import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blogConfig } from "../blog.config.js";

const distDir = path.join(process.cwd(), "dist");
const host = process.env.PREVIEW_HOST ?? "127.0.0.1";
const port = Number(process.env.PREVIEW_PORT ?? 4173);
const liveReloadPath = "/__live-reload";

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const normalizedBasePath = (() => {
  const raw = trimSlashes(blogConfig.basePath ?? "");
  return raw ? `/${raw}` : "";
})();

const contentTypeByExt: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const isFile = async (targetPath: string) => {
  try {
    const info = await stat(targetPath);
    return info.isFile();
  } catch {
    return false;
  }
};

const toDiskPath = (requestPathname: string) => {
  if (normalizedBasePath) {
    if (requestPathname === "/") {
      return null;
    }

    if (
      requestPathname !== normalizedBasePath &&
      !requestPathname.startsWith(`${normalizedBasePath}/`)
    ) {
      return null;
    }

    const replaced = requestPathname.replace(normalizedBasePath, "") || "/";
    return replaced;
  }

  return requestPathname;
};

const resolveFile = async (pathname: string) => {
  const decoded = decodeURIComponent(pathname);
  const safePath = path.normalize(decoded).replace(/^\.{1,2}(\/|\\|$)/g, "");
  const absolute = path.join(distDir, safePath);

  const candidates = [
    absolute,
    path.join(absolute, "index.html"),
    `${absolute}.html`,
  ];

  for (const candidate of candidates) {
    if (await isFile(candidate)) {
      return candidate;
    }
  }

  return null;
};

const sendFile = (
  filePath: string,
  status: number,
  response: import("node:http").ServerResponse,
) => {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypeByExt[ext] ?? "application/octet-stream";

  response.writeHead(status, { "Content-Type": contentType });
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    response.end("Internal Server Error");
  });
  stream.pipe(response);
};

const getLiveReloadScript = () => {
  const endpoint = `${normalizedBasePath}${liveReloadPath}`;
  return `<script data-preview-live-reload>(function(){const source=new EventSource("${endpoint}");source.addEventListener("reload",function(){window.location.reload();});})();</script>`;
};

const sendHtml = async (
  filePath: string,
  status: number,
  response: import("node:http").ServerResponse,
  liveReload: boolean,
) => {
  let html = await readFile(filePath, "utf8");

  if (liveReload && !html.includes("data-preview-live-reload")) {
    const script = getLiveReloadScript();
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${script}</body>`);
    } else {
      html += script;
    }
  }

  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
};

const isLiveReloadRequest = (pathname: string) => {
  const base = normalizedBasePath || "";
  return pathname === `${base}${liveReloadPath}` || pathname === liveReloadPath;
};

export const startPreviewServer = (options?: { liveReload?: boolean }) => {
  const liveReload = options?.liveReload ?? false;
  const clients = new Set<import("node:http").ServerResponse>();

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? host}`,
    );

    if (isLiveReloadRequest(requestUrl.pathname)) {
      if (!liveReload) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("Not Found");
        return;
      }

      response.writeHead(200, {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      });
      response.write("retry: 1000\n\n");
      clients.add(response);

      request.on("close", () => {
        clients.delete(response);
      });
      return;
    }

    const targetPathname = toDiskPath(requestUrl.pathname);
    if (targetPathname === null) {
      const location = normalizedBasePath || "/";
      response.writeHead(302, { Location: location });
      response.end();
      return;
    }

    const filePath = await resolveFile(targetPathname);
    if (filePath) {
      if (path.extname(filePath).toLowerCase() === ".html") {
        await sendHtml(filePath, 200, response, liveReload);
      } else {
        sendFile(filePath, 200, response);
      }
      return;
    }

    const notFoundFile = path.join(distDir, "404.html");
    if (await isFile(notFoundFile)) {
      await sendHtml(notFoundFile, 404, response, liveReload);
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
  });

  server.listen(port, host, () => {
    const base = normalizedBasePath || "/";
    console.log(`Preview server running: http://${host}:${port}${base}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Preview server failed: ${host}:${String(port)} is already in use. Set PREVIEW_PORT to another port.`,
      );
      process.exit(1);
    }

    throw error;
  });

  const triggerReload = () => {
    if (!liveReload) {
      return;
    }

    for (const client of clients) {
      client.write(`event: reload\ndata: ${String(Date.now())}\n\n`);
    }
  };

  const closeLiveReloadClients = () => {
    for (const client of clients) {
      client.end();
    }
    clients.clear();
  };

  return { server, triggerReload, closeLiveReloadClients };
};

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const preview = startPreviewServer();

  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Closing preview server...`);
    preview.closeLiveReloadClients();
    preview.server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
}

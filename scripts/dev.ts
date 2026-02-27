import { spawn } from "node:child_process";
import path from "node:path";
import chokidar from "chokidar";
import { startPreviewServer } from "./preview.js";

const rootDir = process.cwd();
const contentDir = path.join(rootDir, "content");
const publicDir = path.join(rootDir, "public");
const buildScript = path.join(rootDir, "scripts", "build.ts");
const configFile = path.join(rootDir, "blog.config.ts");

const runBuild = () =>
  new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", ["run", "build"], {
      stdio: "inherit",
      cwd: rootDir,
      env: { ...process.env, NODE_ENV: "development" },
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`build failed with exit code ${String(code)}`));
    });
  });

let building = false;
let queued = false;
let preview: ReturnType<typeof startPreviewServer>;

const scheduleBuild = async (reason: string) => {
  if (building) {
    queued = true;
    return;
  }

  building = true;
  console.log(`[watch] rebuild triggered: ${reason}`);

  try {
    await runBuild();
    preview.triggerReload();
    console.log("[watch] rebuild complete");
  } catch (error) {
    console.error("[watch] rebuild failed");
    console.error(error);
  } finally {
    building = false;
    if (queued) {
      queued = false;
      await scheduleBuild("queued changes");
    }
  }
};

await runBuild();
preview = startPreviewServer({ liveReload: true });

const watcher = chokidar.watch(
  [contentDir, publicDir, buildScript, configFile],
  {
    ignoreInitial: true,
  },
);

watcher.on("all", async (eventName, changedPath) => {
  const relative = path.relative(rootDir, changedPath);
  await scheduleBuild(`${eventName}: ${relative}`);
});

console.log("[watch] watching content/public/blog.config.ts/scripts/build.ts");

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`\n[watch] received ${signal}, shutting down...`);

  await watcher.close();
  preview.closeLiveReloadClients();

  await new Promise<void>((resolve) => {
    preview.server.close(() => {
      resolve();
    });
  });

  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

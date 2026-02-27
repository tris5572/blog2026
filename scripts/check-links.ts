import { access, readFile } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { blogConfig } from "../blog.config.js";

const distDir = path.join(process.cwd(), "dist");

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const normalizedBasePath = (() => {
  const raw = trimSlashes(blogConfig.basePath ?? "");
  return raw ? `/${raw}` : "";
})();

const stripHashAndQuery = (value: string) =>
  value.split("#")[0].split("?")[0] ?? "";

const isIgnoredLink = (value: string) => {
  if (!value) return true;
  return /^(https?:|mailto:|tel:|javascript:|data:|#)/i.test(value);
};

const normalizeTargetPath = (linkValue: string, htmlFilePath: string) => {
  const clean = stripHashAndQuery(linkValue);
  if (!clean) return null;

  if (clean.startsWith("/")) {
    if (
      normalizedBasePath &&
      !clean.startsWith(`${normalizedBasePath}/`) &&
      clean !== normalizedBasePath
    ) {
      return null;
    }
    const withoutBase = normalizedBasePath
      ? clean.replace(normalizedBasePath, "") || "/"
      : clean;
    return path.join(distDir, withoutBase);
  }

  const fromDir = path.dirname(htmlFilePath);
  return path.resolve(fromDir, clean);
};

const resolveCandidateFiles = (targetPath: string) => {
  const normalized = targetPath.endsWith(path.sep)
    ? targetPath.slice(0, -1)
    : targetPath;
  const ext = path.extname(normalized);

  if (ext) {
    return [normalized];
  }

  return [
    path.join(normalized, "index.html"),
    `${normalized}.html`,
    normalized,
  ];
};

const existsAny = async (paths: string[]) => {
  for (const candidate of paths) {
    try {
      await access(candidate);
      return true;
    } catch {
      // continue
    }
  }
  return false;
};

const main = async () => {
  const htmlFiles = await fg("**/*.html", {
    cwd: distDir,
    absolute: true,
    onlyFiles: true,
  });

  const broken: Array<{ file: string; link: string }> = [];
  const attrPattern = /(?:href|src)=["']([^"']+)["']/g;

  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf8");
    const matches = source.matchAll(attrPattern);

    for (const match of matches) {
      const link = match[1] ?? "";
      if (isIgnoredLink(link)) {
        continue;
      }

      const target = normalizeTargetPath(link, htmlFile);
      if (!target) {
        continue;
      }

      const candidates = resolveCandidateFiles(target);
      const ok = await existsAny(candidates);
      if (!ok) {
        broken.push({ file: path.relative(distDir, htmlFile), link });
      }
    }
  }

  if (broken.length > 0) {
    console.error("Broken internal links detected:");
    for (const item of broken) {
      console.error(`- ${item.file}: ${item.link}`);
    }
    process.exit(1);
  }

  console.log(`Link check passed: ${htmlFiles.length} HTML files`);
};

await main();

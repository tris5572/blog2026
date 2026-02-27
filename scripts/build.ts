import { mkdir, readFile, rm, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { createHighlighter } from "shiki";
import { blogConfig, hasPlaceholderConfig } from "../blog.config.js";

type Frontmatter = {
  title: string;
  date: string;
  tags?: string[];
  draft?: boolean;
  description?: string;
  slug?: string;
  ogTitle?: string;
  ogDescription?: string;
};

type Post = {
  title: string;
  date: Date;
  dateText: string;
  tags: string[];
  draft: boolean;
  description: string;
  slug: string;
  html: string;
  ogTitle: string;
  ogDescription: string;
};

const rootDir = process.cwd();
const contentDir = path.join(rootDir, "content", "posts");
const outDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const basePath = (() => {
  const raw = trimSlashes(blogConfig.basePath ?? "");
  return raw.length === 0 ? "" : `/${raw}`;
})();

const withBasePath = (pathname: string) => {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath}${clean}`;
};

const toAbsoluteUrl = (pathname: string) => {
  const site = (blogConfig.siteUrl ?? "").replace(/\/+$/g, "");
  return `${site}${withBasePath(pathname)}`;
};

const htmlEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const xmlEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fbf\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const layout = ({
  title,
  description,
  body,
  canonicalPath,
  ogImagePath,
  noindex = false,
}: {
  title: string;
  description: string;
  body: string;
  canonicalPath: string;
  ogImagePath?: string;
  noindex?: boolean;
}) => {
  const fullTitle = `${title} | ${blogConfig.title}`;
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const ogImage = ogImagePath ? toAbsoluteUrl(ogImagePath) : undefined;

  return `<!doctype html>
<html lang="${blogConfig.language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(fullTitle)}</title>
    <meta name="description" content="${htmlEscape(description)}" />
    <link rel="canonical" href="${htmlEscape(canonicalUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${htmlEscape(fullTitle)}" />
    <meta property="og:description" content="${htmlEscape(description)}" />
    <meta property="og:url" content="${htmlEscape(canonicalUrl)}" />
    ${ogImage ? `<meta property="og:image" content="${htmlEscape(ogImage)}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    ${ogImage ? `<meta name="twitter:image" content="${htmlEscape(ogImage)}" />` : ""}
    ${noindex ? '<meta name="robots" content="noindex" />' : ""}
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; }
      .container { width: min(900px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 64px; }
      a { color: inherit; text-underline-offset: 3px; }
      .header { margin-bottom: 32px; }
      .muted { opacity: .7; }
      .post-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 20px; }
      .post-list a { text-decoration: none; }
      .card { padding: 16px; border: 1px solid color-mix(in oklab, currentColor 20%, transparent); border-radius: 12px; }
      .card h2 { margin: 0 0 6px; }
      .card p { margin: 8px 0; }
      .tags { display: flex; gap: 8px; flex-wrap: wrap; }
      .tag { display: inline-block; padding: 2px 10px; border-radius: 999px; border: 1px solid color-mix(in oklab, currentColor 25%, transparent); font-size: 12px; text-decoration: none; }
      article { margin-top: 8px; }
      article h1 { margin-bottom: 8px; line-height: 1.3; }
      article h2, article h3 { margin-top: 28px; margin-bottom: 10px; line-height: 1.35; }
      article p, article ul, article ol, article pre, article blockquote { margin: 14px 0; }
      article ul, article ol { padding-left: 1.4em; }
      article li + li { margin-top: 6px; }
      article blockquote {
        margin-left: 0;
        padding: 8px 14px;
        border-left: 4px solid color-mix(in oklab, currentColor 24%, transparent);
        background: color-mix(in oklab, currentColor 6%, transparent);
        border-radius: 8px;
      }
      pre { padding: 16px; border-radius: 10px; overflow-x: auto; font-size: 14px; line-height: 1.5; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      :not(pre) > code {
        padding: 2px 6px;
        border-radius: 6px;
        background: color-mix(in oklab, currentColor 10%, transparent);
      }
      article img { max-width: 100%; }
      hr { border: 0; border-top: 1px solid color-mix(in oklab, currentColor 20%, transparent); margin: 28px 0; }
      .footer { margin-top: 48px; font-size: 14px; }
    </style>
  </head>
  <body>
    <main class="container">
      <header class="header">
        <h1><a href="${withBasePath("/")}" style="text-decoration:none;">${htmlEscape(blogConfig.title)}</a></h1>
        <p class="muted">${htmlEscape(blogConfig.description)}</p>
      </header>
      ${body}
      <footer class="footer muted">© ${new Date().getFullYear()} ${htmlEscape(blogConfig.author)}</footer>
    </main>
  </body>
</html>`;
};

const ensureDir = async (targetPath: string) => {
  await mkdir(path.dirname(targetPath), { recursive: true });
};

const writePage = async (targetPath: string, html: string) => {
  await ensureDir(targetPath);
  await writeFile(targetPath, html, "utf8");
};

const renderPostList = (posts: Post[]) => {
  const items = posts
    .map((post) => {
      const tags = post.tags
        .map(
          (tag) =>
            `<a class="tag" href="${withBasePath(`/tags/${encodeURIComponent(tag)}/`)}">#${htmlEscape(tag)}</a>`,
        )
        .join(" ");
      return `<li class="card">
  <a href="${withBasePath(`/posts/${post.slug}/`)}"><h2>${htmlEscape(post.title)}</h2></a>
  <p class="muted">${htmlEscape(post.dateText)}</p>
  <p>${htmlEscape(post.description)}</p>
  <div class="tags">${tags}</div>
</li>`;
    })
    .join("\n");

  return `<ul class="post-list">${items}</ul>`;
};

const generateOgpSvg = (post: Post) => {
  const title = xmlEscape(post.ogTitle);
  const description = xmlEscape(post.ogDescription);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" rx="28" />
  <text x="72" y="130" fill="#94a3b8" font-size="34">${xmlEscape(blogConfig.title)}</text>
  <foreignObject x="72" y="170" width="1056" height="320">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:64px;font-weight:700;line-height:1.2;">
      ${title}
    </div>
  </foreignObject>
  <text x="72" y="560" fill="#cbd5e1" font-size="30">${description}</text>
</svg>`;
};

const main = async () => {
  const isProduction = (process.env.NODE_ENV ?? "development") === "production";

  if (isProduction && hasPlaceholderConfig()) {
    throw new Error(
      "blog.config.ts のプレースホルダーが残っている。BLOG_SITE_URL / BLOG_BASE_PATH / BLOG_AUTHOR を設定して再実行してください。",
    );
  }

  if (!/^https?:\/\//.test(blogConfig.siteUrl)) {
    throw new Error("siteUrl は http(s) で始まる必要があります。");
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const highlighter = await createHighlighter({
    themes: ["github-dark"],
    langs: [
      "plaintext",
      "bash",
      "css",
      "html",
      "javascript",
      "json",
      "markdown",
      "typescript",
      "tsx",
      "yaml",
    ],
  });
  const loadedLangs = new Set(
    highlighter.getLoadedLanguages().map((lang) => String(lang)),
  );

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (code, language) => {
      const lang = loadedLangs.has(language) ? language : "plaintext";
      return highlighter.codeToHtml(code, { lang, theme: "github-dark" });
    },
  });

  const files = await fg("**/*.md", { cwd: contentDir, onlyFiles: true });

  const posts: Post[] = [];
  for (const relativeFile of files) {
    const absFile = path.join(contentDir, relativeFile);
    const raw = await readFile(absFile, "utf8");
    const parsed = matter(raw);
    const frontmatter = parsed.data as Frontmatter;

    if (!frontmatter.title || !frontmatter.date) {
      throw new Error(
        `frontmatter error: title/date is required (${relativeFile})`,
      );
    }

    const date = new Date(frontmatter.date);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`frontmatter error: invalid date (${relativeFile})`);
    }

    const fileSlug = slugify(path.basename(relativeFile, ".md"));
    const slug = slugify(frontmatter.slug ?? fileSlug);
    const tags = (frontmatter.tags ?? [])
      .map((tag) => tag.trim())
      .filter(Boolean);

    posts.push({
      title: frontmatter.title,
      date,
      dateText: formatDate(date),
      tags,
      draft: Boolean(frontmatter.draft),
      description: frontmatter.description ?? "",
      slug,
      html: md.render(parsed.content),
      ogTitle: frontmatter.ogTitle ?? frontmatter.title,
      ogDescription: frontmatter.ogDescription ?? frontmatter.description ?? "",
    });
  }

  const publishedPosts = posts
    .filter((post) => !post.draft || !isProduction)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const post of publishedPosts) {
    const ogpPath = `/og/${post.slug}.svg`;
    const postBody = `<article>
  <h1>${htmlEscape(post.title)}</h1>
  <p class="muted">${htmlEscape(post.dateText)}</p>
  <div class="tags">${post.tags
    .map(
      (tag) =>
        `<a class="tag" href="${withBasePath(`/tags/${encodeURIComponent(tag)}/`)}">#${htmlEscape(tag)}</a>`,
    )
    .join(" ")}</div>
  ${post.html}
</article>`;

    await writePage(
      path.join(outDir, "posts", post.slug, "index.html"),
      layout({
        title: post.title,
        description: post.description,
        body: postBody,
        canonicalPath: `/posts/${post.slug}/`,
        ogImagePath: ogpPath,
      }),
    );

    await writePage(
      path.join(outDir, "og", `${post.slug}.svg`),
      generateOgpSvg(post),
    );
  }

  const indexBody = `<section>
  <h2>Posts</h2>
  ${renderPostList(publishedPosts)}
</section>`;

  await writePage(
    path.join(outDir, "index.html"),
    layout({
      title: "Home",
      description: blogConfig.description,
      body: indexBody,
      canonicalPath: "/",
    }),
  );

  const tagMap = new Map<string, Post[]>();
  for (const post of publishedPosts) {
    for (const tag of post.tags) {
      const current = tagMap.get(tag) ?? [];
      current.push(post);
      tagMap.set(tag, current);
    }
  }

  for (const [tag, tagPosts] of tagMap) {
    const body = `<section>
  <h2>#${htmlEscape(tag)}</h2>
  ${renderPostList(tagPosts)}
</section>`;

    await writePage(
      path.join(outDir, "tags", tag, "index.html"),
      layout({
        title: `Tag: ${tag}`,
        description: `${tag} の記事一覧`,
        body,
        canonicalPath: `/tags/${encodeURIComponent(tag)}/`,
      }),
    );
  }

  const lastBuildDate = new Date().toUTCString();
  const rssItems = publishedPosts
    .map(
      (post) => `<item>
  <title>${xmlEscape(post.title)}</title>
  <link>${xmlEscape(toAbsoluteUrl(`/posts/${post.slug}/`))}</link>
  <guid>${xmlEscape(toAbsoluteUrl(`/posts/${post.slug}/`))}</guid>
  <pubDate>${post.date.toUTCString()}</pubDate>
  <description>${xmlEscape(post.description)}</description>
</item>`,
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${xmlEscape(blogConfig.title)}</title>
  <link>${xmlEscape(toAbsoluteUrl("/"))}</link>
  <description>${xmlEscape(blogConfig.description)}</description>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <language>${xmlEscape(blogConfig.language)}</language>
  ${rssItems}
</channel>
</rss>`;
  await writePage(path.join(outDir, "rss.xml"), rss);

  const urls = [
    `<url><loc>${xmlEscape(toAbsoluteUrl("/"))}</loc></url>`,
    ...publishedPosts.map(
      (post) =>
        `<url><loc>${xmlEscape(toAbsoluteUrl(`/posts/${post.slug}/`))}</loc><lastmod>${post.date
          .toISOString()
          .slice(0, 10)}</lastmod></url>`,
    ),
    ...Array.from(tagMap.keys()).map(
      (tag) =>
        `<url><loc>${xmlEscape(toAbsoluteUrl(`/tags/${encodeURIComponent(tag)}/`))}</loc></url>`,
    ),
  ].join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  await writePage(path.join(outDir, "sitemap.xml"), sitemap);

  await writePage(
    path.join(outDir, "404.html"),
    layout({
      title: "Not Found",
      description: "ページが見つからない",
      body: `<section><h2>404</h2><p>ページが見つからない。<a href="${withBasePath("/")}">トップへ戻る</a></p></section>`,
      canonicalPath: "/404.html",
      noindex: true,
    }),
  );

  try {
    await cp(publicDir, outDir, { recursive: true });
  } catch {
    // public ディレクトリがない場合はスキップ
  }

  await writeFile(path.join(outDir, ".nojekyll"), "", "utf8");

  console.log(`Build complete: ${publishedPosts.length} posts`);
};

await main();

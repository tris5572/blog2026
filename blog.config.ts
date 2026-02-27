const pickEnv = (name: string, fallback: string) => {
  const value = process.env[name];
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const blogConfig = {
  title: "Blog 2026",
  description: "TypeScript 製の自作ブログ",
  language: "ja",
  siteUrl: pickEnv("BLOG_SITE_URL", "https://tris5572.github.io"),
  basePath: pickEnv("BLOG_BASE_PATH", "/blog2026"),
  author: pickEnv("BLOG_AUTHOR", "tris5572"),
};

export const hasPlaceholderConfig = () =>
  blogConfig.siteUrl.includes("YOUR_GITHUB_USERNAME") ||
  blogConfig.author.includes("YOUR_NAME") ||
  blogConfig.siteUrl.trim().length === 0 ||
  blogConfig.author.trim().length === 0;

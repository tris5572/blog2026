const required = ["DEPLOY_BASE_URL"] as const;

for (const key of required) {
  if (!process.env[key] || process.env[key]?.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
}

const baseUrl = (process.env.DEPLOY_BASE_URL as string).replace(/\/+$/g, "");

const targets = ["/", "/rss.xml", "/sitemap.xml"];

const main = async () => {
  const results: Array<{ url: string; status: number; ok: boolean }> = [];

  for (const target of targets) {
    const url = `${baseUrl}${target}`;
    const response = await fetch(url, { redirect: "follow" });
    results.push({ url, status: response.status, ok: response.ok });
  }

  const failed = results.filter((result) => !result.ok);

  for (const result of results) {
    console.log(`${result.ok ? "OK" : "NG"} ${result.status} ${result.url}`);
  }

  if (failed.length > 0) {
    throw new Error("deployed URL check failed");
  }
};

await main();

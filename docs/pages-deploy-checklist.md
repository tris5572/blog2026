# GitHub Pages 公開チェックリスト

この手順は P0 の残タスク（Pages設定、初回デプロイ、公開URL確認）を実施するためのチェックリスト。

## 1. 前提

- GitHub リポジトリが作成済み
- `main` ブランチに push できる状態
- ローカルで `pnpm run build && pnpm run check:links` が成功している

## 2. blog.config.ts の本番設定

`blog.config.ts` を編集、または環境変数で以下を設定する。

- `BLOG_SITE_URL`（例: `https://<username>.github.io`）
- `BLOG_BASE_PATH`（Project Pages の場合は通常 `/<repo-name>`）
- `BLOG_AUTHOR`

本番値検証:

```bash
NODE_ENV=production pnpm run build
```

## 3. GitHub Pages 設定

1. GitHub の対象リポジトリを開く
2. Settings > Pages を開く
3. Build and deployment の Source を `GitHub Actions` に設定

## 4. 初回デプロイ

```bash
git add .
git commit -m "chore: prepare pages deployment"
git push origin main
```

Actions タブで `Deploy blog` ワークフローが成功することを確認する。

## 5. 公開URL確認

Project Pages の公開URLを `DEPLOY_BASE_URL` として指定し、チェックを実行する。

```bash
DEPLOY_BASE_URL="https://<username>.github.io/<repo-name>" pnpm run check:deployed
```

成功時は以下の endpoint が 200 系で返る。

- `/`
- `/rss.xml`
- `/sitemap.xml`

## 6. 失敗時の確認ポイント

- `blog.config.ts` の `basePath` がリポジトリ名と一致しているか
- GitHub Pages の Source が `GitHub Actions` になっているか
- Actions の `Upload artifact` の path が `dist` になっているか
- push 先が `main` か

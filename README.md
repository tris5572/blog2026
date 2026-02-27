# blog2026

TypeScript 製の自作ブログエンジン。

実装方針と作業手順は [docs/implementation-plan.md](docs/implementation-plan.md) を参照。
実行ログと今後の実装TODOは [docs/implementation-todo.md](docs/implementation-todo.md) を参照。
frontmatter 仕様は [docs/frontmatter-spec.md](docs/frontmatter-spec.md) を参照。
公開チェック手順は [docs/pages-deploy-checklist.md](docs/pages-deploy-checklist.md) を参照。

## できること

- Markdown 記事から静的HTMLを生成
- コードブロックのシンタックスハイライト
- OGP画像（SVG）の事前生成
- RSS / sitemap 生成
- GitHub Actions でビルドして GitHub Pages へデプロイ

## セットアップ

1. `blog.config.ts` を編集して `siteUrl`, `basePath`, `author` を設定

- もしくは環境変数 `BLOG_SITE_URL`, `BLOG_BASE_PATH`, `BLOG_AUTHOR` で上書き可能

2. 依存関係をインストール

```bash
pnpm install
```

3. ビルド

```bash
pnpm run build
```

ローカルプレビュー:

```bash
pnpm run preview
```

記事編集しながら使う場合（自動再ビルド + プレビュー）:

```bash
pnpm run preview:watch
```

`preview:watch` 実行中は、Markdown を保存して再ビルドが完了するとブラウザを自動リロードする。

必要に応じて `PREVIEW_HOST` / `PREVIEW_PORT` で待受を変更できる。
ポート競合時は `PREVIEW_PORT=4174 pnpm run preview:watch` のように別ポートを指定する。

4. 内部リンクチェック

```bash
pnpm run check:links
```

5. Lint / Format

```bash
pnpm run lint
pnpm run format:check
```

本番ビルド（`NODE_ENV=production`）では、`blog.config.ts` のプレースホルダー値が残っていると失敗する。

出力先は `dist`。

## 記事の書き方

`content/posts/*.md` に frontmatter 付きで作成。

```md
---
title: 記事タイトル
date: 2026-02-28
tags:
  - tag1
draft: false
description: 概要
slug: 任意-slug
ogTitle: OGPタイトル（任意）
ogDescription: OGP説明（任意）
---

本文
```

## デプロイ

`main` ブランチに push すると `.github/workflows/deploy.yml` で Pages へ反映。

GitHub の Settings > Pages で Build and deployment を `GitHub Actions` にすること。

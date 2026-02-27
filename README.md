# blog2026

TypeScript 製の自作ブログエンジン。

## できること

- Markdown 記事から静的HTMLを生成
- コードブロックのシンタックスハイライト
- OGP画像（SVG）の事前生成
- RSS / sitemap 生成
- GitHub Actions でビルドして GitHub Pages へデプロイ

## セットアップ

1. `blog.config.ts` を編集して `siteUrl`, `basePath`, `author` を設定
2. 依存関係をインストール

```bash
pnpm install
```

3. ビルド

```bash
pnpm run build
```

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

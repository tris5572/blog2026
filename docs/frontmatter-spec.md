# Frontmatter 仕様

このドキュメントは `content/posts/*.md` で使用する frontmatter の入力ルールを定義する。

## 1. フォーマット

- YAML frontmatter を使用する
- 先頭と末尾を `---` で囲む

```md
---
title: 記事タイトル
date: 2026-02-28
tags:
  - tag1
draft: false
description: 記事の概要
slug: optional-slug
ogTitle: OGP用タイトル
ogDescription: OGP用説明
---
```

## 2. フィールド一覧

### 必須

- `title` (`string`)
  - 記事タイトル
- `date` (`string`)
  - ISO 形式推奨（例: `2026-02-28`）
  - `new Date(date)` で解釈できる値であること

### 任意

- `tags` (`string[]`)
  - タグ一覧
  - 空文字タグは無視される
  - 半角スペースは含められない
- `draft` (`boolean`)
  - `true` の場合、`NODE_ENV=production` では公開対象から除外
- `description` (`string`)
  - 記事説明（OGP/RSSの説明文にも利用）
- `slug` (`string`)
  - 記事URL用スラッグ
  - 未指定時はファイル名から生成
- `ogTitle` (`string`)
  - OGPタイトル。未指定時は `title`
- `ogDescription` (`string`)
  - OGP説明。未指定時は `description`

## 3. バリデーション

ビルド時に以下をチェックする。

- `title` または `date` が未指定ならエラー
- `date` が不正ならエラー

## 4. 運用ルール

- 新しい frontmatter フィールドを導入する場合は、必ずこの仕様書を先に更新する
- 運用ルール変更時は `docs/implementation-todo.md` の TODO も同時更新する

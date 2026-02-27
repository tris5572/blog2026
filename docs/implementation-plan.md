# 実装方針と実装ステップ

## 1. 目的

本プロジェクトは、TypeScript 製の自作ブログエンジンを用いて、Markdown 記事から静的サイトを生成し、GitHub Actions でビルドした成果物を GitHub Pages へ公開する。

## 2. いまの前提

- パッケージ管理は pnpm
- 公開先は GitHub Pages（Project Pages）
- 記事入力は Markdown（MDX は将来拡張）
- コードブロックはシンタックスハイライト
- OGP 画像はビルド時に事前生成

## 3. アーキテクチャ方針

### 3.1 全体構成

- 入力: content/posts/*.md
- 変換: scripts/build.ts
- 出力: dist/
- 配信: .github/workflows/deploy.yml -> GitHub Pages

### 3.2 採用方針

- コアロジック（記事収集、ページ生成、URL 設計）は自作
- Markdown パース、frontmatter、シンタックスハイライトは既存ライブラリを利用
- CI/CD は GitHub Actions 標準アクションを利用

### 3.3 URL 設計

- トップ: /<basePath>/
- 記事詳細: /<basePath>/posts/<slug>/
- タグ一覧: /<basePath>/tags/<tag>/
- 補助ファイル: /<basePath>/rss.xml, /<basePath>/sitemap.xml

## 4. データ仕様

### 4.1 記事 frontmatter

必須:
- title
- date

任意:
- tags
- draft
- description
- slug
- ogTitle
- ogDescription

### 4.2 draft の扱い

- NODE_ENV=production のときは draft=true 記事を除外
- 開発時は確認用に含める

## 5. ビルド仕様

### 5.1 生成対象

- 記事詳細ページ
- トップ記事一覧
- タグ別一覧
- rss.xml
- sitemap.xml
- 404.html
- OGP 画像（SVG）
- .nojekyll

### 5.2 ハイライト仕様

- Shiki を使用
- 未対応言語は plaintext にフォールバック

### 5.3 OGP 生成仕様

- 形式: SVG
- サイズ: 1200x630
- 記事ごとに dist/og/<slug>.svg を生成
- OGP メタタグへ記事単位で紐付け

## 6. CI/CD 仕様

### 6.1 ワークフロー

1. main への push または手動実行
2. pnpm install --frozen-lockfile
3. pnpm run build
4. dist を Pages artifact としてアップロード
5. deploy-pages で公開

### 6.2 失敗条件

- 依存解決失敗
- frontmatter 不正（title/date 不足、date 不正）
- build エラー

## 7. 実装ステップ

### Step 1: 基盤セットアップ

- package.json, tsconfig, blog.config を作成
- pnpm-lock.yaml を生成

完了条件:
- pnpm install が成功する

### Step 2: コンテンツパイプライン

- Markdown 収集
- frontmatter 検証
- HTML 変換
- 静的ページ出力

完了条件:
- content/posts の記事から dist/posts/* が生成される

### Step 3: 追加生成物

- タグページ
- RSS
- sitemap
- 404

完了条件:
- dist に上記成果物が存在する

### Step 4: OGP 事前生成

- 記事ごとに SVG を生成
- article ページに OGP メタを埋め込む

完了条件:
- dist/og/*.svg が生成され、ページの og:image が正しい

### Step 5: GitHub Pages デプロイ

- Actions ワークフロー構成
- Pages で GitHub Actions デプロイを有効化

完了条件:
- main への push で公開 URL に反映される

## 8. 運用ルール

- 記事追加時は content/posts に Markdown を追加
- 公開前にローカルで pnpm run build を実行
- basePath や siteUrl を変更した場合はリンク検証を実施

## 9. 今後の拡張候補

- MDX 対応（段階導入）
- 検索機能
- 記事シリーズ/関連記事
- 画像最適化
- テスト導入（スナップショット、リンク整合性）

## 10. 受け入れ基準（MVP）

- TypeScript でビルド処理を実装している
- Markdown 記事から静的ページを生成できる
- コードブロックがシンタックスハイライトされる
- OGP 画像が記事単位で事前生成される
- RSS と sitemap が生成される
- GitHub Actions 経由で GitHub Pages に公開できる

## 11. 進捗管理ルール

- 実装タスクの管理は [docs/implementation-todo.md](docs/implementation-todo.md) を参照する
- 新規タスク追加・完了更新は同ファイルで一元管理する
- 実装は TODO の優先度（P0 -> P1 -> P2）に従って進める

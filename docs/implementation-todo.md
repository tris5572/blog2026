# 実行ログと実装TODO

## 1. このドキュメントの位置づけ

このファイルを実装の単一参照元（single source of truth）とする。
今後の実装作業は、必ず本ドキュメントの TODO を参照して進める。

運用ルール:

- 新しい実装タスクは先に TODO へ追加してから着手する
- 実装完了後はステータスを更新する
- 仕様変更が入った場合は「前提」と「TODO」を同時に更新する

## 2. 実行した内容（完了ログ）

### 2026-02-28

- [x] TypeScript + pnpm のプロジェクト初期構成を作成
  - package.json
  - tsconfig.json
  - blog.config.ts
  - pnpm-lock.yaml
- [x] ビルドスクリプトを実装
  - Markdown 記事の収集
  - frontmatter の検証
  - 記事ページ生成
  - トップページ生成
  - タグページ生成
  - RSS / sitemap / 404 生成
  - OGP SVG の事前生成
- [x] GitHub Pages デプロイ用の GitHub Actions を実装
  - .github/workflows/deploy.yml
- [x] サンプル記事を追加
  - content/posts/hello-world.md
- [x] ローカル検証を実施
  - pnpm install
  - pnpm run build
  - 結果: Build complete: 1 posts
- [x] frontmatter 仕様ドキュメントを追加
  - docs/frontmatter-spec.md
- [x] 壊れた内部リンク検知を実装
  - scripts/check-links.ts
  - package.json (`check:links`)
  - .github/workflows/deploy.yml (CI へ組み込み)
- [x] 本番設定の自動検証を実装
  - blog.config.ts を環境変数上書き対応
  - scripts/build.ts でプレースホルダー検知を追加
- [x] 公開確認の手順と自動チェックを追加
  - docs/pages-deploy-checklist.md
  - scripts/check-deployed.ts
  - package.json (`check:deployed`)
- [x] oxlint / oxfmt を導入
  - .oxlintrc.json
  - .oxfmtrc.json
  - package.json (`lint`, `lint:fix`, `format`, `format:check`)
  - .github/workflows/deploy.yml (CI へ組み込み)
- [x] HTML/CSS の最小整形を実施
  - scripts/build.ts の埋め込み CSS を調整
  - 記事本文（見出し、段落、リスト、blockquote、inline code）の可読性を改善
- [x] ローカルプレビュー機能を追加
  - scripts/preview.ts
  - package.json (`preview`, `preview:serve`)
  - README 手順追記
- [x] watch プレビュー機能を追加
  - scripts/dev.ts
  - package.json (`preview:watch`)
  - README 手順追記
- [x] preview の EISDIR クラッシュを修正
  - scripts/preview.ts のファイル解決を isFile 判定に修正
  - ReadStream エラーハンドリングを追加
- [x] preview:watch に Live Reload を追加
  - scripts/preview.ts に SSE エンドポイント追加
  - scripts/dev.ts で再ビルド完了時に reload 通知

## 3. 現在の前提

- パッケージ管理: pnpm
- 公開方式: GitHub Pages（Project Pages）
- 記事入力: Markdown（MDX は将来対応）
- 必須機能: 記事一覧/詳細、タグ、RSS、sitemap、draft、コードハイライト、OGP事前生成

## 4. 今後行う実装TODO

### P0（公開前に必須）

- [x] blog.config.ts の本番値を設定
  - siteUrl
  - basePath
  - author
  - 設定値: siteUrl=`https://tris5572.github.io`, basePath=`/blog2026`, author=`tris5572`
  - 備考: 本番ビルド時はプレースホルダー残存で失敗するため設定漏れを防止済み
- [ ] GitHub リポジトリ側の Pages 設定を GitHub Actions にする
- [ ] main へ push して初回デプロイを確認
- [ ] 公開URLでリンク確認
  - トップ
  - 記事詳細
  - タグページ
  - rss.xml
  - sitemap.xml
  - OGP画像URL
  - 備考: `DEPLOY_BASE_URL=... pnpm run check:deployed` で主要エンドポイント検証可能

### P1（品質向上）

- [x] frontmatter の仕様を docs に固定（入力ルール明文化）
- [x] 壊れた内部リンク検知のチェックを追加
- [x] HTML/CSS の最小整形（読みやすさ改善）

### P2（拡張）

- [ ] MDX 対応の設計メモ作成
- [ ] 検索機能の方式比較（ビルド時インデックス or クライアント検索）
- [ ] 画像最適化フローの検討

## 5. 実装の進め方（参照ルール）

今後の実装作業は以下の順で進める。

1. 本ドキュメントの TODO から対象タスクを選ぶ
2. 変更対象ファイルと完了条件を明確にする
3. 実装する
4. 検証する（最低でも pnpm run build）
5. 本ドキュメントのステータスを更新する

このルールにより、実行済み内容と未完了タスクを常に同期させる。

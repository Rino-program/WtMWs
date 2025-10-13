# yami - 暗めの短文投稿サイト (静的)

概要
- `posts/` に `.md` または `.txt` ファイルを追加すると、`npm run build` で `index.html` の投稿一覧と各投稿の個別ページ（HTML）が生成されます。
- 公開は GitHub Pages にリポジトリをそのまま公開すれば OK。

使い方
1. 投稿ファイルを `posts/` に追加（例: `2025-10-12-my-post.md`）
   - タイトルは通常ファイル名（拡張子を除く）を使います。ファイル名先頭に `YYYY-MM-DD-` を付けても良いです。
   - 日付は本文内に `YYYY-MM-DD` で書くか、YAML front-matter（例: `---\ndate: 2025-10-12\n---`）を使ってください。本文の方を優先します。
   - ファイル名に `[notitle]` を含めると、一覧・個別ページのタイトル表示を抑制できます（画像や本文だけを表示したいとき）。
   - 画像は Markdown の `![alt](image.jpg)` で参照できます。画像ファイルは `posts/` に置いてください。生成される個別ページではそのまま表示されます。
2. ルートで `npm run build` を実行
   - `index.html` の `<!-- GENERATED_POSTS -->` セクションが書き換えられ、`posts/*.html`（個別ページ）が生成されます。
3. GitHub に push して Pages を有効化

サンプル
- `posts/2025-10-12-sample.md` (Markdown -> 個別 HTML ページ生成)
- `posts/sample.txt` (テキスト -> 個別 HTML ページ生成)
- `posts/2025-10-13-notitle-[notitle].md` (タイトル非表示のデモ、画像参照 `night.jpg` を使用)

注意点
- 投稿ファイルは公開されます。個人的な情報や秘密は含めないでください。

さらに自動化したい場合
- GitHub Actions を追加して push 時に自動で `npm run build` とデプロイを行うことができます。必要ならサンプルの workflow を作成します。

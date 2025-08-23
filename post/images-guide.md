# 画像の貼り方ガイド（post ページ用）

目的: このリポジトリの `post` ページで画像を安全に表示し、カード高さを長くしないでクリックで拡大できるようにするための具体的な書き方と設定まとめ。

## 変更済みファイル（参考）
- `post/poststyle.css` — サムネイル表示、ライトボックス、ボタンやカードの見た目を追加・調整
- `post/postscript.js` — タグ/もっと見る機能に加え、画像クリックで開くライトボックスを追加
- `post/index.html` — ページ構造を少し整理（`<main>` の追加など）

---

## 1) 基本ルール（必ず守ること）
- 画像タグの `alt` を必ず入れる（アクセシビリティとSEO）。
- 画像はできれば相対パスで置き、`loading="lazy"` を付けて遅延読み込みを推奨。
- サムネイル表示は `.post-media` コンテナに入れる。

---

## 2) すぐ使えるHTMLスニペット（例）
- 単一画像（キャプションなし）

```html
<div class="post-media">
  <img src="./img/sample.jpg" alt="説明文" loading="lazy">
</div>
```

- キャプション付き（推奨: semantic）

```html
<figure class="post-media">
  <img src="./img/sample.jpg" alt="説明文" loading="lazy">
  <figcaption>キャプション文（撮影日や補足など）</figcaption>
</figure>
```

- 複数画像（並べる例）

```html
<div class="post-media-row">
  <div class="post-media" style="width:48%; display:inline-block; vertical-align:top;">
    <img src="./img/a.jpg" alt="A" loading="lazy">
  </div>
  <div class="post-media" style="width:48%; display:inline-block; vertical-align:top;">
    <img src="./img/b.jpg" alt="B" loading="lazy">
  </div>
</div>
```

> 注: 上の並列表示は簡易例。必要なら CSS に `.post-media-row` を追加して統一した比率やギャップを設定してください。

---

## 3) 仕組み（どう動くか）
- 表示: `.post-media img` は `width:100%` でボックスにフィットし、`max-height`（デフォルトは 220px）で高さを抑えます。これにより縦長にならず一覧の高さを保てます。
- 拡大: 画像クリックでページに動的に生成された `.p-modal`（ライトボックス）を開き、背景暗転で画像を最大サイズで見られます。
- 閉じる方法: クローズボタン、背景クリック、Escキー。

---

## 4) カスタマイズ（よくある変更点）
- サムネ高さを変える
  - ファイル: `post/poststyle.css`
  - クラス: `.post-media img { max-height: 220px; }`
  - 例: もっと小さくしたい → `max-height: 140px;`

- 画像の縦横トリミング挙動
  - 現在は `object-fit: cover` を使い、ボックスに収めつつ中央を表示します。
  - 切り抜きではなく全体表示したい場合は `object-fit: contain` に変更。

- キャプションの見た目
  - `figcaption` を追加して色やフォントサイズを `poststyle.css` に書くと良い（例を下に記載）。

---

## 5) 例: `figcaption` 用のシンプルCSS（追加したい場合）
```css
.post-media figure figcaption{
  font-size: .85rem;
  color: var(--subtext);
  margin-top: .35rem;
}
```

---

## 6) アクセシビリティとパフォーマンス
- `alt` 属性は必須。
- モーダルはキーボード操作で閉じられる（Esc）ことを確認済み。
- 大きな画像はサーバ側で適切にリサイズし、レスポンシブに `srcset`/`sizes` を使うと高速化できる。
- 可能なら `loading="lazy"` を使う。

---

## 7) トラブルシューティング
- 画像をクリックしても拡大しない
  - `postscript.js` がロードされているか確認（`<script src="./postscript.js" defer></script>` が `</body>` の前にあるか）。
  - ブラウザのコンソールにエラーがないか確認。
- 画像が縦長に伸びる
  - `poststyle.css` の `.post-media img { max-height: 220px; object-fit: cover; }` を確認。`object-fit` が `cover` の場合、中央が切り取られる挙動は正常。
- モバイルで表示が崩れる
  - `max-width:100%` を付けているか、メディアクエリで余白を調整する。

---

## 8) 将来の拡張案（必要に応じて）
- 同一セクション内の画像をモーダルで左右移動できるギャラリー機能
- 拡大モードでダウンロードや共有ボタンを追加
- 低解像度のプレースホルダー（LQIP）を先に表示してから高解像度画像を読み込む

---

## 9) テスト手順（素早く確認する方法）
1. `post/index.html` をブラウザで開く（ローカルに置いている場合はファイルを直接開くか簡易HTTPサーバで）。
2. 任意の `section` に上のHTMLスニペットを貼る。
3. ページをリロードして画像が縮小表示されることを確認。
4. 画像をクリックしてライトボックスが開き、Escキーや背景クリックで閉じることを確認。

---

必要があればこのドキュメントに「キャプションのスタイル具体例」「ギャラリー実装例」などのコードを追記します。どの拡張を優先するか教えてください。

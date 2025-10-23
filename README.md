# 🌐 Welcome to My Website

> 手作りで丁寧に作り上げた個人Webサイト - ノーコードツールに頼らない、純粋なHTML/CSS/JavaScriptの世界

[![GitHub last commit](https://img.shields.io/github/last-commit/Rino-program/WtMWs)](https://github.com/Rino-program/WtMWs/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/Rino-program/WtMWs)](https://github.com/Rino-program/WtMWs)
[![Website](https://img.shields.io/website?url=http%3A%2F%2Fringonote-ms.f5.si)](http://ringonote-ms.f5.si)

## 📝 プロジェクト概要

「Welcome to My Website」は、私が一から手作りで構築した個人Webサイトのソースコードリポジトリです。ブログ記事の投稿、リンク集、そして私自身の情報発信の場として運営しています。

基本的にノーコードツールを使わず、**HTML/CSS/JavaScriptを使ってコーディング**しています。コードの一部はGitHub Copilotの力を借りていますが、基本的な構造やデザインはすべて手作りです。

🔗 **Live Site**: [http://ringonote-ms.f5.si](http://ringonote-ms.f5.si)

---

## ✨ 特徴

- 🎨 **手作り設計** - ノーコードツール不使用、純粋なWeb技術で構築
- 📱 **レスポンシブデザイン** - スマホからPCまで快適に閲覧可能
- 📝 **ブログ機能** - 記事の投稿と一覧表示
- 🔗 **リンク集** - 便利なリンクをまとめて管理
- ⚡ **軽量・高速** - 余計なフレームワークを使わないシンプル設計
- 🤖 **一部AI支援** - GitHub Copilotを活用した効率的な開発

---

## 🛠️ 技術スタック

このプロジェクトで使用している技術：(現在)

| 技術 | 使用率 | 用途 |
|------|--------|------|
| JavaScript | 58.1% | インタラクティブな機能、動的なコンテンツ表示 |
| HTML | 24.4% | ページ構造、コンテンツのマークアップ |
| CSS | 17.5% | デザイン、レイアウト、アニメーション |

### 主な機能実装

- バニラJavaScript（フレームワークなし）
- CSSカスタムプロパティ（CSS変数）
- セマンティックHTML5
- モダンCSSレイアウト（Flexbox/Grid）

---

## 📁 ディレクトリ構成

```
WtMWs/
│
├── index.html                 # トップページ（サイトのエントリーポイント）
│
├── html/                      # HTMLファイル群
│   ├── blog_list.html        # ブログ記事一覧ページ
│   ├── blog/                 # 各ブログ記事（個別ページ）
│   │   ├── article1.html
│   │   ├── article2.html
│   │   └── ...
│   └── css/                  # スタイルシート
│       └── style.css         # 共通スタイル定義
│
├── auto_push.bat             # 自動コミット・プッシュスクリプト（Windows用）
├── auto_push_config.json     # 自動プッシュの設定ファイル
│
└── README.md                 # このファイル
```

---

## 🚀 ローカル環境での実行方法

このプロジェクトは純粋な静的サイトなので、特別な環境構築は不要です！

### 方法1: 直接HTMLファイルを開く

1. リポジトリをクローン
   ```bash
   git clone https://github.com/Rino-program/WtMWs.git
   cd WtMWs
   ```

2. `index.html` をブラウザで開く
   - ファイルをダブルクリック、または
   - ブラウザにドラッグ&ドロップ

### 方法2: ローカルサーバーを使用（推奨）

より本番環境に近い状態で確認したい場合：

**Python 3を使う場合:**
```bash
python -m http.server 8000
```

**Node.jsのhttp-serverを使う場合:**
```bash
npx http-server -p 8000
```

その後、ブラウザで `http://localhost:8000` にアクセス

---

## 🔧 自動コミット・プッシュ機能

開発の効率化のため、自動コミット・プッシュスクリプトを用意しています。

### 使い方

1. `auto_push_config.json` で設定を確認
   ```json
   {
     "enabled": true
   }
   ```

2. `auto_push.bat` を実行（Windows環境）
   ```bash
   auto_push.bat
   ```

> ⚠️ **注意**: 現在、動作確認は完了していません。使用する際は十分にテストしてください。

---

## 🗺️ ロードマップ

今後実装予定の機能や改善点：

- [ ] ダークモード対応
- [ ] 検索機能の追加
- [ ] ブログのタグ・カテゴリ機能
- [ ] RSSフィード対応
- [ ] パフォーマンス最適化
- [ ] アクセシビリティの向上（WCAG準拠）
- [ ] 自動プッシュ機能の動作確認と改善

---

## 🤝 コントリビューション

バグ報告や機能提案は大歓迎です！以下の方法でご連絡ください：

1. **Issue を作成** - バグや改善提案はGitHub Issuesへ
2. **Pull Request** - コードの改善案がある場合はPRをお願いします

### Pull Requestのガイドライン

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

---

## 📄 ライセンス

このプロジェクトのライセンスについては、現在明示的に設定されていません。
コードの利用を検討される場合は、事前にご連絡ください。

---

## 💬 お問い合わせ

質問や感想、ご意見などお気軽にどうぞ！

- 🐙 **GitHub**: [@Rino-program](https://github.com/Rino-program)

---

## 🌟 サポート

このプロジェクトが気に入ったら、ぜひスターをつけてください！⭐

---

<div align="center">
Made with ❤️ and ☕ by Rino-program
</div>
```

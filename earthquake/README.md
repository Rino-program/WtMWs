# 地震情報サイト 🌏

リアルタイムで地震情報を提供し、防災意識を高めることを目的としたWebサイトです。

## 機能

### 📊 リアルタイム震度
- 現在の地震活動状況を表示
- 地震発生地点のマップ表示（予定）

### ⚠️ 地震速報・情報
- 緊急地震速報の表示
- 最近の地震情報一覧（最新10件）
- 震源地、マグニチュード、最大震度などの詳細情報

### 📚 地震の知識
以下のトピックについて詳しく解説：
- 震度とマグニチュードの違い
- 地震が起きたときの適切な行動
- 防災グッズのチェックリスト
- 津波に関する情報
- 緊急地震速報のしくみ
- 日本の地震のメカニズム

## 技術スタック

- **HTML5**: セマンティックなマークアップ
- **CSS3**: レスポンシブデザイン、Flexbox、Grid
- **JavaScript (ES6+)**: 非同期データ取得、DOM操作

## データソース

- [気象庁](https://www.jma.go.jp/jma/index.html) - 地震情報API
- [防災科学技術研究所](https://www.bosai.go.jp/) - 地震データ

## セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/Rino-program/WtMWs.git
cd WtMWs/earthquake
```

2. ブラウザでindex.htmlを開く
```bash
# Windowsの場合
start index.html

# macOS/Linuxの場合
open index.html
```

または、ローカルサーバーを起動：
```bash
# Pythonを使用する場合
python -m http.server 8000

# Node.jsを使用する場合（http-serverがインストール済みの場合）
npx http-server
```

3. ブラウザで `http://localhost:8000` にアクセス

## 今後の実装予定

- [ ] 地震マップの実装（Leaflet.js / Google Maps API）
- [ ] プッシュ通知機能
- [ ] PWA対応（オフラインでも閲覧可能に）
- [ ] より詳細な地震データの表示
- [ ] 避難所マップの統合
- [ ] 多言語対応

## 注意事項

⚠️ **免責事項**
- このサイトの情報は参考情報です
- 正式な情報は必ず[気象庁の公式サイト](https://www.jma.go.jp/jma/index.html)でご確認ください
- 緊急時は公式な情報源を優先してください

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

プルリクエストや問題報告を歓迎します！

## 作成者

Rino-program

## リンク

- GitHub Pages: https://rino-program.github.io/WtMWs/earthquake/
- リポジトリ: https://github.com/Rino-program/WtMWs

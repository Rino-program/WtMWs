# Study Support v2

> 学習効率を最大化するポモドーロタイマー + タスク管理アプリケーション

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ 特徴

- 🎯 **ポモドーロタイマー** - 集中力を高める25分間の作業セッション
- 📝 **タスク管理** - タスクの作成・編集・削除・優先度設定
- 📊 **統計・分析** - 学習時間や進捗の可視化
- 🔔 **通知機能** - セッション完了時の通知
- 🌙 **ダーク/ライトモード** - 目に優しいテーマ
- 💾 **完全ローカル** - データはすべてブラウザ内に保存
- 📱 **PWA対応** - オフラインでも動作
- ⌨️ **キーボードショートカット** - 効率的な操作

## 🚀 はじめに

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Rino-program/WtMWs.git
cd WtMWs/study-v2

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

### ビルド

```bash
# プロダクションビルド
npm run build

# ビルドをプレビュー
npm run preview
```

## 📖 使い方

### 基本的な使い方

1. **タスクを作成** - 「+ タスク追加」ボタンからタスクを作成
2. **タスクを選択** - 取り組みたいタスクを選択
3. **タイマーを開始** - 「スタート」ボタンをクリック
4. **集中して作業** - 25分間集中して作業
5. **休憩を取る** - セッション完了後、5分間の休憩
6. **繰り返す** - 4ラウンド後に長い休憩（15分）

### キーボードショートカット

| キー | 機能 |
|-----|------|
| `Space` | タイマーの開始/一時停止 |
| `S` | セッションをスキップ |
| `R` | タイマーをリセット |
| `1` | セッションタブに切り替え |
| `2` | ダッシュボードタブに切り替え |
| `3` | 設定タブに切り替え |

## 🏗️ アーキテクチャ

### プロジェクト構造

```
study-v2/
├── src/
│   ├── core/              # コアロジック
│   │   ├── App.ts         # アプリケーションメイン
│   │   ├── Timer.ts       # タイマー機能
│   │   ├── TaskManager.ts # タスク管理
│   │   └── ...
│   ├── storage/           # データストレージ
│   │   └── DatabaseManager.ts # IndexedDB管理
│   ├── ui/                # UIコンポーネント
│   │   ├── views/         # ビュー
│   │   └── utils/         # UIユーティリティ
│   ├── types/             # TypeScript型定義
│   ├── utils/             # ユーティリティ関数
│   └── config/            # 設定
├── styles/                # スタイルシート
└── tests/                 # テスト
```

### 技術スタック

- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **IndexedDB** - ローカルデータベース
- **Web Workers** - 高精度タイマー
- **CSS Variables** - テーマシステム
- **Vitest** - テストフレームワーク

## 🧪 テスト

```bash
# テスト実行
npm test

# カバレッジ確認
npm run test:coverage

# UIでテスト実行
npm run test:ui
```

## 📝 開発

### コード品質

```bash
# リント
npm run lint

# フォーマット
npm run format

# 型チェック
npm run type-check
```

### デバッグ

開発モードでは、コンソールでアプリインスタンスにアクセスできます：

```javascript
window.app.getState()        // アプリケーション状態の取得
window.app.tasks.getAllTasks()  // 全タスクの取得
window.app.sessions.getTodayTotalMinutes()  // 今日の合計時間
```

## 🎨 カスタマイズ

### テーマのカスタマイズ

`styles/variables.css` でカラー変数を変更できます：

```css
:root {
  --primary: #22c55e;  /* プライマリカラー */
  --bg: #0b1220;       /* 背景色 */
  /* ... */
}
```

### タイマー設定

設定画面から以下を変更できます：

- 集中時間（1〜180分）
- 短休憩時間（1〜60分）
- 長休憩時間（1〜120分）
- ラウンド数（1〜12）

## 🔒 プライバシー

- すべてのデータはブラウザ内に保存されます
- サーバーへのデータ送信は一切ありません
- IndexedDBとlocalStorageを使用
- データエクスポート/インポート機能あり

## 🤝 貢献

バグ報告や機能リクエストは [Issues](https://github.com/Rino-program/WtMWs/issues) にお願いします。

## 📄 ライセンス

© 2025 Rino-program. All rights reserved.

## 🔗 リンク

- [ドキュメント](./docs/)
- [変更履歴](./CHANGELOG.md)
- [改善計画](./IMPROVEMENT_PLAN.md)

## 🙏 謝辞

この v2 は、旧バージョンの課題を解決し、より堅牢で拡張性の高いアプリケーションとして再設計されました。

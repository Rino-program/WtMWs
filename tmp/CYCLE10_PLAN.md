# サイクル10 改善計画（100項目）

## 新規アプリ（10項目）
1. [新規] base64/ - Base64エンコード/デコードツール（画像対応）
2. [新規] regex/ - 正規表現テスター（マッチハイライト・説明表示）
3. [新規] markdown/ - マークダウンプレビューエディタ
4. [新規] diff/ - テキスト差分比較ツール
5. [新規] ipsum/ - Lorem Ipsumダミーテキスト生成
6. [新規] urlparse/ - URL解析・パラメータ編集ツール
7. [新規] hash/ - ハッシュ生成器（MD5, SHA1, SHA256）
8. [新規] timezone/ - 世界時計・タイムゾーン変換
9. [新規] aspect/ - アスペクト比計算機（画像・動画用）
10. [新規] minify/ - HTML/CSS/JS圧縮ツール

## ゲーム拡張（20項目）
11. [拡張] tetris - ゴーストピース（落下予測）表示追加
12. [拡張] tetris - ホールド機能（ピース一時保存）
13. [拡張] tetris - T-Spinボーナス判定
14. [拡張] snake - ワープ壁モード（端から反対側へ）
15. [拡張] snake - 障害物ステージ追加
16. [拡張] minesweeper - 旗カウンター表示
17. [拡張] minesweeper - コード表示モード（残り地雷視覚化）
18. [拡張] chess - 駒の動き可能マスハイライト
19. [拡張] chess - チェックメイト判定強化
20. [拡張] chess - 引き分け（ステイルメイト）判定
21. [拡張] 2048 - アニメーション速度設定
22. [拡張] 2048 - カラーテーマ切り替え
23. [拡張] memory - カード裏面デザイン選択
24. [拡張] memory - サウンド効果追加
25. [拡張] slide - 画像読み込み機能
26. [拡張] slide - シャッフルアニメーション
27. [拡張] typing - カスタムテキスト入力
28. [拡張] typing - 日本語タイピングモード
29. [拡張] sudoku - ヒント機能（1マス解答表示）
30. [拡張] sudoku - メモ機能（候補数字表示）

## UI/UX改善（20項目）
31. [UI] 全アプリ - ローディングスピナー追加
32. [UI] 全アプリ - エラー表示コンポーネント統一
33. [UI] particles - プリセット保存機能
34. [UI] fractal - ブックマーク機能（座標保存）
35. [UI] drawboard - レイヤー機能追加
36. [UI] paint - 図形ツール（四角・円・直線）
37. [UI] visualizer - プレイリスト機能
38. [UI] piano - 録音・再生機能
39. [UI] wave - プリセット保存
40. [UI] life - ルールセット変更（B3/S23以外）
41. [UI] matrix - カスタム文字設定
42. [UI] penrose - アニメーション速度調整
43. [UI] timer - テーマカスタマイズ
44. [UI] pomodoro - カスタム時間設定
45. [UI] notes - フォルダ/カテゴリ機能
46. [UI] calculator - 計算履歴グラフ表示
47. [UI] converter - お気に入り変換保存
48. [UI] password - パスワード強度詳細表示
49. [UI] qrcode - バッチ生成機能
50. [UI] colorpicker - カラーパレット履歴

## アクセシビリティ（15項目）
51. [A11y] 全アプリ - skip link追加
52. [A11y] 全アプリ - focus-visible スタイル改善
53. [A11y] tetris - スクリーンリーダー対応状況表示
54. [A11y] snake - 音声フィードバック
55. [A11y] memory - カード内容読み上げ
56. [A11y] chess - 駒移動アナウンス
57. [A11y] timer - 残り時間音声通知
58. [A11y] calculator - 計算結果読み上げ
59. [A11y] notes - 見出しナビゲーション
60. [A11y] quotes - 引用読み上げボタン
61. [A11y] kanji - 読み上げ機能
62. [A11y] flashcard - カード読み上げ
63. [A11y] habit - 達成音フィードバック
64. [A11y] pomodoro - セッション終了通知音
65. [A11y] reaction - 結果音声フィードバック

## パフォーマンス最適化（10項目）
66. [Perf] particles - requestAnimationFrame最適化
67. [Perf] fractal - Web Worker使用でUI非ブロック
68. [Perf] life - オフスクリーンCanvas使用
69. [Perf] matrix - 描画バッチ処理
70. [Perf] visualizer - AudioContext最適化
71. [Perf] wave - シェーダー最適化
72. [Perf] gravity - 衝突判定効率化
73. [Perf] fluid - グリッド最適化
74. [Perf] cube3d - 頂点バッファ再利用
75. [Perf] penrose - タイル計算キャッシュ

## モバイル対応強化（10項目）
76. [Mobile] tetris - タッチボタン位置調整
77. [Mobile] chess - ドラッグ&ドロップ改善
78. [Mobile] drawboard - ピンチズーム対応
79. [Mobile] piano - マルチタッチ対応
80. [Mobile] sudoku - 数字パッド配置最適化
81. [Mobile] typing - ソフトキーボード対応
82. [Mobile] memory - カードサイズ自動調整
83. [Mobile] 2048 - スワイプ感度設定
84. [Mobile] slide - ジェスチャーガイド表示
85. [Mobile] habit - スワイプで完了/未完了

## データ永続化（10項目）
86. [Data] index - お気に入りアプリ機能
87. [Data] 全ゲーム - クラウド同期オプション（UI）
88. [Data] notes - 自動保存インジケーター
89. [Data] flashcard - デッキバックアップ機能
90. [Data] habit - 統計エクスポート（CSV）
91. [Data] pomodoro - 週間/月間レポート
92. [Data] typing - 練習履歴グラフ
93. [Data] calculator - 履歴エクスポート
94. [Data] palette - コレクション管理
95. [Data] jsonformat - 履歴機能

## バグ修正・安定性（5項目）
96. [Bug] chess - キャスリング条件修正（攻撃されているマス通過禁止）
97. [Bug] sudoku - 難易度による生成時間最適化
98. [Bug] memory - ダブルクリック防止
99. [Bug] tetris - 壁蹴り（Wall Kick）システム追加
100. [Bug] 2048 - タイル重複マージ防止

---
優先度: 新規アプリ > バグ修正 > パフォーマンス > UI改善 > アクセシビリティ

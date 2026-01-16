# サイクル12 改善計画（100項目）

## 新規アプリ（10項目）
1. [新規] morse/ - モールス信号変換器（音声再生付き）
2. [新規] pixel/ - ピクセルアートエディタ
3. [新規] ascii/ - ASCIIアート生成器（画像→ASCII）
4. [新規] shadow/ - CSSボックスシャドウ生成器
5. [新規] scramble/ - 単語スクランブルゲーム
6. [新規] hangman/ - ハングマンゲーム
7. [新規] wordcount/ - 文字数・単語数カウンター
8. [新規] stopwatch/ - ラップ機能付きストップウォッチ（強化版）
9. [新規] calendar/ - シンプルカレンダー・イベント管理
10. [新規] metronome/ - メトロノーム（BPM調整・ビート可視化）

## 既存アプリ拡張（25項目）
11. [拡張] tetris - ゴーストピース実装
12. [拡張] tetris - ホールド機能実装
13. [拡張] tetris - T-Spin判定
14. [拡張] tetris - 壁蹴り（SRS）
15. [拡張] snake - ワープ壁モード
16. [拡張] snake - 2Pモード
17. [拡張] minesweeper - 安全なフィールド開け
18. [拡張] chess - ステイルメイト判定
19. [拡張] chess - 駒移動可能マスハイライト
20. [拡張] chess - キャスリング条件強化
21. [拡張] 2048 - カラーテーマ3種追加
22. [拡張] memory - サウンド効果追加
23. [拡張] slide - カスタム画像モード
24. [拡張] sudoku - ヒント機能
25. [拡張] sudoku - メモ機能
26. [拡張] typing - 日本語モード
27. [拡張] typing - カスタムテキスト
28. [拡張] kanji - 音声読み上げ
29. [拡張] flashcard - スペース繰り返し学習
30. [拡張] habit - 週間サマリー
31. [拡張] pomodoro - 詳細統計画面
32. [拡張] notes - タグフィルター
33. [拡張] calculator - グラフ機能
34. [拡張] password - バッチ生成
35. [拡張] colorpicker - スポイトツール

## UI/UX改善（20項目）
36. [UI] index - お気に入りアプリ機能
37. [UI] index - ダークモードトグル
38. [UI] index - 履歴表示
39. [UI] 全アプリ - 統一ローディング
40. [UI] 全アプリ - エラーハンドリング改善
41. [UI] particles - プリセット保存
42. [UI] fractal - 座標ブックマーク
43. [UI] drawboard - レイヤー
44. [UI] paint - 図形ツール追加
45. [UI] visualizer - プレイリスト
46. [UI] piano - 録音機能
47. [UI] wave - プリセット保存
48. [UI] life - カスタムルール
49. [UI] matrix - 文字カスタマイズ
50. [UI] timer - テーマ選択
51. [UI] jsonformat - ダークテーマ
52. [UI] markdown - テーマ切り替え
53. [UI] diff - シンタックスハイライト
54. [UI] regex - 履歴機能
55. [UI] base64 - ファイル複数対応

## パフォーマンス（10項目）
56. [Perf] particles - WebGL移行検討
57. [Perf] fractal - Web Worker完全活用
58. [Perf] life - ダブルバッファ
59. [Perf] matrix - 最適化
60. [Perf] visualizer - オーディオ処理最適化
61. [Perf] wave - GPU活用
62. [Perf] gravity - 空間分割
63. [Perf] fluid - 計算効率化
64. [Perf] cube3d - 描画最適化
65. [Perf] penrose - キャッシュ活用

## アクセシビリティ（15項目）
66. [A11y] 全アプリ - キーボード操作完全対応
67. [A11y] 全アプリ - スクリーンリーダー対応
68. [A11y] 全アプリ - フォーカス表示改善
69. [A11y] 全アプリ - 色覚多様性対応
70. [A11y] tetris - 音声ガイド
71. [A11y] snake - 方向読み上げ
72. [A11y] memory - カード読み上げ
73. [A11y] chess - 盤面状況読み上げ
74. [A11y] timer - 時間読み上げ
75. [A11y] calculator - 結果読み上げ
76. [A11y] notes - 構造ナビゲーション
77. [A11y] quotes - 引用読み上げ
78. [A11y] kanji - 正解音声
79. [A11y] flashcard - カード音声
80. [A11y] habit - 完了フィードバック

## モバイル対応（10項目）
81. [Mobile] 全アプリ - タッチ操作最適化
82. [Mobile] tetris - ボタン配置改善
83. [Mobile] chess - ドラッグ改善
84. [Mobile] drawboard - 筆圧対応
85. [Mobile] piano - マルチタッチ
86. [Mobile] sudoku - パッド配置
87. [Mobile] typing - IME対応
88. [Mobile] 2048 - スワイプ感度
89. [Mobile] slide - ジェスチャー
90. [Mobile] habit - スワイプ操作

## データ・保存機能（10項目）
91. [Data] 全アプリ - データエクスポート統一
92. [Data] notes - クラウド同期UI
93. [Data] flashcard - デッキ共有
94. [Data] habit - 統計グラフ
95. [Data] pomodoro - 週間レポート
96. [Data] typing - 成長グラフ
97. [Data] calculator - 計算ログ
98. [Data] palette - コレクション
99. [Data] jsonformat - スニペット保存
100. [Data] markdown - 自動保存強化

---
## 完了サマリー（サイクル6-12）

### 追加されたアプリ（21個）
- サイクル7: reaction, habit, nummemory, slide
- サイクル8: 2048, tapspeed, kanji
- サイクル9: flashcard, jsonformat, palette
- サイクル10: base64, regex, markdown, diff, timezone
- サイクル11: lorem, gradient, binary
- サイクル12: (計画中)

### 主要なバグ修正
- Tetris: 7-bag randomization
- Chess: En passant

### 合計変更数
- サイクル6: 100項目（バグ修正中心）
- サイクル7: 100項目（新規アプリ4個）
- サイクル8: 100項目（新規アプリ3個）
- サイクル9: 100項目（新規アプリ3個）
- サイクル10: 100項目（新規アプリ5個）
- サイクル11: 100項目（新規アプリ3個）
- サイクル12: 100項目（計画）

総計: 700項目以上の改善計画

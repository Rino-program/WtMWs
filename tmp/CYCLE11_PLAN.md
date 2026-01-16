# サイクル11 改善計画（100項目）

## 新規アプリ（10項目）
1. [新規] lorem/ - Lorem Ipsumダミーテキスト生成器
2. [新規] gradient/ - CSSグラデーション生成器
3. [新規] shadow/ - CSSボックスシャドウ生成器
4. [新規] animate/ - CSSアニメーションプレビュー
5. [新規] pixel/ - ピクセルアートエディタ
6. [新規] ascii/ - ASCIIアート生成器
7. [新規] morse/ - モールス信号変換器
8. [新規] binary/ - 2進数/10進数/16進数変換
9. [新規] scramble/ - 単語スクランブルゲーム
10. [新規] hangman/ - ハングマンゲーム

## ゲーム機能拡張（20項目）
11. [拡張] tetris - ゴーストピース（落下予測）実装
12. [拡張] tetris - ホールド機能実装
13. [拡張] tetris - T-Spin判定・ボーナス実装
14. [拡張] tetris - 壁蹴り（Wall Kick）システム
15. [拡張] snake - ワープ壁モード追加
16. [拡張] snake - 障害物ステージ追加
17. [拡張] snake - 2Pモード（対戦）
18. [拡張] minesweeper - 旗カウンター改善
19. [拡張] minesweeper - ヒント機能
20. [拡張] chess - 駒移動可能マスハイライト
21. [拡張] chess - 棋譜表示・エクスポート
22. [拡張] chess - キャスリング条件強化（攻撃マス考慮）
23. [拡張] 2048 - カラーテーマ選択
24. [拡張] 2048 - アニメーション設定
25. [拡張] memory - カード裏面デザイン選択
26. [拡張] memory - サウンド効果
27. [拡張] slide - カスタム画像読み込み
28. [拡張] sudoku - ヒント機能（1マス解答）
29. [拡張] sudoku - メモ機能（候補数字）
30. [拡張] sudoku - 難易度タイムボーナス

## UI/UXエンハンスメント（20項目）
31. [UI] index - お気に入りアプリ機能
32. [UI] index - ダークモード切り替え
33. [UI] index - 最近使ったアプリ履歴
34. [UI] 全アプリ - ローディングアニメーション統一
35. [UI] 全アプリ - トースト通知改善
36. [UI] particles - プリセット保存機能
37. [UI] fractal - ブックマーク（座標保存）
38. [UI] drawboard - レイヤー機能
39. [UI] paint - 図形ツール
40. [UI] visualizer - プレイリスト
41. [UI] piano - 録音・再生機能
42. [UI] wave - プリセット保存
43. [UI] life - カスタムルールセット
44. [UI] matrix - カスタム文字設定
45. [UI] timer - テーマカスタマイズ
46. [UI] pomodoro - サウンド選択
47. [UI] notes - フォルダ機能
48. [UI] calculator - グラフ表示
49. [UI] colorpicker - パレット履歴
50. [UI] password - 複数生成

## アクセシビリティ強化（15項目）
51. [A11y] 全アプリ - キーボードショートカット一覧
52. [A11y] 全アプリ - フォーカス表示改善
53. [A11y] 全アプリ - aria-label完全対応
54. [A11y] tetris - 音声フィードバック
55. [A11y] snake - 方向音声通知
56. [A11y] memory - カード読み上げ
57. [A11y] chess - 移動アナウンス
58. [A11y] timer - 残り時間読み上げ
59. [A11y] calculator - 結果読み上げ
60. [A11y] notes - 見出しナビゲーション
61. [A11y] quotes - 引用読み上げ
62. [A11y] kanji - 音声再生
63. [A11y] flashcard - カード音声
64. [A11y] habit - 達成通知音
65. [A11y] pomodoro - セッション通知

## パフォーマンス最適化（10項目）
66. [Perf] particles - WebGL検討
67. [Perf] fractal - Web Worker化
68. [Perf] life - ダブルバッファリング
69. [Perf] matrix - 描画最適化
70. [Perf] visualizer - FFT最適化
71. [Perf] wave - シェーダー活用
72. [Perf] gravity - 空間分割法
73. [Perf] fluid - GPU計算検討
74. [Perf] cube3d - 頂点キャッシュ
75. [Perf] penrose - タイル計算最適化

## モバイル対応強化（10項目）
76. [Mobile] 全アプリ - スワイプナビゲーション
77. [Mobile] tetris - タッチ操作改善
78. [Mobile] chess - ドラッグ感度調整
79. [Mobile] drawboard - Apple Pencil対応
80. [Mobile] piano - タッチ応答改善
81. [Mobile] sudoku - パッド配置最適化
82. [Mobile] typing - IME対応改善
83. [Mobile] memory - タップ感度
84. [Mobile] 2048 - スワイプ閾値設定
85. [Mobile] habit - スワイプ操作

## データ管理強化（10項目）
86. [Data] 全アプリ - IndexedDB移行検討
87. [Data] notes - 自動バックアップ
88. [Data] flashcard - クラウド同期UI
89. [Data] habit - CSV/JSONエクスポート
90. [Data] pomodoro - 詳細統計
91. [Data] typing - 練習履歴詳細
92. [Data] calculator - 計算ログ
93. [Data] palette - コレクション共有
94. [Data] jsonformat - 履歴機能
95. [Data] markdown - 自動保存改善

## バグ修正・品質向上（5項目）
96. [Bug] chess - ステイルメイト判定追加
97. [Bug] sudoku - 生成アルゴリズム最適化
98. [Bug] memory - 連打防止強化
99. [Bug] 2048 - タイル重複防止
100. [Bug] typing - 日本語入力対応

---
優先度: 新規アプリ > バグ修正 > ゲーム拡張 > UI改善

#!/bin/bash
# Update Phase 4
sed -i 's/Phase 2: ゲームロジックの実装/Phase 4: データファイルの作成/g' phase4.html
sed -i 's/Phase 3: UIの実装/Phase 4: データファイルの作成/g' phase4.html
sed -i 's/シミュレーションとゲームエンジン - ゲームの核となる処理/ゲームコンテンツの追加 - 魚種、装備、装飾のデータ/g' phase4.html
sed -i 's/phase2/phase4/g' phase4.html
sed -i 's/phase3/phase5/g' phase4.html
sed -i 's/phase1/phase3/g' phase4.html
sed -i 's/"phase4.html" class="btn btn-secondary"/"phase3.html" class="btn btn-secondary"/g' phase4.html
sed -i 's/"phase5.html" class="btn btn-primary/"phase5.html" class="btn btn-primary/g' phase4.html
sed -i 's/Phase 3完了/Phase 4完了/g' phase4.html
sed -i 's/UIが完成しました/データファイルが整いました/g' phase4.html
sed -i 's/ゲームコンテンツを充実させるデータファイルを作成します/追加機能を実装してゲームを豊かにします/g' phase4.html

# Update Phase 5
sed -i 's/Phase 2: ゲームロジックの実装/Phase 5: 追加機能の実装/g' phase5.html
sed -i 's/Phase 3: UIの実装/Phase 5: 追加機能の実装/g' phase5.html
sed -i 's/Phase 4: データファイルの作成/Phase 5: 追加機能の実装/g' phase5.html
sed -i 's/シミュレーションとゲームエンジン - ゲームの核となる処理/ゲームを豊かにする機能 - セーブ\/ロード、イベント、実績/g' phase5.html
sed -i 's/ゲームコンテンツの追加 - 魚種、装備、装飾のデータ/ゲームを豊かにする機能 - セーブ\/ロード、イベント、実績/g' phase5.html
sed -i 's/phase2/phase5/g' phase5.html
sed -i 's/phase4/phase5/g' phase5.html
sed -i 's/phase3/phase4/g' phase5.html
sed -i 's/phase5/phase6/g' phase5.html
sed -i 's/phase6/bugfix/g' phase5.html
sed -i 's/"phase4.html" class="btn btn-secondary"/"phase4.html" class="btn btn-secondary"/g' phase5.html
sed -i 's/Phase 4完了/Phase 5完了/g' phase5.html
sed -i 's/データファイルが整いました/ゲームの主要機能がすべて完成しました/g' phase5.html
sed -i 's/追加機能を実装してゲームを豊かにします/継続的な改善とバグ対策に進みましょう/g' phase5.html

# Update Bugfix
sed -i 's/Phase 2: ゲームロジックの実装/バグ対策と改善/g' bugfix.html
sed -i 's/Phase 3: UIの実装/バグ対策と改善/g' bugfix.html
sed -i 's/Phase 4: データファイルの作成/バグ対策と改善/g' bugfix.html
sed -i 's/Phase 5: 追加機能の実装/バグ対策と改善/g' bugfix.html
sed -i 's/シミュレーションとゲームエンジン - ゲームの核となる処理/品質向上とメンテナンス - デバッグ、最適化、ドキュメント/g' bugfix.html
sed -i 's/ゲームを豊かにする機能 - セーブ\/ロード、イベント、実績/品質向上とメンテナンス - デバッグ、最適化、ドキュメント/g' bugfix.html
sed -i 's/phase2/bugfix/g' bugfix.html
sed -i 's/phase5/bugfix/g' bugfix.html
sed -i 's/phase4/phase5/g' bugfix.html
sed -i 's/bugfix/index/g' bugfix.html | head -1
sed -i 's/"index.html" class="btn btn-primary/"index.html" class="btn btn-primary/g' bugfix.html
sed -i 's/Phase 5完了/開発ガイド完了/g' bugfix.html
sed -i 's/継続的な改善とバグ対策に進みましょう/素晴らしい水族館ゲームが完成しました！/g' bugfix.html

echo "All phases updated!"

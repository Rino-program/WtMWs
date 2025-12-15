/**
 * メインエントリーポイント
 */

import { App } from '@/core/App';
import { renderApp } from '@/ui/render';
import { setupKeyboardShortcuts } from '@/ui/utils/keyboard';
import { setupVisibilityChange } from '@/ui/utils/visibility';

// グローバルアプリインスタンス
let app: App;

/**
 * アプリケーション起動
 */
async function main(): Promise<void> {
  try {
    // ローディング表示
    const loadingScreen = document.querySelector('.loading-screen');

    // アプリインスタンス作成
    app = new App();

    // 初期化
    await app.init();

    // UI レンダリング
    renderApp(app);

    // キーボードショートカット設定
    setupKeyboardShortcuts(app);

    // Visibility API設定（タブ切り替え時の処理）
    setupVisibilityChange(app);

    // ローディング非表示
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.remove();
      }, 300);
    }

    // Service Worker登録
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./sw.js');
        console.log('✅ Service Worker registered');
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }

    // グローバルからアクセス可能に（デバッグ用）
    if (process.env.NODE_ENV === 'development') {
      (window as any).app = app;
    }
  } catch (error) {
    console.error('アプリケーションの起動に失敗:', error);
    showErrorScreen(error);
  }
}

/**
 * エラー画面表示
 */
function showErrorScreen(error: unknown): void {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  const errorMessage = error instanceof Error ? error.message : String(error);

  appEl.innerHTML = `
    <div class="error-screen">
      <div class="error-content">
        <h1>⚠️ エラーが発生しました</h1>
        <p class="error-message">${errorMessage}</p>
        <button onclick="window.location.reload()" class="btn-primary">
          再読み込み
        </button>
      </div>
    </div>
  `;
}

/**
 * ページ読み込み完了後に実行
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

/**
 * ページアンロード時のクリーンアップ
 */
window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
  }
});

// エクスポート（テスト用）
export { app };

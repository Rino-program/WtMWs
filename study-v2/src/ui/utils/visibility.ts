/**
 * Visibility API設定（タブ切り替え時の処理）
 */

import { App } from '@/core/App';

export function setupVisibilityChange(app: App): void {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // タブがアクティブになったら強制的に再レンダリング
      // これによりタイマー表示が最新の状態に更新される
      const event = new CustomEvent('app:refresh');
      document.dispatchEvent(event);
    }
  });
}

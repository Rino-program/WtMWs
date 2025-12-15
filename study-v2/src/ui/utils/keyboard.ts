/**
 * キーボードショートカット設定
 */

import { App } from '@/core/App';
import { TimerState } from '@/core/Timer';

export function setupKeyboardShortcuts(app: App): void {
  document.addEventListener('keydown', (event) => {
    // 入力フィールドにフォーカスがある場合はスキップ
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case ' ': // Space: スタート/一時停止
        event.preventDefault();
        if (app['timer'].getState() === TimerState.Running) {
          app.pauseTimer();
        } else {
          app.startTimer();
        }
        break;

      case 's':
      case 'S': // S: スキップ
        event.preventDefault();
        app.skipTimer();
        break;

      case 'r':
      case 'R': // R: リセット
        event.preventDefault();
        if (confirm('タイマーをリセットしますか？')) {
          app.resetTimer();
        }
        break;

      case '1': // 1: セッションタブ
        event.preventDefault();
        switchToTab('session');
        break;

      case '2': // 2: ダッシュボードタブ
        event.preventDefault();
        switchToTab('dashboard');
        break;

      case '3': // 3: 設定タブ
        event.preventDefault();
        switchToTab('settings');
        break;
    }
  });
}

function switchToTab(tabName: string): void {
  const tab = document.querySelector(`[data-tab="${tabName}"]`) as HTMLElement;
  if (tab) {
    tab.click();
  }
}

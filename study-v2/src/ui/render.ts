/**
 * UIレンダリング
 */

import { App } from '@/core/App';
import { TimerView } from '@/ui/views/TimerView';
import { TaskView } from '@/ui/views/TaskView';
import { HeaderView } from '@/ui/views/HeaderView';

export function renderApp(app: App): void {
  const appEl = document.getElementById('app');
  if (!appEl) {
    throw new Error('App element not found');
  }

  // HTMLテンプレート
  appEl.innerHTML = `
    <div class="app-container">
      <div id="header"></div>
      <main class="main-content">
        <div class="session-view">
          <div id="task-panel" class="panel"></div>
          <div id="timer-panel" class="panel"></div>
        </div>
        <div id="dashboard-view" class="hidden"></div>
        <div id="settings-view" class="hidden"></div>
      </main>
      <div id="toast-container"></div>
    </div>
  `;

  // ビューの初期化
  const headerView = new HeaderView(app);
  const taskView = new TaskView(app);
  const timerView = new TimerView(app);

  headerView.render();
  taskView.render();
  timerView.render();
}

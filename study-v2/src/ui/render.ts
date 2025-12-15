/**
 * UIレンダリング
 */

import { App } from '@/core/App';
import { TimerView } from '@/ui/views/TimerView';
import { TaskView } from '@/ui/views/TaskView';
import { HeaderView } from '@/ui/views/HeaderView';
import { DashboardView } from '@/ui/views/DashboardView';

export function renderApp(app: App): void {
  const appEl = document.getElementById('app');
  if (!appEl) {
    throw new Error('App element not found');
  }

  // HTMLテンプレート
  appEl.innerHTML = `
    <div class="app-container">
      <div id="header"></div>
      
      <!-- タブナビゲーション -->
      <nav class="tab-nav">
        <button class="tab-btn active" data-view="session">
          ⏱️ セッション
        </button>
        <button class="tab-btn" data-view="dashboard">
          📊 ダッシュボード
        </button>
        <button class="tab-btn" data-view="settings">
          ⚙️ 設定
        </button>
      </nav>

      <main class="main-content">
        <!-- セッションビュー -->
        <div id="session-view" class="view-panel active">
          <div class="session-layout">
            <div id="task-panel" class="panel"></div>
            <div id="timer-panel" class="panel"></div>
          </div>
        </div>

        <!-- ダッシュボードビュー -->
        <div id="dashboard-view" class="view-panel">
          <div id="dashboard-panel"></div>
        </div>

        <!-- 設定ビュー -->
        <div id="settings-view" class="view-panel">
          <div id="settings-panel"></div>
        </div>
      </main>

      <div id="toast-container"></div>
    </div>
  `;

  // ビューの初期化
  const headerView = new HeaderView(app);
  const taskView = new TaskView(app);
  const timerView = new TimerView(app);
  const dashboardView = new DashboardView(app);

  headerView.render();
  taskView.render();
  timerView.render();
  dashboardView.render();

  // タブ切り替え
  setupTabNavigation();
}

function setupTabNavigation(): void {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const viewPanels = document.querySelectorAll('.view-panel');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      
      // アクティブクラスを切り替え
      tabBtns.forEach((b) => b.classList.remove('active'));
      viewPanels.forEach((p) => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${view}-view`)?.classList.add('active');
    });
  });
}

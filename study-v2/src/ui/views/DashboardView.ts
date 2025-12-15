/**
 * ダッシュボードビュー - 統計と分析を表示
 */

import { App } from '@/core/App';
import { EVENT_NAMES } from '@/types/events';
import { formatTime } from '@/utils/dateHelpers';

export class DashboardView {
  private app: App;
  private container: HTMLElement | null = null;

  constructor(app: App) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.app.on(EVENT_NAMES.SESSION_END, () => this.render());
    this.app.on(EVENT_NAMES.TASK_UPDATE, () => this.render());
  }

  render(): void {
    this.container = document.getElementById('dashboard-panel');
    if (!this.container) return;

    const sessions = (this.app as any).sessionLogger.getAllSessions();
    const tasks = this.app.tasks.getAllTasks();
    const activeTasks = this.app.tasks.getActiveTasks();

    // 今日の統計
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter((s: any) => new Date(s.startedAt) >= today);
    const todayWorkTime = todaySessions.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0);
    const todayPomodoros = todaySessions.filter((s: any) => s.type === 'focus').length;

    // 今週の統計
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekSessions = sessions.filter((s: any) => new Date(s.startedAt) >= weekStart);
    const weekWorkTime = weekSessions.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0);

    // タスク統計
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.filter((t) => t.id !== 'none').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 期限切れ・近日締切
    const overdueTasks = this.app.tasks.getOverdueTasks();
    const upcomingTasks = this.app.tasks.getUpcomingTasks(3);

    this.container.innerHTML = `
      <div class="dashboard-container">
        <h2>📊 ダッシュボード</h2>
        
        <!-- 今日の統計 -->
        <div class="stats-section">
          <h3>📅 今日の学習</h3>
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon">⏱️</div>
              <div class="stat-content">
                <div class="stat-value">${formatTime(todayWorkTime)}</div>
                <div class="stat-label">学習時間</div>
              </div>
            </div>
            <div class="stat-card success">
              <div class="stat-icon">🍅</div>
              <div class="stat-content">
                <div class="stat-value">${todayPomodoros}</div>
                <div class="stat-label">ポモドーロ</div>
              </div>
            </div>
            <div class="stat-card info">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">${activeTasks.length}</div>
                <div class="stat-label">進行中タスク</div>
              </div>
            </div>
            <div class="stat-card warning">
              <div class="stat-icon">📈</div>
              <div class="stat-content">
                <div class="stat-value">${completionRate.toFixed(0)}%</div>
                <div class="stat-label">完了率</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 今週の統計 -->
        <div class="stats-section">
          <h3>📈 今週の推移</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-content">
                <div class="stat-value">${formatTime(weekWorkTime)}</div>
                <div class="stat-label">週間学習時間</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-content">
                <div class="stat-value">${weekSessions.filter((s: any) => s.type === 'focus').length}</div>
                <div class="stat-label">週間ポモドーロ</div>
              </div>
            </div>
          </div>
        </div>

        <!-- アラート -->
        ${
          overdueTasks.length > 0 || upcomingTasks.length > 0
            ? `
        <div class="alerts-section">
          <h3>⚠️ アラート</h3>
          ${
            overdueTasks.length > 0
              ? `
          <div class="alert alert-danger">
            <strong>期限切れ:</strong> ${overdueTasks.length}件のタスク
            <ul>
              ${overdueTasks.slice(0, 3).map((t) => `<li>${t.title}</li>`).join('')}
              ${overdueTasks.length > 3 ? `<li>他 ${overdueTasks.length - 3}件...</li>` : ''}
            </ul>
          </div>
          `
              : ''
          }
          ${
            upcomingTasks.length > 0
              ? `
          <div class="alert alert-warning">
            <strong>近日締切:</strong> ${upcomingTasks.length}件のタスク
            <ul>
              ${upcomingTasks.slice(0, 3).map((t) => `<li>${t.title} - ${new Date(t.deadline!).toLocaleDateString()}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }
        </div>
        `
            : ''
        }

        <!-- 最近のセッション -->
        <div class="recent-section">
          <h3>🕒 最近のセッション</h3>
          <div class="session-list">
            ${todaySessions
              .slice(-5)
              .reverse()
              .map(
                (s: any) => `
              <div class="session-item">
                <span class="session-type ${s.type}">${s.type === 'focus' ? '🍅' : '☕'}</span>
                <span class="session-task">${this.app.tasks.getTask(s.taskId)?.title || '不明'}</span>
                <span class="session-time">${formatTime(s.durationMs)}</span>
                <span class="session-date">${new Date(s.startedAt).toLocaleTimeString()}</span>
              </div>
            `
              )
              .join('') || '<p class="empty-message">今日はまだセッションがありません</p>'}
          </div>
        </div>
      </div>
    `;
  }

  destroy(): void {
    this.app.off(EVENT_NAMES.SESSION_END, () => this.render());
    this.app.off(EVENT_NAMES.TASK_UPDATE, () => this.render());
  }
}

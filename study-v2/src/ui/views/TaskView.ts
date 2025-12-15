/**
 * タスクビュー
 */

import { App } from '@/core/App';
import { Task, TaskStatus } from '@/types/models';
import { EVENT_NAMES } from '@/types/events';

export class TaskView {
  private app: App;
  private container: HTMLElement | null = null;

  constructor(app: App) {
    this.app = app;
    this.setupEventListeners();
  }

  render(): void {
    this.container = document.getElementById('task-panel');
    if (!this.container) return;

    const tasks = this.app.tasks.getActiveTasks();
    const state = this.app.getState();
    const currentTask = state.currentTaskId
      ? this.app.tasks.getTask(state.currentTaskId)
      : null;

    this.container.innerHTML = `
      <div class="task-container">
        <div class="task-header">
          <h2>タスク管理</h2>
          <button id="btn-add-task" class="btn btn-sm btn-primary">+ タスク追加</button>
        </div>

        ${
          currentTask && currentTask.id !== 'none'
            ? `
          <div class="current-task">
            <h3>現在のタスク</h3>
            <div class="task-card active">
              <div class="task-title">${currentTask.title}</div>
              ${currentTask.subject ? `<div class="task-subject">${currentTask.subject}</div>` : ''}
              ${
                currentTask.amount > 0
                  ? `
                <div class="task-progress">
                  <span>${currentTask.currentAmount}/${currentTask.amount}${currentTask.amountUnit}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(currentTask.currentAmount / currentTask.amount) * 100}%"></div>
                  </div>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        `
            : ''
        }

        <div class="task-list">
          <h3>タスク一覧 (${tasks.length})</h3>
          <div class="task-items">
            ${
              tasks.length > 0
                ? tasks
                    .map(
                      (task) => `
              <div class="task-item ${task.id === state.currentTaskId ? 'selected' : ''}" data-task-id="${task.id}">
                <div class="task-content">
                  <div class="task-title">${task.title}</div>
                  ${task.subject ? `<div class="task-subject">${task.subject}</div>` : ''}
                </div>
                <button class="btn-select" data-task-id="${task.id}">選択</button>
              </div>
            `
                    )
                    .join('')
                : '<p class="empty-message">タスクがありません</p>'
            }
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private setupEventListeners(): void {
    this.app.tasks.on(EVENT_NAMES.TASK_CREATE, () => this.render());
    this.app.tasks.on(EVENT_NAMES.TASK_UPDATE, () => this.render());
    this.app.tasks.on(EVENT_NAMES.TASK_DELETE, () => this.render());
    this.app.tasks.on(EVENT_NAMES.TASK_SELECT, () => this.render());
  }

  private attachEvents(): void {
    // タスク追加ボタン
    document.getElementById('btn-add-task')?.addEventListener('click', () => {
      this.showTaskForm();
    });

    // タスク選択ボタン
    document.querySelectorAll('.btn-select').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const taskId = (btn as HTMLElement).dataset.taskId;
        if (taskId) {
          await this.app.selectTask(taskId);
        }
      });
    });
  }

  private showTaskForm(): void {
    const title = prompt('タスクタイトル:');
    if (!title) return;

    const subject = prompt('科目/カテゴリ (任意):') || '';

    this.app.tasks
      .createTask({
        title,
        subject,
        notes: '',
        folderId: 'default',
        priority: 'normal' as any,
        status: TaskStatus.Active,
        goalMinutes: 0,
        amount: 0,
        amountUnit: '',
        currentAmount: 0,
        deadline: null,
        completedAt: null,
        tags: [],
      })
      .catch((error) => {
        alert(`タスクの作成に失敗しました: ${error.message}`);
      });
  }
}

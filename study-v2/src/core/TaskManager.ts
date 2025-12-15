/**
 * タスク管理クラス
 */

import { Task, TaskStatus, TaskPriority } from '@/types/models';
import { db } from '@/storage/DatabaseManager';
import { EventEmitter } from '@/utils/EventEmitter';
import { EVENT_NAMES } from '@/types/events';
import { validateTask } from '@/utils/validators';
import { NONE_TASK } from '@/config/constants';

export class TaskManager extends EventEmitter {
  private tasks: Task[] = [];

  /**
   * 初期化
   */
  async init(): Promise<void> {
    await this.loadTasks();
    
    // 'none' タスクが存在しない場合は作成
    const noneTask = this.tasks.find((t) => t.id === 'none');
    if (!noneTask) {
      await this.createTask(NONE_TASK);
    }
  }

  /**
   * タスクの読み込み
   */
  private async loadTasks(): Promise<void> {
    this.tasks = await db.getAll<Task>('tasks');
  }

  /**
   * タスク取得
   */
  getTask(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  /**
   * 全タスク取得
   */
  getAllTasks(): Task[] {
    return [...this.tasks];
  }

  /**
   * アクティブなタスク取得
   */
  getActiveTasks(): Task[] {
    return this.tasks.filter((t) => t.status === TaskStatus.Active && t.id !== 'none');
  }

  /**
   * フォルダIDで絞り込み
   */
  getTasksByFolder(folderId: string): Task[] {
    return this.tasks.filter((t) => t.folderId === folderId && t.id !== 'none');
  }

  /**
   * ステータスで絞り込み
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks.filter((t) => t.status === status && t.id !== 'none');
  }

  /**
   * 優先度で絞り込み
   */
  getTasksByPriority(priority: TaskPriority): Task[] {
    return this.tasks.filter((t) => t.priority === priority && t.id !== 'none');
  }

  /**
   * デッドラインが近いタスク取得
   */
  getUpcomingTasks(days: number = 7): Task[] {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.tasks.filter((t) => {
      if (!t.deadline || t.status !== TaskStatus.Active || t.id === 'none') return false;
      const deadline = new Date(t.deadline);
      return deadline >= now && deadline <= future;
    });
  }

  /**
   * 期限切れタスク取得
   */
  getOverdueTasks(): Task[] {
    const now = new Date();
    return this.tasks.filter((t) => {
      if (!t.deadline || t.status !== TaskStatus.Active || t.id === 'none') return false;
      return new Date(t.deadline) < now;
    });
  }

  /**
   * タスク作成
   */
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    // バリデーション
    const validation = validateTask(taskData);
    if (!validation.valid) {
      throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
    }

    const task: Task = {
      ...taskData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.put('tasks', task);
    this.tasks.push(task);

    this.emit(EVENT_NAMES.TASK_CREATE, { task });

    return task;
  }

  /**
   * タスク更新
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const task = this.getTask(id);
    if (!task) {
      throw new Error(`タスクが見つかりません: ${id}`);
    }

    // バリデーション
    const updatedTask = { ...task, ...updates };
    const validation = validateTask(updatedTask);
    if (!validation.valid) {
      throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
    }

    updatedTask.updatedAt = new Date();

    // 完了状態が変更された場合
    if (updates.status === TaskStatus.Completed && task.status !== TaskStatus.Completed) {
      updatedTask.completedAt = new Date();
    } else if (updates.status !== TaskStatus.Completed && task.status === TaskStatus.Completed) {
      updatedTask.completedAt = null;
    }

    await db.put('tasks', updatedTask);

    const index = this.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tasks[index] = updatedTask;
    }

    this.emit(EVENT_NAMES.TASK_UPDATE, { task: updatedTask });

    return updatedTask;
  }

  /**
   * タスク削除
   */
  async deleteTask(id: string): Promise<void> {
    if (id === 'none') {
      throw new Error('デフォルトタスクは削除できません');
    }

    const task = this.getTask(id);
    if (!task) {
      throw new Error(`タスクが見つかりません: ${id}`);
    }

    await db.delete('tasks', id);

    this.tasks = this.tasks.filter((t) => t.id !== id);

    this.emit(EVENT_NAMES.TASK_DELETE, { task });
  }

  /**
   * タスク完了
   */
  async completeTask(id: string): Promise<Task> {
    return this.updateTask(id, {
      status: TaskStatus.Completed,
      completedAt: new Date(),
    });
  }

  /**
   * タスクアーカイブ
   */
  async archiveTask(id: string): Promise<Task> {
    return this.updateTask(id, {
      status: TaskStatus.Archived,
    });
  }

  /**
   * タスクの量を増加
   */
  async incrementAmount(id: string, delta: number = 1): Promise<Task> {
    const task = this.getTask(id);
    if (!task) {
      throw new Error(`タスクが見つかりません: ${id}`);
    }

    const newAmount = Math.min(task.currentAmount + delta, task.amount);
    return this.updateTask(id, { currentAmount: newAmount });
  }

  /**
   * タスクの量を減少
   */
  async decrementAmount(id: string, delta: number = 1): Promise<Task> {
    const task = this.getTask(id);
    if (!task) {
      throw new Error(`タスクが見つかりません: ${id}`);
    }

    const newAmount = Math.max(task.currentAmount - delta, 0);
    return this.updateTask(id, { currentAmount: newAmount });
  }

  /**
   * タスクの量をリセット
   */
  async resetAmount(id: string): Promise<Task> {
    return this.updateTask(id, { currentAmount: 0 });
  }

  /**
   * 検索
   */
  searchTasks(query: string): Task[] {
    const lowerQuery = query.toLowerCase();
    return this.tasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(lowerQuery) ||
        task.subject.toLowerCase().includes(lowerQuery) ||
        task.notes.toLowerCase().includes(lowerQuery) ||
        task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * ID生成
   */
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Tasks Module
 * Study Support NG v1.0
 */

import { store } from '../core/store.js';
import { db, STORES } from '../core/database.js';
import { 
  generateId, 
  getPriorityColor, 
  getPriorityLabel,
  getDeadlineStatus,
  escapeHtml,
  formatDateLocale
} from '../core/utils.js';

class TasksModule {
  constructor() {
    this.elements = {};
  }

  async init() {
    this.cacheElements();
    this.bindEvents();
    this.subscribeToStore();
    await this.loadTasks();
    await this.loadFolders();
    this.render();
  }

  cacheElements() {
    this.elements = {
      tasksList: document.getElementById('tasks-list'),
      tasksEmpty: document.getElementById('tasks-empty'),
      quickTaskItems: document.getElementById('quick-task-items'),
      currentTaskDisplay: document.getElementById('current-task-display'),
      addTaskBtn: document.getElementById('add-task-btn'),
      addFolderBtn: document.getElementById('add-folder-btn'),
      quickAddTask: document.getElementById('quick-add-task'),
      selectTaskBtn: document.getElementById('select-task-btn'),
      folderFilter: document.getElementById('folder-filter'),
      taskSearch: document.getElementById('task-search'),
      filterTabs: document.querySelectorAll('.tasks-filters .filter-tab'),
      // Modal elements
      taskModal: document.getElementById('task-modal'),
      taskForm: document.getElementById('task-form'),
      taskModalTitle: document.getElementById('task-modal-title'),
      taskTitle: document.getElementById('task-title'),
      taskFolder: document.getElementById('task-folder'),
      taskPriority: document.getElementById('task-priority'),
      taskEstimated: document.getElementById('task-estimated'),
      taskDeadline: document.getElementById('task-deadline'),
      taskTags: document.getElementById('task-tags'),
      taskNotes: document.getElementById('task-notes'),
      taskCancelBtn: document.getElementById('task-cancel-btn'),
      taskModalClose: document.getElementById('task-modal-close'),
      // Folder modal
      folderModal: document.getElementById('folder-modal'),
      folderForm: document.getElementById('folder-form'),
      folderName: document.getElementById('folder-name'),
      folderColor: document.getElementById('folder-color'),
      folderIcon: document.getElementById('folder-icon'),
      folderCancelBtn: document.getElementById('folder-cancel-btn'),
      folderModalClose: document.getElementById('folder-modal-close'),
      // Task select modal
      taskSelectModal: document.getElementById('task-select-modal'),
      taskSelectList: document.getElementById('task-select-list'),
      taskSelectModalClose: document.getElementById('task-select-modal-close')
    };
  }

  bindEvents() {
    // Add task button
    this.elements.addTaskBtn?.addEventListener('click', () => this.openTaskModal());
    this.elements.quickAddTask?.addEventListener('click', () => this.openTaskModal());
    
    // Add folder button
    this.elements.addFolderBtn?.addEventListener('click', () => this.openFolderModal());
    
    // Select task button
    this.elements.selectTaskBtn?.addEventListener('click', () => this.openTaskSelectModal());
    
    // Task form
    this.elements.taskForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTask();
    });
    
    this.elements.taskCancelBtn?.addEventListener('click', () => this.closeTaskModal());
    this.elements.taskModalClose?.addEventListener('click', () => this.closeTaskModal());
    
    // Folder form
    this.elements.folderForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveFolder();
    });
    
    this.elements.folderCancelBtn?.addEventListener('click', () => this.closeFolderModal());
    this.elements.folderModalClose?.addEventListener('click', () => this.closeFolderModal());
    
    // Task select modal
    this.elements.taskSelectModalClose?.addEventListener('click', () => this.closeTaskSelectModal());
    
    // Filters
    this.elements.folderFilter?.addEventListener('change', (e) => {
      store.set('taskFilter.folder', e.target.value);
    });
    
    this.elements.taskSearch?.addEventListener('input', (e) => {
      store.set('taskFilter.search', e.target.value);
    });
    
    this.elements.filterTabs?.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        store.set('taskFilter.status', filter);
        
        this.elements.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
    
    // Task list click delegation
    this.elements.tasksList?.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-item');
      if (!taskItem) return;
      
      const taskId = taskItem.dataset.taskId;
      
      if (e.target.classList.contains('task-item__checkbox')) {
        this.toggleTaskComplete(taskId);
      } else if (e.target.closest('.task-edit-btn')) {
        this.openTaskModal(taskId);
      } else if (e.target.closest('.task-delete-btn')) {
        this.deleteTask(taskId);
      } else if (e.target.closest('.task-select-btn')) {
        this.selectTask(taskId);
      }
    });
    
    // Quick task list click
    this.elements.quickTaskItems?.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.quick-task-item');
      if (!taskItem) return;
      
      const taskId = taskItem.dataset.taskId;
      this.selectTask(taskId);
    });
    
    // Task select list click
    this.elements.taskSelectList?.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-select-item');
      if (!taskItem) return;
      
      const taskId = taskItem.dataset.taskId;
      this.selectTask(taskId);
      this.closeTaskSelectModal();
    });
  }

  subscribeToStore() {
    store.subscribe('tasks', () => this.render());
    store.subscribe('folders', () => this.renderFolderOptions());
    store.subscribe('taskFilter.*', () => this.render());
    store.subscribe('currentTask', () => this.renderCurrentTask());
    store.subscribe('ui.selectedTaskId', () => this.updateSelectedTask());
  }

  async loadTasks() {
    try {
      const tasks = await db.getAll(STORES.TASKS);
      store.set('tasks', tasks);
    } catch (error) {
      console.error('タスクの読み込みに失敗:', error);
      store.set('tasks', []);
    }
  }

  async loadFolders() {
    try {
      let folders = await db.getAll(STORES.FOLDERS);
      
      // Ensure default folder exists
      if (!folders.some(f => f.id === 'default')) {
        const defaultFolder = {
          id: 'default',
          name: 'デフォルト',
          color: '#6366f1',
          icon: '📁',
          order: 0,
          createdAt: Date.now()
        };
        await db.add(STORES.FOLDERS, defaultFolder);
        folders = [defaultFolder, ...folders];
      }
      
      store.set('folders', folders);
    } catch (error) {
      console.error('フォルダの読み込みに失敗:', error);
      store.set('folders', [{
        id: 'default',
        name: 'デフォルト',
        color: '#6366f1',
        icon: '📁',
        order: 0,
        createdAt: Date.now()
      }]);
    }
  }

  openTaskModal(taskId = null) {
    store.set('ui.editingTask', taskId);
    store.set('ui.modalOpen', 'task');
    
    // Reset form
    this.elements.taskForm?.reset();
    
    if (taskId) {
      // Edit mode
      const task = store.get('tasks').find(t => t.id === taskId);
      if (task) {
        this.elements.taskModalTitle.textContent = 'タスクを編集';
        this.elements.taskTitle.value = task.title;
        this.elements.taskFolder.value = task.folderId || 'default';
        this.elements.taskPriority.value = task.priority || 'normal';
        this.elements.taskEstimated.value = task.estimatedPomodoros || 1;
        this.elements.taskDeadline.value = task.deadline || '';
        this.elements.taskTags.value = task.tags?.join(', ') || '';
        this.elements.taskNotes.value = task.notes || '';
      }
    } else {
      // Create mode
      this.elements.taskModalTitle.textContent = 'タスクを追加';
    }
    
    // Update folder options
    this.renderFolderOptions();
    
    // Show modal
    document.getElementById('modal-overlay')?.classList.add('active');
    this.elements.taskModal?.classList.add('active');
    this.elements.taskTitle?.focus();
  }

  closeTaskModal() {
    store.set('ui.editingTask', null);
    store.set('ui.modalOpen', null);
    
    document.getElementById('modal-overlay')?.classList.remove('active');
    this.elements.taskModal?.classList.remove('active');
    this.elements.taskForm?.reset();
  }

  async saveTask() {
    const editingTaskId = store.get('ui.editingTask');
    const title = this.elements.taskTitle?.value.trim();
    
    if (!title) return;
    
    const taskData = {
      title,
      folderId: this.elements.taskFolder?.value || 'default',
      priority: this.elements.taskPriority?.value || 'normal',
      estimatedPomodoros: parseInt(this.elements.taskEstimated?.value) || 1,
      deadline: this.elements.taskDeadline?.value || null,
      tags: this.elements.taskTags?.value.split(',').map(t => t.trim()).filter(Boolean) || [],
      notes: this.elements.taskNotes?.value || '',
      updatedAt: Date.now()
    };
    
    try {
      if (editingTaskId) {
        // Update existing task
        const existingTask = store.get('tasks').find(t => t.id === editingTaskId);
        const updatedTask = { ...existingTask, ...taskData };
        await db.put(STORES.TASKS, updatedTask);
        
        const tasks = store.get('tasks').map(t => 
          t.id === editingTaskId ? updatedTask : t
        );
        store.set('tasks', tasks);
        
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { type: 'success', message: 'タスクを更新しました' }
        }));
      } else {
        // Create new task
        const newTask = {
          id: generateId(),
          ...taskData,
          status: 'active',
          completedPomodoros: 0,
          createdAt: Date.now()
        };
        
        await db.add(STORES.TASKS, newTask);
        
        const tasks = [...store.get('tasks'), newTask];
        store.set('tasks', tasks);
        
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { type: 'success', message: 'タスクを追加しました' }
        }));
      }
      
      this.closeTaskModal();
    } catch (error) {
      console.error('タスクの保存に失敗:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', message: 'タスクの保存に失敗しました' }
      }));
    }
  }

  async toggleTaskComplete(taskId) {
    const tasks = store.get('tasks');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const isCompleting = task.status !== 'completed';
    const updatedTask = {
      ...task,
      status: isCompleting ? 'completed' : 'active',
      completedAt: isCompleting ? Date.now() : null,
      updatedAt: Date.now()
    };
    
    try {
      await db.put(STORES.TASKS, updatedTask);
      
      const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
      store.set('tasks', updatedTasks);
      
      if (isCompleting) {
        // Update user stats
        const user = store.get('user');
        store.update('user', {
          totalTasksCompleted: user.totalTasksCompleted + 1
        });
        
        // Dispatch event for XP/achievements
        window.dispatchEvent(new CustomEvent('task-completed', {
          detail: { task: updatedTask }
        }));
      }
    } catch (error) {
      console.error('タスク状態の更新に失敗:', error);
    }
  }

  async deleteTask(taskId) {
    const confirmed = await this.confirmDelete('このタスクを削除しますか？');
    if (!confirmed) return;
    
    try {
      await db.delete(STORES.TASKS, taskId);
      
      const tasks = store.get('tasks').filter(t => t.id !== taskId);
      store.set('tasks', tasks);
      
      // Clear current task if deleted
      if (store.get('currentTask')?.id === taskId) {
        store.set('currentTask', null);
        store.set('timer.currentTaskId', null);
      }
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', message: 'タスクを削除しました' }
      }));
    } catch (error) {
      console.error('タスクの削除に失敗:', error);
    }
  }

  selectTask(taskId) {
    const task = store.get('tasks').find(t => t.id === taskId);
    store.set('currentTask', task || null);
    store.set('timer.currentTaskId', taskId || null);
    store.set('ui.selectedTaskId', taskId);
  }

  confirmDelete(message) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      const overlay = document.getElementById('modal-overlay');
      const messageEl = document.getElementById('confirm-message');
      const cancelBtn = document.getElementById('confirm-cancel');
      const okBtn = document.getElementById('confirm-ok');
      
      if (!modal || !overlay) {
        resolve(window.confirm(message));
        return;
      }
      
      messageEl.textContent = message;
      overlay.classList.add('active');
      modal.classList.add('active');
      
      const cleanup = () => {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        cancelBtn.removeEventListener('click', onCancel);
        okBtn.removeEventListener('click', onOk);
      };
      
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      
      const onOk = () => {
        cleanup();
        resolve(true);
      };
      
      cancelBtn.addEventListener('click', onCancel);
      okBtn.addEventListener('click', onOk);
    });
  }

  openFolderModal() {
    store.set('ui.modalOpen', 'folder');
    
    this.elements.folderForm?.reset();
    
    document.getElementById('modal-overlay')?.classList.add('active');
    this.elements.folderModal?.classList.add('active');
    this.elements.folderName?.focus();
  }

  closeFolderModal() {
    store.set('ui.modalOpen', null);
    
    document.getElementById('modal-overlay')?.classList.remove('active');
    this.elements.folderModal?.classList.remove('active');
    this.elements.folderForm?.reset();
  }

  async saveFolder() {
    const name = this.elements.folderName?.value.trim();
    if (!name) return;
    
    const folders = store.get('folders');
    const newFolder = {
      id: generateId(),
      name,
      color: this.elements.folderColor?.value || '#6366f1',
      icon: this.elements.folderIcon?.value || '📁',
      order: folders.length,
      createdAt: Date.now()
    };
    
    try {
      await db.add(STORES.FOLDERS, newFolder);
      store.set('folders', [...folders, newFolder]);
      
      this.closeFolderModal();
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', message: 'フォルダを作成しました' }
      }));
    } catch (error) {
      console.error('フォルダの作成に失敗:', error);
    }
  }

  openTaskSelectModal() {
    store.set('ui.modalOpen', 'taskSelect');
    
    this.renderTaskSelectList();
    
    document.getElementById('modal-overlay')?.classList.add('active');
    this.elements.taskSelectModal?.classList.add('active');
  }

  closeTaskSelectModal() {
    store.set('ui.modalOpen', null);
    
    document.getElementById('modal-overlay')?.classList.remove('active');
    this.elements.taskSelectModal?.classList.remove('active');
  }

  render() {
    this.renderTaskList();
    this.renderQuickTaskList();
  }

  renderTaskList() {
    const tasks = this.getFilteredTasks();
    const container = this.elements.tasksList;
    const emptyEl = this.elements.tasksEmpty;
    
    if (!container) return;
    
    if (tasks.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    
    if (emptyEl) emptyEl.classList.add('hidden');
    
    const folders = store.get('folders');
    const selectedTaskId = store.get('ui.selectedTaskId');
    
    container.innerHTML = tasks.map(task => {
      const folder = folders.find(f => f.id === task.folderId);
      const deadlineStatus = getDeadlineStatus(task.deadline);
      const isSelected = task.id === selectedTaskId;
      const isCompleted = task.status === 'completed';
      
      return `
        <div class="task-item ${isCompleted ? 'completed' : ''} ${isSelected ? 'selecting' : ''}" 
             data-task-id="${task.id}">
          <input type="checkbox" 
                 class="task-item__checkbox" 
                 ${isCompleted ? 'checked' : ''}>
          <div class="task-item__content">
            <div class="task-item__header">
              <span class="task-item__priority task-item__priority--${task.priority}" 
                    style="background: ${getPriorityColor(task.priority)}"></span>
              <span class="task-item__title">${escapeHtml(task.title)}</span>
            </div>
            <div class="task-item__meta">
              ${folder ? `
                <span class="task-item__folder">
                  <span style="color: ${folder.color}">${folder.icon}</span>
                  ${escapeHtml(folder.name)}
                </span>
              ` : ''}
              ${deadlineStatus ? `
                <span class="${deadlineStatus.class}">📅 ${deadlineStatus.text}</span>
              ` : ''}
              <span>🍅 ${task.completedPomodoros || 0}/${task.estimatedPomodoros || 1}</span>
              ${task.tags?.length ? `
                <div class="task-item__tags">
                  ${task.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
          <div class="task-item__actions">
            <button class="btn btn--icon btn--ghost task-select-btn" title="タイマーに設定">🎯</button>
            <button class="btn btn--icon btn--ghost task-edit-btn" title="編集">✏️</button>
            <button class="btn btn--icon btn--ghost btn--danger task-delete-btn" title="削除">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderQuickTaskList() {
    const tasks = store.get('tasks')
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        // Priority sort
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      })
      .slice(0, 5);
    
    const container = this.elements.quickTaskItems;
    if (!container) return;
    
    const selectedTaskId = store.get('ui.selectedTaskId');
    
    if (tasks.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem;">タスクがありません</p>';
      return;
    }
    
    container.innerHTML = tasks.map(task => `
      <div class="quick-task-item ${task.id === selectedTaskId ? 'selected' : ''}" 
           data-task-id="${task.id}">
        <span class="quick-task-item__priority" 
              style="background: ${getPriorityColor(task.priority)}"></span>
        <span class="quick-task-item__title">${escapeHtml(task.title)}</span>
        <span class="quick-task-item__pomodoros">🍅 ${task.completedPomodoros || 0}/${task.estimatedPomodoros || 1}</span>
      </div>
    `).join('');
  }

  renderTaskSelectList() {
    const tasks = store.get('tasks').filter(t => t.status !== 'completed');
    const container = this.elements.taskSelectList;
    if (!container) return;
    
    const currentTaskId = store.get('currentTask')?.id;
    
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📋</span>
          <p>未完了のタスクがありません</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = tasks.map(task => `
      <div class="task-select-item ${task.id === currentTaskId ? 'selected' : ''}" 
           data-task-id="${task.id}">
        <span class="quick-task-item__priority" 
              style="background: ${getPriorityColor(task.priority)}"></span>
        <div class="task-select-item__info">
          <div class="task-select-item__title">${escapeHtml(task.title)}</div>
          <div class="task-select-item__meta">
            🍅 ${task.completedPomodoros || 0}/${task.estimatedPomodoros || 1}
          </div>
        </div>
      </div>
    `).join('');
  }

  renderCurrentTask() {
    const task = store.get('currentTask');
    const container = this.elements.currentTaskDisplay;
    if (!container) return;
    
    if (!task) {
      container.innerHTML = `
        <div class="current-task-empty">
          <span class="current-task-empty__icon">📝</span>
          <p>タスクを選択してください</p>
          <button class="btn btn--secondary btn--sm" id="select-task-btn">タスクを選択</button>
        </div>
      `;
      
      // Re-bind the select task button
      document.getElementById('select-task-btn')?.addEventListener('click', () => this.openTaskSelectModal());
      return;
    }
    
    const folders = store.get('folders');
    const folder = folders.find(f => f.id === task.folderId);
    const progress = task.estimatedPomodoros > 0 
      ? Math.round((task.completedPomodoros / task.estimatedPomodoros) * 100) 
      : 0;
    
    container.innerHTML = `
      <div class="current-task-card" style="border-left-color: ${getPriorityColor(task.priority)}">
        <div class="current-task-card__title">${escapeHtml(task.title)}</div>
        <div class="current-task-card__meta">
          ${folder ? `<span style="color: ${folder.color}">${folder.icon}</span> ${escapeHtml(folder.name)}` : ''}
          <span>・🍅 ${task.completedPomodoros || 0}/${task.estimatedPomodoros || 1}</span>
        </div>
        <div class="current-task-card__progress">
          <div class="progress-bar progress-bar--success">
            <div class="progress-bar__fill" style="width: ${progress}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderFolderOptions() {
    const folders = store.get('folders');
    
    // Task folder select
    if (this.elements.taskFolder) {
      const currentValue = this.elements.taskFolder.value;
      this.elements.taskFolder.innerHTML = folders.map(f => `
        <option value="${f.id}">${f.icon} ${escapeHtml(f.name)}</option>
      `).join('');
      this.elements.taskFolder.value = currentValue || 'default';
    }
    
    // Filter folder select
    if (this.elements.folderFilter) {
      const currentValue = this.elements.folderFilter.value;
      this.elements.folderFilter.innerHTML = `
        <option value="all">すべてのフォルダ</option>
        ${folders.map(f => `
          <option value="${f.id}">${f.icon} ${escapeHtml(f.name)}</option>
        `).join('')}
      `;
      this.elements.folderFilter.value = currentValue || 'all';
    }
  }

  updateSelectedTask() {
    const selectedId = store.get('ui.selectedTaskId');
    
    // Update task list
    document.querySelectorAll('.task-item').forEach(el => {
      el.classList.toggle('selecting', el.dataset.taskId === selectedId);
    });
    
    // Update quick task list
    document.querySelectorAll('.quick-task-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.taskId === selectedId);
    });
  }

  getFilteredTasks() {
    const tasks = store.get('tasks');
    const filter = store.get('taskFilter');
    
    return tasks.filter(task => {
      // Folder filter
      if (filter.folder !== 'all' && task.folderId !== filter.folder) {
        return false;
      }
      
      // Status filter
      if (filter.status === 'active' && task.status === 'completed') {
        return false;
      }
      if (filter.status === 'completed' && task.status !== 'completed') {
        return false;
      }
      
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const tagMatch = task.tags?.some(t => t.toLowerCase().includes(searchLower));
        if (!titleMatch && !tagMatch) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Completed tasks at bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Priority sort
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Creation date (newest first)
      return b.createdAt - a.createdAt;
    });
  }

  async incrementTaskPomodoro(taskId) {
    if (!taskId) return;
    
    const tasks = store.get('tasks');
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTask = {
      ...task,
      completedPomodoros: (task.completedPomodoros || 0) + 1,
      updatedAt: Date.now()
    };
    
    try {
      await db.put(STORES.TASKS, updatedTask);
      
      const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
      store.set('tasks', updatedTasks);
      
      // Update current task if it's the same
      if (store.get('currentTask')?.id === taskId) {
        store.set('currentTask', updatedTask);
      }
    } catch (error) {
      console.error('タスクのポモドーロ数更新に失敗:', error);
    }
  }
}

export const tasks = new TasksModule();

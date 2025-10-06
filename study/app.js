// Study Support v0.2 Enhanced
// 指摘された問題をすべて修正：
// - 右上ボタンの動作修正
// - レイアウト大幅改善
// - プログレスバー表示
// - メモ表示機能
// - タスク選択時の表示変更
// - 機能大幅追加（ショートカット、目標設定、統計改善）
// - JSON エクスポート時にarchived除外
// - 通知機能、その他多数の改善

(() => {
  const LS_KEY = 'studyapp.db.v1';
  const BACKUP_PREFIX = 'studyapp.db.v1.corrupt.';

  const defaultSettings = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    roundsUntilLongBreak: 4,
    currentTaskId: null,
    theme: 'system',
    dailyGoalMinutes: 0,
    weeklyGoalMinutes: 0,
    showSeconds: false,
    compactMode: false,
    notifyBreakStart: false,
    notifyBreakEnd: false,
    notifyGoalAchieved: false,
    enableSound: true,
    autoStartBreaks: false,
    autoStartFocus: false,
    autoIncrementAmount: true, // 集中セッション完了時に量を自動増加
    prioritizeAmount: true, // 量を時間より優先して表示
    enableAnimations: true, // アニメーション効果
    showTaskPreview: true, // タスクプレビュー表示
  };

  const defaultDB = () => ({
    version: 1,
    tasks: [
      { 
        id: 'none', title: '未選択', subject: '', notes: '', goalMinutes: 0, 
        amount: 0, amountUnit: '', currentAmount: 0, priority: 'normal', 
        deadline: null, createdAt: Date.now(), updatedAt: Date.now(), 
        archived: false, folderId: null, completed: false 
      },
    ],
    folders: [
      { id: 'default', name: 'デフォルト', color: '#22c55e', createdAt: Date.now(), updatedAt: Date.now() }
    ],
    amountLogs: [], // {id, taskId, delta, unit, ts}
    sessions: [],
    settings: { ...defaultSettings },
    updatedAt: Date.now(),
  });

  function loadDB() {
    const text = localStorage.getItem(LS_KEY);
    if (!text) return defaultDB();
    try {
      const obj = JSON.parse(text);
      if (obj.version !== 1) throw new Error('unsupported version');
      // マイグレーション：新しい設定項目を追加
      obj.settings = { ...defaultSettings, ...obj.settings };
      
      // フォルダ機能のマイグレーション
      if (!obj.folders) {
        obj.folders = [
          { id: 'default', name: 'デフォルト', color: '#22c55e', createdAt: Date.now(), updatedAt: Date.now() }
        ];
      }
      
      // タスク・量項目の補完
      obj.tasks.forEach(task => {
        if (task.goalMinutes === undefined) task.goalMinutes = 0;
        if (task.amount === undefined) task.amount = 0;
        if (task.amountUnit === undefined) task.amountUnit = '';
        if (task.currentAmount === undefined) task.currentAmount = 0;
        if (task.folderId === undefined) task.folderId = 'default';
        if (task.completed === undefined) task.completed = false;
        if (task.priority === undefined) task.priority = 'normal';
        if (task.deadline === undefined) task.deadline = null;
      });
      if (!Array.isArray(obj.amountLogs)) obj.amountLogs = [];
      return obj;
    } catch (e) {
      console.error('データベースの読み込みに失敗しました:', e);
      // backup and reset
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const randomId = Math.random().toString(36).slice(2, 8);
      localStorage.setItem(BACKUP_PREFIX + ts + '_' + randomId, text ?? '');
      
      // ユーザーに通知
      setTimeout(() => {
        alert('データの読み込みに失敗しました。バックアップを作成して初期化しました。');
      }, 100);
      
      return defaultDB();
    }
  }

  function saveDB(db) {
    db.updatedAt = Date.now();
    
    // 定期的にバックアップを作成（3日ごとに）
    const lastBackup = localStorage.getItem('studyapp.lastBackup');
    const now = Date.now();
    if (!lastBackup || now - parseInt(lastBackup) > 3 * 24 * 60 * 60 * 1000) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const randomId = Math.random().toString(36).slice(2, 8);
      localStorage.setItem(BACKUP_PREFIX + 'auto_' + ts + '_' + randomId, localStorage.getItem(LS_KEY) || '');
      localStorage.setItem('studyapp.lastBackup', String(now));
    }
    
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('データ保存に失敗しました:', e);
      // ストレージ容量不足の場合、古いバックアップを削除
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_PREFIX + 'auto_')) {
          localStorage.removeItem(key);
          break;
        }
      }
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(db));
      } catch (e2) {
        alert('データの保存に失敗しました。ブラウザのストレージ容量を確認してください。');
      }
    }
  }

  // タイマー完了音声
  function playTimerSound() {
    try {
      // Web Audio APIを使用してビープ音を生成
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      // フォールバックとしてalert音を使用
      console.warn('音声再生に失敗:', e);
    }
  }
  
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        notificationPermission = permission === 'granted';
      });
    } else {
      notificationPermission = 'Notification' in window && Notification.permission === 'granted';
    }
  }

  function showNotification(title, body) {
    if (!notificationPermission) return;
    try {
      new Notification(title, { body });
    } catch (e) {
      console.warn('通知の表示に失敗:', e);
    }
  }

  // state
  let db = loadDB();
  let isDetailView = true; // タスク表示モード（詳細/選択式）
  let notificationPermission = false; // 通知許可状態

  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) {
      db = loadDB();
      refreshUI();
      
      // ダッシュボードがアクティブな場合、更新
      const activeTab = document.querySelector('.tab-button.is-active');
      if (activeTab && activeTab.dataset.tab === 'dashboard') {
        updateDashboard();
      }
    }
  });

  // Tabs - 右上ボタンの動作修正
  const tabs = Array.from(document.querySelectorAll('.tab-button'));
  const panes = {
    session: document.getElementById('section-session'),
    dashboard: document.getElementById('section-dashboard'),
    settings: document.getElementById('section-settings'),
  };
  
  tabs.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      tabs.forEach(b => { 
        b.classList.toggle('is-active', b === btn); 
        b.setAttribute('aria-selected', String(b===btn)); 
      });
      Object.entries(panes).forEach(([k, el]) => {
        if (el) el.classList.toggle('is-active', k === tab);
      });
      
      // フォーカス管理
      if (tab === 'session' && startBtn) startBtn.focus();
      if (tab === 'dashboard') updateDashboard();
      if (tab === 'settings') {
        loadSettingsIntoForm();
        if (focusMin) focusMin.focus();
      }
    });
  });

  // Theme
  function applyTheme() {
    const t = db.settings.theme || 'system';
    if (t === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = t;
    }
    
    // Compact mode
    const compact = db.settings.compactMode || false;
    document.documentElement.dataset.compactMode = String(compact);
  }

  // Task Management - 大幅改善
  const taskSelect = document.getElementById('task-select');
  const addTaskBtn = document.getElementById('add-task-btn');
  const addFolderBtn = document.getElementById('add-folder-btn');
  const deleteTaskBtn = document.getElementById('delete-task-btn');
  const changeTaskBtn = document.getElementById('change-task-btn');
  const toggleViewBtn = document.getElementById('toggle-view-btn');
  const taskForm = document.getElementById('new-task-form');
  const folderForm = document.getElementById('new-folder-form');
  const taskList = document.getElementById('task-list');
  const taskSelector = document.getElementById('task-selector');
  const taskItems = document.getElementById('task-items');
  const currentTaskDisplay = document.getElementById('current-task-display');

  // Folder and filter controls
  const folderFilter = document.getElementById('folder-filter');
  const filterAll = document.getElementById('filter-all');
  const filterIncomplete = document.getElementById('filter-incomplete');
  const filterCompleted = document.getElementById('filter-completed');

  const newTaskTitle = document.getElementById('new-task-title');
  const newTaskFolder = document.getElementById('new-task-folder');
  const newTaskSubject = document.getElementById('new-task-subject');
  const newTaskNotes = document.getElementById('new-task-notes');
  const newTaskGoal = document.getElementById('new-task-goal');
  const newTaskAmount = document.getElementById('new-task-amount');
  const newTaskAmountUnit = document.getElementById('new-task-amount-unit');
  const saveTaskBtn = document.getElementById('save-task-btn');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');

  const newFolderName = document.getElementById('new-folder-name');
  const newFolderColor = document.getElementById('new-folder-color');
  const saveFolderBtn = document.getElementById('save-folder-btn');
  const cancelFolderBtn = document.getElementById('cancel-folder-btn');

  // Amount controls
  const amountMinusBtn = document.getElementById('amount-minus-btn');
  const amountPlusBtn = document.getElementById('amount-plus-btn');
  const amountResetBtn = document.getElementById('amount-reset-btn');
  const amountCompleteBtn = document.getElementById('amount-complete-btn');
  const currentAmountDisplay = document.getElementById('current-amount-display');
  const taskFormTitle = document.getElementById('task-form-title');

  let editingTaskId = null; // 編集中のタスクID
  let currentFilter = 'all'; // all, incomplete, completed
  let currentFolderId = ''; // 空文字列 = すべてのフォルダ

  function activeTasks() {
    return db.tasks.filter(t => !t.archived);
  }

  function getFilteredTasks() {
    let tasks = activeTasks().filter(t => t.id !== 'none');
    
    // フォルダフィルター
    if (currentFolderId) {
      tasks = tasks.filter(t => t.folderId === currentFolderId);
    }
    
    // 完了状態フィルター
    switch (currentFilter) {
      case 'incomplete':
        tasks = tasks.filter(t => !t.completed);
        break;
      case 'completed':
        tasks = tasks.filter(t => t.completed);
        break;
      // 'all' の場合は何もしない
    }
    
    return tasks;
  }

  function getFolder(folderId) {
    return db.folders.find(f => f.id === folderId) || db.folders[0];
  }

  function getCurrentTask() {
    const id = db.settings.currentTaskId || 'none';
    return db.tasks.find(t => t.id === id) || db.tasks.find(t => t.id === 'none');
  }

  function renderFolderOptions() {
    // タスクフォーム内のフォルダ選択
    if (newTaskFolder) {
      newTaskFolder.innerHTML = '';
      db.folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        newTaskFolder.appendChild(option);
      });
    }
    
    // フィルター用のフォルダ選択
    if (folderFilter) {
      folderFilter.innerHTML = '<option value="">すべてのフォルダ</option>';
      db.folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        folderFilter.appendChild(option);
      });
      folderFilter.value = currentFolderId;
    }
  }

  function toggleFolderForm(show) {
    if (!folderForm) return;
    folderForm.classList.toggle('hidden', !show);
    folderForm.setAttribute('aria-hidden', String(!show));
    if (show && newFolderName) newFolderName.focus();
  }

  function getTaskProgress(taskId) {
    const task = db.tasks.find(t => t.id === taskId);
    if (!task || !task.goalMinutes || task.goalMinutes <= 0) return { progress: 0, totalMinutes: 0 };
    
    const today = startOfToday();
    const sessions = db.sessions.filter(s => s.taskId === taskId && s.startedAt >= today);
    const totalMs = sessions.reduce((acc, s) => acc + s.durationMs, 0);
    const totalMinutes = minutesRounded(totalMs);
    const progress = Math.round((totalMinutes / task.goalMinutes) * 100);
    
    return { progress, totalMinutes, goalMinutes: task.goalMinutes };
  }

  function renderCurrentTask() {
    if (!currentTaskDisplay) return;
    
    const task = getCurrentTask();
    const titleEl = currentTaskDisplay.querySelector('.task-title');
    const metaEl = currentTaskDisplay.querySelector('.task-meta');
    const amountEl = currentTaskDisplay.querySelector('.task-amount');
    const notesEl = currentTaskDisplay.querySelector('.task-notes');
    const amountControls = currentTaskDisplay.querySelector('.task-amount-controls');
    
    if (titleEl) titleEl.textContent = task.id === 'none' ? '未選択' : task.title;
    if (metaEl) metaEl.textContent = task.subject || '';
    
    // 量をメイン表示にする
    if (amountEl) {
      if (task.amount && task.amountUnit) {
        const progress = task.currentAmount || 0;
        const total = task.amount;
        const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
        amountEl.innerHTML = `
          <div style="font-weight:bold;font-size:16px;color:var(--primary);">
            ${progress}/${total}${task.amountUnit} (${percentage}%)
          </div>
          <div class="progress-bar-container" style="margin-top:4px;">
            <div class="progress-bar-fill" style="width: ${percentage}%"></div>
          </div>
        `;
      } else {
        amountEl.textContent = '';
      }
    }
    
    if (notesEl) notesEl.textContent = task.notes || '';
    
    // Amount controls
    if (amountControls) {
      if (task.id !== 'none' && task.amount > 0) {
        amountControls.style.display = 'flex';
        if (currentAmountDisplay) currentAmountDisplay.textContent = `${task.currentAmount || 0}/${task.amount}${task.amountUnit || ''}`;
        // ボタンの有効/無効
        if (amountMinusBtn) amountMinusBtn.disabled = (task.currentAmount || 0) <= 0;
        if (amountPlusBtn) amountPlusBtn.disabled = (task.currentAmount || 0) >= (task.amount || 0);
      } else {
        amountControls.style.display = 'none';
      }
    }
    
    // 時間目標は副次的に表示
    if (task.id !== 'none' && task.goalMinutes > 0) {
      const { progress, totalMinutes, goalMinutes } = getTaskProgress(task.id);
      if (metaEl) metaEl.textContent += ` | 時間目標: ${totalMinutes}/${goalMinutes}分 (${progress}%)`;
    }
  }

  function renderTaskList() {
    if (!taskItems) return;
    taskItems.innerHTML = '';
    
    const tasks = getFilteredTasks();
    if (tasks.length === 0) {
      const filterText = currentFilter === 'completed' ? '完了済みタスク' : (currentFilter === 'incomplete' ? '未完了タスク' : 'タスク');
      taskItems.innerHTML = `<p class="hint">${filterText}がありません。</p>`;
      return;
    }

    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item';
      if (task.id === db.settings.currentTaskId) item.classList.add('active');
      if (task.completed) item.classList.add('completed');
      
      const folder = getFolder(task.folderId);
      const { progress: timeProgress, totalMinutes, goalMinutes } = getTaskProgress(task.id);
      const amountProgress = task.amount > 0 ? Math.round(((task.currentAmount || 0) / task.amount) * 100) : 0;
      const amountCurrent = task.currentAmount || 0;
      
      // 優先度の表示
      const priorityIcon = {
        'normal': '',
        'high': '🔶',
        'urgent': '🔴'
      };
      const priorityText = {
        'normal': '',
        'high': '高優先度',
        'urgent': '緊急'
      };
      
      // デッドラインの表示
      let deadlineDisplay = '';
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays < 0;
        const isNearDeadline = diffDays <= 3 && diffDays >= 0;
        
        deadlineDisplay = `
          <div style="font-size:11px;color:${isOverdue ? 'var(--danger)' : isNearDeadline ? 'var(--warning)' : 'var(--text-muted)'};margin-top:4px;">
            ${isOverdue ? '⚠️ ' : isNearDeadline ? '⏰ ' : '📅 '}
            ${deadline.toLocaleDateString('ja-JP')}
            ${isOverdue ? ` (${Math.abs(diffDays)}日経過)` : diffDays === 0 ? ' (今日)' : ` (残り${diffDays}日)`}
          </div>
        `;
      }
      
      // 量をメインに、時間を副次的に表示
      let progressDisplay = '';
      if (task.amount > 0) {
        progressDisplay = `
          <div class="task-amount-progress" style="margin-top:6px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
              <span style="font-weight:bold;color:var(--primary);">${amountCurrent}/${task.amount}${task.amountUnit || ''}</span>
              <span style="font-size:12px;color:var(--text-muted);">${amountProgress}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${amountProgress}%"></div>
            </div>
          </div>
        `;
      }
      
      if (goalMinutes > 0) {
        progressDisplay += `
          <div class="task-time-progress" style="margin-top:4px;font-size:11px;color:var(--text-muted);">
            時間: ${totalMinutes}/${goalMinutes}分 (${timeProgress}%)
          </div>
        `;
      }
      
      item.innerHTML = `
        <div class="task-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div class="task-name" style="font-weight:bold;${task.completed ? 'text-decoration:line-through;opacity:0.7;' : ''}">
            ${priorityIcon[task.priority] || ''} ${task.title}
          </div>
          <div class="task-status">
            <span class="folder-indicator" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${folder.color};margin-right:4px;" title="${folder.name}"></span>
            ${task.priority !== 'normal' ? `<span style="font-size:10px;color:var(--warning);margin-right:4px;" title="${priorityText[task.priority]}">${priorityIcon[task.priority]}</span>` : ''}
            ${task.completed ? '<span style="color:var(--success);font-size:12px;">✓</span>' : ''}
          </div>
        </div>
        <div class="task-subject" style="color:var(--text-muted);font-size:12px;">${task.subject}</div>
        ${task.notes ? `<div class="task-notes" style="font-size:11px;color:var(--text-muted);margin-top:4px;font-style:italic;">${task.notes}</div>` : ''}
        ${deadlineDisplay}
        ${progressDisplay}
        <div class="task-actions" style="margin-top:8px;display:flex;gap:6px;justify-content:space-between;align-items:center;">
          <div style="display:flex;gap:4px;align-items:center;">
            <button class="edit-task-btn btn-icon" data-task-id="${task.id}" title="編集">✏️</button>
            <button class="toggle-complete-btn btn-icon" data-task-id="${task.id}" title="${task.completed ? '未完了に戻す' : '完了にする'}">
              ${task.completed ? '↩️' : '✅'}
            </button>
          </div>
          <button class="delete-task-btn btn-icon danger" data-task-id="${task.id}" title="削除">🗑️</button>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        if (e.target.closest('.task-actions')) return; // ボタンクリック時は無視
        db.settings.currentTaskId = task.id;
        saveDB(db);
        renderCurrentTask();
        renderTaskList();
        renderTaskOptions();
      });
      
      // ボタンのイベントリスナー
      const editBtn = item.querySelector('.edit-task-btn');
      const toggleCompleteBtn = item.querySelector('.toggle-complete-btn');
      const deleteBtn = item.querySelector('.delete-task-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          startEditTask(task.id);
        });
      }
      
      if (toggleCompleteBtn) {
        toggleCompleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleTaskComplete(task.id);
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTask(task.id);
        });
      }
      
      taskItems.appendChild(item);
    });
  }

  function renderTaskOptions() {
    if (!taskSelect) return;
    taskSelect.innerHTML = '';
    activeTasks().forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.id === 'none' ? '未選択' : `${t.title}${t.subject?` ・ ${t.subject}`:''}`;
      taskSelect.appendChild(opt);
    });
    const current = db.settings.currentTaskId || 'none';
    if (!activeTasks().some(t => t.id === current)) {
      db.settings.currentTaskId = 'none';
    }
    taskSelect.value = db.settings.currentTaskId || 'none';
  }

  function toggleTaskView() {
    if (!taskList || !taskSelector || !toggleViewBtn) return;
    isDetailView = !isDetailView;
    taskList.classList.toggle('hidden', !isDetailView);
    taskSelector.classList.toggle('hidden', isDetailView);
    toggleViewBtn.textContent = isDetailView ? '📊' : '📝';
    toggleViewBtn.title = isDetailView ? '選択式表示に切替' : '詳細表示に切替';
  }

  function toggleTaskForm(show) {
    if (!taskForm) return;
    taskForm.classList.toggle('hidden', !show);
    taskForm.setAttribute('aria-hidden', String(!show));
    if (show && newTaskTitle) newTaskTitle.focus();
  }

  function startEditTask(taskId) {
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    if (taskFormTitle) taskFormTitle.textContent = 'タスク編集';
    if (newTaskTitle) newTaskTitle.value = task.title;
    if (newTaskFolder) newTaskFolder.value = task.folderId || 'default';
    if (newTaskSubject) newTaskSubject.value = task.subject;
    if (newTaskNotes) newTaskNotes.value = task.notes;
    if (newTaskGoal) newTaskGoal.value = task.goalMinutes;
    if (newTaskAmount) newTaskAmount.value = task.amount;
    if (newTaskAmountUnit) newTaskAmountUnit.value = task.amountUnit;
    
    // 優先度とデッドラインも設定
    const newTaskPriority = document.getElementById('new-task-priority');
    const newTaskDeadline = document.getElementById('new-task-deadline');
    if (newTaskPriority) newTaskPriority.value = task.priority || 'normal';
    if (newTaskDeadline) newTaskDeadline.value = task.deadline || '';
    
    toggleTaskForm(true);
  }

  function toggleTaskComplete(taskId) {
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    task.updatedAt = Date.now();
    
    // 完了にした場合、量も最大にする
    if (task.completed && task.amount > 0) {
      const before = task.currentAmount || 0;
      task.currentAmount = task.amount;
      if (task.amount - before > 0) {
        logAmount(task.id, task.amount - before, task.amountUnit || '');
      }
    }
    
    saveDB(db);
    renderCurrentTask();
    renderTaskList();
    renderTaskOptions();
    
    if (task.completed && db.settings.notifyGoalAchieved && notificationPermission) {
      showNotification('タスク完了！', `${task.title} を完了しました！`);
    }
  }

  function deleteTask(taskId) {
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (confirm(`「${task.title}」を削除しますか？この操作は取り消せません。`)) {
      const index = db.tasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        db.tasks.splice(index, 1);
      }
      
      // 削除したタスクが現在選択中の場合、'none'に変更
      if (db.settings.currentTaskId === taskId) {
        db.settings.currentTaskId = 'none';
      }
      
      saveDB(db);
      renderCurrentTask();
      renderTaskList();
      renderTaskOptions();
      
      // ダッシュボードがアクティブな場合、更新
      const activeTab = document.querySelector('.tab-button.is-active');
      if (activeTab && activeTab.dataset.tab === 'dashboard') {
        updateDashboard();
      }
    }
  }

  function logAmount(taskId, delta, unit) {
    if (!db.amountLogs) db.amountLogs = [];
    db.amountLogs.push({
      id: 'a_' + Math.random().toString(36).slice(2, 9),
      taskId,
      delta,
      unit,
      ts: Date.now()
    });
    saveDB(db);
  }

  function autoIncrementAmount() {
    if (!db.settings.autoIncrementAmount) return; // 設定で無効化されている場合はスキップ
    
    const task = getCurrentTask();
    if (task.id === 'none' || task.amount <= 0) return;
    
    if (task.currentAmount < task.amount) {
      task.currentAmount++;
      task.updatedAt = Date.now();
      logAmount(task.id, 1, task.amountUnit || '');
      renderCurrentTask();
      renderTaskList();
      
      // 完了チェック
      if (task.currentAmount >= task.amount) {
        if (db.settings.notifyGoalAchieved && notificationPermission) {
          showNotification('タスク完了！', `${task.title} の目標量に達しました！`);
        }
        if (db.settings.enableSound !== false) {
          setTimeout(() => playTimerSound(), 500); // 少し遅延させて重複を避ける
        }
      }
    }
  }

  function incrementAmount() {
    const task = getCurrentTask();
    if (task.id === 'none' || task.amount <= 0) return;
    
    if (task.currentAmount < task.amount) {
      task.currentAmount++;
      task.updatedAt = Date.now();
      saveDB(db);
      renderCurrentTask();
      renderTaskList();
      
      // 完了チェック
      if (task.currentAmount >= task.amount) {
        if (db.settings.notifyGoalAchieved && notificationPermission) {
          showNotification('タスク完了！', `${task.title} の目標量に達しました！`);
        }
        if (db.settings.enableSound !== false) {
          playTimerSound();
        }
      }
    }
  }

  function decrementAmount() {
    const task = getCurrentTask();
    if (task.id === 'none' || task.amount <= 0) return;
    
    if (task.currentAmount > 0) {
      task.currentAmount--;
      task.updatedAt = Date.now();
      saveDB(db);
      renderCurrentTask();
      renderTaskList();
    }
  }

  function resetAmount() {
    const task = getCurrentTask();
    if (task.id === 'none' || task.amount <= 0) return;
    
    if (confirm('現在の量をリセットしますか？')) {
      const before = task.currentAmount || 0;
      task.currentAmount = 0;
      task.updatedAt = Date.now();
      if (before !== 0) logAmount(task.id, -before, task.amountUnit || ''); else saveDB(db);
      renderCurrentTask();
      renderTaskList();
    }
  }

  function completeAmount() {
    const task = getCurrentTask();
    if (task.id === 'none' || task.amount <= 0) return;
    
    const before = task.currentAmount || 0;
    task.currentAmount = task.amount;
    task.updatedAt = Date.now();
    if (task.amount - before !== 0) logAmount(task.id, task.amount - before, task.amountUnit || ''); else saveDB(db);
    renderCurrentTask();
    renderTaskList();
    
    if (db.settings.notifyGoalAchieved && notificationPermission) {
      showNotification('タスク完了！', `${task.title} を完了しました！`);
    }
    if (db.settings.enableSound !== false) {
      playTimerSound();
    }
  }

  // Event listeners - ボタンの動作修正
  if (addTaskBtn) addTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (newTaskTitle) newTaskTitle.value = '';
    if (newTaskFolder) newTaskFolder.value = 'default';
    if (newTaskSubject) newTaskSubject.value = '';
    if (newTaskNotes) newTaskNotes.value = '';
    if (newTaskGoal) newTaskGoal.value = '';
    if (newTaskAmount) newTaskAmount.value = '';
    if (newTaskAmountUnit) newTaskAmountUnit.value = '';
    editingTaskId = null;
    if (taskFormTitle) taskFormTitle.textContent = '新規タスク追加';
    toggleTaskForm(true);
    toggleFolderForm(false);
  });

  if (addFolderBtn) addFolderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (newFolderName) newFolderName.value = '';
    if (newFolderColor) newFolderColor.value = '#22c55e';
    toggleFolderForm(true);
    toggleTaskForm(false);
  });

  if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTaskForm(false);
    editingTaskId = null;
  });

  if (cancelFolderBtn) cancelFolderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFolderForm(false);
  });

  // フォルダフォーム送信
  if (folderForm) folderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newFolderName?.value.trim();
    if (!name) {
      if (newFolderName) newFolderName.focus();
      return;
    }
    
    const folder = {
      id: 'f_' + Math.random().toString(36).slice(2, 9),
      name,
      color: newFolderColor?.value || '#22c55e',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    db.folders.push(folder);
    saveDB(db);
    renderFolderOptions();
    toggleFolderForm(false);
  });

  // フィルターのイベントリスナー
  if (folderFilter) folderFilter.addEventListener('change', () => {
    currentFolderId = folderFilter.value;
    renderTaskList();
  });

  [filterAll, filterIncomplete, filterCompleted].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTaskList();
      });
    }
  });

  // タスクフォーム送信（統合版）
  if (taskForm) taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = newTaskTitle?.value.trim();
    if (!title) {
      if (newTaskTitle) newTaskTitle.focus();
      return;
    }
    
    // 優先度とデッドラインの取得
    const newTaskPriority = document.getElementById('new-task-priority');
    const newTaskDeadline = document.getElementById('new-task-deadline');
    
    if (editingTaskId) {
      // 編集モード
      const task = db.tasks.find(t => t.id === editingTaskId);
      if (task) {
        task.title = title;
        task.subject = newTaskSubject?.value.trim() || '';
        task.notes = newTaskNotes?.value.trim() || '';
        task.goalMinutes = parseInt(newTaskGoal?.value) || 0;
        task.amount = parseInt(newTaskAmount?.value) || 0;
        task.amountUnit = newTaskAmountUnit?.value.trim() || '';
        task.folderId = newTaskFolder?.value || 'default';
        task.priority = newTaskPriority?.value || 'normal';
        task.deadline = newTaskDeadline?.value || null;
        task.updatedAt = Date.now();
        saveDB(db);
        refreshTaskUI();
        editingTaskId = null;
        if (taskFormTitle) taskFormTitle.textContent = '新規タスク追加';
        toggleTaskForm(false);
      }
    } else {
      // 新規作成
      const t = {
        id: 't_' + Math.random().toString(36).slice(2,9),
        title,
        subject: newTaskSubject?.value.trim() || '',
        notes: newTaskNotes?.value.trim() || '',
        goalMinutes: parseInt(newTaskGoal?.value) || 0,
        amount: parseInt(newTaskAmount?.value) || 0,
        amountUnit: newTaskAmountUnit?.value.trim() || '',
        folderId: newTaskFolder?.value || 'default',
        priority: newTaskPriority?.value || 'normal',
        deadline: newTaskDeadline?.value || null,
        currentAmount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        archived: false,
        completed: false,
      };
      db.tasks.push(t);
      db.settings.currentTaskId = t.id;
      saveDB(db);
      refreshTaskUI();
      toggleTaskForm(false);
    }
    
    // ダッシュボードがアクティブな場合、更新
    const activeTab = document.querySelector('.tab-button.is-active');
    if (activeTab && activeTab.dataset.tab === 'dashboard') {
      updateDashboard();
    }
  });

  if (deleteTaskBtn) deleteTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const id = taskSelect?.value;
    if (id === 'none') return;
    const t = db.tasks.find(x => x.id === id);
    if (t) { t.archived = true; t.updatedAt = Date.now(); }
    if (db.settings.currentTaskId === id) db.settings.currentTaskId = 'none';
    saveDB(db);
    refreshTaskUI();
    
    // ダッシュボードがアクティブな場合、更新
    const activeTab = document.querySelector('.tab-button.is-active');
    if (activeTab && activeTab.dataset.tab === 'dashboard') {
      updateDashboard();
    }
  });

  if (changeTaskBtn) changeTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTaskView();
  });
  
  if (toggleViewBtn) toggleViewBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTaskView();
  });

  if (taskSelect) taskSelect.addEventListener('change', () => {
    db.settings.currentTaskId = taskSelect.value;
    saveDB(db);
    renderCurrentTask();
    renderTaskList();
  });

  // フォルダフォーム送信
  if (folderForm) folderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newFolderName?.value.trim();
    if (!name) {
      if (newFolderName) newFolderName.focus();
      return;
    }
    
    const folder = {
      id: 'f_' + Math.random().toString(36).slice(2, 9),
      name,
      color: newFolderColor?.value || '#22c55e',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    db.folders.push(folder);
    saveDB(db);
    renderFolderOptions();
    toggleFolderForm(false);
  });

  // フィルターのイベントリスナー
  if (folderFilter) folderFilter.addEventListener('change', () => {
    currentFolderId = folderFilter.value;
    renderTaskList();
  });

  function refreshTaskUI() {
    renderCurrentTask();
    renderTaskList();
    renderTaskOptions();
    renderFolderOptions();
  }

  // Timer - プログレスリング対応
  const modeLabel = document.getElementById('mode-label');
  const roundLabel = document.getElementById('round-label');
  const timeLeftEl = document.getElementById('time-left');
  const timePercentEl = document.getElementById('time-percent');
  const progressCircle = document.getElementById('progress-circle');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const skipBtn = document.getElementById('skip-btn');
  const resetBtn = document.getElementById('reset-btn');

  const Mode = { Focus:'focus', Short:'short', Long:'long' };
  let state = {
    mode: Mode.Focus,
    round: 1,
    endAt: null,
    running: false,
    pausedRemainingMs: null,
    focusStartedAt: null,
    intervalId: null,
    totalDurationMs: 0,
  };

  function currentModeMinutes() {
    const s = db.settings;
    return state.mode === Mode.Focus ? s.focusMinutes : (state.mode === Mode.Short ? s.shortBreakMinutes : s.longBreakMinutes);
  }

  function formatTime(ms, showSeconds = false) {
    const sec = Math.max(0, Math.ceil(ms/1000));
    const m = Math.floor(sec/60);
    const s = sec%60;
    return showSeconds ? 
      `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` :
      `${m}:${String(s).padStart(2,'0')}`;
  }

  function updateTitle(ms){
    const emoji = state.mode === Mode.Focus ? '🎯' : (state.mode === Mode.Short ? '☕' : '🛌');
    document.title = `${emoji} ${formatTime(ms)} - Study Support`;
  }

  function updateProgressRing(percentage) {
    if (!progressCircle) return;
    const circumference = 2 * Math.PI * 100; // 半径100pxに更新
    const offset = circumference * (1 - percentage / 100);
    progressCircle.style.strokeDashoffset = offset;
  }

  function setButtons() {
    if (startBtn) startBtn.disabled = state.running || state.endAt !== null;
    if (pauseBtn) pauseBtn.disabled = !state.running;
    if (resumeBtn) resumeBtn.disabled = state.running || (state.pausedRemainingMs == null);
    if (skipBtn) skipBtn.disabled = !state.running && state.endAt == null;
  }

  function displayTime(ms, percentage = 100){
    const showSeconds = db.settings.showSeconds || false;
    if (timeLeftEl) timeLeftEl.textContent = formatTime(ms, showSeconds);
    if (timePercentEl) timePercentEl.textContent = `${Math.round(percentage)}%`;
    updateProgressRing(percentage);
    updateTitle(ms);
  }

  function startTimer(){
    const minutes = currentModeMinutes();
    const durationMs = minutes * 60 * 1000;
    const now = Date.now();
    state.endAt = now + durationMs;
    state.totalDurationMs = durationMs;
    state.running = true;
    if (state.mode === Mode.Focus) state.focusStartedAt = now;
    tick();
    state.intervalId = setInterval(tick, 250);
    setButtons();
  }

  function pauseTimer(){
    if (!state.running) return;
    const remaining = Math.max(0, state.endAt - Date.now());
    state.pausedRemainingMs = remaining;
    state.running = false;
    clearInterval(state.intervalId); state.intervalId = null;
    setButtons();
  }

  function resumeTimer(){
    if (state.running || state.pausedRemainingMs == null) return;
    const now = Date.now();
    state.endAt = now + state.pausedRemainingMs;
    state.pausedRemainingMs = null;
    state.running = true;
    tick();
    state.intervalId = setInterval(tick, 250);
    setButtons();
  }

  function skipTimer(){
    finishCycle(true);
  }

  function resetTimer(){
    clearInterval(state.intervalId); state.intervalId = null;
    state = { mode: Mode.Focus, round: 1, endAt: null, running: false, pausedRemainingMs: null, focusStartedAt: null, intervalId: null, totalDurationMs: 0 };
    renderMode();
    const durationMs = currentModeMinutes() * 60 * 1000;
    state.totalDurationMs = durationMs;
    displayTime(durationMs, 100);
    setButtons();
  }

  function renderMode(){
    const modeText = state.mode === Mode.Focus ? '🎯 集中' : (state.mode === Mode.Short ? '☕ 短休憩' : '🛌 長休憩');
    if (modeLabel) modeLabel.textContent = modeText;
    if (roundLabel) roundLabel.textContent = `Round ${state.round}`;
  }

  function tick(){
    if (!state.endAt) return;
    const remaining = state.endAt - Date.now();
    const percentage = state.totalDurationMs > 0 ? Math.max(0, (remaining / state.totalDurationMs) * 100) : 100;
    
    if (remaining <= 0) {
      displayTime(0, 0);
      clearInterval(state.intervalId); state.intervalId = null;
      if (state.running) finishCycle(false);
      return;
    }
    displayTime(remaining, percentage);
  }

  function logFocusSession(endReason){
    if (state.focusStartedAt == null) return;
    const endedAt = Date.now();
    const durationMs = Math.max(0, endedAt - state.focusStartedAt);
    
    db.sessions.push({
      id: 's_' + Math.random().toString(36).slice(2,9),
      taskId: db.settings.currentTaskId || 'none',
      startedAt: state.focusStartedAt,
      endedAt,
      durationMs,
      round: state.round,
      endReason,
    });
    saveDB(db);
    state.focusStartedAt = null;
    
    checkGoalAchievement();
    updateSessionStats();
    
    // ダッシュボードがアクティブな場合、自動更新
    const activeTab = document.querySelector('.tab-button.is-active');
    if (activeTab && activeTab.dataset.tab === 'dashboard') {
      updateDashboard();
    }
  }

  function checkGoalAchievement() {
    if (!db.settings.notifyGoalAchieved || !notificationPermission) return;
    
    if (db.settings.dailyGoalMinutes > 0) {
      const todayMinutes = getTodayFocusMinutes();
      if (todayMinutes >= db.settings.dailyGoalMinutes) {
        showNotification('目標達成！', `今日の目標 ${db.settings.dailyGoalMinutes}分 を達成しました！`);
      }
    }
  }

  function nextModeAfterFocus(){
    if (state.round % db.settings.roundsUntilLongBreak === 0) return Mode.Long;
    return Mode.Short;
  }

  function finishCycle(skipped){
    const wasFocus = state.mode === Mode.Focus;
    const endReason = skipped ? 'skip' : 'complete';
    state.running = false;
    const prevRound = state.round;
    clearInterval(state.intervalId); state.intervalId = null;
    state.endAt = null;
    
    if (wasFocus) {
      logFocusSession(endReason);
      
      // 集中セッション完了時に量を自動で1増加（完了でない場合のみ）
      if (endReason === 'complete') {
        autoIncrementAmount();
      }
    }
    
    // 完了音声を再生
    if (db.settings.enableSound !== false) {
      playTimerSound();
    }
    
    if (!wasFocus && db.settings.notifyBreakEnd && notificationPermission) {
      showNotification('休憩終了', '集中タイムに戻りましょう！');
    }
    
    if (wasFocus) {
      state.mode = nextModeAfterFocus();
      if (db.settings.notifyBreakStart && notificationPermission) {
        const breakType = state.mode === Mode.Long ? '長休憩' : '短休憩';
        showNotification(`${breakType}開始`, `お疲れ様でした！${breakType}をお楽しみください。`);
      }
      // 休憩自動開始
      if (db.settings.autoStartBreaks && !skipped) {
        setTimeout(() => startTimer(), 1000);
      }
    } else {
      state.mode = Mode.Focus;
      state.round = prevRound + 1;
      // 集中自動開始
      if (db.settings.autoStartFocus && !skipped) {
        setTimeout(() => startTimer(), 1000);
      }
    }
    
    renderMode();
    const durationMs = currentModeMinutes() * 60 * 1000;
    state.totalDurationMs = durationMs;
    displayTime(durationMs, 100);
    setButtons();
  }

  // Event listeners
  if (startBtn) {
    startBtn.addEventListener('click', startTimer);
    startBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      startTimer();
    });
  }
  if (pauseBtn) {
    pauseBtn.addEventListener('click', pauseTimer);
    pauseBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      pauseTimer();
    });
  }
  if (resumeBtn) {
    resumeBtn.addEventListener('click', resumeTimer);
    resumeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      resumeTimer();
    });
  }
  if (skipBtn) {
    skipBtn.addEventListener('click', skipTimer);
    skipBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      skipTimer();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', resetTimer);
    resetBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }

  // Statistics functions
  function startOfDay(ts){
    const d = new Date(ts);
    d.setHours(0,0,0,0);
    return d.getTime();
  }
  function startOfToday(){ return startOfDay(Date.now()); }
  function isInToday(ts){
    const s = startOfToday();
    return ts >= s && ts < s + 24*60*60*1000;
  }
  function isInLast7Days(ts){
    const now = Date.now();
    return ts >= startOfDay(now - 6*24*60*60*1000);
  }

  function minutesRounded(ms){ return Math.round(ms/60000); }

  function getTodayFocusMinutes() {
    const todaySessions = db.sessions.filter(s => isInToday(s.startedAt));
    const todayMs = todaySessions.reduce((acc, s) => acc + s.durationMs, 0);
    return minutesRounded(todayMs);
  }

  function updateSessionStats() {
    const todayFocusEl = document.getElementById('today-focus-time');
    const streakEl = document.getElementById('streak-count');
    
    if (todayFocusEl) {
      todayFocusEl.textContent = `${getTodayFocusMinutes()}分`;
    }
    
    if (streakEl) {
      const todaySessions = db.sessions.filter(s => isInToday(s.startedAt));
      streakEl.textContent = String(todaySessions.length);
    }
  }

  // Settings - 大幅改善
  const focusMin = document.getElementById('focus-min');
  const shortMin = document.getElementById('short-min');
  const longMin = document.getElementById('long-min');
  const roundsUntilLong = document.getElementById('rounds-until-long');
  const dailyGoal = document.getElementById('daily-goal');
  const weeklyGoal = document.getElementById('weekly-goal');
  const showSeconds = document.getElementById('show-seconds');
  const compactMode = document.getElementById('compact-mode');
  const notifyBreakStart = document.getElementById('notify-break-start');
  const notifyBreakEnd = document.getElementById('notify-break-end');
  const notifyGoalAchieved = document.getElementById('notify-goal-achieved');
  const enableSound = document.getElementById('enable-sound');
  const autoStartBreaks = document.getElementById('auto-start-breaks');
  const autoStartFocus = document.getElementById('auto-start-focus');
  const autoIncrementAmountEl = document.getElementById('auto-increment-amount');
  const prioritizeAmountEl = document.getElementById('prioritize-amount');
  const themeSelect = document.getElementById('theme-select');
  
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');
  const saveGoalsBtn = document.getElementById('save-goals-btn');
  const testNotificationBtn = document.getElementById('test-notification');
  const clearDataBtn = document.getElementById('clear-data-btn');

  function loadSettingsIntoForm(){
    // 常に最新のDBを読み込んでフォームに反映（別タブや別処理でDBが変更されている場合に備える）
    db = loadDB();

    if (focusMin) focusMin.value = db.settings.focusMinutes;
    if (shortMin) shortMin.value = db.settings.shortBreakMinutes;
    if (longMin) longMin.value = db.settings.longBreakMinutes;
    if (roundsUntilLong) roundsUntilLong.value = db.settings.roundsUntilLongBreak;
    if (dailyGoal) dailyGoal.value = db.settings.dailyGoalMinutes || '';
    if (weeklyGoal) weeklyGoal.value = db.settings.weeklyGoalMinutes || '';
    if (themeSelect) themeSelect.value = db.settings.theme || 'system';
    if (showSeconds) showSeconds.checked = db.settings.showSeconds || false;
    if (compactMode) compactMode.checked = db.settings.compactMode || false;
    if (notifyBreakStart) notifyBreakStart.checked = db.settings.notifyBreakStart || false;
    if (notifyBreakEnd) notifyBreakEnd.checked = db.settings.notifyBreakEnd || false;
    if (notifyGoalAchieved) notifyGoalAchieved.checked = db.settings.notifyGoalAchieved || false;
    if (enableSound) enableSound.checked = db.settings.enableSound !== false;
    if (autoStartBreaks) autoStartBreaks.checked = db.settings.autoStartBreaks || false;
    if (autoStartFocus) autoStartFocus.checked = db.settings.autoStartFocus || false;
    if (autoIncrementAmountEl) autoIncrementAmountEl.checked = db.settings.autoIncrementAmount !== false;
    if (prioritizeAmountEl) prioritizeAmountEl.checked = db.settings.prioritizeAmount !== false;
    
    // 新しい設定項目
    const enableAnimationsEl = document.getElementById('enable-animations');
    const showTaskPreviewEl = document.getElementById('show-task-preview');
    if (enableAnimationsEl) enableAnimationsEl.checked = db.settings.enableAnimations !== false;
    if (showTaskPreviewEl) showTaskPreviewEl.checked = db.settings.showTaskPreview !== false;

    // フォームに反映したらテーマ/コンパクト表示を適用
    applyTheme();

    updateDataInfo();
  }

  function updateDataInfo() {
    const taskCountEl = document.getElementById('task-count');
    const sessionCountEl = document.getElementById('session-count');
    const dataSizeEl = document.getElementById('data-size');
    
    if (taskCountEl) taskCountEl.textContent = String(activeTasks().length - 1);
    if (sessionCountEl) sessionCountEl.textContent = String(db.sessions.length);
    if (dataSizeEl) {
      const sizeKB = Math.round(JSON.stringify(db).length / 1024);
      dataSizeEl.textContent = `${sizeKB} KB`;
    }
  }

  // Settings event listeners
  if (themeSelect) themeSelect.addEventListener('change', () => {
    db.settings.theme = themeSelect.value;
    applyTheme();
    saveDB(db);
  });

  // チェックボックスを変更したら即時保存・適用する（ユーザー操作で保存忘れが起きないように）
  if (showSeconds) showSeconds.addEventListener('change', () => {
    db.settings.showSeconds = showSeconds.checked;
    saveDB(db);
    // 表示を即時更新
    const remaining = state.endAt ? Math.max(0, state.endAt - Date.now()) : state.totalDurationMs;
    const percentage = state.totalDurationMs > 0 ? Math.max(0, (remaining / state.totalDurationMs) * 100) : 100;
    displayTime(remaining, percentage);
  });

  if (compactMode) compactMode.addEventListener('change', () => {
    db.settings.compactMode = compactMode.checked;
    saveDB(db);
    // compact の適用は applyTheme が担当しているので呼び出す
    applyTheme();
  });

  if (enableSound) enableSound.addEventListener('change', () => {
    db.settings.enableSound = enableSound.checked;
    saveDB(db);
  });

  if (autoStartBreaks) autoStartBreaks.addEventListener('change', () => {
    db.settings.autoStartBreaks = autoStartBreaks.checked;
    saveDB(db);
  });

  if (autoStartFocus) autoStartFocus.addEventListener('change', () => {
    db.settings.autoStartFocus = autoStartFocus.checked;
    saveDB(db);
  });

  // 新しい設定項目のイベントリスナー
  if (autoIncrementAmountEl) autoIncrementAmountEl.addEventListener('change', () => {
    db.settings.autoIncrementAmount = autoIncrementAmountEl.checked;
    saveDB(db);
  });

  if (prioritizeAmountEl) prioritizeAmountEl.addEventListener('change', () => {
    db.settings.prioritizeAmount = prioritizeAmountEl.checked;
    saveDB(db);
    // 表示を即座に更新
    refreshTaskUI();
  });

  // 通知設定（変更時に即時保存）
  if (notifyBreakStart) notifyBreakStart.addEventListener('change', () => {
    db.settings.notifyBreakStart = notifyBreakStart.checked;
    saveDB(db);
    if (notifyBreakStart.checked) requestNotificationPermission();
  });

  if (notifyBreakEnd) notifyBreakEnd.addEventListener('change', () => {
    db.settings.notifyBreakEnd = notifyBreakEnd.checked;
    saveDB(db);
    if (notifyBreakEnd.checked) requestNotificationPermission();
  });

  if (notifyGoalAchieved) notifyGoalAchieved.addEventListener('change', () => {
    db.settings.notifyGoalAchieved = notifyGoalAchieved.checked;
    saveDB(db);
    if (notifyGoalAchieved.checked) requestNotificationPermission();
  });

  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
    const s = db.settings;
    s.focusMinutes = clampInt(focusMin?.value, 1, 120, defaultSettings.focusMinutes);
    s.shortBreakMinutes = clampInt(shortMin?.value, 1, 60, defaultSettings.shortBreakMinutes);
    s.longBreakMinutes = clampInt(longMin?.value, 1, 120, defaultSettings.longBreakMinutes);
    s.roundsUntilLongBreak = clampInt(roundsUntilLong?.value, 1, 12, defaultSettings.roundsUntilLongBreak);
    s.showSeconds = showSeconds?.checked || false;
    s.compactMode = compactMode?.checked || false;
    s.notifyBreakStart = notifyBreakStart?.checked || false;
    s.notifyBreakEnd = notifyBreakEnd?.checked || false;
    s.notifyGoalAchieved = notifyGoalAchieved?.checked || false;
    s.enableSound = enableSound?.checked !== false;
    s.autoStartBreaks = autoStartBreaks?.checked || false;
    s.autoStartFocus = autoStartFocus?.checked || false;
    s.autoIncrementAmount = autoIncrementAmountEl?.checked !== false;
    s.prioritizeAmount = prioritizeAmountEl?.checked !== false;
    
    saveDB(db);

    // テーマとコンパクト表示を即時適用
    applyTheme();

    // タイマーが実行中の場合、現在のモードの時間を更新
    const newDurationMs = currentModeMinutes() * 60 * 1000;
    if (state.running && state.endAt) {
      // 実行中のタイマーの残り時間を維持しつつ、新しい時間を基準に調整
      const now = Date.now();
      const elapsed = state.totalDurationMs - (state.endAt - now);
      state.endAt = now + (newDurationMs - elapsed);
    }
    state.totalDurationMs = newDurationMs;
    
    // 時間を再表示
    const remaining = state.endAt ? Math.max(0, state.endAt - Date.now()) : newDurationMs;
    const percentage = state.totalDurationMs > 0 ? Math.max(0, (remaining / state.totalDurationMs) * 100) : 100;
    displayTime(remaining, percentage);
    
    // showSecondsが変更された場合、即座に時間を更新
    if (s.showSeconds !== db.settings.showSeconds) {
      displayTime(remaining, percentage);
    }
  });

  if (saveGoalsBtn) saveGoalsBtn.addEventListener('click', () => {
    db.settings.dailyGoalMinutes = parseInt(dailyGoal?.value) || 0;
    db.settings.weeklyGoalMinutes = parseInt(weeklyGoal?.value) || 0;
    saveDB(db);
    
    // ダッシュボードがアクティブな場合、更新
    const activeTab = document.querySelector('.tab-button.is-active');
    if (activeTab && activeTab.dataset.tab === 'dashboard') {
      updateDashboard();
    }
  });

  if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', () => {
    db.settings = { ...defaultSettings, currentTaskId: db.settings.currentTaskId };
    applyTheme();
    saveDB(db);
    loadSettingsIntoForm();
    renderMode();
    const durationMs = currentModeMinutes() * 60 * 1000;
    state.totalDurationMs = durationMs;
    displayTime(durationMs, 100);
    
    // ダッシュボードがアクティブな場合、更新
    const activeTab = document.querySelector('.tab-button.is-active');
    if (activeTab && activeTab.dataset.tab === 'dashboard') {
      updateDashboard();
    }
  });

  if (testNotificationBtn) testNotificationBtn.addEventListener('click', () => {
    if (!notificationPermission) {
      requestNotificationPermission();
      setTimeout(() => {
        if (notificationPermission) {
          showNotification('通知テスト', 'Study Support の通知が正常に動作しています！');
        } else {
          alert('通知許可が必要です。ブラウザの設定を確認してください。');
        }
      }, 500);
    } else {
      showNotification('通知テスト', 'Study Support の通知が正常に動作しています！');
    }
  });

  if (clearDataBtn) clearDataBtn.addEventListener('click', () => {
    if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      localStorage.removeItem(LS_KEY);
      location.reload();
    }
  });

  function clampInt(v, min, max, fallback){
    const n = parseInt(String(v), 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  // Dashboard - 大幅改善
  function updateDashboard(){
    updateOverviewStats();
    updateTodayStats();
    updateWeekStats();
    updateAmountStats();
  }

  function updateAmountStats() {
    // 今日の量と週間の量を today-task-progress と week-task-breakdown 下部に追加
    const todayTaskProgressEl = document.getElementById('today-task-progress');
    if (todayTaskProgressEl) {
      const todayStart = startOfToday();
      const logs = (db.amountLogs || []).filter(l => l.ts >= todayStart);
      if (logs.length > 0) {
        const sumByTask = new Map();
        logs.forEach(l => sumByTask.set(l.taskId, (sumByTask.get(l.taskId) || 0) + l.delta));
        const wrap = document.createElement('div');
        wrap.className = 'amount-summary';
        wrap.style.marginTop = '8px';
        wrap.innerHTML = '<div style="font-weight:bold">今日の量</div>';
        sumByTask.forEach((v, taskId) => {
          const t = db.tasks.find(x => x.id === taskId);
          const unit = t?.amountUnit || '';
          const name = t ? (t.id === 'none' ? '未選択' : t.title) : '削除済み';
          const row = document.createElement('div');
          row.textContent = `${name}: ${v}${unit}`;
          wrap.appendChild(row);
        });
        todayTaskProgressEl.appendChild(wrap);
      }
    }
    const weekTaskBreakdownEl = document.getElementById('week-task-breakdown');
    if (weekTaskBreakdownEl) {
      const weekStart = startOfDay(Date.now() - 6*24*60*60*1000);
      const logs = (db.amountLogs || []).filter(l => l.ts >= weekStart);
      if (logs.length > 0) {
        const sumByTask = new Map();
        logs.forEach(l => sumByTask.set(l.taskId, (sumByTask.get(l.taskId) || 0) + l.delta));
        const wrap = document.createElement('div');
        wrap.className = 'amount-summary';
        wrap.style.marginTop = '8px';
        wrap.innerHTML = '<div style="font-weight:bold">週間の量</div>';
        sumByTask.forEach((v, taskId) => {
          const t = db.tasks.find(x => x.id === taskId);
          const unit = t?.amountUnit || '';
          const name = t ? (t.id === 'none' ? '未選択' : t.title) : '削除済み';
          const row = document.createElement('div');
          row.textContent = `${name}: ${v}${unit}`;
          wrap.appendChild(row);
        });
        weekTaskBreakdownEl.appendChild(wrap);
      }
    }
  }

  function updateOverviewStats() {
    const totalMs = db.sessions.reduce((acc, s) => acc + s.durationMs, 0);
    const totalFocusEl = document.getElementById('total-focus-time');
    const totalSessionsEl = document.getElementById('total-sessions');
    const currentStreakEl = document.getElementById('current-streak');
    const efficiencyEl = document.getElementById('efficiency-rate');
    const productivityScoreEl = document.getElementById('productivity-score');
    
    if (totalFocusEl) {
      totalFocusEl.textContent = `${minutesRounded(totalMs)}分`;
    }
    
    if (totalSessionsEl) {
      totalSessionsEl.textContent = String(db.sessions.length);
    }
    
    if (currentStreakEl) {
      let streak = 0;
      const today = startOfToday();
      for (let i = 0; i < 30; i++) {
        const dayStart = today - (i * 24 * 60 * 60 * 1000);
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const hasSessions = db.sessions.some(s => s.startedAt >= dayStart && s.startedAt < dayEnd);
        if (hasSessions) {
          streak++;
        } else {
          break;
        }
      }
      currentStreakEl.textContent = String(streak);
    }
    
    if (efficiencyEl) {
      const completed = db.sessions.filter(s => s.endReason === 'complete').length;
      const total = db.sessions.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      efficiencyEl.textContent = `${rate}%`;
    }
    
    if (productivityScoreEl) {
      const completed = db.sessions.filter(s => s.endReason === 'complete').length;
      const total = db.sessions.length;
      const completionRate = total > 0 ? (completed / total) : 0;
      
      const avgSessionMs = total > 0 ? (totalMs / total) : 0;
      const avgSessionMinutes = minutesRounded(avgSessionMs);
      
      // 生産性スコア = 完了率 * 平均セッション時間 / 25（標準ポモドーロ時間）
      const productivityScore = Math.round(completionRate * avgSessionMinutes / 25 * 100);
      productivityScoreEl.textContent = String(Math.min(100, productivityScore));
    }
  }

  function updateTodayStats() {
    const todayTotalEl = document.getElementById('today-total');
    const todayCountEl = document.getElementById('today-count');
    const todayGoalEl = document.getElementById('today-goal-progress');
    const todayTaskProgressEl = document.getElementById('today-task-progress');
    const todaySessionsEl = document.getElementById('today-sessions');
    
    const todaySessions = db.sessions.filter(s => isInToday(s.startedAt));
    const todayMs = todaySessions.reduce((acc, s) => acc + s.durationMs, 0);
    const todayMinutes = minutesRounded(todayMs);
    
    if (todayTotalEl) todayTotalEl.textContent = `${todayMinutes}分`;
    if (todayCountEl) todayCountEl.textContent = String(todaySessions.length);
    
    if (todayGoalEl) {
      const goal = db.settings.dailyGoalMinutes || 0;
      const progress = goal > 0 ? Math.round((todayMinutes / goal) * 100) : 0;
      todayGoalEl.textContent = `${progress}%`;
    }
    
    // タスク別進捗
    if (todayTaskProgressEl) {
      todayTaskProgressEl.innerHTML = '';
      const taskStats = new Map();
      
      todaySessions.forEach(s => {
        const taskId = s.taskId || 'none';
        taskStats.set(taskId, (taskStats.get(taskId) || 0) + s.durationMs);
      });
      
      const sortedTasks = [...taskStats.entries()].sort((a,b) => b[1] - a[1]);
      
      if (sortedTasks.length === 0) {
        todayTaskProgressEl.innerHTML = '<p class="hint">今日はまだセッションがありません。</p>';
        return;
      }
      
      sortedTasks.forEach(([taskId, ms]) => {
        const task = db.tasks.find(t => t.id === taskId);
        const taskName = task ? (task.id === 'none' ? '未選択' : task.title) : '削除済み';
        const minutes = minutesRounded(ms);
        
        const item = document.createElement('div');
        item.className = 'task-progress-item';
        
        let progressHtml = '';
        if (task && task.goalMinutes > 0) {
          const progress = Math.min(100, Math.round((minutes / task.goalMinutes) * 100));
          progressHtml = `
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${minutes}/${task.goalMinutes}分 (${progress}%)</div>
          `;
        }
        
        item.innerHTML = `
          <div class="task-progress-header">
            <span class="task-name">${taskName}</span>
            <span class="task-time">${minutes}分</span>
          </div>
          ${progressHtml}
        `;
        
        todayTaskProgressEl.appendChild(item);
      });
    }
    
    // セッション履歴
    if (todaySessionsEl) {
      todaySessionsEl.innerHTML = '';
      const recentSessions = todaySessions.slice(-10).reverse();
      
      if (recentSessions.length === 0) {
        todaySessionsEl.innerHTML = '<p class="hint">今日はまだセッションがありません。</p>';
        return;
      }
      
      recentSessions.forEach(session => {
        const task = db.tasks.find(t => t.id === session.taskId);
        const taskName = task ? (task.id === 'none' ? '未選択' : task.title) : '削除済み';
        const time = new Date(session.startedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        const duration = minutesRounded(session.durationMs);
        
        const item = document.createElement('div');
        item.className = 'session-item';
        item.innerHTML = `
          <span>${taskName}</span>
          <span class="session-time">${time} (${duration}分)</span>
        `;
        
        todaySessionsEl.appendChild(item);
      });
    }
  }

  function updateWeekStats() {
    const weekTotalEl = document.getElementById('week-total');
    const weekAverageEl = document.getElementById('week-average');
    const weekBestEl = document.getElementById('week-best');
    const weekGoalEl = document.getElementById('week-goal-progress');
    const weekChartEl = document.getElementById('week-chart-bars');
    const weekTaskBreakdownEl = document.getElementById('week-task-breakdown');
    
    // 過去7日間のデータ
    const weekData = [];
    const today = startOfToday();
    
    for (let i = 6; i >= 0; i--) {
      const dayStart = today - (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const daySessions = db.sessions.filter(s => s.startedAt >= dayStart && s.startedAt < dayEnd);
      const dayMs = daySessions.reduce((acc, s) => acc + s.durationMs, 0);
      weekData.push(minutesRounded(dayMs));
    }
    
    const weekTotal = weekData.reduce((acc, m) => acc + m, 0);
    const weekAverage = Math.round(weekTotal / 7);
    const weekBest = Math.max(...weekData);
    const weekGoal = db.settings.weeklyGoalMinutes || 0;
    const weekProgress = weekGoal > 0 ? Math.round((weekTotal / weekGoal) * 100) : 0;
    
    if (weekTotalEl) weekTotalEl.textContent = `${weekTotal}分`;
    if (weekAverageEl) weekAverageEl.textContent = `${weekAverage}分`;
    if (weekBestEl) weekBestEl.textContent = `${weekBest}分`;
    if (weekGoalEl) weekGoalEl.textContent = `${weekProgress}%`;
    
    // 週間チャート
    if (weekChartEl) {
      weekChartEl.innerHTML = '';
      const maxMinutes = Math.max(...weekData, 1);
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      const today = new Date().getDay();
      
      weekData.forEach((minutes, index) => {
        const dayIndex = (today - 6 + index + 7) % 7;
        const dayLabel = days[dayIndex];
        const isToday = index === 6;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar-container';
        barContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-height: 140px;
        `;
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        const height = Math.max(4, (minutes / maxMinutes) * 100);
        bar.style.cssText = `
          height: ${height}px;
          width: 32px;
          background: ${isToday ? 'var(--primary)' : minutes > 0 ? 'var(--success)' : 'var(--border)'};
          border-radius: 4px;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        `;
        bar.title = `${dayLabel}曜日: ${minutes}分`;
        
        // ホバーエフェクト
        bar.addEventListener('mouseenter', () => {
          bar.style.transform = 'scale(1.1)';
          bar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        bar.addEventListener('mouseleave', () => {
          bar.style.transform = 'scale(1)';
          bar.style.boxShadow = 'none';
        });
        
        const dayLabelEl = document.createElement('div');
        dayLabelEl.style.cssText = `
          font-size: 12px;
          color: ${isToday ? 'var(--primary)' : 'var(--text-muted)'};
          font-weight: ${isToday ? 'bold' : 'normal'};
          margin-bottom: 4px;
        `;
        dayLabelEl.textContent = dayLabel;
        
        const minutesEl = document.createElement('div');
        minutesEl.style.cssText = `
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
        `;
        minutesEl.textContent = `${minutes}分`;
        
        barContainer.appendChild(dayLabelEl);
        barContainer.appendChild(bar);
        barContainer.appendChild(minutesEl);
        weekChartEl.appendChild(barContainer);
      });
    }
    
    // 週間タスク別内訳
    if (weekTaskBreakdownEl) {
      weekTaskBreakdownEl.innerHTML = '';
      const weekSessions = db.sessions.filter(s => isInLast7Days(s.startedAt));
      const taskStats = new Map();
      
      weekSessions.forEach(s => {
        const taskId = s.taskId || 'none';
        taskStats.set(taskId, (taskStats.get(taskId) || 0) + s.durationMs);
      });
      
      const totalWeekMs = weekSessions.reduce((acc, s) => acc + s.durationMs, 0);
      const sortedTasks = [...taskStats.entries()].sort((a,b) => b[1] - a[1]);
      
      if (sortedTasks.length === 0) {
        weekTaskBreakdownEl.innerHTML = '<p class="hint">週間データがありません。</p>';
        return;
      }
      
      sortedTasks.forEach(([taskId, ms]) => {
        const task = db.tasks.find(t => t.id === taskId);
        const taskName = task ? (task.id === 'none' ? '未選択' : task.title) : '削除済み';
        const minutes = minutesRounded(ms);
        const percentage = totalWeekMs > 0 ? Math.round((ms / totalWeekMs) * 100) : 0;
        
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
          <div>
            <span class="task-name">${taskName}</span>
            <span style="font-size:12px;color:var(--text-muted)">${minutes}分 (${percentage}%)</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${percentage}%"></div>
          </div>
        `;
        
        weekTaskBreakdownEl.appendChild(item);
      });
    }
  }

  // Export/Import - archived除外対応
  const exportBtn = document.getElementById('export-btn');
  const importFile = document.getElementById('import-file');
  
  if (exportBtn) exportBtn.addEventListener('click', () => {
    if (confirm('現在のデータをJSONファイルとしてエクスポートしますか？')) {
      // archived タスクを除外してエクスポート
      const exportData = {
        ...db,
        tasks: db.tasks.filter(t => !t.archived), // archived タスクを除外
        amountLogs: db.amountLogs || [],
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `studyapp-${ts}.json`;
      a.href = url; a.click();
      URL.revokeObjectURL(url);
    }
  });
  
  if (importFile) importFile.addEventListener('change', async (e) => {
    const f = importFile.files?.[0];
    if (!f) return;
    
    if (!confirm('データをインポートします。現在のデータは上書きされますが、よろしいですか？')) {
      importFile.value = '';
      return;
    }
    
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      if (obj.version !== 1) throw new Error('Invalid version');
      
      // マイグレーション
      obj.settings = { ...defaultSettings, ...obj.settings };
      obj.tasks.forEach(task => {
        if (task.goalMinutes === undefined) task.goalMinutes = 0;
        if (task.amount === undefined) task.amount = 0;
        if (task.amountUnit === undefined) task.amountUnit = '';
        if (task.currentAmount === undefined) task.currentAmount = 0;
      });
      
      db = obj;
      saveDB(db);
      applyTheme();
      refreshUI();
      
      // ダッシュボードがアクティブな場合、更新
      const activeTab = document.querySelector('.tab-button.is-active');
      if (activeTab && activeTab.dataset.tab === 'dashboard') {
        updateDashboard();
      }
      
      alert('データをインポートしました！');
    } catch (err) {
      alert('インポートに失敗しました。ファイル形式を確認してください。\n' + err.message);
    } finally {
      importFile.value = '';
    }
  });

  // changeAmount helper function
  function changeAmount(delta) {
    if (delta > 0) {
      incrementAmount();
    } else if (delta < 0) {
      decrementAmount();
    }
  }

  // Mini timer controls
  const miniToggleBtn = document.getElementById('mini-toggle');
  if (miniToggleBtn) {
    miniToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.running) {
        pauseTimer();
      } else if (state.pausedRemainingMs !== null) {
        resumeTimer();
      } else {
        startTimer();
      }
    });
  }

  // Update mini timer display
  function updateMiniTimer() {
    const miniMode = document.getElementById('mini-mode');
    const miniTime = document.getElementById('mini-time');
    const miniToggle = document.getElementById('mini-toggle');
    
    if (miniMode) {
      const modeText = state.mode === Mode.Focus ? '🎯 集中' : (state.mode === Mode.Short ? '☕ 短休憩' : '🛌 長休憩');
      miniMode.textContent = modeText;
    }
    
    if (miniTime && miniToggle) {
      const remaining = state.endAt ? Math.max(0, state.endAt - Date.now()) : state.totalDurationMs;
      const percentage = state.totalDurationMs > 0 ? Math.max(0, (remaining / state.totalDurationMs) * 100) : 100;
      const showSeconds = db.settings.showSeconds || false;
      miniTime.textContent = `${formatTime(remaining, showSeconds)} (${Math.round(percentage)}%)`;
      
      // ボタンのテキストを更新
      if (state.running) {
        miniToggle.textContent = '⏸';
        miniToggle.title = '一時停止';
      } else if (state.pausedRemainingMs !== null) {
        miniToggle.textContent = '▶';
        miniToggle.title = '再開';
      } else {
        miniToggle.textContent = '▶';
        miniToggle.title = '開始';
      }
    }
  }

  // Update tick function to include mini timer
  const originalTick = tick;
  function tick(){
    originalTick();
    updateMiniTimer();
  }

  // Amount controls event listeners
  if (amountMinusBtn) amountMinusBtn.addEventListener('click', decrementAmount);
  if (amountPlusBtn) amountPlusBtn.addEventListener('click', incrementAmount);
  if (amountResetBtn) amountResetBtn.addEventListener('click', resetAmount);
  if (amountCompleteBtn) amountCompleteBtn.addEventListener('click', completeAmount);

  // Keyboard shortcuts - 追加機能
  document.addEventListener('keydown', (e) => {
    // フォーム入力中は処理しない
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }
    
    switch (e.key) {
      case ' ': // Space
        e.preventDefault();
        if (state.running) {
          pauseTimer();
        } else if (state.pausedRemainingMs !== null) {
          resumeTimer();
        } else {
          startTimer();
        }
        break;
      case 's':
      case 'S':
        e.preventDefault();
        if (state.running || state.endAt) {
          skipTimer();
        }
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        resetTimer();
        break;
      case '1':
        e.preventDefault();
        tabs[0]?.click();
        break;
      case '2':
        e.preventDefault();
        tabs[1]?.click();
        break;
      case '3':
        e.preventDefault();
        tabs[2]?.click();
        break;
      case '+':
      case '=': // 一部キーボードで+がShift+='に割当
        e.preventDefault();
        changeAmount(+1);
        break;
      case '-':
        e.preventDefault();
        changeAmount(-1);
        break;
    }
  });

  // Mini timer refs
  const mini = {
    bar: document.getElementById('mini-timer'),
    mode: document.getElementById('mini-mode'),
    time: document.getElementById('mini-time'),
    toggle: document.getElementById('mini-toggle'),
    skip: document.getElementById('mini-skip'),
  };

  function updateMiniTimer(msLeft = null, percentage = null) {
    if (!mini.bar) return;
    const emoji = state.mode === Mode.Focus ? '🎯' : (state.mode === Mode.Short ? '☕' : '🛌');
    if (mini.mode) mini.mode.textContent = `${emoji} ${state.mode === Mode.Focus ? '集中' : (state.mode === Mode.Short ? '短休憩' : '長休憩')}`;
    const ms = msLeft != null ? msLeft : (state.endAt ? Math.max(0, state.endAt - Date.now()) : currentModeMinutes()*60*1000);
    const pct = percentage != null ? percentage : (state.totalDurationMs > 0 ? Math.max(0, (ms / state.totalDurationMs) * 100) : 100);
    if (mini.time) mini.time.textContent = `${formatTime(ms, db.settings.showSeconds)} (${Math.round(pct)}%)`;
    if (mini.toggle) mini.toggle.textContent = state.running ? '⏸' : (state.endAt ? '▶' : '▶');
  }

  if (mini.toggle) mini.toggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.running) {
      pauseTimer();
    } else if (state.pausedRemainingMs != null) {
      resumeTimer();
    } else if (!state.endAt) {
      startTimer();
    } else {
      resumeTimer();
    }
    updateMiniTimer();
  });
  if (mini.skip) mini.skip.addEventListener('click', (e) => { e.preventDefault(); skipTimer(); updateMiniTimer(); });

  // Ensure amount button listeners after DOM is ready and elements exist
  setTimeout(() => {
    const am = document.getElementById('amount-minus-btn');
    const ap = document.getElementById('amount-plus-btn');
    const ar = document.getElementById('amount-reset-btn');
    const ac = document.getElementById('amount-complete-btn');
    if (am && !am.dataset.bound) { am.dataset.bound = '1'; am.addEventListener('click', (e)=>{e.preventDefault(); changeAmount(-1);}); am.addEventListener('touchend', (e)=>{e.preventDefault(); changeAmount(-1);}); }
    if (ap && !ap.dataset.bound) { ap.dataset.bound = '1'; ap.addEventListener('click', (e)=>{e.preventDefault(); changeAmount(+1);}); ap.addEventListener('touchend', (e)=>{e.preventDefault(); changeAmount(+1);}); }
    if (ar && !ar.dataset.bound) { ar.dataset.bound = '1'; ar.addEventListener('click', (e)=>{e.preventDefault(); resetAmount();}); ar.addEventListener('touchend', (e)=>{e.preventDefault(); resetAmount();}); }
    if (ac && !ac.dataset.bound) { ac.dataset.bound = '1'; ac.addEventListener('click', (e)=>{e.preventDefault(); completeAmount();}); ac.addEventListener('touchend', (e)=>{e.preventDefault(); completeAmount();}); }
  }, 0);

  // Hook mini timer into existing updates
  const _displayTime = displayTime;
  displayTime = function(ms, percentage = 100) {
    _displayTime(ms, percentage);
    updateMiniTimer(ms, percentage);
  };

  const _renderMode = renderMode;
  renderMode = function() {
    _renderMode();
    updateMiniTimer();
  };

  // Initial
  updateMiniTimer();

  // Initialize
  function refreshUI(){
    refreshTaskUI();
    renderMode();
    const durationMs = currentModeMinutes() * 60 * 1000;
    state.totalDurationMs = durationMs;
    displayTime(durationMs, 100);
    setButtons();
    updateSessionStats();
  }

  // Initial load
  applyTheme();
  requestNotificationPermission();
  refreshUI();
  loadSettingsIntoForm();

  // Service Worker registration for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker registered:', reg.scope))
        .catch(err => console.error('Service Worker registration failed:', err));
    });
  }

  // Visibility change handling - タブが非アクティブでも時間を正確に
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.running) {
      tick(); // タブが再度アクティブになったら即座に更新
    }
  });

  // Auto-save reminder (週に1回程度)
  setInterval(() => {
    const lastReminder = localStorage.getItem('studyapp.lastExportReminder');
    const now = Date.now();
    if (!lastReminder || now - parseInt(lastReminder) > 7 * 24 * 60 * 60 * 1000) {
      const sessions = db.sessions.length;
      if (sessions > 50) { // セッションが一定以上あれば
        if (confirm('データのバックアップをお勧めします。今すぐエクスポートしますか？')) {
          exportBtn?.click();
        }
        localStorage.setItem('studyapp.lastExportReminder', String(now));
      }
    }
  }, 60 * 60 * 1000); // 1時間ごとにチェック

})();

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
  };

  const defaultDB = () => ({
    version: 1,
    tasks: [
      { id: 'none', title: '未選択', subject: '', notes: '', goalMinutes: 0, createdAt: Date.now(), updatedAt: Date.now(), archived: false },
    ],
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
      // タスクにgoalMinutesを追加（既存データ対応）
      obj.tasks.forEach(task => {
        if (task.goalMinutes === undefined) task.goalMinutes = 0;
      });
      return obj;
    } catch (e) {
      // backup and reset
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      localStorage.setItem(BACKUP_PREFIX + ts, text ?? '');
      return defaultDB();
    }
  }

  function saveDB(db) {
    db.updatedAt = Date.now();
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  }

  // Notification support
  let notificationPermission = false;
  
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

  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) {
      db = loadDB();
      refreshUI();
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
      if (tab === 'dashboard') updateDashboard();
      if (tab === 'settings') loadSettingsIntoForm();
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
  }

  // Task Management - 大幅改善
  const taskSelect = document.getElementById('task-select');
  const addTaskBtn = document.getElementById('add-task-btn');
  const deleteTaskBtn = document.getElementById('delete-task-btn');
  const changeTaskBtn = document.getElementById('change-task-btn');
  const toggleViewBtn = document.getElementById('toggle-view-btn');
  const taskForm = document.getElementById('new-task-form');
  const taskList = document.getElementById('task-list');
  const taskSelector = document.getElementById('task-selector');
  const taskItems = document.getElementById('task-items');
  const currentTaskDisplay = document.getElementById('current-task-display');

  const newTaskTitle = document.getElementById('new-task-title');
  const newTaskSubject = document.getElementById('new-task-subject');
  const newTaskNotes = document.getElementById('new-task-notes');
  const newTaskGoal = document.getElementById('new-task-goal');
  const saveTaskBtn = document.getElementById('save-task-btn');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');

  function activeTasks() {
    return db.tasks.filter(t => !t.archived);
  }

  function getCurrentTask() {
    const id = db.settings.currentTaskId || 'none';
    return db.tasks.find(t => t.id === id) || db.tasks.find(t => t.id === 'none');
  }

  function getTaskProgress(taskId) {
    const task = db.tasks.find(t => t.id === taskId);
    if (!task || !task.goalMinutes || task.goalMinutes <= 0) return { progress: 0, totalMinutes: 0 };
    
    const today = startOfToday();
    const sessions = db.sessions.filter(s => s.taskId === taskId && s.startedAt >= today);
    const totalMs = sessions.reduce((acc, s) => acc + s.durationMs, 0);
    const totalMinutes = minutesRounded(totalMs);
    const progress = Math.min(100, Math.round((totalMinutes / task.goalMinutes) * 100));
    
    return { progress, totalMinutes, goalMinutes: task.goalMinutes };
  }

  function renderCurrentTask() {
    if (!currentTaskDisplay) return;
    
    const task = getCurrentTask();
    const titleEl = currentTaskDisplay.querySelector('.task-title');
    const metaEl = currentTaskDisplay.querySelector('.task-meta');
    const notesEl = currentTaskDisplay.querySelector('.task-notes');
    
    if (titleEl) titleEl.textContent = task.id === 'none' ? '未選択' : task.title;
    if (metaEl) metaEl.textContent = task.subject || '';
    if (notesEl) notesEl.textContent = task.notes || '';
    
    if (task.id !== 'none' && task.goalMinutes > 0) {
      const { progress, totalMinutes, goalMinutes } = getTaskProgress(task.id);
      if (metaEl) metaEl.textContent += ` | 目標: ${goalMinutes}分 (${totalMinutes}/${goalMinutes}分 ${progress}%)`;
    }
  }

  function renderTaskList() {
    if (!taskItems) return;
    taskItems.innerHTML = '';
    
    const tasks = activeTasks().filter(t => t.id !== 'none');
    if (tasks.length === 0) {
      taskItems.innerHTML = '<p class="hint">タスクがありません。「➕」ボタンで追加してください。</p>';
      return;
    }

    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item';
      if (task.id === db.settings.currentTaskId) item.classList.add('active');
      
      const { progress, totalMinutes, goalMinutes } = getTaskProgress(task.id);
      
      item.innerHTML = `
        <div class="task-name">${task.title}</div>
        <div class="task-subject">${task.subject}</div>
        ${task.notes ? `<div class="task-notes" style="font-size:11px;color:var(--text-muted);margin-top:4px">${task.notes}</div>` : ''}
        ${goalMinutes > 0 ? `
          <div class="task-progress">
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${totalMinutes}/${goalMinutes}分 (${progress}%)</div>
          </div>
        ` : ''}
      `;
      
      item.addEventListener('click', () => {
        db.settings.currentTaskId = task.id;
        saveDB(db);
        renderCurrentTask();
        renderTaskList();
        renderTaskOptions();
      });
      
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

  // Event listeners - ボタンの動作修正
  if (addTaskBtn) addTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (newTaskTitle) newTaskTitle.value = '';
    if (newTaskSubject) newTaskSubject.value = '';
    if (newTaskNotes) newTaskNotes.value = '';
    if (newTaskGoal) newTaskGoal.value = '';
    toggleTaskForm(true);
  });

  if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTaskForm(false);
  });

  if (saveTaskBtn) saveTaskBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const title = newTaskTitle?.value.trim();
    if (!title) { 
      if (newTaskTitle) newTaskTitle.focus(); 
      return; 
    }
    
    const t = {
      id: 't_' + Math.random().toString(36).slice(2,9),
      title,
      subject: newTaskSubject?.value.trim() || '',
      notes: newTaskNotes?.value.trim() || '',
      goalMinutes: parseInt(newTaskGoal?.value) || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
    };
    db.tasks.push(t);
    db.settings.currentTaskId = t.id;
    saveDB(db);
    refreshTaskUI();
    toggleTaskForm(false);
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

  function refreshTaskUI() {
    renderCurrentTask();
    renderTaskList();
    renderTaskOptions();
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
    const circumference = 2 * Math.PI * 90;
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
    
    if (wasFocus) logFocusSession(endReason);
    
    if (!wasFocus && db.settings.notifyBreakEnd && notificationPermission) {
      showNotification('休憩終了', '集中タイムに戻りましょう！');
    }
    
    if (wasFocus) {
      state.mode = nextModeAfterFocus();
      if (db.settings.notifyBreakStart && notificationPermission) {
        const breakType = state.mode === Mode.Long ? '長休憩' : '短休憩';
        showNotification(`${breakType}開始`, `お疲れ様でした！${breakType}をお楽しみください。`);
      }
    } else {
      state.mode = Mode.Focus;
      state.round = prevRound + 1;
    }
    
    renderMode();
    const durationMs = currentModeMinutes() * 60 * 1000;
    state.totalDurationMs = durationMs;
    displayTime(durationMs, 100);
    setButtons();
  }

  // Event listeners
  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resumeBtn) resumeBtn.addEventListener('click', resumeTimer);
  if (skipBtn) skipBtn.addEventListener('click', skipTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

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
  const themeSelect = document.getElementById('theme-select');
  
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');
  const saveGoalsBtn = document.getElementById('save-goals-btn');
  const testNotificationBtn = document.getElementById('test-notification');
  const clearDataBtn = document.getElementById('clear-data-btn');

  function loadSettingsIntoForm(){
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
    
    saveDB(db);
    
    const durationMs = currentModeMinutes() * 60 * 1000;
    state.totalDurationMs = durationMs;
    displayTime(state.endAt ? Math.max(0, state.endAt - Date.now()) : durationMs);
  });

  if (saveGoalsBtn) saveGoalsBtn.addEventListener('click', () => {
    db.settings.dailyGoalMinutes = parseInt(dailyGoal?.value) || 0;
    db.settings.weeklyGoalMinutes = parseInt(weeklyGoal?.value) || 0;
    saveDB(db);
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
  }

  function updateOverviewStats() {
    const totalFocusEl = document.getElementById('total-focus-time');
    const totalSessionsEl = document.getElementById('total-sessions');
    const currentStreakEl = document.getElementById('current-streak');
    const efficiencyEl = document.getElementById('efficiency-rate');
    
    if (totalFocusEl) {
      const totalMs = db.sessions.reduce((acc, s) => acc + s.durationMs, 0);
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
    
    if (weekTotalEl) weekTotalEl.textContent = `${weekTotal}分`;
    if (weekAverageEl) weekAverageEl.textContent = `${weekAverage}分`;
    if (weekBestEl) weekBestEl.textContent = `${weekBest}分`;
    
    // 週間チャート
    if (weekChartEl) {
      weekChartEl.innerHTML = '';
      const maxMinutes = Math.max(...weekData, 1);
      
      weekData.forEach(minutes => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        const height = (minutes / maxMinutes) * 100;
        bar.style.height = `${height}%`;
        bar.title = `${minutes}分`;
        weekChartEl.appendChild(bar);
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
    // archived タスクを除外してエクスポート
    const exportData = {
      ...db,
      tasks: db.tasks.filter(t => !t.archived), // archived タスクを除外
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `studyapp-${ts}.json`;
    a.href = url; a.click();
    URL.revokeObjectURL(url);
  });
  
  if (importFile) importFile.addEventListener('change', async (e) => {
    const f = importFile.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      if (obj.version !== 1) throw new Error('Invalid version');
      
      // マイグレーション
      obj.settings = { ...defaultSettings, ...obj.settings };
      obj.tasks.forEach(task => {
        if (task.goalMinutes === undefined) task.goalMinutes = 0;
      });
      
      db = obj;
      saveDB(db);
      applyTheme();
      refreshUI();
      alert('データをインポートしました！');
    } catch (err) {
      alert('インポートに失敗しました。ファイル形式を確認してください。\n' + err.message);
    } finally {
      importFile.value = '';
    }
  });

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
    }
  });

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

  // PWA registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
  }

  // 通知許可の初期化
  requestNotificationPermission();

  // kick off
  applyTheme();
  refreshUI();
})();

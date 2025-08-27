// Study Support MVP v0.1
// - localStorage snapshot db
// - Pomodoro: focus/short/long with rounds
// - tasks CRUD (minimal)
// - auto session logging
// - stats today/week
// - export/import JSON
// - PWA registration

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
  };

  const defaultDB = () => ({
    version: 1,
    tasks: [
      { id: 'none', title: '未選択', subject: '', notes: '', createdAt: Date.now(), updatedAt: Date.now(), archived: false },
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

  // state
  let db = loadDB();
  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) {
      db = loadDB();
      refreshUI();
    }
  });

  // Tabs
  const tabs = Array.from(document.querySelectorAll('.tab-button'));
  const panes = {
    session: document.getElementById('section-session'),
    dashboard: document.getElementById('section-dashboard'),
    settings: document.getElementById('section-settings'),
  };
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabs.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', String(b===btn)); });
      Object.entries(panes).forEach(([k, el]) => el.classList.toggle('is-active', k === tab));
      if (tab === 'dashboard') updateDashboard();
      if (tab === 'settings') loadSettingsIntoForm();
    });
  });

  // Theme
  const themeSelect = document.getElementById('theme-select');
  function applyTheme() {
    const t = db.settings.theme || 'system';
    if (t === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = t;
    }
  }
  themeSelect.addEventListener('change', () => {
    db.settings.theme = themeSelect.value;
    applyTheme();
    saveDB(db);
  });

  // Tasks
  const taskSelect = document.getElementById('task-select');
  const addTaskBtn = document.getElementById('add-task-btn');
  const deleteTaskBtn = document.getElementById('delete-task-btn');
  const taskForm = document.getElementById('new-task-form');
  const newTaskTitle = document.getElementById('new-task-title');
  const newTaskSubject = document.getElementById('new-task-subject');
  const newTaskNotes = document.getElementById('new-task-notes');
  const saveTaskBtn = document.getElementById('save-task-btn');
  const cancelTaskBtn = document.getElementById('cancel-task-btn');

  function renderTaskOptions() {
    taskSelect.innerHTML = '';
    db.tasks.filter(t => !t.archived).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.id === 'none' ? '未選択' : `${t.title}${t.subject?` ・ ${t.subject}`:''}`;
      taskSelect.appendChild(opt);
    });
    const current = db.settings.currentTaskId || 'none';
    if (!db.tasks.some(t => t.id === current && !t.archived)) {
      db.settings.currentTaskId = 'none';
    }
    taskSelect.value = db.settings.currentTaskId || 'none';
  }

  function toggleTaskForm(show){
    taskForm.classList.toggle('hidden', !show);
    taskForm.setAttribute('aria-hidden', String(!show));
    if (show) newTaskTitle.focus();
  }

  addTaskBtn.addEventListener('click', () => {
    newTaskTitle.value = '';
    newTaskSubject.value = '';
    newTaskNotes.value = '';
    toggleTaskForm(true);
  });
  cancelTaskBtn.addEventListener('click', () => toggleTaskForm(false));
  saveTaskBtn.addEventListener('click', () => {
    const title = newTaskTitle.value.trim();
    if (!title) { newTaskTitle.focus(); return; }
    const t = {
      id: 't_' + Math.random().toString(36).slice(2,9),
      title,
      subject: newTaskSubject.value.trim(),
      notes: newTaskNotes.value.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archived: false,
    };
    db.tasks.push(t);
    db.settings.currentTaskId = t.id;
    saveDB(db);
    renderTaskOptions();
    toggleTaskForm(false);
  });
  deleteTaskBtn.addEventListener('click', () => {
    const id = taskSelect.value;
    if (id === 'none') return;
    const t = db.tasks.find(x => x.id === id);
    if (t) { t.archived = true; t.updatedAt = Date.now(); }
    if (db.settings.currentTaskId === id) db.settings.currentTaskId = 'none';
    saveDB(db);
    renderTaskOptions();
  });
  taskSelect.addEventListener('change', () => {
    db.settings.currentTaskId = taskSelect.value;
    saveDB(db);
  });

  // Timer
  const modeLabel = document.getElementById('mode-label');
  const roundLabel = document.getElementById('round-label');
  const timeLeftEl = document.getElementById('time-left');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const skipBtn = document.getElementById('skip-btn');
  const resetBtn = document.getElementById('reset-btn');

  const Mode = { Focus:'focus', Short:'short', Long:'long' };
  let state = {
    mode: Mode.Focus,
    round: 1,
    endAt: null, // timestamp
    running: false,
    pausedRemainingMs: null,
    focusStartedAt: null, // for logging
    intervalId: null,
  };

  function currentModeMinutes() {
    const s = db.settings;
    return state.mode === Mode.Focus ? s.focusMinutes : (state.mode === Mode.Short ? s.shortBreakMinutes : s.longBreakMinutes);
  }

  function formatMMSS(ms) {
    const sec = Math.max(0, Math.ceil(ms/1000));
    const m = Math.floor(sec/60);
    const s = sec%60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function updateTitle(ms){
    const emoji = state.mode === Mode.Focus ? '🎯' : (state.mode === Mode.Short ? '☕' : '🛌');
    document.title = `${emoji} ${formatMMSS(ms)} - Study Support`;
  }

  function setButtons() {
    startBtn.disabled = state.running || state.endAt !== null;
    pauseBtn.disabled = !state.running;
    resumeBtn.disabled = state.running || (state.pausedRemainingMs == null);
    skipBtn.disabled = !state.running && state.endAt == null; // allow skip when running
  }

  function displayTime(ms){
    timeLeftEl.textContent = formatMMSS(ms);
    updateTitle(ms);
  }

  function startTimer(){
    const minutes = currentModeMinutes();
    const durationMs = minutes * 60 * 1000;
    const now = Date.now();
    state.endAt = now + durationMs;
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
    // transition immediately
    finishCycle(true);
  }

  function resetTimer(){
    clearInterval(state.intervalId); state.intervalId = null;
    // Reset to initial focus
    state = { mode: Mode.Focus, round: 1, endAt: null, running: false, pausedRemainingMs: null, focusStartedAt: null, intervalId: null };
    renderMode();
    displayTime(currentModeMinutes()*60*1000);
    setButtons();
  }

  function renderMode(){
    modeLabel.textContent = state.mode === Mode.Focus ? '集中' : (state.mode === Mode.Short ? '短休憩' : '長休憩');
    roundLabel.textContent = `Round ${state.round}`;
  }

  function tick(){
    if (!state.endAt) return;
    const remaining = state.endAt - Date.now();
    if (remaining <= 0) {
      displayTime(0);
      clearInterval(state.intervalId); state.intervalId = null;
      if (state.running) finishCycle(false);
      return;
    }
    displayTime(remaining);
  }

  function logFocusSession(endReason){
    // only when mode was focus
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
  }

  function nextModeAfterFocus(){
    // decide short or long break
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
    // log if focus session
    if (wasFocus) logFocusSession(endReason);
    // switch mode
    if (wasFocus) {
      state.mode = nextModeAfterFocus();
    } else {
      // break -> next focus, increment round only after break
      state.mode = Mode.Focus;
      state.round = prevRound + 1;
    }
    renderMode();
    displayTime(currentModeMinutes()*60*1000);
    setButtons();
  }

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resumeBtn.addEventListener('click', resumeTimer);
  skipBtn.addEventListener('click', skipTimer);
  resetBtn.addEventListener('click', resetTimer);

  // Settings form
  const focusMin = document.getElementById('focus-min');
  const shortMin = document.getElementById('short-min');
  const longMin = document.getElementById('long-min');
  const roundsUntilLong = document.getElementById('rounds-until-long');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');

  function loadSettingsIntoForm(){
    focusMin.value = db.settings.focusMinutes;
    shortMin.value = db.settings.shortBreakMinutes;
    longMin.value = db.settings.longBreakMinutes;
    roundsUntilLong.value = db.settings.roundsUntilLongBreak;
    themeSelect.value = db.settings.theme || 'system';
  }

  saveSettingsBtn.addEventListener('click', () => {
    const s = db.settings;
    s.focusMinutes = clampInt(focusMin.value, 1, 120, defaultSettings.focusMinutes);
    s.shortBreakMinutes = clampInt(shortMin.value, 1, 60, defaultSettings.shortBreakMinutes);
    s.longBreakMinutes = clampInt(longMin.value, 1, 120, defaultSettings.longBreakMinutes);
    s.roundsUntilLongBreak = clampInt(roundsUntilLong.value, 1, 12, defaultSettings.roundsUntilLongBreak);
    s.theme = themeSelect.value;
    applyTheme();
    saveDB(db);
    // reflect on timer display without altering in-progress timers unless reset
    displayTime(currentModeMinutes()*60*1000);
  });
  resetSettingsBtn.addEventListener('click', () => {
    db.settings = { ...defaultSettings, currentTaskId: db.settings.currentTaskId };
    applyTheme();
    saveDB(db);
    loadSettingsIntoForm();
    renderMode();
    displayTime(currentModeMinutes()*60*1000);
  });

  function clampInt(v, min, max, fallback){
    const n = parseInt(String(v), 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  // Dashboard
  const todayTotalEl = document.getElementById('today-total');
  const todayCountEl = document.getElementById('today-count');
  const todayByTaskEl = document.getElementById('today-by-task');
  const weekTotalEl = document.getElementById('week-total');
  const weekByTaskEl = document.getElementById('week-by-task');

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
    return ts >= startOfDay(now - 6*24*60*60*1000); // inclusive of today and past 6 days
  }

  function minutesRounded(ms){ return Math.round(ms/60000); }

  function aggregate(sessions, predicate){
    const filtered = sessions.filter(s => predicate(s.startedAt));
    const total = filtered.reduce((acc, s) => acc + s.durationMs, 0);
    const byTask = new Map();
    for (const s of filtered){
      const key = s.taskId || 'none';
      byTask.set(key, (byTask.get(key)||0) + s.durationMs);
    }
    return { filtered, total, byTask };
  }

  function updateDashboard(){
    const today = aggregate(db.sessions, isInToday);
    todayTotalEl.textContent = `${minutesRounded(today.total)} 分`;
    todayCountEl.textContent = String(today.filtered.length);
    todayByTaskEl.innerHTML = '';
    for (const [taskId, ms] of [...today.byTask.entries()].sort((a,b)=>b[1]-a[1])){
      const li = document.createElement('li');
      li.textContent = `${taskName(taskId)}: ${minutesRounded(ms)} 分`;
      todayByTaskEl.appendChild(li);
    }

    const week = aggregate(db.sessions, isInLast7Days);
    weekTotalEl.textContent = `${minutesRounded(week.total)} 分`;
    weekByTaskEl.innerHTML = '';
    for (const [taskId, ms] of [...week.byTask.entries()].sort((a,b)=>b[1]-a[1])){
      const li = document.createElement('li');
      li.textContent = `${taskName(taskId)}: ${minutesRounded(ms)} 分`;
      weekByTaskEl.appendChild(li);
    }
  }

  function taskName(id){
    const t = db.tasks.find(x => x.id === id);
    return t ? (t.id==='none'?'未選択':t.title) : '未選択';
  }

  // Export/Import
  const exportBtn = document.getElementById('export-btn');
  const importFile = document.getElementById('import-file');
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(db,null,2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `studyapp-${ts}.json`;
    a.href = url; a.click();
    URL.revokeObjectURL(url);
  });
  importFile.addEventListener('change', async (e) => {
    const f = importFile.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      if (obj.version !== 1) throw new Error('Invalid version');
      db = obj;
      saveDB(db);
      applyTheme();
      renderTaskOptions();
      refreshUI();
    } catch (err) {
      alert('インポートに失敗しました。ファイル形式を確認してください。');
    } finally {
      importFile.value = '';
    }
  });

  // Initial render
  function refreshUI(){
    renderTaskOptions();
    renderMode();
    displayTime(currentModeMinutes()*60*1000);
    setButtons();
  }

  // PWA registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
  }

  // kick off
  applyTheme();
  refreshUI();
})();

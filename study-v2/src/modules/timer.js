/**
 * Timer Module
 * Study Support NG v1.0
 */

import { store } from '../core/store.js';
import { 
  formatTime, 
  playSound, 
  showNotification, 
  bgmManager,
  getRandomQuote,
  getRandomBreakActivities,
  createConfetti
} from '../core/utils.js';

class TimerModule {
  constructor() {
    this.intervalId = null;
    this.startTime = null;
    this.pausedTime = null;
    this.isFocusMode = false;
    this.isBgmPlaying = false;
    
    // DOM elements
    this.elements = {};
    
    // Bind methods
    this.tick = this.tick.bind(this);
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.subscribeToStore();
    
    // Initialize timer time based on settings
    this.resetTimeForCurrentMode();
    
    this.updateDisplay();
    this.addSvgGradient();
    this.updateDailyGoalProgress();
    this.loadMotivationQuote();
    
    console.log('✅ Timer 初期化完了');
  }

  cacheElements() {
    this.elements = {
      timeDisplay: document.getElementById('timer-time'),
      labelDisplay: document.getElementById('timer-label'),
      roundDisplay: document.getElementById('timer-round'),
      taskDisplay: document.getElementById('timer-task'),
      progressCircle: document.getElementById('timer-progress'),
      startBtn: document.getElementById('timer-start'),
      pauseBtn: document.getElementById('timer-pause'),
      resumeBtn: document.getElementById('timer-resume'),
      skipBtn: document.getElementById('timer-skip'),
      resetBtn: document.getElementById('timer-reset'),
      modeButtons: document.querySelectorAll('.mode-btn'),
      todayPomodoros: document.getElementById('today-pomodoros'),
      todayMinutes: document.getElementById('today-minutes'),
      timerPanel: document.querySelector('.timer-panel'),
      // New elements
      dailyGoalText: document.getElementById('daily-goal-text'),
      dailyGoalFill: document.getElementById('daily-goal-fill'),
      focusModeBtn: document.getElementById('focus-mode-btn'),
      bgmBtn: document.getElementById('bgm-btn'),
      motivationQuote: document.getElementById('motivation-quote'),
      newQuoteBtn: document.getElementById('new-quote-btn'),
      // Modals
      pomodoroCompleteModal: document.getElementById('pomodoro-complete-modal'),
      completedFocusTime: document.getElementById('completed-focus-time'),
      completeXpGained: document.getElementById('complete-xp-gained'),
      completeTodayCount: document.getElementById('complete-today-count'),
      breakMessage: document.getElementById('break-message'),
      startBreakBtn: document.getElementById('start-break-btn'),
      skipBreakBtn: document.getElementById('skip-break-btn'),
      breakModal: document.getElementById('break-modal'),
      breakSuggestionsModal: document.getElementById('break-suggestions-modal'),
      breakModalClose: document.getElementById('break-modal-close')
    };
  }

  addSvgGradient() {
    const svg = document.querySelector('.timer-ring__svg');
    if (!svg) return;
    
    // Check if gradient already exists
    if (svg.querySelector('#timer-gradient')) return;
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="timer-gradient-break" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
      </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
  }

  bindEvents() {
    this.elements.startBtn?.addEventListener('click', () => this.start());
    this.elements.pauseBtn?.addEventListener('click', () => this.pause());
    this.elements.resumeBtn?.addEventListener('click', () => this.resume());
    this.elements.skipBtn?.addEventListener('click', () => this.skip());
    this.elements.resetBtn?.addEventListener('click', () => this.reset());
    
    this.elements.modeButtons?.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.setMode(mode);
      });
    });

    // Focus mode toggle
    this.elements.focusModeBtn?.addEventListener('click', () => this.toggleFocusMode());
    
    // BGM toggle
    this.elements.bgmBtn?.addEventListener('click', () => this.toggleBgm());
    
    // Motivation quote
    this.elements.newQuoteBtn?.addEventListener('click', () => this.loadMotivationQuote());
    
    // Pomodoro complete modal
    this.elements.startBreakBtn?.addEventListener('click', () => {
      this.closePomodoroCompleteModal();
      this.start();
    });
    this.elements.skipBreakBtn?.addEventListener('click', () => {
      this.closePomodoroCompleteModal();
      this.setMode('focus');
    });
    
    // Break modal
    this.elements.breakModalClose?.addEventListener('click', () => this.closeBreakModal());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const currentView = store.get('currentView');
      if (currentView !== 'timer') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.toggleTimer();
          break;
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.skip();
          }
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.reset();
          }
          break;
        case 'KeyF':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.toggleFocusMode();
          }
          break;
        case 'KeyM':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.toggleBgm();
          }
          break;
      }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && store.get('timer.status') === 'running') {
        this.syncTime();
      }
    });
  }

  subscribeToStore() {
    store.subscribe('timer.*', () => this.updateDisplay());
    store.subscribe('today.*', () => {
      this.updateTodayStats();
      this.updateDailyGoalProgress();
    });
    store.subscribe('currentTask', () => this.updateTaskDisplay());
    store.subscribe('settings.*', () => {
      // Update time if idle and mode matches
      const status = store.get('timer.status');
      console.log('⚙️ タイマー設定が変更されました。status:', status);
      if (status === 'idle') {
        console.log('🔄 タイマー時間をリセット中...');
        this.resetTimeForCurrentMode();
      }
      this.updateDailyGoalProgress();
    });
  }

  // Focus Mode
  toggleFocusMode() {
    this.isFocusMode = !this.isFocusMode;
    document.body.classList.toggle('focus-mode', this.isFocusMode);
    this.elements.focusModeBtn?.classList.toggle('active', this.isFocusMode);
  }

  // BGM
  toggleBgm() {
    const settings = store.get('settings');
    const bgmType = settings.bgmType || 'whitenoise';
    const bgmVolume = settings.bgmVolume || 0.3;
    
    if (bgmType === 'none') return;
    
    this.isBgmPlaying = bgmManager.toggle(bgmType, bgmVolume);
    this.elements.bgmBtn?.classList.toggle('active', this.isBgmPlaying);
  }

  // Motivation Quote
  loadMotivationQuote() {
    const quote = getRandomQuote();
    if (this.elements.motivationQuote) {
      this.elements.motivationQuote.innerHTML = `
        <span class="motivation-icon">${quote.icon}</span>
        <p class="motivation-text">"${quote.text}"</p>
      `;
    }
  }

  // Daily Goal Progress
  updateDailyGoalProgress() {
    const today = store.get('today');
    const settings = store.get('settings');
    const goalMinutes = settings.dailyGoalMinutes || 120;
    const currentMinutes = today.minutes || 0;
    const percentage = Math.min(100, Math.round((currentMinutes / goalMinutes) * 100));
    
    if (this.elements.dailyGoalText) {
      this.elements.dailyGoalText.textContent = `${currentMinutes} / ${goalMinutes}分`;
    }
    
    if (this.elements.dailyGoalFill) {
      this.elements.dailyGoalFill.style.width = `${percentage}%`;
      this.elements.dailyGoalFill.classList.toggle('complete', percentage >= 100);
    }
  }

  toggleTimer() {
    const status = store.get('timer.status');
    switch (status) {
      case 'idle':
        this.start();
        break;
      case 'running':
        this.pause();
        break;
      case 'paused':
        this.resume();
        break;
    }
  }

  start() {
    const status = store.get('timer.status');
    if (status === 'running') return;

    this.startTime = Date.now();
    this.pausedTime = null;
    
    store.set('timer.status', 'running');
    
    this.intervalId = setInterval(this.tick, 100);
    
    this.updateButtonVisibility();
    this.elements.timerPanel?.classList.add('timer-running');
    this.elements.timerPanel?.classList.remove('timer-paused');
    
    // Update title
    this.updateDocumentTitle();
  }

  pause() {
    if (store.get('timer.status') !== 'running') return;
    
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.pausedTime = Date.now();
    
    store.set('timer.status', 'paused');
    
    this.updateButtonVisibility();
    this.elements.timerPanel?.classList.remove('timer-running');
    this.elements.timerPanel?.classList.add('timer-paused');
    
    this.updateDocumentTitle();
  }

  resume() {
    if (store.get('timer.status') !== 'paused') return;
    
    // Adjust start time for paused duration
    const pausedDuration = Date.now() - this.pausedTime;
    this.startTime += pausedDuration;
    this.pausedTime = null;
    
    store.set('timer.status', 'running');
    
    this.intervalId = setInterval(this.tick, 100);
    
    this.updateButtonVisibility();
    this.elements.timerPanel?.classList.add('timer-running');
    this.elements.timerPanel?.classList.remove('timer-paused');
    
    this.updateDocumentTitle();
  }

  skip() {
    this.completeSession(false);
  }

  reset() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.startTime = null;
    this.pausedTime = null;
    
    store.set('timer.status', 'idle');
    this.resetTimeForCurrentMode();
    
    this.updateButtonVisibility();
    this.elements.timerPanel?.classList.remove('timer-running', 'timer-paused');
    
    document.title = 'Study Support NG';
  }

  setMode(mode) {
    const status = store.get('timer.status');
    if (status === 'running') return;
    
    store.set('timer.mode', mode);
    this.resetTimeForCurrentMode();
    
    // Update mode buttons
    this.elements.modeButtons?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update progress circle color
    const progressCircle = this.elements.progressCircle;
    if (progressCircle) {
      if (mode === 'focus') {
        progressCircle.style.stroke = 'url(#timer-gradient)';
        this.elements.timerPanel?.classList.remove('timer-break');
      } else {
        progressCircle.style.stroke = 'url(#timer-gradient-break)';
        this.elements.timerPanel?.classList.add('timer-break');
      }
    }
  }

  resetTimeForCurrentMode() {
    const mode = store.get('timer.mode');
    const settings = store.get('settings');
    
    let minutes;
    switch (mode) {
      case 'focus':
        minutes = settings.focusMinutes;
        break;
      case 'short':
        minutes = settings.shortBreakMinutes;
        break;
      case 'long':
        minutes = settings.longBreakMinutes;
        break;
      default:
        minutes = 25;
    }
    
    const seconds = minutes * 60;
    store.set('timer.timeLeft', seconds);
    store.set('timer.totalTime', seconds);
  }

  tick() {
    if (!this.startTime) return;
    
    const totalTime = store.get('timer.totalTime');
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const timeLeft = Math.max(0, totalTime - elapsed);
    
    store.set('timer.timeLeft', timeLeft);
    this.updateDocumentTitle();
    
    if (timeLeft === 0) {
      this.completeSession(true);
    }
  }

  syncTime() {
    if (!this.startTime || store.get('timer.status') !== 'running') return;
    
    const totalTime = store.get('timer.totalTime');
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const timeLeft = Math.max(0, totalTime - elapsed);
    
    store.set('timer.timeLeft', timeLeft);
    
    if (timeLeft === 0) {
      this.completeSession(true);
    }
  }

  completeSession(completed) {
    clearInterval(this.intervalId);
    this.intervalId = null;
    
    const mode = store.get('timer.mode');
    const totalTime = store.get('timer.totalTime');
    const timeLeft = store.get('timer.timeLeft');
    const settings = store.get('settings');
    
    // Calculate actual time spent
    const timeSpent = Math.floor((totalTime - timeLeft) / 60);
    
    if (mode === 'focus' && completed) {
      // Record pomodoro completion
      this.recordPomodoro(timeSpent);
      
      // Play completion sound
      if (settings.soundEnabled) {
        playSound('complete');
      }
      
      // Show notification
      if (settings.notificationEnabled) {
        showNotification('ポモドーロ完了！', '休憩を取りましょう 🎉');
      }
      
      // Create confetti effect
      createConfetti();
      
      // Move to next round or break
      const round = store.get('timer.currentRound') || 1;
      const roundsUntilLong = settings.pomodorosUntilLongBreak || 4;
      
      if (round >= roundsUntilLong) {
        store.set('timer.currentRound', 1);
        this.setMode('long');
      } else {
        store.set('timer.currentRound', round + 1);
        this.setMode('short');
      }
      
      // Show completion modal
      this.showPomodoroCompleteModal(timeSpent, round);
      
    } else if (mode !== 'focus' && completed) {
      // Break completed
      if (settings.soundEnabled) {
        playSound('break');
      }
      
      if (settings.notificationsEnabled) {
        showNotification('休憩終了', '次の集中タイムを始めましょう！ 💪');
      }
      
      this.setMode('focus');
      
      // Auto-start focus if enabled
      if (settings.autoStartFocus) {
        setTimeout(() => this.start(), 1000);
      }
    } else {
      // Skipped
      if (mode === 'focus') {
        this.setMode('short');
      } else {
        this.setMode('focus');
      }
    }
    
    store.set('timer.status', 'idle');
    this.startTime = null;
    this.pausedTime = null;
    
    this.updateButtonVisibility();
    this.elements.timerPanel?.classList.remove('timer-running', 'timer-paused');
    
    document.title = 'Study Support NG';
  }

  // Show pomodoro complete modal
  showPomodoroCompleteModal(minutes, round) {
    const today = store.get('today');
    const mode = store.get('timer.mode');
    const settings = store.get('settings');
    const xpGained = 25 + Math.floor(minutes / 5) * 2;
    
    if (this.elements.completedFocusTime) {
      this.elements.completedFocusTime.textContent = `${minutes}分間の集中お疲れ様でした`;
    }
    if (this.elements.completeXpGained) {
      this.elements.completeXpGained.textContent = `+${xpGained}`;
    }
    if (this.elements.completeTodayCount) {
      this.elements.completeTodayCount.textContent = today.pomodoros;
    }
    if (this.elements.breakMessage) {
      const breakTime = mode === 'long' ? settings.longBreakMinutes : settings.shortBreakMinutes;
      this.elements.breakMessage.textContent = `${breakTime}分間の休憩を取りましょう`;
    }
    
    // Show break activities
    this.showBreakSuggestions();
    
    // Show modal
    if (this.elements.pomodoroCompleteModal) {
      this.elements.pomodoroCompleteModal.classList.add('active');
      document.getElementById('modal-overlay')?.classList.add('active');
    }
    
    // Auto start break if enabled
    if (settings.autoStartBreak) {
      setTimeout(() => {
        this.closePomodoroCompleteModal();
        this.start();
      }, 3000);
    }
  }

  closePomodoroCompleteModal() {
    this.elements.pomodoroCompleteModal?.classList.remove('active');
    document.getElementById('modal-overlay')?.classList.remove('active');
  }

  showBreakSuggestions() {
    const activities = getRandomBreakActivities(2);
    if (this.elements.breakSuggestionsModal) {
      this.elements.breakSuggestionsModal.innerHTML = activities.map(a => `
        <div class="stretch-item">
          <span class="stretch-icon">${a.icon}</span>
          <div class="stretch-content">
            <h4>${a.title}</h4>
            <p>${a.description}</p>
          </div>
        </div>
      `).join('');
    }
  }

  closeBreakModal() {
    this.elements.breakModal?.classList.remove('active');
    document.getElementById('modal-overlay')?.classList.remove('active');
  }

  recordPomodoro(minutes) {
    // Update today stats
    const today = store.get('today');
    store.update('today', {
      pomodoros: today.pomodoros + 1,
      minutes: today.minutes + minutes
    });
    
    // Update user stats
    const user = store.get('user');
    store.update('user', {
      totalPomodoros: user.totalPomodoros + 1,
      totalMinutes: user.totalMinutes + minutes
    });
    
    // Dispatch event for other modules to handle (XP, achievements)
    window.dispatchEvent(new CustomEvent('pomodoro-completed', {
      detail: { minutes, taskId: store.get('timer.currentTaskId') }
    }));
  }

  updateDisplay() {
    const timeLeft = store.get('timer.timeLeft');
    const totalTime = store.get('timer.totalTime');
    const mode = store.get('timer.mode');
    const currentRound = store.get('timer.currentRound');
    const settings = store.get('settings');
    
    // Update time display
    if (this.elements.timeDisplay) {
      this.elements.timeDisplay.textContent = formatTime(timeLeft);
    }
    
    // Update label
    if (this.elements.labelDisplay) {
      const labels = {
        focus: '集中タイム',
        short: '短い休憩',
        long: '長い休憩'
      };
      this.elements.labelDisplay.textContent = labels[mode] || '集中タイム';
    }
    
    // Update round
    if (this.elements.roundDisplay) {
      const roundsUntilLongBreak = settings.pomodorosUntilLongBreak || 4;
      this.elements.roundDisplay.textContent = `ラウンド ${currentRound}/${roundsUntilLongBreak}`;
    }
    
    // Update progress ring
    if (this.elements.progressCircle) {
      const circumference = 2 * Math.PI * 90; // radius = 90
      const progress = timeLeft / totalTime;
      const offset = circumference * (1 - progress);
      this.elements.progressCircle.style.strokeDasharray = circumference;
      this.elements.progressCircle.style.strokeDashoffset = offset;
    }
  }

  updateButtonVisibility() {
    const status = store.get('timer.status');
    
    this.elements.startBtn?.classList.toggle('hidden', status !== 'idle');
    this.elements.pauseBtn?.classList.toggle('hidden', status !== 'running');
    this.elements.resumeBtn?.classList.toggle('hidden', status !== 'paused');
  }

  updateTodayStats() {
    const today = store.get('today');
    
    if (this.elements.todayPomodoros) {
      this.elements.todayPomodoros.textContent = today.pomodoros;
    }
    
    if (this.elements.todayMinutes) {
      this.elements.todayMinutes.textContent = `${today.minutes}分`;
    }
  }

  updateTaskDisplay() {
    const task = store.get('currentTask');
    
    if (this.elements.taskDisplay) {
      if (task) {
        this.elements.taskDisplay.textContent = task.title;
        this.elements.taskDisplay.classList.add('has-task');
      } else {
        this.elements.taskDisplay.textContent = 'タスク未選択';
        this.elements.taskDisplay.classList.remove('has-task');
      }
    }
  }

  updateDocumentTitle() {
    const status = store.get('timer.status');
    const timeLeft = store.get('timer.timeLeft');
    const mode = store.get('timer.mode');
    
    if (status === 'running' || status === 'paused') {
      const timeStr = formatTime(timeLeft);
      const modeStr = mode === 'focus' ? '🎯' : '☕';
      const pauseStr = status === 'paused' ? '⏸️ ' : '';
      document.title = `${pauseStr}${timeStr} ${modeStr} Study Support`;
    } else {
      document.title = 'Study Support NG';
    }
  }
}

export const timer = new TimerModule();

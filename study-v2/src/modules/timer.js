/**
 * Timer Module
 * Study Support NG v1.0
 */

import { store } from '../core/store.js';
import { formatTime, playSound, showNotification } from '../core/utils.js';

class TimerModule {
  constructor() {
    this.intervalId = null;
    this.startTime = null;
    this.pausedTime = null;
    
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
      timerPanel: document.querySelector('.timer-panel')
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
    store.subscribe('today.*', () => this.updateTodayStats());
    store.subscribe('currentTask', () => this.updateTaskDisplay());
    store.subscribe('settings.*', () => {
      // Update time if idle and mode matches
      const status = store.get('timer.status');
      console.log('⚙️ タイマー設定が変更されました。status:', status);
      if (status === 'idle') {
        console.log('🔄 タイマー時間をリセット中...');
        this.resetTimeForCurrentMode();
      }
    });
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
      
      // Move to next round or break
      const round = store.get('timer.round');
      const roundsUntilLong = settings.roundsUntilLongBreak;
      
      if (round >= roundsUntilLong) {
        store.set('timer.round', 1);
        this.setMode('long');
      } else {
        store.set('timer.round', round + 1);
        this.setMode('short');
      }
    } else if (mode !== 'focus' && completed) {
      // Break completed
      if (settings.soundEnabled) {
        playSound('break');
      }
      
      if (settings.notificationEnabled) {
        showNotification('休憩終了', '次の集中タイムを始めましょう！ 💪');
      }
      
      this.setMode('focus');
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

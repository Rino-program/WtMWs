/**
 * タイマービュー
 */

import { App } from '@/core/App';
import { TimerState } from '@/core/Timer';
import { EVENT_NAMES } from '@/types/events';
import { formatTime } from '@/utils/dateHelpers';

export class TimerView {
  private app: App;
  private container: HTMLElement | null = null;

  constructor(app: App) {
    this.app = app;
    this.setupEventListeners();
  }

  render(): void {
    this.container = document.getElementById('timer-panel');
    if (!this.container) return;

    const state = this.app.getState();

    this.container.innerHTML = `
      <div class="timer-container">
        <div class="timer-header">
          <h2>ポモドーロタイマー</h2>
          <div class="timer-mode">${this.getModeLabel(state.currentMode)}</div>
          <div class="timer-round">Round ${state.currentRound}</div>
        </div>
        
        <div class="timer-display">
          <div class="time-circle">
            <svg viewBox="0 0 200 200" class="progress-ring">
              <circle cx="100" cy="100" r="90" class="progress-bg"></circle>
              <circle cx="100" cy="100" r="90" class="progress-bar" id="progress-circle"></circle>
            </svg>
            <div class="time-text" id="time-display">
              ${formatTime(state.timeRemainingMs, state.settings.showSeconds)}
            </div>
          </div>
        </div>

        <div class="timer-controls">
          <button id="btn-start" class="btn btn-primary btn-lg">
            ${state.isTimerRunning ? (state.isPaused ? '再開' : '一時停止') : 'スタート'}
          </button>
          <button id="btn-skip" class="btn btn-secondary">スキップ</button>
          <button id="btn-reset" class="btn btn-danger">リセット</button>
        </div>

        <div class="timer-stats">
          <div class="stat-item">
            <span class="stat-label">今日の合計</span>
            <span class="stat-value">${state.statistics.todayFocusMinutes}分</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">今日の回数</span>
            <span class="stat-value">${state.statistics.todaySessionCount}回</span>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
    this.updateProgress();
  }

  private setupEventListeners(): void {
    // タイマーTickイベント
    this.app['timer'].on(EVENT_NAMES.TIMER_TICK, () => {
      this.updateDisplay();
      this.updateProgress();
    });

    // タイマー状態変更イベント
    this.app['timer'].on(EVENT_NAMES.TIMER_START, () => this.updateControls());
    this.app['timer'].on(EVENT_NAMES.TIMER_PAUSE, () => this.updateControls());
    this.app['timer'].on(EVENT_NAMES.TIMER_RESUME, () => this.updateControls());
    this.app['timer'].on(EVENT_NAMES.TIMER_COMPLETE, () => this.render());
    this.app['timer'].on(EVENT_NAMES.TIMER_MODE_CHANGE, () => this.render());
  }

  private attachEvents(): void {
    document.getElementById('btn-start')?.addEventListener('click', () => {
      const timer = this.app['timer'];
      if (timer.getState() === TimerState.Running) {
        this.app.pauseTimer();
      } else {
        this.app.startTimer();
      }
    });

    document.getElementById('btn-skip')?.addEventListener('click', () => {
      this.app.skipTimer();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      if (confirm('タイマーをリセットしますか？')) {
        this.app.resetTimer();
      }
    });
  }

  private updateDisplay(): void {
    const state = this.app.getState();
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
      timeDisplay.textContent = formatTime(
        state.timeRemainingMs,
        state.settings.showSeconds
      );
    }

    // タイトル更新
    document.title = `${formatTime(state.timeRemainingMs, false)} - Study Support`;
  }

  private updateProgress(): void {
    const state = this.app.getState();
    const circle = document.getElementById('progress-circle');
    if (!circle) return;

    const percentage = (state.timeRemainingMs / (state.settings.focusMinutes * 60000)) * 100;
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (percentage / 100) * circumference;

    circle.style.strokeDashoffset = String(offset);
  }

  private updateControls(): void {
    const state = this.app.getState();
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.textContent = state.isTimerRunning
        ? state.isPaused
          ? '再開'
          : '一時停止'
        : 'スタート';
    }
  }

  private getModeLabel(mode: string): string {
    switch (mode) {
      case 'focus':
        return '🎯 集中';
      case 'short_break':
        return '☕ 短休憩';
      case 'long_break':
        return '🌟 長休憩';
      default:
        return '';
    }
  }
}

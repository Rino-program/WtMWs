/**
 * 高精度タイマークラス - Web Worker使用
 */

import { SessionType } from '@/types/models';
import { EventEmitter } from '@/utils/EventEmitter';
import { EVENT_NAMES, TimerTickEvent, TimerCompleteEvent } from '@/types/events';
import { TIMER_CONFIG } from '@/config/constants';

export enum TimerState {
  Idle = 'idle',
  Running = 'running',
  Paused = 'paused',
}

export interface TimerConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  roundsUntilLongBreak: number;
}

export class Timer extends EventEmitter {
  private worker: Worker | null = null;
  private state: TimerState = TimerState.Idle;
  private currentMode: SessionType = SessionType.Focus;
  private currentRound: number = 1;
  private totalDurationMs: number = 0;
  private remainingMs: number = 0;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private config: TimerConfig;
  private tickInterval: number | null = null;

  constructor(config: TimerConfig) {
    super();
    this.config = config;
    this.initWorker();
  }

  /**
   * Web Workerの初期化
   */
  private initWorker(): void {
    const workerCode = `
      let interval;
      let endTime;
      let lastTick = 0;
      
      self.onmessage = (e) => {
        const { action, duration } = e.data;
        
        if (action === 'start') {
          endTime = Date.now() + duration;
          lastTick = Date.now();
          
          interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, endTime - now);
            
            // 100msごとに送信
            if (now - lastTick >= 100) {
              self.postMessage({ type: 'tick', remaining });
              lastTick = now;
            }
            
            if (remaining === 0) {
              clearInterval(interval);
              self.postMessage({ type: 'complete' });
            }
          }, 50); // 50msごとにチェック
        } else if (action === 'stop') {
          if (interval) {
            clearInterval(interval);
          }
          self.postMessage({ type: 'stopped' });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      if (e.data.type === 'tick') {
        this.remainingMs = e.data.remaining;
        this.emitTick();
      } else if (e.data.type === 'complete') {
        this.handleComplete();
      }
    };

    this.worker.onerror = (error) => {
      console.error('Timer Worker Error:', error);
      // フォールバック: setIntervalを使用
      this.fallbackToSetInterval();
    };
  }

  /**
   * Web Workerが使えない場合のフォールバック
   */
  private fallbackToSetInterval(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }

    this.tickInterval = window.setInterval(() => {
      if (this.state !== TimerState.Running) return;

      const elapsed = Date.now() - this.startTime;
      this.remainingMs = Math.max(0, this.totalDurationMs - elapsed);

      this.emitTick();

      if (this.remainingMs === 0) {
        this.handleComplete();
      }
    }, TIMER_CONFIG.TICK_INTERVAL_MS);
  }

  /**
   * タイマー開始
   */
  start(mode?: SessionType): void {
    if (mode) {
      this.currentMode = mode;
    }

    this.totalDurationMs = this.getDuration(this.currentMode);
    this.remainingMs = this.totalDurationMs;
    this.startTime = Date.now();
    this.state = TimerState.Running;

    if (this.worker) {
      this.worker.postMessage({ action: 'start', duration: this.remainingMs });
    } else {
      this.fallbackToSetInterval();
    }

    this.emit(EVENT_NAMES.TIMER_START, undefined);
  }

  /**
   * タイマー一時停止
   */
  pause(): void {
    if (this.state !== TimerState.Running) return;

    this.pausedTime = Date.now();
    this.state = TimerState.Paused;

    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.emit(EVENT_NAMES.TIMER_PAUSE, undefined);
  }

  /**
   * タイマー再開
   */
  resume(): void {
    if (this.state !== TimerState.Paused) return;

    const pauseDuration = Date.now() - this.pausedTime;
    this.startTime += pauseDuration;
    this.state = TimerState.Running;

    if (this.worker) {
      this.worker.postMessage({ action: 'start', duration: this.remainingMs });
    } else {
      this.fallbackToSetInterval();
    }

    this.emit(EVENT_NAMES.TIMER_RESUME, undefined);
  }

  /**
   * タイマースキップ
   */
  skip(): void {
    this.stop();
    this.nextMode();
    this.emit(EVENT_NAMES.TIMER_SKIP, undefined);
  }

  /**
   * タイマーリセット
   */
  reset(): void {
    this.stop();
    this.currentRound = 1;
    this.currentMode = SessionType.Focus;
    this.emit(EVENT_NAMES.TIMER_RESET, undefined);
  }

  /**
   * タイマー停止
   */
  private stop(): void {
    this.state = TimerState.Idle;

    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.remainingMs = 0;
  }

  /**
   * タイマー完了処理
   */
  private handleComplete(): void {
    const completeEvent: TimerCompleteEvent = {
      type: this.currentMode,
      round: this.currentRound,
      taskId: null, // これは上位層で設定される
    };

    this.emit(EVENT_NAMES.TIMER_COMPLETE, completeEvent);
    this.stop();
    this.nextMode();
  }

  /**
   * 次のモードに移行
   */
  private nextMode(): void {
    const oldMode = this.currentMode;

    if (this.currentMode === SessionType.Focus) {
      if (this.currentRound >= this.config.roundsUntilLongBreak) {
        this.currentMode = SessionType.LongBreak;
        this.currentRound = 1;
      } else {
        this.currentMode = SessionType.ShortBreak;
        this.currentRound++;
      }
    } else {
      this.currentMode = SessionType.Focus;
    }

    this.emit(EVENT_NAMES.TIMER_MODE_CHANGE, {
      oldMode,
      newMode: this.currentMode,
      round: this.currentRound,
    });
  }

  /**
   * Tickイベント発火
   */
  private emitTick(): void {
    const tickEvent: TimerTickEvent = {
      remainingMs: this.remainingMs,
      totalMs: this.totalDurationMs,
      percentage: (this.remainingMs / this.totalDurationMs) * 100,
    };

    this.emit(EVENT_NAMES.TIMER_TICK, tickEvent);
  }

  /**
   * モードに応じた時間を取得
   */
  private getDuration(mode: SessionType): number {
    switch (mode) {
      case SessionType.Focus:
        return this.config.focusMinutes * 60 * 1000;
      case SessionType.ShortBreak:
        return this.config.shortBreakMinutes * 60 * 1000;
      case SessionType.LongBreak:
        return this.config.longBreakMinutes * 60 * 1000;
      default:
        return 0;
    }
  }

  /**
   * 現在の状態を取得
   */
  getState(): TimerState {
    return this.state;
  }

  /**
   * 現在のモードを取得
   */
  getCurrentMode(): SessionType {
    return this.currentMode;
  }

  /**
   * 現在のラウンドを取得
   */
  getCurrentRound(): number {
    return this.currentRound;
  }

  /**
   * 残り時間を取得
   */
  getRemainingMs(): number {
    return this.remainingMs;
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.stop();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.removeAllListeners();
  }
}

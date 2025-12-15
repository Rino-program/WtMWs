/**
 * イベント型定義
 */

import { Task, Session, SessionType } from './models';

// イベント名の定数
export const EVENT_NAMES = {
  // タイマーイベント
  TIMER_START: 'timer:start',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_SKIP: 'timer:skip',
  TIMER_RESET: 'timer:reset',
  TIMER_TICK: 'timer:tick',
  TIMER_COMPLETE: 'timer:complete',
  TIMER_MODE_CHANGE: 'timer:modeChange',

  // タスクイベント
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_SELECT: 'task:select',
  TASK_COMPLETE: 'task:complete',
  TASK_ARCHIVE: 'task:archive',

  // セッションイベント
  SESSION_START: 'session:start',
  SESSION_END: 'session:end',
  SESSION_LOG: 'session:log',

  // 状態変更イベント
  STATE_CHANGE: 'state:change',
  SETTINGS_CHANGE: 'settings:change',

  // UIイベント
  UI_NOTIFICATION: 'ui:notification',
  UI_ERROR: 'ui:error',
  UI_SUCCESS: 'ui:success',
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

// タイマーイベントデータ
export interface TimerTickEvent {
  remainingMs: number;
  totalMs: number;
  percentage: number;
}

export interface TimerCompleteEvent {
  type: SessionType;
  round: number;
  taskId: string | null;
}

export interface TimerModeChangeEvent {
  oldMode: SessionType;
  newMode: SessionType;
  round: number;
}

// タスクイベントデータ
export interface TaskEvent {
  task: Task;
}

export interface TaskSelectEvent {
  taskId: string | null;
  task: Task | null;
}

// セッションイベントデータ
export interface SessionEvent {
  session: Session;
}

// 通知イベントデータ
export interface NotificationEvent {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

// イベントデータのマッピング
export interface EventDataMap {
  [EVENT_NAMES.TIMER_START]: void;
  [EVENT_NAMES.TIMER_PAUSE]: void;
  [EVENT_NAMES.TIMER_RESUME]: void;
  [EVENT_NAMES.TIMER_SKIP]: void;
  [EVENT_NAMES.TIMER_RESET]: void;
  [EVENT_NAMES.TIMER_TICK]: TimerTickEvent;
  [EVENT_NAMES.TIMER_COMPLETE]: TimerCompleteEvent;
  [EVENT_NAMES.TIMER_MODE_CHANGE]: TimerModeChangeEvent;
  [EVENT_NAMES.TASK_CREATE]: TaskEvent;
  [EVENT_NAMES.TASK_UPDATE]: TaskEvent;
  [EVENT_NAMES.TASK_DELETE]: TaskEvent;
  [EVENT_NAMES.TASK_SELECT]: TaskSelectEvent;
  [EVENT_NAMES.TASK_COMPLETE]: TaskEvent;
  [EVENT_NAMES.TASK_ARCHIVE]: TaskEvent;
  [EVENT_NAMES.SESSION_START]: SessionEvent;
  [EVENT_NAMES.SESSION_END]: SessionEvent;
  [EVENT_NAMES.SESSION_LOG]: SessionEvent;
  [EVENT_NAMES.UI_NOTIFICATION]: NotificationEvent;
  [EVENT_NAMES.UI_ERROR]: NotificationEvent;
  [EVENT_NAMES.UI_SUCCESS]: NotificationEvent;
}

// イベントリスナーの型
export type EventListener<T = unknown> = (data: T) => void;

// イベントエミッターのインターフェース
export interface IEventEmitter {
  on<K extends EventName>(event: K, listener: EventListener<any>): void;
  off<K extends EventName>(event: K, listener: EventListener<any>): void;
  emit<K extends EventName>(event: K, data: any): void;
  once<K extends EventName>(event: K, listener: EventListener<any>): void;
}

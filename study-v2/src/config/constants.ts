/**
 * アプリケーション定数
 */

import { Settings, TaskPriority, TaskStatus } from '@/types/models';

// データベース設定
export const DB_NAME = 'StudySupportDB';
export const DB_VERSION = 2;
export const STORAGE_KEY = 'studyapp.db.v2';

// デフォルト設定
export const DEFAULT_SETTINGS: Settings = {
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
  autoIncrementAmount: true,
  prioritizeAmount: true,
  enableAnimations: true,
  showTaskPreview: true,
};

// デフォルトフォルダ
export const DEFAULT_FOLDER = {
  id: 'default',
  name: 'デフォルト',
  color: '#22c55e',
  icon: '📁',
  createdAt: new Date(),
  updatedAt: new Date(),
  sortOrder: 0,
};

// 未選択タスク
export const NONE_TASK = {
  id: 'none',
  title: '未選択',
  subject: '',
  notes: '',
  folderId: 'default',
  priority: TaskPriority.Normal,
  status: TaskStatus.Active,
  goalMinutes: 0,
  amount: 0,
  amountUnit: '',
  currentAmount: 0,
  deadline: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  tags: [],
};

// 優先度アイコン
export const PRIORITY_ICONS = {
  [TaskPriority.Low]: '🔵',
  [TaskPriority.Normal]: '⚪',
  [TaskPriority.High]: '🔶',
  [TaskPriority.Urgent]: '🔴',
} as const;

// 優先度ラベル
export const PRIORITY_LABELS = {
  [TaskPriority.Low]: '低',
  [TaskPriority.Normal]: '通常',
  [TaskPriority.High]: '高',
  [TaskPriority.Urgent]: '緊急',
} as const;

// タイムゾーン
export const TIMEZONE = 'Asia/Tokyo';

// ローカルストレージキー
export const STORAGE_KEYS = {
  LAST_BACKUP: 'studyapp.lastBackup',
  MIGRATION_FLAG: 'studyapp.migration.v1_to_v2',
  NOTIFICATION_PERMISSION: 'studyapp.notificationPermission',
} as const;

// バックアップ設定
export const BACKUP_CONFIG = {
  AUTO_BACKUP_INTERVAL_DAYS: 3,
  MAX_AUTO_BACKUPS: 5,
  BACKUP_PREFIX: 'studyapp.backup.',
} as const;

// タイマー設定
export const TIMER_CONFIG = {
  TICK_INTERVAL_MS: 100, // タイマーの更新間隔
  MIN_DURATION_MINUTES: 1,
  MAX_DURATION_MINUTES: 180,
} as const;

// UI設定
export const UI_CONFIG = {
  TOAST_DURATION_MS: 3000,
  ANIMATION_DURATION_MS: 300,
  DEBOUNCE_DELAY_MS: 300,
  THROTTLE_DELAY_MS: 100,
} as const;

// 統計設定
export const STATS_CONFIG = {
  WEEK_DAYS: 7,
  PRODUCTIVITY_SCORE_MAX: 100,
} as const;

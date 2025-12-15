/**
 * データモデルの型定義
 */

// タスクの優先度
export enum TaskPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Urgent = 'urgent',
}

// タスクの状態
export enum TaskStatus {
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
}

// タスク
export interface Task {
  id: string;
  title: string;
  subject: string;
  notes: string;
  folderId: string;
  priority: TaskPriority;
  status: TaskStatus;
  goalMinutes: number;
  amount: number;
  amountUnit: string;
  currentAmount: number;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  tags: string[];
}

// セッションタイプ
export enum SessionType {
  Focus = 'focus',
  ShortBreak = 'short_break',
  LongBreak = 'long_break',
}

// セッション
export interface Session {
  id: string;
  taskId: string;
  type: SessionType;
  round: number;
  startedAt: Date;
  endedAt: Date;
  durationMs: number;
  interrupted: boolean;
}

// フォルダ
export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder: number;
}

// 設定
export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  roundsUntilLongBreak: number;
  currentTaskId: string | null;
  theme: 'system' | 'light' | 'dark';
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  showSeconds: boolean;
  compactMode: boolean;
  notifyBreakStart: boolean;
  notifyBreakEnd: boolean;
  notifyGoalAchieved: boolean;
  enableSound: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  autoIncrementAmount: boolean;
  prioritizeAmount: boolean;
  enableAnimations: boolean;
  showTaskPreview: boolean;
}

// 統計データ
export interface Statistics {
  totalFocusMinutes: number;
  totalSessions: number;
  streakDays: number;
  averageFocusMinutes: number;
  productivityScore: number;
  todayFocusMinutes: number;
  todaySessionCount: number;
  weekFocusMinutes: number;
  weekSessionCount: number;
}

// アプリケーション全体の状態
export interface AppState {
  tasks: Task[];
  sessions: Session[];
  folders: Folder[];
  settings: Settings;
  statistics: Statistics;
  currentTaskId: string | null;
  isTimerRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  currentMode: SessionType;
  timeRemainingMs: number;
}

// データベーススキーマ
export interface DatabaseSchema {
  version: number;
  tasks: Task[];
  sessions: Session[];
  folders: Folder[];
  settings: Settings;
  updatedAt: Date;
}

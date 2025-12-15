/**
 * アプリケーションメインクラス
 */

import { AppState, SessionType } from '@/types/models';
import { db } from '@/storage/DatabaseManager';
import { TaskManager } from '@/core/TaskManager';
import { FolderManager } from '@/core/FolderManager';
import { Timer, TimerState } from '@/core/Timer';
import { SessionLogger } from '@/core/SessionLogger';
import { SettingsManager } from '@/core/SettingsManager';
import { NotificationService } from '@/core/NotificationService';
import { EventEmitter } from '@/utils/EventEmitter';
import { EVENT_NAMES } from '@/types/events';

export class App extends EventEmitter {
  private taskManager: TaskManager;
  private folderManager: FolderManager;
  private timer: Timer;
  private sessionLogger: SessionLogger;
  private settingsManager: SettingsManager;
  private notificationService: NotificationService;
  private initialized: boolean = false;

  constructor() {
    super();

    // マネージャーの初期化
    this.taskManager = new TaskManager();
    this.folderManager = new FolderManager();
    this.sessionLogger = new SessionLogger();
    this.settingsManager = new SettingsManager();

    // タイマーは設定読み込み後に初期化
    this.timer = new Timer({
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      roundsUntilLongBreak: 4,
    });

    // 通知サービス（設定読み込み後に更新）
    this.notificationService = new NotificationService(this.settingsManager.getSettings());

    this.setupEventListeners();
  }

  /**
   * アプリケーション初期化
   */
  async init(): Promise<void> {
    try {
      // データベース初期化
      await db.init();

      // 各マネージャーの初期化
      await this.settingsManager.init();
      await this.taskManager.init();
      await this.folderManager.init();
      await this.sessionLogger.init();

      // タイマー設定を更新
      const settings = this.settingsManager.getSettings();
      this.timer.updateConfig({
        focusMinutes: settings.focusMinutes,
        shortBreakMinutes: settings.shortBreakMinutes,
        longBreakMinutes: settings.longBreakMinutes,
        roundsUntilLongBreak: settings.roundsUntilLongBreak,
      });

      // 通知サービスの設定を更新
      this.notificationService.updateSettings(settings);

      // テーマ適用
      this.settingsManager.applyTheme();

      this.initialized = true;

      // 通知権限をリクエスト（ユーザーの操作後）
      if (this.notificationService.isSupported()) {
        setTimeout(() => {
          this.notificationService.requestPermission();
        }, 2000);
      }

      console.log('✅ アプリケーションの初期化が完了しました');
    } catch (error) {
      console.error('❌ アプリケーションの初期化に失敗:', error);
      throw error;
    }
  }

  /**
   * イベントリスナーのセットアップ
   */
  private setupEventListeners(): void {
    // タイマー完了イベント
    this.timer.on(EVENT_NAMES.TIMER_COMPLETE, async (event) => {
      if (event.type === SessionType.Focus) {
        // フォーカスセッション完了
        await this.sessionLogger.endSession(false);
        await this.notificationService.notifyFocusComplete(event.round);

        // 自動量増加
        const settings = this.settingsManager.getSettings();
        if (settings.autoIncrementAmount && settings.currentTaskId) {
          const task = this.taskManager.getTask(settings.currentTaskId);
          if (task && task.amount > 0 && task.currentAmount < task.amount) {
            await this.taskManager.incrementAmount(settings.currentTaskId);
          }
        }

        // 目標達成チェック
        await this.checkGoalAchievement();

        // 自動で休憩開始
        if (settings.autoStartBreaks) {
          setTimeout(() => this.timer.start(), 1000);
        }
      } else {
        // 休憩完了
        await this.notificationService.notifyBreakEnd();

        // 自動でフォーカス開始
        const settings = this.settingsManager.getSettings();
        if (settings.autoStartFocus) {
          setTimeout(() => this.timer.start(), 1000);
        }
      }
    });

    // タイマーモード変更イベント
    this.timer.on(EVENT_NAMES.TIMER_MODE_CHANGE, async (event) => {
      if (
        event.newMode === SessionType.ShortBreak ||
        event.newMode === SessionType.LongBreak
      ) {
        await this.notificationService.notifyBreakStart(
          event.newMode === SessionType.LongBreak
        );
      }
    });

    // 設定変更イベント
    this.settingsManager.on(EVENT_NAMES.SETTINGS_CHANGE, () => {
      const settings = this.settingsManager.getSettings();

      // タイマー設定更新
      this.timer.updateConfig({
        focusMinutes: settings.focusMinutes,
        shortBreakMinutes: settings.shortBreakMinutes,
        longBreakMinutes: settings.longBreakMinutes,
        roundsUntilLongBreak: settings.roundsUntilLongBreak,
      });

      // 通知サービス更新
      this.notificationService.updateSettings(settings);

      // テーマ適用
      this.settingsManager.applyTheme();
    });
  }

  /**
   * 目標達成チェック
   */
  private async checkGoalAchievement(): Promise<void> {
    const settings = this.settingsManager.getSettings();

    // 日次目標
    if (settings.dailyGoalMinutes > 0) {
      const todayMinutes = this.sessionLogger.getTodayTotalMinutes();
      if (todayMinutes >= settings.dailyGoalMinutes) {
        await this.notificationService.notifyGoalAchieved('daily', todayMinutes);
      }
    }

    // 週次目標
    if (settings.weeklyGoalMinutes > 0) {
      const weekMinutes = this.sessionLogger.getWeekTotalMinutes();
      if (weekMinutes >= settings.weeklyGoalMinutes) {
        await this.notificationService.notifyGoalAchieved('weekly', weekMinutes);
      }
    }
  }

  /**
   * タイマー開始
   */
  startTimer(): void {
    if (this.timer.getState() === TimerState.Paused) {
      this.timer.resume();
    } else {
      const settings = this.settingsManager.getSettings();
      const currentTaskId = settings.currentTaskId || 'none';

      // セッション開始
      if (this.timer.getCurrentMode() === SessionType.Focus) {
        this.sessionLogger.startSession(
          currentTaskId,
          SessionType.Focus,
          this.timer.getCurrentRound()
        );
      }

      this.timer.start();
    }
  }

  /**
   * タイマー一時停止
   */
  pauseTimer(): void {
    this.timer.pause();
  }

  /**
   * タイマースキップ
   */
  skipTimer(): void {
    // 進行中のセッションを中断として記録
    if (this.timer.getCurrentMode() === SessionType.Focus) {
      this.sessionLogger.endSession(true);
    }

    this.timer.skip();
  }

  /**
   * タイマーリセット
   */
  resetTimer(): void {
    // 進行中のセッションをキャンセル
    this.sessionLogger.cancelSession();
    this.timer.reset();
  }

  /**
   * 現在のタスクを選択
   */
  async selectTask(taskId: string): Promise<void> {
    await this.settingsManager.set('currentTaskId', taskId);

    const task = this.taskManager.getTask(taskId);
    this.taskManager.emit(EVENT_NAMES.TASK_SELECT, {
      taskId,
      task: task || null,
    });
  }

  /**
   * アプリケーションの状態を取得
   */
  getState(): AppState {
    const settings = this.settingsManager.getSettings();

    return {
      tasks: this.taskManager.getAllTasks(),
      sessions: this.sessionLogger.getAllSessions(),
      folders: this.folderManager.getAllFolders(),
      settings,
      statistics: {
        totalFocusMinutes: this.sessionLogger.getAllSessions().reduce(
          (sum, s) => sum + Math.round(s.durationMs / 60000),
          0
        ),
        totalSessions: this.sessionLogger.getAllSessions().length,
        streakDays: this.sessionLogger.getStreakDays(),
        averageFocusMinutes: 0, // 計算は統計エンジンで
        productivityScore: 0, // 計算は統計エンジンで
        todayFocusMinutes: this.sessionLogger.getTodayTotalMinutes(),
        todaySessionCount: this.sessionLogger.getTodaySessionCount(),
        weekFocusMinutes: this.sessionLogger.getWeekTotalMinutes(),
        weekSessionCount: this.sessionLogger.getWeekSessionCount(),
      },
      currentTaskId: settings.currentTaskId,
      isTimerRunning: this.timer.getState() === TimerState.Running,
      isPaused: this.timer.getState() === TimerState.Paused,
      currentRound: this.timer.getCurrentRound(),
      currentMode: this.timer.getCurrentMode(),
      timeRemainingMs: this.timer.getRemainingMs(),
    };
  }

  /**
   * マネージャーへのアクセサ
   */
  get tasks(): TaskManager {
    return this.taskManager;
  }

  get folders(): FolderManager {
    return this.folderManager;
  }

  get sessions(): SessionLogger {
    return this.sessionLogger;
  }

  get settings(): SettingsManager {
    return this.settingsManager;
  }

  get notifications(): NotificationService {
    return this.notificationService;
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.timer.destroy();
    this.taskManager.removeAllListeners();
    this.folderManager.removeAllListeners();
    this.sessionLogger.removeAllListeners();
    this.settingsManager.removeAllListeners();
    this.removeAllListeners();
  }
}

/**
 * セッション記録クラス
 */

import { Session, SessionType } from '@/types/models';
import { db } from '@/storage/DatabaseManager';
import { EventEmitter } from '@/utils/EventEmitter';
import { EVENT_NAMES } from '@/types/events';
import { startOfToday, daysAgo } from '@/utils/dateHelpers';

export class SessionLogger extends EventEmitter {
  private sessions: Session[] = [];
  private currentSession: Session | null = null;

  /**
   * 初期化
   */
  async init(): Promise<void> {
    await this.loadSessions();
  }

  /**
   * セッションの読み込み
   */
  private async loadSessions(): Promise<void> {
    this.sessions = await db.getAll<Session>('sessions');
    this.sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * セッション開始
   */
  startSession(taskId: string, type: SessionType, round: number): void {
    this.currentSession = {
      id: this.generateId(),
      taskId,
      type,
      round,
      startedAt: new Date(),
      endedAt: new Date(), // 一時的に設定
      durationMs: 0,
      interrupted: false,
    };

    this.emit(EVENT_NAMES.SESSION_START, { session: this.currentSession });
  }

  /**
   * セッション終了
   */
  async endSession(interrupted: boolean = false): Promise<Session | null> {
    if (!this.currentSession) return null;

    const session: Session = {
      ...this.currentSession,
      endedAt: new Date(),
      durationMs: new Date().getTime() - this.currentSession.startedAt.getTime(),
      interrupted,
    };

    // フォーカスセッションのみ記録
    if (session.type === SessionType.Focus) {
      await db.put('sessions', session);
      this.sessions.unshift(session);

      this.emit(EVENT_NAMES.SESSION_END, { session });
      this.emit(EVENT_NAMES.SESSION_LOG, { session });
    }

    this.currentSession = null;
    return session;
  }

  /**
   * セッションキャンセル
   */
  cancelSession(): void {
    this.currentSession = null;
  }

  /**
   * セッション取得
   */
  getSession(id: string): Session | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  /**
   * 全セッション取得
   */
  getAllSessions(): Session[] {
    return [...this.sessions];
  }

  /**
   * 今日のセッション取得
   */
  getTodaySessions(): Session[] {
    const today = startOfToday();
    return this.sessions.filter((s) => s.startedAt >= today);
  }

  /**
   * 期間内のセッション取得
   */
  getSessionsInRange(start: Date, end: Date): Session[] {
    return this.sessions.filter((s) => s.startedAt >= start && s.startedAt <= end);
  }

  /**
   * タスクIDで絞り込み
   */
  getSessionsByTask(taskId: string): Session[] {
    return this.sessions.filter((s) => s.taskId === taskId);
  }

  /**
   * タイプで絞り込み
   */
  getSessionsByType(type: SessionType): Session[] {
    return this.sessions.filter((s) => s.type === type);
  }

  /**
   * 今日の合計時間（分）
   */
  getTodayTotalMinutes(): number {
    const sessions = this.getTodaySessions();
    const totalMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
    return Math.round(totalMs / 60000);
  }

  /**
   * 今日のセッション数
   */
  getTodaySessionCount(): number {
    return this.getTodaySessions().length;
  }

  /**
   * 週間合計時間（分）
   */
  getWeekTotalMinutes(): number {
    const weekAgo = daysAgo(7);
    const sessions = this.sessions.filter((s) => s.startedAt >= weekAgo);
    const totalMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
    return Math.round(totalMs / 60000);
  }

  /**
   * 週間セッション数
   */
  getWeekSessionCount(): number {
    const weekAgo = daysAgo(7);
    return this.sessions.filter((s) => s.startedAt >= weekAgo).length;
  }

  /**
   * タスク別の合計時間
   */
  getTotalMinutesByTask(taskId: string): number {
    const sessions = this.getSessionsByTask(taskId);
    const totalMs = sessions.reduce((sum, s) => sum + s.durationMs, 0);
    return Math.round(totalMs / 60000);
  }

  /**
   * 日別の統計
   */
  getDailyStats(days: number = 7): Array<{ date: Date; minutes: number; count: number }> {
    const stats: Array<{ date: Date; minutes: number; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = daysAgo(i);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySessions = this.sessions.filter(
        (s) => s.startedAt >= date && s.startedAt < nextDay
      );

      const totalMs = daySessions.reduce((sum, s) => sum + s.durationMs, 0);

      stats.push({
        date,
        minutes: Math.round(totalMs / 60000),
        count: daySessions.length,
      });
    }

    return stats.reverse();
  }

  /**
   * 連続日数の計算
   */
  getStreakDays(): number {
    let streak = 0;
    let currentDate = startOfToday();

    while (true) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const hasSessions = this.sessions.some(
        (s) => s.startedAt >= currentDate && s.startedAt < nextDay
      );

      if (!hasSessions) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * セッション削除
   */
  async deleteSession(id: string): Promise<void> {
    await db.delete('sessions', id);
    this.sessions = this.sessions.filter((s) => s.id !== id);
  }

  /**
   * 古いセッションの削除
   */
  async deleteOldSessions(days: number = 90): Promise<void> {
    const cutoffDate = daysAgo(days);
    const oldSessions = this.sessions.filter((s) => s.startedAt < cutoffDate);

    for (const session of oldSessions) {
      await db.delete('sessions', session.id);
    }

    this.sessions = this.sessions.filter((s) => s.startedAt >= cutoffDate);
  }

  /**
   * ID生成
   */
  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

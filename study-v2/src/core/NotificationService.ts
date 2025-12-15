/**
 * 通知サービス
 */

import { Settings } from '@/types/models';

export class NotificationService {
  private permission: NotificationPermission = 'default';
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
    this.checkPermission();
  }

  /**
   * 通知権限の確認
   */
  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * 通知権限をリクエスト
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知をサポートしていません');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('通知権限のリクエストに失敗:', error);
      return false;
    }
  }

  /**
   * 通知を表示
   */
  async show(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.settings.enableSound && !options?.silent) {
      return;
    }

    if (this.permission !== 'granted') {
      console.warn('通知権限が許可されていません');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/img/title.png',
        badge: '/img/title.png',
        ...options,
      });

      // 通知をクリックしたらウィンドウにフォーカス
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 自動的に閉じる
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('通知の表示に失敗:', error);
    }
  }

  /**
   * 休憩開始通知
   */
  async notifyBreakStart(isLongBreak: boolean): Promise<void> {
    if (!this.settings.notifyBreakStart) return;

    const title = isLongBreak ? '長休憩の時間です！' : '短休憩の時間です！';
    const body = isLongBreak
      ? 'しっかり休憩して、リフレッシュしましょう'
      : '少し休憩して、水分補給をしましょう';

    await this.show(title, { body });

    if (this.settings.enableSound) {
      this.playSound();
    }
  }

  /**
   * 休憩終了通知
   */
  async notifyBreakEnd(): Promise<void> {
    if (!this.settings.notifyBreakEnd) return;

    await this.show('休憩終了！', {
      body: '集中モードを開始しましょう',
    });

    if (this.settings.enableSound) {
      this.playSound();
    }
  }

  /**
   * 集中完了通知
   */
  async notifyFocusComplete(round: number): Promise<void> {
    await this.show('集中セッション完了！', {
      body: `ラウンド ${round} が完了しました。お疲れ様です！`,
    });

    if (this.settings.enableSound) {
      this.playSound();
    }
  }

  /**
   * 目標達成通知
   */
  async notifyGoalAchieved(type: 'daily' | 'weekly', minutes: number): Promise<void> {
    if (!this.settings.notifyGoalAchieved) return;

    const typeText = type === 'daily' ? '今日の' : '今週の';
    await this.show(`${typeText}目標達成！`, {
      body: `おめでとうございます！${minutes}分の学習を達成しました🎉`,
    });

    if (this.settings.enableSound) {
      this.playSound('success');
    }
  }

  /**
   * サウンド再生
   */
  private playSound(type: 'default' | 'success' = 'default'): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'success') {
        // 成功音: 上昇音
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      } else {
        // デフォルト音: ビープ音
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      }

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('音声再生に失敗:', error);
    }
  }

  /**
   * 設定を更新
   */
  updateSettings(settings: Settings): void {
    this.settings = settings;
  }

  /**
   * 通知権限の状態を取得
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * 通知がサポートされているかチェック
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }
}

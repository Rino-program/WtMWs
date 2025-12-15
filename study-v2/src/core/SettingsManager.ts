/**
 * 設定管理クラス
 */

import { Settings } from '@/types/models';
import { db } from '@/storage/DatabaseManager';
import { EventEmitter } from '@/utils/EventEmitter';
import { EVENT_NAMES } from '@/types/events';
import { validateSettings } from '@/utils/validators';
import { DEFAULT_SETTINGS } from '@/config/constants';

export class SettingsManager extends EventEmitter {
  private settings: Settings = { ...DEFAULT_SETTINGS };

  /**
   * 初期化
   */
  async init(): Promise<void> {
    await this.loadSettings();
  }

  /**
   * 設定の読み込み
   */
  private async loadSettings(): Promise<void> {
    const stored = await db.get<{ id: string } & Settings>('settings', 'app_settings');
    if (stored) {
      this.settings = { ...DEFAULT_SETTINGS, ...stored };
    } else {
      await this.saveSettings();
    }
  }

  /**
   * 設定の保存
   */
  private async saveSettings(): Promise<void> {
    await db.put('settings', { id: 'app_settings', ...this.settings });
  }

  /**
   * 設定取得
   */
  getSettings(): Settings {
    return { ...this.settings };
  }

  /**
   * 設定更新
   */
  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    // バリデーション
    const newSettings = { ...this.settings, ...updates };
    const validation = validateSettings(newSettings);
    if (!validation.valid) {
      throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`);
    }

    this.settings = newSettings;
    await this.saveSettings();

    this.emit(EVENT_NAMES.SETTINGS_CHANGE, undefined);

    return this.getSettings();
  }

  /**
   * 特定の設定値を取得
   */
  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key];
  }

  /**
   * 特定の設定値を更新
   */
  async set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    await this.updateSettings({ [key]: value } as Partial<Settings>);
  }

  /**
   * 設定をリセット
   */
  async resetSettings(): Promise<Settings> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
    this.emit(EVENT_NAMES.SETTINGS_CHANGE, undefined);
    return this.getSettings();
  }

  /**
   * テーマを適用
   */
  applyTheme(): void {
    const theme = this.settings.theme;
    const root = document.documentElement;

    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }

    // コンパクトモード
    if (this.settings.compactMode) {
      root.setAttribute('data-compact', 'true');
    } else {
      root.removeAttribute('data-compact');
    }

    // アニメーション
    if (!this.settings.enableAnimations) {
      root.setAttribute('data-no-animations', 'true');
    } else {
      root.removeAttribute('data-no-animations');
    }
  }
}

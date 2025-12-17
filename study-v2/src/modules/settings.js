/**
 * Settings Module
 * Study Support NG v1.0
 */

import { store } from '../core/store.js';
import { db, STORES } from '../core/database.js';
import { playSound, showNotification } from '../core/utils.js';

const DEFAULT_SETTINGS = {
  // Timer settings
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  
  // Sound settings
  soundEnabled: true,
  soundVolume: 0.5,
  tickingSound: false,
  
  // Notification settings
  notificationsEnabled: true,
  notifyBeforeEnd: 1, // minutes before end
  
  // Display settings
  theme: 'auto', // light, dark, auto
  showSecondsInTitle: true,
  
  // Data settings
  dailyGoalMinutes: 120,
  weeklyGoalMinutes: 600
};

class SettingsModule {
  constructor() {
    this.elements = {};
    this.pendingChanges = {};
  }

  async init() {
    console.log('⚙️ Settings 初期化開始...');
    this.cacheElements();
    this.bindEvents();
    console.log('🎯 イベントバインド完了');
    
    await this.loadSettings();
    console.log('📦 設定ロード完了');
    
    this.applySettings();
    console.log('✅ 設定適用完了');
    
    this.updateFormValues();
    console.log('📝 フォーム値更新完了');
    
    console.log('✅ Settings 初期化完了');
  }

  cacheElements() {
    this.elements = {
      // Timer settings
      focusMinutes: document.getElementById('setting-focus'),
      shortBreakMinutes: document.getElementById('setting-short-break'),
      longBreakMinutes: document.getElementById('setting-long-break'),
      pomodorosUntilLongBreak: document.getElementById('setting-rounds'),
      autoStartBreak: document.getElementById('setting-auto-start-break'),
      autoStartFocus: document.getElementById('setting-auto-start-focus'),
      
      // Sound settings
      soundEnabled: document.getElementById('setting-sound'),
      soundVolume: document.getElementById('setting-sound-volume'),
      volumeValue: document.getElementById('volume-value'),
      tickingSound: document.getElementById('setting-ticking-sound'),
      testSoundBtn: document.getElementById('test-sound-btn'),
      
      // Notification settings
      notificationsEnabled: document.getElementById('setting-notification'),
      notifyBeforeEnd: document.getElementById('setting-notify-before'),
      testNotificationBtn: document.getElementById('test-notification-btn'),
      
      // Display settings
      themeSelect: document.getElementById('setting-theme'),
      showSecondsInTitle: document.getElementById('setting-animations'),
      
      // Goals
      dailyGoalMinutes: document.getElementById('setting-daily-goal'),
      weeklyGoalMinutes: document.getElementById('setting-weekly-goal'),
      
      // Data management
      exportBtn: document.getElementById('export-data-btn'),
      importBtn: document.getElementById('import-data-btn'),
      importInput: document.getElementById('import-file-input'),
      resetBtn: document.getElementById('reset-data-btn'),
      
      // Save button
      saveBtn: document.getElementById('save-settings-btn'),
      settingsStatus: document.getElementById('settings-status')
    };
  }

  bindEvents() {
    // Helper to update setting immediately
    const updateSetting = (key, value) => {
      console.log(`⚙️ 設定を更新: ${key} = ${value}`);
      store.set(`settings.${key}`, value);
      this.saveSetting(key, value);
    };

    // Timer settings
    this.elements.focusMinutes?.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 25;
      updateSetting('focusMinutes', value);
    });
    
    this.elements.shortBreakMinutes?.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 5;
      updateSetting('shortBreakMinutes', value);
    });
    
    this.elements.longBreakMinutes?.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 15;
      updateSetting('longBreakMinutes', value);
    });
    
    this.elements.pomodorosUntilLongBreak?.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 4;
      updateSetting('pomodorosUntilLongBreak', value);
    });
    
    this.elements.autoStartBreak?.addEventListener('change', (e) => {
      updateSetting('autoStartBreak', e.target.checked);
    });
    
    this.elements.autoStartFocus?.addEventListener('change', (e) => {
      updateSetting('autoStartFocus', e.target.checked);
    });
    
    // Sound settings
    this.elements.soundEnabled?.addEventListener('change', (e) => {
      updateSetting('soundEnabled', e.target.checked);
      this.updateSoundControlsState();
    });
    
    this.elements.soundVolume?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      updateSetting('soundVolume', value);
      if (this.elements.volumeValue) {
        this.elements.volumeValue.textContent = `${Math.round(value * 100)}%`;
      }
    });
    
    this.elements.tickingSound?.addEventListener('change', (e) => {
      updateSetting('tickingSound', e.target.checked);
    });
    
    this.elements.testSoundBtn?.addEventListener('click', () => {
      const settings = store.get('settings');
      if (settings.soundEnabled) {
        playSound('complete', settings.soundVolume);
      }
    });
    
    // Notification settings
    this.elements.notificationsEnabled?.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const permission = await this.requestNotificationPermission();
        if (permission !== 'granted') {
          e.target.checked = false;
          this.showStatus('通知の許可が必要です', 'error');
          return;
        }
      }
      updateSetting('notificationsEnabled', e.target.checked);
    });
    
    this.elements.notifyBeforeEnd?.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 1;
      updateSetting('notifyBeforeEnd', value);
    });
    
    this.elements.testNotificationBtn?.addEventListener('click', () => {
      showNotification('テスト通知', {
        body: 'これはテスト通知です！',
        icon: '⏰'
      });
    });
    
    // Theme
    this.elements.themeSelect?.addEventListener('change', (e) => {
      updateSetting('theme', e.target.value);
      this.applyTheme(e.target.value);
    });
    
    this.elements.showSecondsInTitle?.addEventListener('change', (e) => {
      updateSetting('showSecondsInTitle', e.target.checked);
    });
    
    // Goals
    this.elements.dailyGoalMinutes?.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 120;
      updateSetting('dailyGoalMinutes', value);
    });
    
    this.elements.weeklyGoalMinutes?.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 600;
      updateSetting('weeklyGoalMinutes', value);
    });
    
    // Data management
    this.elements.exportBtn?.addEventListener('click', () => this.exportData());
    this.elements.importBtn?.addEventListener('click', () => this.elements.importInput?.click());
    this.elements.importInput?.addEventListener('change', (e) => this.importData(e));
    this.elements.resetBtn?.addEventListener('click', () => this.confirmResetData());
    
    // Note: Save button removed - settings now auto-save on change
  }

  async loadSettings() {
    try {
      console.log('📦 IndexedDB から設定を読み込み中...');
      const saved = await db.get(STORES.SETTINGS, 'settings');
      
      if (saved) {
        console.log('✅ 保存済み設定を読み込みました:', saved);
        const settings = { ...DEFAULT_SETTINGS, ...saved };
        store.update('settings', settings);
      } else {
        console.log('ℹ️ 保存済み設定がありません。デフォルト値を使用します。');
        // Settings are already set by initializeStore()
      }
    } catch (error) {
      console.error('❌ 設定の読み込みに失敗:', error);
      // Use already-set defaults from initializeStore()
    }
  }

  updateFormValues() {
    const settings = store.get('settings');
    
    // Timer settings
    if (this.elements.focusMinutes) {
      this.elements.focusMinutes.value = settings.focusMinutes;
    }
    if (this.elements.shortBreakMinutes) {
      this.elements.shortBreakMinutes.value = settings.shortBreakMinutes;
    }
    if (this.elements.longBreakMinutes) {
      this.elements.longBreakMinutes.value = settings.longBreakMinutes;
    }
    if (this.elements.pomodorosUntilLongBreak) {
      this.elements.pomodorosUntilLongBreak.value = settings.pomodorosUntilLongBreak;
    }
    if (this.elements.autoStartBreak) {
      this.elements.autoStartBreak.checked = settings.autoStartBreak;
    }
    if (this.elements.autoStartFocus) {
      this.elements.autoStartFocus.checked = settings.autoStartFocus;
    }
    
    // Sound settings
    if (this.elements.soundEnabled) {
      this.elements.soundEnabled.checked = settings.soundEnabled;
    }
    if (this.elements.soundVolume) {
      this.elements.soundVolume.value = settings.soundVolume;
    }
    if (this.elements.volumeValue) {
      this.elements.volumeValue.textContent = `${Math.round(settings.soundVolume * 100)}%`;
    }
    if (this.elements.tickingSound) {
      this.elements.tickingSound.checked = settings.tickingSound;
    }
    this.updateSoundControlsState();
    
    // Notification settings
    if (this.elements.notificationsEnabled) {
      this.elements.notificationsEnabled.checked = settings.notificationsEnabled;
    }
    if (this.elements.notifyBeforeEnd) {
      this.elements.notifyBeforeEnd.value = settings.notifyBeforeEnd;
    }
    
    // Display settings
    if (this.elements.themeSelect) {
      this.elements.themeSelect.value = settings.theme;
    }
    if (this.elements.showSecondsInTitle) {
      this.elements.showSecondsInTitle.checked = settings.showSecondsInTitle;
    }
    
    // Goals
    if (this.elements.dailyGoalMinutes) {
      this.elements.dailyGoalMinutes.value = settings.dailyGoalMinutes;
    }
    if (this.elements.weeklyGoalMinutes) {
      this.elements.weeklyGoalMinutes.value = settings.weeklyGoalMinutes;
    }
  }

  updateSoundControlsState() {
    const enabled = this.elements.soundEnabled?.checked ?? true;
    
    if (this.elements.soundVolume) {
      this.elements.soundVolume.disabled = !enabled;
    }
    if (this.elements.tickingSound) {
      this.elements.tickingSound.disabled = !enabled;
    }
    if (this.elements.testSoundBtn) {
      this.elements.testSoundBtn.disabled = !enabled;
    }
  }

  async saveSetting(key, value) {
    // Save individual setting to database asynchronously
    try {
      const settings = store.get('settings');
      await db.put(STORES.SETTINGS, { id: 'settings', ...settings });
      console.log(`💾 設定を保存: ${key} = ${value}`);
    } catch (error) {
      console.error(`❌ 設定の保存に失敗 (${key}):`, error);
    }
  }

  async saveSettings() {
    const currentSettings = store.get('settings');
    
    try {
      await db.put(STORES.SETTINGS, { id: 'settings', ...currentSettings });
      this.pendingChanges = {};
      
      this.showStatus('設定を保存しました', 'success');
      
      // Apply settings immediately
      this.applySettings();
    } catch (error) {
      console.error('設定の保存に失敗:', error);
      this.showStatus('設定の保存に失敗しました', 'error');
    }
  }

  applySettings() {
    const settings = store.get('settings');
    
    // Apply theme
    this.applyTheme(settings.theme);
    
    // Request notifications if enabled
    if (settings.notificationsEnabled) {
      this.requestNotificationPermission();
    }
  }

  applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return 'denied';
  }

  async exportData() {
    try {
      const data = await db.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-support-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showStatus('データをエクスポートしました', 'success');
    } catch (error) {
      console.error('エクスポートに失敗:', error);
      this.showStatus('エクスポートに失敗しました', 'error');
    }
  }

  async importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!this.validateImportData(data)) {
        throw new Error('無効なデータ形式です');
      }
      
      // Confirm import
      const confirmed = confirm('現在のデータを上書きしてインポートしますか？\nこの操作は取り消せません。');
      if (!confirmed) return;
      
      await db.importData(data);
      
      this.showStatus('データをインポートしました。ページを再読み込みします...', 'success');
      
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (error) {
      console.error('インポートに失敗:', error);
      this.showStatus('インポートに失敗しました: ' + error.message, 'error');
    } finally {
      event.target.value = '';
    }
  }

  validateImportData(data) {
    // Basic validation
    if (typeof data !== 'object' || data === null) return false;
    
    // Check for expected stores
    const expectedStores = ['tasks', 'user', 'settings'];
    return expectedStores.some(store => store in data);
  }

  confirmResetData() {
    const confirmed = confirm(
      '本当にすべてのデータをリセットしますか？\n' +
      'この操作は取り消せません。\n\n' +
      '以下のデータが削除されます：\n' +
      '・タスク\n' +
      '・ポモドーロ記録\n' +
      '・実績\n' +
      '・統計\n' +
      '・設定'
    );
    
    if (!confirmed) return;
    
    const doubleConfirmed = confirm('最終確認：本当にリセットしますか？');
    if (!doubleConfirmed) return;
    
    this.resetData();
  }

  async resetData() {
    try {
      await db.resetAll();
      
      this.showStatus('データをリセットしました。ページを再読み込みします...', 'success');
      
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (error) {
      console.error('リセットに失敗:', error);
      this.showStatus('リセットに失敗しました', 'error');
    }
  }

  showStatus(message, type = 'info') {
    const statusEl = this.elements.settingsStatus;
    if (!statusEl) {
      console.log(`[Settings] ${type}: ${message}`);
      return;
    }
    
    statusEl.textContent = message;
    statusEl.className = `settings-status ${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  // Get current effective settings
  getSettings() {
    return store.get('settings');
  }
}

export const settings = new SettingsModule();
export { DEFAULT_SETTINGS };

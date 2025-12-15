/**
 * Study Support NG - Main Entry Point
 * v1.0.0
 */

import { db, STORES } from './core/database.js';
import { store } from './core/store.js';
import { generateId, levelFromXp } from './core/utils.js';

import { timer } from './modules/timer.js';
import { tasks } from './modules/tasks.js';
import { achievements } from './modules/achievements.js';
import { stats } from './modules/stats.js';
import { settings } from './modules/settings.js';
import { initUI, toast, navigation, loading } from './modules/ui.js';

class App {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('🚀 Study Support NG を起動中...');
    
    try {
      // Show loading
      loading.init();
      loading.show('アプリを初期化中...');
      
      // Initialize database
      await db.init();
      console.log('✅ データベース初期化完了');
      
      // Initialize UI
      initUI();
      console.log('✅ UI初期化完了');
      
      // Load user data
      await this.loadUserData();
      console.log('✅ ユーザーデータ読み込み完了');
      
      // Initialize modules
      await this.initModules();
      console.log('✅ モジュール初期化完了');
      
      // Setup event listeners
      this.setupGlobalEvents();
      
      // Check daily reset
      await this.checkDailyReset();
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Hide loading
      loading.hide();
      
      // Show welcome message
      this.showWelcomeMessage();
      
      this.isInitialized = true;
      console.log('🎉 Study Support NG 起動完了！');
      
    } catch (error) {
      console.error('❌ 初期化エラー:', error);
      loading.forceHide();
      toast.error('アプリの初期化に失敗しました。ページを再読み込みしてください。');
    }
  }

  async loadUserData() {
    try {
      // Load user
      let user = await db.get(STORES.USER, 'user');
      
      if (!user) {
        // Create new user
        user = {
          id: 'user',
          createdAt: Date.now(),
          xp: 0,
          level: 1,
          totalMinutes: 0,
          totalPomodoros: 0,
          totalTasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          achievements: []
        };
        await db.put(STORES.USER, user);
      }
      
      store.update('user', user);
      
      // Load today's data
      const today = new Date().toISOString().split('T')[0];
      let dailyLog = await db.get(STORES.DAILY_LOGS, today);
      
      if (!dailyLog) {
        dailyLog = {
          id: today,
          date: today,
          pomodoros: 0,
          minutes: 0,
          tasksCompleted: 0
        };
      }
      
      store.update('today', dailyLog);
      
    } catch (error) {
      console.error('ユーザーデータの読み込みエラー:', error);
    }
  }

  async initModules() {
    // Initialize in order
    await settings.init();
    await timer.init();
    await tasks.init();
    await stats.init();
    await achievements.init();
  }

  setupGlobalEvents() {
    // Pomodoro completed
    window.addEventListener('pomodoro-completed', async (e) => {
      const { minutes } = e.detail;
      
      // Update stats
      await stats.recordPomodoro(minutes);
      
      // Update streak
      await stats.updateStreak();
      
      // Check achievements
      await achievements.checkAchievements();
      
      toast.success(`🍅 ${minutes}分のポモドーロを完了しました！`);
    });
    
    // Task completed
    window.addEventListener('task-completed', async (e) => {
      const { task } = e.detail;
      
      // Update stats
      await stats.recordTaskCompletion();
      
      // Check achievements
      await achievements.checkAchievements();
      
      toast.success(`✅ タスク「${task.title}」を完了しました！`);
    });
    
    // View changed
    window.addEventListener('view-changed', (e) => {
      const { view } = e.detail;
      
      // Refresh data when switching views
      if (view === 'stats') {
        stats.refresh();
      } else if (view === 'achievements') {
        achievements.render();
      }
    });
    
    // Visibility change (for timer accuracy)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        timer.syncTime();
      }
    });
    
    // Before unload warning if timer is running
    window.addEventListener('beforeunload', (e) => {
      const timerState = store.get('timer');
      if (timerState.isRunning) {
        e.preventDefault();
        e.returnValue = 'タイマーが実行中です。本当にページを離れますか？';
      }
    });
    
    // Online/offline status
    window.addEventListener('online', () => {
      toast.success('オンラインに復帰しました');
    });
    
    window.addEventListener('offline', () => {
      toast.warning('オフラインです。データはローカルに保存されます。');
    });
  }

  async checkDailyReset() {
    const user = store.get('user');
    const today = new Date().toISOString().split('T')[0];
    
    if (user.lastStudyDate && user.lastStudyDate !== today) {
      const lastDate = new Date(user.lastStudyDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      // Check if streak should be reset
      if (diffDays > 1) {
        store.update('user', { currentStreak: 0 });
        await db.put(STORES.USER, { id: 'user', ...store.get('user') });
      }
    }
    
    // Reset today's stats
    store.update('today', {
      date: today,
      pomodoros: 0,
      minutes: 0,
      tasksCompleted: 0
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('✅ Service Worker 登録完了:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast.info('新しいバージョンが利用可能です', {
                duration: 0,
                action: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  location.reload();
                },
                actionText: '更新'
              });
            }
          });
        });
      } catch (error) {
        console.warn('Service Worker 登録失敗:', error);
      }
    }
  }

  showWelcomeMessage() {
    const user = store.get('user');
    const hour = new Date().getHours();
    
    let greeting;
    if (hour < 6) {
      greeting = '🌙 深夜の勉強、お疲れ様です！';
    } else if (hour < 12) {
      greeting = '☀️ おはようございます！今日も頑張りましょう！';
    } else if (hour < 18) {
      greeting = '🌤️ こんにちは！良い午後を！';
    } else {
      greeting = '🌙 こんばんは！夜の学習タイムですね！';
    }
    
    // Only show if user has some history
    if (user.totalPomodoros > 0) {
      const level = levelFromXp(user.xp);
      toast.info(`${greeting}\nLv.${level} | 🔥${user.currentStreak}日連続`, {
        duration: 4000
      });
    } else {
      toast.info(`${greeting}\n最初のポモドーロを始めましょう！`, {
        duration: 4000
      });
    }
  }
}

// Initialize app when DOM is ready
const app = new App();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for debugging
window.StudySupport = {
  app,
  store,
  db,
  timer,
  tasks,
  achievements,
  stats,
  settings
};

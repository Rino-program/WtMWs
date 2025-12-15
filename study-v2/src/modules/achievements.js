/**
 * Achievements Module
 * Study Support NG v1.0
 */

import { store } from '../core/store.js';
import { db, STORES } from '../core/database.js';
import { 
  playSound, 
  createConfetti, 
  showXpGain,
  xpProgress,
  levelFromXp,
  xpForLevel
} from '../core/utils.js';

// Achievement definitions
const ACHIEVEMENTS = [
  // Getting Started
  { id: 'first-pomodoro', name: '最初の一歩', description: '初めてのポモドーロを完了', icon: '🌱', xp: 50, condition: (stats) => stats.totalPomodoros >= 1 },
  { id: 'first-task', name: 'タスクマスター見習い', description: '初めてのタスクを完了', icon: '✅', xp: 30, condition: (stats) => stats.totalTasksCompleted >= 1 },
  
  // Pomodoro milestones
  { id: 'pomodoro-10', name: 'ポモドーロ入門者', description: '10ポモドーロ達成', icon: '🍅', xp: 100, condition: (stats) => stats.totalPomodoros >= 10 },
  { id: 'pomodoro-50', name: 'ポモドーロ愛好家', description: '50ポモドーロ達成', icon: '🍅', xp: 200, condition: (stats) => stats.totalPomodoros >= 50 },
  { id: 'pomodoro-100', name: 'ポモドーロマスター', description: '100ポモドーロ達成', icon: '🏆', xp: 500, condition: (stats) => stats.totalPomodoros >= 100 },
  { id: 'pomodoro-500', name: 'ポモドーロレジェンド', description: '500ポモドーロ達成', icon: '👑', xp: 1000, condition: (stats) => stats.totalPomodoros >= 500 },
  
  // Task milestones
  { id: 'task-10', name: '仕事人', description: '10タスク完了', icon: '📋', xp: 100, condition: (stats) => stats.totalTasksCompleted >= 10 },
  { id: 'task-50', name: 'タスクハンター', description: '50タスク完了', icon: '🎯', xp: 300, condition: (stats) => stats.totalTasksCompleted >= 50 },
  { id: 'task-100', name: 'タスクキラー', description: '100タスク完了', icon: '⚔️', xp: 500, condition: (stats) => stats.totalTasksCompleted >= 100 },
  
  // Time milestones
  { id: 'time-60', name: '1時間学習者', description: '累計1時間学習', icon: '⏰', xp: 50, condition: (stats) => stats.totalMinutes >= 60 },
  { id: 'time-300', name: '5時間学習者', description: '累計5時間学習', icon: '⏱️', xp: 150, condition: (stats) => stats.totalMinutes >= 300 },
  { id: 'time-600', name: '10時間学習者', description: '累計10時間学習', icon: '🕐', xp: 300, condition: (stats) => stats.totalMinutes >= 600 },
  { id: 'time-1500', name: '25時間学習者', description: '累計25時間学習', icon: '📚', xp: 500, condition: (stats) => stats.totalMinutes >= 1500 },
  { id: 'time-3000', name: '50時間学習者', description: '累計50時間学習', icon: '🎓', xp: 1000, condition: (stats) => stats.totalMinutes >= 3000 },
  { id: 'time-6000', name: '100時間学習者', description: '累計100時間学習', icon: '🌟', xp: 2000, condition: (stats) => stats.totalMinutes >= 6000 },
  
  // Streak achievements
  { id: 'streak-3', name: '三日坊主卒業', description: '3日連続学習', icon: '🔥', xp: 100, condition: (stats) => stats.currentStreak >= 3 },
  { id: 'streak-7', name: '一週間継続', description: '7日連続学習', icon: '🔥', xp: 200, condition: (stats) => stats.currentStreak >= 7 },
  { id: 'streak-14', name: '二週間継続', description: '14日連続学習', icon: '🔥', xp: 400, condition: (stats) => stats.currentStreak >= 14 },
  { id: 'streak-30', name: '一ヶ月継続', description: '30日連続学習', icon: '💪', xp: 800, condition: (stats) => stats.currentStreak >= 30 },
  { id: 'streak-100', name: '100日チャレンジ達成', description: '100日連続学習', icon: '🏅', xp: 2000, condition: (stats) => stats.currentStreak >= 100 },
  
  // Level achievements
  { id: 'level-5', name: 'レベル5到達', description: 'レベル5に到達', icon: '⭐', xp: 0, condition: (stats) => stats.level >= 5 },
  { id: 'level-10', name: 'レベル10到達', description: 'レベル10に到達', icon: '⭐', xp: 0, condition: (stats) => stats.level >= 10 },
  { id: 'level-25', name: 'レベル25到達', description: 'レベル25に到達', icon: '🌟', xp: 0, condition: (stats) => stats.level >= 25 },
  { id: 'level-50', name: 'レベル50到達', description: 'レベル50に到達', icon: '💫', xp: 0, condition: (stats) => stats.level >= 50 },
  
  // Daily achievements
  { id: 'daily-5', name: 'デイリー5', description: '1日で5ポモドーロ達成', icon: '🌅', xp: 100, condition: (stats, daily) => daily.pomodoros >= 5 },
  { id: 'daily-10', name: 'デイリー10', description: '1日で10ポモドーロ達成', icon: '☀️', xp: 200, condition: (stats, daily) => daily.pomodoros >= 10 },
  { id: 'daily-marathon', name: 'マラソンランナー', description: '1日で4時間以上学習', icon: '🏃', xp: 300, condition: (stats, daily) => daily.minutes >= 240 },
  
  // Special achievements
  { id: 'early-bird', name: '早起き学習者', description: '午前6時前に学習開始', icon: '🐦', xp: 50, condition: () => false, special: 'early' },
  { id: 'night-owl', name: '夜型学習者', description: '午後11時以降に学習', icon: '🦉', xp: 50, condition: () => false, special: 'night' },
];

class AchievementsModule {
  constructor() {
    this.elements = {};
    this.unlockedCache = new Set();
  }

  async init() {
    this.cacheElements();
    this.bindEvents();
    this.subscribeToStore();
    await this.loadAchievements();
    this.render();
  }

  cacheElements() {
    this.elements = {
      achievementsGrid: document.getElementById('achievements-grid'),
      currentLevel: document.getElementById('current-level'),
      levelText: document.getElementById('level-text'),
      xpBarFill: document.getElementById('xp-bar-fill'),
      currentXp: document.getElementById('current-xp'),
      nextLevelXp: document.getElementById('next-level-xp'),
      unlockedAchievements: document.getElementById('unlocked-achievements'),
      totalAchievements: document.getElementById('total-achievements'),
      headerLevelBadge: document.querySelector('.level-badge__level'),
      headerXpFill: document.querySelector('.level-badge__xp-fill'),
      headerStreak: document.querySelector('.streak-badge__count'),
      filterTabs: document.querySelectorAll('.achievements-filter .filter-tab'),
      // Modals
      levelUpModal: document.getElementById('level-up-modal'),
      newLevelDisplay: document.getElementById('new-level'),
      levelUpCloseBtn: document.getElementById('level-up-close'),
      achievementModal: document.getElementById('achievement-modal'),
      achievementIcon: document.getElementById('achievement-icon'),
      achievementName: document.getElementById('achievement-name'),
      achievementDescription: document.getElementById('achievement-description'),
      achievementXp: document.getElementById('achievement-xp'),
      achievementCloseBtn: document.getElementById('achievement-close')
    };
  }

  bindEvents() {
    // Filter tabs
    this.elements.filterTabs?.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        this.currentFilter = filter;
        
        this.elements.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        this.render();
      });
    });
    
    // Close modals
    this.elements.levelUpCloseBtn?.addEventListener('click', () => this.closeLevelUpModal());
    this.elements.achievementCloseBtn?.addEventListener('click', () => this.closeAchievementModal());
    
    // Listen for events
    window.addEventListener('pomodoro-completed', (e) => this.onPomodoroCompleted(e.detail));
    window.addEventListener('task-completed', (e) => this.onTaskCompleted(e.detail));
  }

  subscribeToStore() {
    store.subscribe('user.*', () => this.updateDisplay());
    store.subscribe('today.*', () => this.checkDailyAchievements());
  }

  async loadAchievements() {
    try {
      const user = await db.get(STORES.USER, 'user');
      if (user) {
        store.update('user', user);
        this.unlockedCache = new Set(user.achievements?.map(a => a.id) || []);
      }
    } catch (error) {
      console.error('実績の読み込みに失敗:', error);
    }
    
    // Set total achievements
    if (this.elements.totalAchievements) {
      this.elements.totalAchievements.textContent = ACHIEVEMENTS.length;
    }
  }

  async onPomodoroCompleted({ minutes, taskId }) {
    const settings = store.get('settings');
    
    // Award XP
    const baseXp = 25;
    const bonusXp = Math.floor(minutes / 5) * 2; // Bonus for longer focus
    const totalXp = baseXp + bonusXp;
    
    await this.awardXp(totalXp);
    
    // Check special achievements
    const hour = new Date().getHours();
    if (hour < 6) {
      await this.unlockAchievement('early-bird');
    }
    if (hour >= 23) {
      await this.unlockAchievement('night-owl');
    }
    
    // Check regular achievements
    await this.checkAchievements();
  }

  async onTaskCompleted({ task }) {
    // Award XP based on task
    const baseXp = 20;
    const priorityBonus = { low: 0, normal: 5, high: 10, urgent: 20 };
    const totalXp = baseXp + (priorityBonus[task.priority] || 0);
    
    await this.awardXp(totalXp);
    
    // Check achievements
    await this.checkAchievements();
  }

  async awardXp(amount) {
    const user = store.get('user');
    const oldLevel = levelFromXp(user.xp);
    const newXp = user.xp + amount;
    const newLevel = levelFromXp(newXp);
    
    store.update('user', { xp: newXp, level: newLevel });
    
    // Save to DB
    await this.saveUser();
    
    // Show XP gain animation
    showXpGain(amount, window.innerWidth / 2, window.innerHeight / 2);
    
    // Check for level up
    if (newLevel > oldLevel) {
      this.showLevelUp(newLevel);
    }
    
    // Check level achievements
    await this.checkAchievements();
  }

  async checkAchievements() {
    const user = store.get('user');
    const today = store.get('today');
    
    const stats = {
      ...user,
      level: user.level || levelFromXp(user.xp)
    };
    
    for (const achievement of ACHIEVEMENTS) {
      // Skip if already unlocked
      if (this.unlockedCache.has(achievement.id)) continue;
      
      // Skip special achievements (handled separately)
      if (achievement.special) continue;
      
      // Check condition
      if (achievement.condition(stats, today)) {
        await this.unlockAchievement(achievement.id);
      }
    }
  }

  async checkDailyAchievements() {
    const today = store.get('today');
    const user = store.get('user');
    
    const stats = {
      ...user,
      level: user.level || levelFromXp(user.xp)
    };
    
    for (const achievement of ACHIEVEMENTS) {
      if (this.unlockedCache.has(achievement.id)) continue;
      if (achievement.special) continue;
      
      if (achievement.condition(stats, today)) {
        await this.unlockAchievement(achievement.id);
      }
    }
  }

  async unlockAchievement(achievementId) {
    if (this.unlockedCache.has(achievementId)) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;
    
    // Add to unlocked
    this.unlockedCache.add(achievementId);
    
    const user = store.get('user');
    const achievements = [...(user.achievements || []), {
      id: achievementId,
      unlockedAt: Date.now()
    }];
    
    // Award XP from achievement
    const newXp = user.xp + achievement.xp;
    const newLevel = levelFromXp(newXp);
    
    store.update('user', {
      achievements,
      xp: newXp,
      level: newLevel
    });
    
    // Save to DB
    await this.saveUser();
    
    // Show achievement modal
    this.showAchievementUnlock(achievement);
    
    // Update display
    this.render();
  }

  showLevelUp(level) {
    const settings = store.get('settings');
    
    if (settings.soundEnabled) {
      playSound('levelup');
    }
    
    createConfetti();
    
    if (this.elements.newLevelDisplay) {
      this.elements.newLevelDisplay.textContent = level;
    }
    
    document.getElementById('modal-overlay')?.classList.add('active');
    this.elements.levelUpModal?.classList.add('active');
  }

  closeLevelUpModal() {
    document.getElementById('modal-overlay')?.classList.remove('active');
    this.elements.levelUpModal?.classList.remove('active');
  }

  showAchievementUnlock(achievement) {
    const settings = store.get('settings');
    
    if (settings.soundEnabled) {
      playSound('achievement');
    }
    
    if (this.elements.achievementIcon) {
      this.elements.achievementIcon.textContent = achievement.icon;
    }
    if (this.elements.achievementName) {
      this.elements.achievementName.textContent = achievement.name;
    }
    if (this.elements.achievementDescription) {
      this.elements.achievementDescription.textContent = achievement.description;
    }
    if (this.elements.achievementXp) {
      this.elements.achievementXp.textContent = achievement.xp;
    }
    
    // Use setTimeout to not conflict with level up modal
    setTimeout(() => {
      document.getElementById('modal-overlay')?.classList.add('active');
      this.elements.achievementModal?.classList.add('active');
    }, 500);
  }

  closeAchievementModal() {
    document.getElementById('modal-overlay')?.classList.remove('active');
    this.elements.achievementModal?.classList.remove('active');
  }

  async saveUser() {
    const user = store.get('user');
    try {
      await db.put(STORES.USER, { id: 'user', ...user });
    } catch (error) {
      console.error('ユーザーデータの保存に失敗:', error);
    }
  }

  updateDisplay() {
    const user = store.get('user');
    const progress = xpProgress(user.xp);
    
    // Update level display
    if (this.elements.currentLevel) {
      this.elements.currentLevel.textContent = progress.level;
    }
    if (this.elements.levelText) {
      this.elements.levelText.textContent = progress.level;
    }
    if (this.elements.xpBarFill) {
      this.elements.xpBarFill.style.width = `${progress.percent}%`;
    }
    if (this.elements.currentXp) {
      this.elements.currentXp.textContent = progress.current;
    }
    if (this.elements.nextLevelXp) {
      this.elements.nextLevelXp.textContent = progress.needed;
    }
    
    // Update header
    if (this.elements.headerLevelBadge) {
      this.elements.headerLevelBadge.textContent = `Lv.${progress.level}`;
    }
    if (this.elements.headerXpFill) {
      this.elements.headerXpFill.style.width = `${progress.percent}%`;
    }
    if (this.elements.headerStreak) {
      this.elements.headerStreak.textContent = `${user.currentStreak || 0}日`;
    }
    
    // Update unlocked count
    if (this.elements.unlockedAchievements) {
      this.elements.unlockedAchievements.textContent = this.unlockedCache.size;
    }
  }

  render() {
    this.updateDisplay();
    this.renderAchievementsGrid();
  }

  renderAchievementsGrid() {
    const container = this.elements.achievementsGrid;
    if (!container) return;
    
    const filter = this.currentFilter || 'all';
    
    let achievements = ACHIEVEMENTS;
    if (filter === 'unlocked') {
      achievements = ACHIEVEMENTS.filter(a => this.unlockedCache.has(a.id));
    } else if (filter === 'locked') {
      achievements = ACHIEVEMENTS.filter(a => !this.unlockedCache.has(a.id));
    }
    
    container.innerHTML = achievements.map(achievement => {
      const isUnlocked = this.unlockedCache.has(achievement.id);
      
      return `
        <div class="achievement-card ${isUnlocked ? '' : 'locked'}">
          <div class="achievement-card__icon">${achievement.icon}</div>
          <div class="achievement-card__content">
            <div class="achievement-card__name">${achievement.name}</div>
            <div class="achievement-card__description">${achievement.description}</div>
            ${achievement.xp > 0 ? `<div class="achievement-card__xp">+${achievement.xp} XP</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

export const achievements = new AchievementsModule();
export { ACHIEVEMENTS };

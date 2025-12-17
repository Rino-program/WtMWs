/**
 * Stats Module
 * Study Support NG v1.0
 */

import { store } from '../core/store.js';
import { db, STORES } from '../core/database.js';
import { formatDuration, formatDate, getDayOfYear } from '../core/utils.js';

class StatsModule {
  constructor() {
    this.elements = {};
    this.chartCanvas = null;
    this.heatmapData = [];
  }

  async init() {
    this.cacheElements();
    this.bindEvents();
    this.subscribeToStore();
    await this.loadStats();
    this.render();
  }

  bindEvents() {
    // Bind period tabs for chart switching
    this.elements.chartPeriodTabs?.forEach(tab => {
      tab.addEventListener('click', () => {
        this.elements.chartPeriodTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderChart(tab.dataset.period);
      });
    });
  }

  cacheElements() {
    this.elements = {
      // Summary cards
      totalTimeCard: document.getElementById('stat-total-time'),
      totalPomodorosCard: document.getElementById('stat-total-pomodoros'),
      totalTasksCard: document.getElementById('stat-total-tasks'),
      currentStreakCard: document.getElementById('stat-current-streak'),
      longestStreakCard: document.getElementById('stat-best-streak'),
      avgDailyCard: document.getElementById('stat-avg-daily'),
      
      // Today stats
      todayPomodoros: document.getElementById('today-pomodoros'),
      todayMinutes: document.getElementById('today-minutes'),
      todayTasks: document.getElementById('today-tasks'),
      
      // Chart
      chartCanvas: document.getElementById('study-chart-canvas'),
      chartPeriodTabs: document.querySelectorAll('.chart-period-selector .period-btn'),
      
      // Heatmap
      heatmapContainer: document.getElementById('heatmap-container')
    };
    
    this.chartCanvas = this.elements.chartCanvas;
  }

  subscribeToStore() {
    store.subscribe('user.*', () => this.updateSummary());
    store.subscribe('today.*', () => this.updateTodayStats());
  }

  async loadStats() {
    try {
      // Load user data
      const user = await db.get(STORES.USER, 'user');
      if (user) {
        store.update('user', user);
      }
      
      // Load daily logs for charts
      const dailyLogs = await db.getAll(STORES.DAILY_LOGS);
      this.dailyLogs = dailyLogs || [];
      
      // Build heatmap data from daily logs
      this.buildHeatmapData();
    } catch (error) {
      console.error('統計の読み込みに失敗:', error);
    }
  }

  async refresh() {
    await this.loadStats();
    this.render();
  }

  render() {
    this.updateSummary();
    this.updateTodayStats();
    this.renderChart('week');
    this.renderHeatmap();
    this.updatePeriodStats();
  }

  updateSummary() {
    const user = store.get('user');
    
    // Total time
    if (this.elements.totalTimeCard) {
      const hours = Math.floor((user.totalMinutes || 0) / 60);
      const mins = (user.totalMinutes || 0) % 60;
      this.elements.totalTimeCard.textContent = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
    }
    
    // Total pomodoros
    if (this.elements.totalPomodorosCard) {
      this.elements.totalPomodorosCard.textContent = user.totalPomodoros || 0;
    }
    
    // Total tasks
    if (this.elements.totalTasksCard) {
      this.elements.totalTasksCard.textContent = user.totalTasksCompleted || 0;
    }
    
    // Current streak
    if (this.elements.currentStreakCard) {
      this.elements.currentStreakCard.textContent = `${user.currentStreak || 0}日`;
    }
    
    // Longest streak
    if (this.elements.longestStreakCard) {
      this.elements.longestStreakCard.textContent = `${user.longestStreak || 0}日`;
    }
    
    // Average daily
    if (this.elements.avgDailyCard) {
      const avgMinutes = this.calculateAverageDailyMinutes();
      const hours = Math.floor(avgMinutes / 60);
      const mins = avgMinutes % 60;
      this.elements.avgDailyCard.textContent = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
    }
  }

  updateTodayStats() {
    const today = store.get('today');
    
    if (this.elements.todayPomodoros) {
      this.elements.todayPomodoros.textContent = today.pomodoros || 0;
    }
    if (this.elements.todayMinutes) {
      this.elements.todayMinutes.textContent = today.minutes || 0;
    }
    if (this.elements.todayTasks) {
      this.elements.todayTasks.textContent = today.tasksCompleted || 0;
    }
  }

  calculateAverageDailyMinutes() {
    if (!this.dailyLogs || this.dailyLogs.length === 0) return 0;
    
    const totalMinutes = this.dailyLogs.reduce((sum, log) => sum + (log.minutes || 0), 0);
    return Math.round(totalMinutes / this.dailyLogs.length);
  }

  buildHeatmapData() {
    this.heatmapData = [];
    
    // Create a map from daily logs
    const logMap = new Map();
    this.dailyLogs.forEach(log => {
      logMap.set(log.date, log.minutes || 0);
    });
    
    // Generate last 365 days
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      this.heatmapData.push({
        date: dateStr,
        minutes: logMap.get(dateStr) || 0,
        dayOfWeek: date.getDay()
      });
    }
  }

  renderChart(period = 'week') {
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.getContext('2d');
    const width = this.chartCanvas.width = this.chartCanvas.offsetWidth;
    const height = this.chartCanvas.height = 200;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get data based on period
    const data = this.getChartData(period);
    if (data.length === 0) {
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.textAlign = 'center';
      ctx.font = '14px system-ui';
      ctx.fillText('データがありません', width / 2, height / 2);
      return;
    }
    
    // Chart dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Find max value
    const maxValue = Math.max(...data.map(d => d.minutes), 60);
    
    // Draw axes
    ctx.strokeStyle = 'var(--border-color)';
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Draw bars
    const barWidth = (chartWidth / data.length) * 0.7;
    const gap = (chartWidth / data.length) * 0.3;
    
    data.forEach((d, i) => {
      const barHeight = (d.minutes / maxValue) * chartHeight;
      const x = padding.left + (i * (barWidth + gap)) + gap / 2;
      const y = height - padding.bottom - barHeight;
      
      // Gradient
      const gradient = ctx.createLinearGradient(x, y, x, height - padding.bottom);
      gradient.addColorStop(0, 'var(--primary-color)');
      gradient.addColorStop(1, 'var(--primary-light)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Label
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, height - padding.bottom + 15);
    });
    
    // Y-axis labels
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.textAlign = 'right';
    ctx.font = '10px system-ui';
    
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue / 4) * i);
      const y = height - padding.bottom - (chartHeight / 4) * i;
      ctx.fillText(`${value}分`, padding.left - 5, y + 3);
    }
  }

  getChartData(period) {
    const data = [];
    const today = new Date();
    
    if (period === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const log = this.dailyLogs.find(l => l.date === dateStr);
        
        data.push({
          date: dateStr,
          minutes: log?.minutes || 0,
          label: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
        });
      }
    } else if (period === 'month') {
      // Last 30 days (grouped by week)
      for (let week = 3; week >= 0; week--) {
        let weekTotal = 0;
        for (let day = 0; day < 7; day++) {
          const date = new Date(today);
          date.setDate(date.getDate() - (week * 7 + day));
          const dateStr = date.toISOString().split('T')[0];
          const log = this.dailyLogs.find(l => l.date === dateStr);
          weekTotal += log?.minutes || 0;
        }
        
        data.push({
          minutes: weekTotal,
          label: `${3 - week + 1}週目`
        });
      }
    } else if (period === 'year') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const monthTotal = this.dailyLogs
          .filter(log => {
            const logDate = new Date(log.date);
            return logDate.getFullYear() === year && logDate.getMonth() === month;
          })
          .reduce((sum, log) => sum + (log.minutes || 0), 0);
        
        data.push({
          minutes: monthTotal,
          label: `${month + 1}月`
        });
      }
    }
    
    return data;
  }

  renderHeatmap() {
    const container = this.elements.heatmapContainer;
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create wrapper for day labels and grid
    const wrapper = document.createElement('div');
    wrapper.className = 'heatmap-wrapper';
    
    // Create day labels
    const dayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    const labelsDiv = document.createElement('div');
    labelsDiv.className = 'heatmap-day-labels';
    labelsDiv.innerHTML = dayLabels.map((day, i) => 
      i % 2 === 1 ? `<span>${day}</span>` : '<span></span>'
    ).join('');
    wrapper.appendChild(labelsDiv);
    
    // Create grid
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    
    // Group by week
    let currentWeek = [];
    this.heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      
      if (day.dayOfWeek === 6 || index === this.heatmapData.length - 1) {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'heatmap-week';
        
        // Pad first week if needed
        if (index < 7) {
          for (let i = 0; i < 6 - currentWeek.length + 1; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'heatmap-cell empty';
            weekDiv.appendChild(emptyCell);
          }
        }
        
        currentWeek.forEach(d => {
          const cell = document.createElement('div');
          cell.className = 'heatmap-cell';
          cell.dataset.level = this.getHeatmapLevel(d.minutes);
          cell.title = `${d.date}: ${d.minutes}分`;
          weekDiv.appendChild(cell);
        });
        
        grid.appendChild(weekDiv);
        currentWeek = [];
      }
    });
    
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
    
    // Render legend
    const legend = document.createElement('div');
    legend.className = 'heatmap-legend';
    legend.innerHTML = `
      <span>少ない</span>
      <div class="heatmap-cell" data-level="0"></div>
      <div class="heatmap-cell" data-level="1"></div>
      <div class="heatmap-cell" data-level="2"></div>
      <div class="heatmap-cell" data-level="3"></div>
      <div class="heatmap-cell" data-level="4"></div>
      <span>多い</span>
    `;
    container.appendChild(legend);
  }

  getHeatmapLevel(minutes) {
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 60) return 2;
    if (minutes < 120) return 3;
    return 4;
  }

  updatePeriodStats() {
    const weekStats = this.calculatePeriodStats(7);
    const monthStats = this.calculatePeriodStats(30);
    
    if (this.elements.weekStats) {
      this.elements.weekStats.innerHTML = `
        <div class="period-stat">
          <span class="period-stat__label">今週の学習時間</span>
          <span class="period-stat__value">${formatDuration(weekStats.totalMinutes)}</span>
        </div>
        <div class="period-stat">
          <span class="period-stat__label">ポモドーロ数</span>
          <span class="period-stat__value">${weekStats.totalPomodoros}</span>
        </div>
        <div class="period-stat">
          <span class="period-stat__label">完了タスク</span>
          <span class="period-stat__value">${weekStats.totalTasks}</span>
        </div>
      `;
    }
    
    if (this.elements.monthStats) {
      this.elements.monthStats.innerHTML = `
        <div class="period-stat">
          <span class="period-stat__label">今月の学習時間</span>
          <span class="period-stat__value">${formatDuration(monthStats.totalMinutes)}</span>
        </div>
        <div class="period-stat">
          <span class="period-stat__label">ポモドーロ数</span>
          <span class="period-stat__value">${monthStats.totalPomodoros}</span>
        </div>
        <div class="period-stat">
          <span class="period-stat__label">完了タスク</span>
          <span class="period-stat__value">${monthStats.totalTasks}</span>
        </div>
      `;
    }
  }

  calculatePeriodStats(days) {
    const today = new Date();
    let totalMinutes = 0;
    let totalPomodoros = 0;
    let totalTasks = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = this.dailyLogs.find(l => l.date === dateStr);
      
      if (log) {
        totalMinutes += log.minutes || 0;
        totalPomodoros += log.pomodoros || 0;
        totalTasks += log.tasksCompleted || 0;
      }
    }
    
    return { totalMinutes, totalPomodoros, totalTasks };
  }

  async updateDailyLog(date, updates) {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    
    try {
      let log = await db.get(STORES.DAILY_LOGS, dateStr);
      
      if (!log) {
        log = {
          id: dateStr,
          date: dateStr,
          minutes: 0,
          pomodoros: 0,
          tasksCompleted: 0
        };
      }
      
      // Apply updates
      Object.assign(log, updates);
      
      // Save
      await db.put(STORES.DAILY_LOGS, log);
      
      // Update local cache
      const existingIndex = this.dailyLogs.findIndex(l => l.date === dateStr);
      if (existingIndex >= 0) {
        this.dailyLogs[existingIndex] = log;
      } else {
        this.dailyLogs.push(log);
      }
      
      // Rebuild heatmap data
      this.buildHeatmapData();
    } catch (error) {
      console.error('デイリーログの更新に失敗:', error);
    }
  }

  async recordPomodoro(minutes) {
    const today = new Date().toISOString().split('T')[0];
    const log = this.dailyLogs.find(l => l.date === today) || { minutes: 0, pomodoros: 0 };
    
    await this.updateDailyLog(today, {
      minutes: (log.minutes || 0) + minutes,
      pomodoros: (log.pomodoros || 0) + 1
    });
    
    // Update store
    const todayState = store.get('today');
    store.update('today', {
      minutes: (todayState.minutes || 0) + minutes,
      pomodoros: (todayState.pomodoros || 0) + 1
    });
    
    // Update user totals
    const user = store.get('user');
    await this.updateUserStats({
      totalMinutes: (user.totalMinutes || 0) + minutes,
      totalPomodoros: (user.totalPomodoros || 0) + 1
    });
    
    // Refresh display
    this.render();
  }

  async recordTaskCompletion() {
    const today = new Date().toISOString().split('T')[0];
    const log = this.dailyLogs.find(l => l.date === today) || { tasksCompleted: 0 };
    
    await this.updateDailyLog(today, {
      tasksCompleted: (log.tasksCompleted || 0) + 1
    });
    
    // Update store
    const todayState = store.get('today');
    store.update('today', {
      tasksCompleted: (todayState.tasksCompleted || 0) + 1
    });
    
    // Update user totals
    const user = store.get('user');
    await this.updateUserStats({
      totalTasksCompleted: (user.totalTasksCompleted || 0) + 1
    });
    
    this.render();
  }

  async updateUserStats(updates) {
    const user = store.get('user');
    store.update('user', updates);
    
    try {
      await db.put(STORES.USER, { id: 'user', ...user, ...updates });
    } catch (error) {
      console.error('ユーザー統計の更新に失敗:', error);
    }
  }

  async updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const user = store.get('user');
    
    const lastStudyDate = user.lastStudyDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = user.currentStreak || 0;
    
    if (lastStudyDate === today) {
      // Already studied today, no change
    } else if (lastStudyDate === yesterdayStr) {
      // Continue streak
      newStreak += 1;
    } else if (!lastStudyDate) {
      // First time
      newStreak = 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
    
    const longestStreak = Math.max(newStreak, user.longestStreak || 0);
    
    await this.updateUserStats({
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastStudyDate: today
    });
    
    return newStreak;
  }
}

export const stats = new StatsModule();

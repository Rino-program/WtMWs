/**
 * Utility Functions
 * Study Support NG v1.0
 */

/**
 * Generate UUID v4
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format minutes to human readable string
 */
export function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${mins}分`;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toISOString().split('T')[0];
}

/**
 * Format date to localized string
 */
export function formatDateLocale(date, options = {}) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
}

/**
 * Get today's date string
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * Check if date is today
 */
export function isToday(date) {
  return formatDate(date) === getToday();
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes) {
  if (minutes === 0) return '0分';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}分`;
  } else if (mins === 0) {
    return `${hours}時間`;
  } else {
    return `${hours}時間${mins}分`;
  }
}

/**
 * Get day of year (1-365/366)
 */
export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get days ago date
 */
export function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * Calculate XP needed for level
 */
export function xpForLevel(level) {
  return Math.floor(Math.pow(level, 2) * 100);
}

/**
 * Calculate level from total XP
 */
export function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP progress in current level
 */
export function xpProgress(xp) {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level - 1);
  const nextLevelXp = xpForLevel(level);
  const progress = xp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  return {
    level,
    current: progress,
    needed,
    percent: Math.floor((progress / needed) * 100)
  };
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Play sound effect
 */
export function playSound(type = 'complete') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    switch (type) {
      case 'complete':
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        break;
      case 'break':
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(500, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        break;
      case 'click':
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        break;
      case 'levelup':
        osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3); // G5
        osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.45); // C6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        break;
      case 'achievement':
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
        break;
    }
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
}

/**
 * Show desktop notification
 */
export function showNotification(title, body, options = {}) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  try {
    new Notification(title, {
      body,
      icon: '../img/title.png',
      badge: '../img/title.png',
      ...options
    });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Download file
 */
export function downloadFile(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read file as text
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Get priority color
 */
export function getPriorityColor(priority) {
  const colors = {
    low: 'var(--color-priority-low)',
    normal: 'var(--color-priority-normal)',
    high: 'var(--color-priority-high)',
    urgent: 'var(--color-priority-urgent)'
  };
  return colors[priority] || colors.normal;
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority) {
  const labels = {
    low: '🔵 低',
    normal: '🟢 通常',
    high: '🟠 高',
    urgent: '🔴 緊急'
  };
  return labels[priority] || labels.normal;
}

/**
 * Check deadline status
 */
export function getDeadlineStatus(deadline) {
  if (!deadline) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: 'overdue', text: '期限切れ', class: 'deadline-warning' };
  if (diffDays === 0) return { status: 'today', text: '今日', class: 'deadline-warning' };
  if (diffDays === 1) return { status: 'tomorrow', text: '明日', class: 'deadline-soon' };
  if (diffDays <= 3) return { status: 'soon', text: `${diffDays}日後`, class: 'deadline-soon' };
  return { status: 'normal', text: formatDateLocale(deadlineDate, { year: undefined }), class: '' };
}

/**
 * Escape HTML
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create confetti effect
 */
export function createConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `${Math.random() * 100}%`;
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(confetti);
  }
  
  setTimeout(() => container.remove(), 4000);
}

/**
 * Show XP gain animation
 */
export function showXpGain(amount, x, y) {
  const elem = document.createElement('div');
  elem.className = 'xp-gain';
  elem.textContent = `+${amount} XP`;
  elem.style.left = `${x}px`;
  elem.style.top = `${y}px`;
  document.body.appendChild(elem);
  
  setTimeout(() => elem.remove(), 1500);
}

/**
 * Motivation quotes list
 */
export const MOTIVATION_QUOTES = [
  { text: "継続は力なり。今日の努力が明日の成功を作る。", icon: "💪" },
  { text: "小さな一歩が大きな変化を生む。", icon: "🚀" },
  { text: "今日できることを明日に延ばすな。", icon: "⏰" },
  { text: "学ぶことをやめた時、人は老いる。", icon: "📚" },
  { text: "困難は成長の機会である。", icon: "🌱" },
  { text: "1%の改善を毎日続ければ、1年で37倍になる。", icon: "📈" },
  { text: "休憩は怠けではない。より良い結果のための投資だ。", icon: "☕" },
  { text: "完璧を目指すより、まず完了させよう。", icon: "✅" },
  { text: "集中力は筋肉と同じ。鍛えれば強くなる。", icon: "🧠" },
  { text: "今この瞬間に集中しよう。過去も未来もここにはない。", icon: "🎯" },
  { text: "成功とは、失敗から失敗へと情熱を失わずに進むことだ。", icon: "🔥" },
  { text: "できないと思った瞬間、本当にできなくなる。", icon: "💡" },
  { text: "学びは終わりのない旅。楽しんで進もう。", icon: "🗺️" },
  { text: "最大の敵は自分自身の中にいる。", icon: "⚔️" },
  { text: "今日という日は、残りの人生の最初の日。", icon: "🌅" },
  { text: "ゆっくりでも進み続ける限り、必ずゴールに着く。", icon: "🐢" },
  { text: "25分間、この一瞬に全力を注ごう。", icon: "🍅" },
  { text: "習慣が人を作る。良い習慣を身につけよう。", icon: "🔄" },
  { text: "誰かと比べるな。昨日の自分と比べよう。", icon: "🪞" },
  { text: "難しいことも、始めてしまえば半分終わったようなもの。", icon: "🎬" }
];

/**
 * Get random motivation quote
 */
export function getRandomQuote() {
  return MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
}

/**
 * Break activity suggestions
 */
export const BREAK_ACTIVITIES = [
  { icon: "👁️", title: "目の休憩", description: "20秒間、20フィート（約6m）先を見つめましょう" },
  { icon: "🙆", title: "肩回し", description: "両肩を前後に10回ずつ回しましょう" },
  { icon: "🚶", title: "軽いウォーキング", description: "部屋の中や廊下を少し歩きましょう" },
  { icon: "💧", title: "水分補給", description: "コップ1杯の水を飲みましょう" },
  { icon: "🧘", title: "深呼吸", description: "4秒吸って、4秒止めて、4秒吐く呼吸を5回" },
  { icon: "🤸", title: "ストレッチ", description: "首、腕、背中を軽くストレッチしましょう" },
  { icon: "👐", title: "手首のストレッチ", description: "手首を回したり、指を伸ばしたりしましょう" },
  { icon: "🪟", title: "窓の外を見る", description: "窓の外の景色を眺めてリフレッシュ" },
  { icon: "☕", title: "飲み物を取りに行く", description: "お茶やコーヒーを淹れましょう" },
  { icon: "🌿", title: "観葉植物に水やり", description: "植物のお世話でリラックス" }
];

/**
 * Get random break activities
 */
export function getRandomBreakActivities(count = 3) {
  const shuffled = [...BREAK_ACTIVITIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get week date range string
 */
export function getWeekRange(date = new Date()) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const formatShort = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${formatShort(startOfWeek)} - ${formatShort(endOfWeek)}`;
}

/**
 * BGM Audio Manager
 */
export class BGMManager {
  constructor() {
    this.audioContext = null;
    this.noiseNode = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.currentType = 'none';
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  play(type = 'whitenoise', volume = 0.3) {
    this.stop();
    this.init();
    
    if (type === 'none') return;
    
    this.currentType = type;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = volume;
    this.gainNode.connect(this.audioContext.destination);
    
    switch (type) {
      case 'whitenoise':
        this.playWhiteNoise();
        break;
      case 'rain':
        this.playRainSound();
        break;
      case 'forest':
        this.playForestSound();
        break;
      case 'cafe':
        this.playCafeSound();
        break;
      case 'lofi':
        this.playLofiSound();
        break;
    }
    
    this.isPlaying = true;
  }

  playWhiteNoise() {
    const bufferSize = 2 * this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;
    
    // Add low-pass filter for softer sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    this.noiseNode.connect(filter);
    filter.connect(this.gainNode);
    this.noiseNode.start();
  }

  playRainSound() {
    // Brown noise for rain-like sound
    const bufferSize = 2 * this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    
    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    this.noiseNode.connect(filter);
    filter.connect(this.gainNode);
    this.noiseNode.start();
  }

  playForestSound() {
    // Pink noise for nature-like sound
    const bufferSize = 2 * this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
    
    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.gainNode);
    this.noiseNode.start();
  }

  playCafeSound() {
    // Mix of brown and pink noise
    this.playRainSound();
  }

  playLofiSound() {
    // Low frequency oscillation for lo-fi feel
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;
    
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 90;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    const subGain = this.audioContext.createGain();
    subGain.gain.value = 0.3;
    
    osc.connect(subGain);
    osc2.connect(subGain);
    subGain.connect(filter);
    filter.connect(this.gainNode);
    
    osc.start();
    osc2.start();
    
    this.noiseNode = { 
      stop: () => { osc.stop(); osc2.stop(); }
    };
  }

  stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch (e) {}
      this.noiseNode = null;
    }
    this.isPlaying = false;
    this.currentType = 'none';
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  toggle(type, volume) {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play(type, volume);
      return true;
    }
  }
}

export const bgmManager = new BGMManager();

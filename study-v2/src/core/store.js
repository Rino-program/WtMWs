/**
 * State Manager - Reactive State Management
 * Study Support NG v1.0
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.middleware = [];
  }

  /**
   * Get state value by path
   * @param {string} path - Dot notation path (e.g., 'user.level')
   * @returns {any}
   */
  get(path) {
    if (!path) return this.state;
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  /**
   * Set state value by path
   * @param {string} path - Dot notation path
   * @param {any} value - New value
   */
  set(path, value) {
    const oldValue = this.get(path);
    if (oldValue === value) return;

    // Run middleware
    for (const fn of this.middleware) {
      const result = fn(path, value, oldValue);
      if (result === false) return;
    }

    // Set value
    const keys = path.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;

    // Notify listeners
    this.notify(path, value, oldValue);
  }

  /**
   * Update state with partial object
   * @param {string} path - Base path
   * @param {object} partial - Partial update object
   */
  update(path, partial) {
    const current = this.get(path) || {};
    this.set(path, { ...current, ...partial });
  }

  /**
   * Subscribe to state changes
   * @param {string} path - Path to watch (supports wildcards)
   * @param {function} callback - Callback function(newValue, oldValue, path)
   * @returns {function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(path)?.delete(callback);
    };
  }

  /**
   * Notify listeners of state change
   */
  notify(path, newValue, oldValue) {
    // Exact match listeners
    this.listeners.get(path)?.forEach(cb => cb(newValue, oldValue, path));

    // Wildcard listeners (e.g., 'user.*' matches 'user.level')
    this.listeners.forEach((callbacks, listenerPath) => {
      if (listenerPath.endsWith('.*')) {
        const basePath = listenerPath.slice(0, -2);
        if (path.startsWith(basePath + '.') || path === basePath) {
          callbacks.forEach(cb => cb(newValue, oldValue, path));
        }
      }
      // Global listener
      if (listenerPath === '*') {
        callbacks.forEach(cb => cb(newValue, oldValue, path));
      }
    });
  }

  /**
   * Add middleware
   * @param {function} fn - Middleware function(path, newValue, oldValue) => boolean
   */
  use(fn) {
    this.middleware.push(fn);
  }

  /**
   * Initialize state with default values
   * @param {object} initialState
   */
  init(initialState) {
    this.state = JSON.parse(JSON.stringify(initialState));
  }

  /**
   * Reset state to initial values
   * @param {object} initialState
   */
  reset(initialState) {
    this.state = JSON.parse(JSON.stringify(initialState));
    this.notify('*', this.state, null);
  }

  /**
   * Get entire state (for debugging)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

// Initial state structure
const initialState = {
  // Current view
  currentView: 'timer',
  
  // Timer state
  timer: {
    mode: 'focus', // 'focus', 'short', 'long'
    status: 'idle', // 'idle', 'running', 'paused'
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    round: 1,
    currentTaskId: null
  },
  
  // Tasks
  tasks: [],
  folders: [],
  currentTask: null,
  taskFilter: {
    folder: 'all',
    status: 'all',
    search: ''
  },
  
  // User data
  user: {
    level: 1,
    xp: 0,
    totalMinutes: 0,
    totalPomodoros: 0,
    totalTasksCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: []
  },
  
  // Today's stats
  today: {
    date: new Date().toISOString().split('T')[0],
    minutes: 0,
    pomodoros: 0,
    tasksCompleted: []
  },
  
  // Settings
  settings: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    roundsUntilLongBreak: 4,
    soundEnabled: true,
    notificationEnabled: false,
    theme: 'dark',
    animationsEnabled: true
  },
  
  // UI state
  ui: {
    modalOpen: null,
    editingTask: null,
    selectedTaskId: null,
    isLoading: false
  }
};

// Singleton instance
export const store = new StateManager();
store.init(initialState);

export { initialState };

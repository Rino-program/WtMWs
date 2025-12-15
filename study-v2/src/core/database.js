/**
 * Database Manager - IndexedDB Wrapper
 * Study Support NG v1.0
 */

const DB_NAME = 'StudySupportNG';
const DB_VERSION = 1;

const STORES = {
  TASKS: 'tasks',
  POMODOROS: 'pomodoros',
  USER: 'user',
  FOLDERS: 'folders',
  DAILY_LOGS: 'dailyLogs',
  SETTINGS: 'settings'
};

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.readyPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB を開けませんでした:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('IndexedDB 接続成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createStores(db);
      };
    });
  }

  createStores(db) {
    // Tasks Store
    if (!db.objectStoreNames.contains(STORES.TASKS)) {
      const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
      taskStore.createIndex('folderId', 'folderId', { unique: false });
      taskStore.createIndex('status', 'status', { unique: false });
      taskStore.createIndex('priority', 'priority', { unique: false });
      taskStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Pomodoros Store
    if (!db.objectStoreNames.contains(STORES.POMODOROS)) {
      const pomodoroStore = db.createObjectStore(STORES.POMODOROS, { keyPath: 'id' });
      pomodoroStore.createIndex('taskId', 'taskId', { unique: false });
      pomodoroStore.createIndex('startTime', 'startTime', { unique: false });
      pomodoroStore.createIndex('date', 'date', { unique: false });
    }

    // User Store
    if (!db.objectStoreNames.contains(STORES.USER)) {
      db.createObjectStore(STORES.USER, { keyPath: 'id' });
    }

    // Folders Store
    if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
      const folderStore = db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
      folderStore.createIndex('order', 'order', { unique: false });
    }

    // Daily Logs Store
    if (!db.objectStoreNames.contains(STORES.DAILY_LOGS)) {
      db.createObjectStore(STORES.DAILY_LOGS, { keyPath: 'date' });
    }

    // Settings Store
    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
      db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
    }
  }

  async ensureReady() {
    if (!this.isReady) {
      await this.readyPromise;
    }
  }

  // Generic CRUD operations
  async add(storeName, data) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, value) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Export all data
  async exportData() {
    await this.ensureReady();
    const data = {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      tasks: await this.getAll(STORES.TASKS),
      pomodoros: await this.getAll(STORES.POMODOROS),
      user: await this.get(STORES.USER, 'user'),
      folders: await this.getAll(STORES.FOLDERS),
      dailyLogs: await this.getAll(STORES.DAILY_LOGS),
      settings: await this.get(STORES.SETTINGS, 'settings')
    };
    return data;
  }

  // Import data
  async importData(data) {
    await this.ensureReady();
    
    if (data.version > DB_VERSION) {
      throw new Error('インポートデータのバージョンが新しすぎます');
    }

    // Clear existing data
    await this.clear(STORES.TASKS);
    await this.clear(STORES.POMODOROS);
    await this.clear(STORES.FOLDERS);
    await this.clear(STORES.DAILY_LOGS);

    // Import new data
    if (data.tasks) {
      for (const task of data.tasks) {
        await this.add(STORES.TASKS, task);
      }
    }
    if (data.pomodoros) {
      for (const pomodoro of data.pomodoros) {
        await this.add(STORES.POMODOROS, pomodoro);
      }
    }
    if (data.folders) {
      for (const folder of data.folders) {
        await this.add(STORES.FOLDERS, folder);
      }
    }
    if (data.dailyLogs) {
      for (const log of data.dailyLogs) {
        await this.put(STORES.DAILY_LOGS, log);
      }
    }
    if (data.user) {
      await this.put(STORES.USER, data.user);
    }
    if (data.settings) {
      await this.put(STORES.SETTINGS, data.settings);
    }
  }

  // Reset all data
  async resetAll() {
    await this.ensureReady();
    for (const storeName of Object.values(STORES)) {
      await this.clear(storeName);
    }
  }
}

// Singleton instance
export const db = new DatabaseManager();
export { STORES };

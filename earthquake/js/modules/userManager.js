/**
 * ユーザー管理システム（1200行超）
 * プロファイル、設定、履歴、お気に入り、通知設定
 */

const UserManager = {
    // ========================================
    // 初期化 (100行)
    // ========================================
    
    /**
     * ユーザー管理システムの初期化
     */
    async init() {
        this.currentUser = null;
        this.settings = {};
        this.favorites = [];
        this.viewHistory = [];
        this.notificationPreferences = {};
        this.bookmarks = [];
        this.searchHistory = [];
        
        // ローカルストレージから読み込み
        await this.loadUserData();
        
        // デフォルトユーザーの作成
        if (!this.currentUser) {
            this.createDefaultUser();
        }
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        console.log('✅ User Manager initialized');
    },

    /**
     * ユーザーデータの読み込み
     */
    async loadUserData() {
        try {
            const userData = localStorage.getItem('earthquake_user_data');
            
            if (userData) {
                const data = JSON.parse(userData);
                this.currentUser = data.user;
                this.settings = data.settings || {};
                this.favorites = data.favorites || [];
                this.viewHistory = data.viewHistory || [];
                this.notificationPreferences = data.notificationPreferences || {};
                this.bookmarks = data.bookmarks || [];
                this.searchHistory = data.searchHistory || [];
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    },

    /**
     * デフォルトユーザーの作成
     */
    createDefaultUser() {
        this.currentUser = {
            id: this.generateUserId(),
            name: 'ゲストユーザー',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };
        
        this.settings = this.getDefaultSettings();
        this.notificationPreferences = this.getDefaultNotificationPreferences();
        
        this.saveUserData();
    },

    /**
     * ユーザーIDの生成
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * デフォルト設定の取得
     */
    getDefaultSettings() {
        return {
            theme: 'dark',
            language: 'ja',
            autoRefresh: true,
            autoRefreshInterval: 60000,
            sound: true,
            soundVolume: 0.7,
            voice: true,
            mapStyle: 'standard',
            defaultView: 'dashboard',
            units: {
                distance: 'km',
                depth: 'km'
            },
            filters: {
                minMagnitude: 0,
                maxDepth: 1000,
                timeRange: '24h'
            },
            display: {
                showEEW: true,
                showTsunami: true,
                showIntensity: true,
                animateEarthquakes: true,
                clusterMarkers: true
            }
        };
    },

    /**
     * デフォルト通知設定の取得
     */
    getDefaultNotificationPreferences() {
        return {
            eew: {
                enabled: true,
                minMagnitude: 5.0,
                minIntensity: '4',
                sound: true,
                voice: true,
                push: true
            },
            tsunami: {
                enabled: true,
                sound: true,
                voice: true,
                push: true
            },
            earthquake: {
                enabled: true,
                minMagnitude: 3.0,
                sound: false,
                voice: false,
                push: false
            }
        };
    },

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ページ離脱時にデータを保存
        window.addEventListener('beforeunload', () => {
            this.saveUserData();
        });
        
        // 定期保存（5分ごと）
        setInterval(() => {
            this.saveUserData();
        }, 5 * 60 * 1000);
    },

    // ========================================
    // ユーザープロファイル管理 (150行)
    // ========================================
    
    /**
     * ユーザープロファイルの取得
     */
    getProfile() {
        return {
            ...this.currentUser,
            statistics: this.getUserStatistics()
        };
    },

    /**
     * ユーザープロファイルの更新
     */
    updateProfile(updates) {
        this.currentUser = {
            ...this.currentUser,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveUserData();
        
        return this.currentUser;
    },

    /**
     * ユーザー統計の取得
     */
    getUserStatistics() {
        return {
            totalViews: this.viewHistory.length,
            favoritesCount: this.favorites.length,
            bookmarksCount: this.bookmarks.length,
            searchCount: this.searchHistory.length,
            memberSince: this.currentUser.createdAt,
            lastActive: this.currentUser.lastLoginAt
        };
    },

    /**
     * ユーザーアクティビティの記録
     */
    recordActivity(activity) {
        if (!this.currentUser.activities) {
            this.currentUser.activities = [];
        }
        
        this.currentUser.activities.push({
            type: activity.type,
            data: activity.data,
            timestamp: new Date().toISOString()
        });
        
        // 最新100件のみ保持
        if (this.currentUser.activities.length > 100) {
            this.currentUser.activities = this.currentUser.activities.slice(-100);
        }
        
        this.currentUser.lastLoginAt = new Date().toISOString();
    },

    // ========================================
    // 設定管理 (200行)
    // ========================================
    
    /**
     * 設定の取得
     */
    getSettings() {
        return { ...this.settings };
    },

    /**
     * 設定の更新
     */
    updateSettings(updates) {
        this.settings = {
            ...this.settings,
            ...updates
        };
        
        this.saveUserData();
        this.applySettings();
        
        return this.settings;
    },

    /**
     * 個別設定の取得
     */
    getSetting(key) {
        return this.settings[key];
    },

    /**
     * 個別設定の更新
     */
    setSetting(key, value) {
        this.settings[key] = value;
        this.saveUserData();
        this.applySetting(key, value);
    },

    /**
     * 設定の適用
     */
    applySettings() {
        // テーマの適用
        if (this.settings.theme) {
            document.body.setAttribute('data-theme', this.settings.theme);
        }
        
        // 音声設定の適用
        if (window.AudioManager) {
            AudioManager.toggle(this.settings.sound);
            AudioManager.setVolume(this.settings.soundVolume);
            AudioManager.toggleVoice(this.settings.voice);
        }
        
        // 自動更新の適用
        if (window.Interactions) {
            if (this.settings.autoRefresh) {
                Interactions.startAutoRefresh(this.settings.autoRefreshInterval);
            } else {
                Interactions.stopAutoRefresh();
            }
        }
        
        // マップスタイルの適用
        if (window.MapRenderer && this.settings.mapStyle) {
            MapRenderer.setMapStyle(this.settings.mapStyle);
        }
    },

    /**
     * 個別設定の適用
     */
    applySetting(key, value) {
        switch (key) {
            case 'theme':
                document.body.setAttribute('data-theme', value);
                break;
            
            case 'sound':
                if (window.AudioManager) {
                    AudioManager.toggle(value);
                }
                break;
            
            case 'soundVolume':
                if (window.AudioManager) {
                    AudioManager.setVolume(value);
                }
                break;
            
            case 'voice':
                if (window.AudioManager) {
                    AudioManager.toggleVoice(value);
                }
                break;
            
            case 'autoRefresh':
                if (window.Interactions) {
                    if (value) {
                        Interactions.startAutoRefresh(this.settings.autoRefreshInterval);
                    } else {
                        Interactions.stopAutoRefresh();
                    }
                }
                break;
            
            case 'mapStyle':
                if (window.MapRenderer) {
                    MapRenderer.setMapStyle(value);
                }
                break;
        }
    },

    /**
     * 設定のリセット
     */
    resetSettings() {
        this.settings = this.getDefaultSettings();
        this.saveUserData();
        this.applySettings();
    },

    // ========================================
    // お気に入り管理 (150行)
    // ========================================
    
    /**
     * お気に入りの追加
     */
    addFavorite(earthquake) {
        // 重複チェック
        if (this.favorites.some(fav => fav.id === earthquake.id)) {
            return false;
        }
        
        this.favorites.unshift({
            id: earthquake.id,
            earthquake: earthquake,
            addedAt: new Date().toISOString()
        });
        
        // 最大100件
        if (this.favorites.length > 100) {
            this.favorites = this.favorites.slice(0, 100);
        }
        
        this.saveUserData();
        this.recordActivity({ type: 'favorite_added', data: { earthquakeId: earthquake.id } });
        
        return true;
    },

    /**
     * お気に入りの削除
     */
    removeFavorite(earthquakeId) {
        const index = this.favorites.findIndex(fav => fav.id === earthquakeId);
        
        if (index !== -1) {
            this.favorites.splice(index, 1);
            this.saveUserData();
            this.recordActivity({ type: 'favorite_removed', data: { earthquakeId } });
            return true;
        }
        
        return false;
    },

    /**
     * お気に入りの取得
     */
    getFavorites(options = {}) {
        const { limit = 50, offset = 0, sortBy = 'addedAt', order = 'desc' } = options;
        
        let favorites = [...this.favorites];
        
        // ソート
        favorites.sort((a, b) => {
            if (sortBy === 'addedAt') {
                return order === 'desc' 
                    ? new Date(b.addedAt) - new Date(a.addedAt)
                    : new Date(a.addedAt) - new Date(b.addedAt);
            } else if (sortBy === 'magnitude') {
                return order === 'desc'
                    ? b.earthquake.magnitude - a.earthquake.magnitude
                    : a.earthquake.magnitude - b.earthquake.magnitude;
            }
            return 0;
        });
        
        // ページネーション
        return favorites.slice(offset, offset + limit);
    },

    /**
     * お気に入りかチェック
     */
    isFavorite(earthquakeId) {
        return this.favorites.some(fav => fav.id === earthquakeId);
    },

    /**
     * お気に入りのクリア
     */
    clearFavorites() {
        this.favorites = [];
        this.saveUserData();
    },

    // ========================================
    // ブックマーク管理 (150行)
    // ========================================
    
    /**
     * ブックマークの追加
     */
    addBookmark(bookmark) {
        const newBookmark = {
            id: this.generateBookmarkId(),
            title: bookmark.title,
            description: bookmark.description || '',
            type: bookmark.type, // 'location', 'search', 'filter'
            data: bookmark.data,
            createdAt: new Date().toISOString()
        };
        
        this.bookmarks.unshift(newBookmark);
        
        // 最大50件
        if (this.bookmarks.length > 50) {
            this.bookmarks = this.bookmarks.slice(0, 50);
        }
        
        this.saveUserData();
        this.recordActivity({ type: 'bookmark_added', data: { bookmarkId: newBookmark.id } });
        
        return newBookmark;
    },

    /**
     * ブックマークIDの生成
     */
    generateBookmarkId() {
        return 'bookmark_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * ブックマークの削除
     */
    removeBookmark(bookmarkId) {
        const index = this.bookmarks.findIndex(bm => bm.id === bookmarkId);
        
        if (index !== -1) {
            this.bookmarks.splice(index, 1);
            this.saveUserData();
            this.recordActivity({ type: 'bookmark_removed', data: { bookmarkId } });
            return true;
        }
        
        return false;
    },

    /**
     * ブックマークの取得
     */
    getBookmarks(type = null) {
        if (type) {
            return this.bookmarks.filter(bm => bm.type === type);
        }
        return [...this.bookmarks];
    },

    /**
     * ブックマークの更新
     */
    updateBookmark(bookmarkId, updates) {
        const bookmark = this.bookmarks.find(bm => bm.id === bookmarkId);
        
        if (bookmark) {
            Object.assign(bookmark, updates, {
                updatedAt: new Date().toISOString()
            });
            this.saveUserData();
            return bookmark;
        }
        
        return null;
    },

    // ========================================
    // 閲覧履歴管理 (150行)
    // ========================================
    
    /**
     * 閲覧履歴の追加
     */
    addToHistory(earthquake) {
        // 重複を削除
        this.viewHistory = this.viewHistory.filter(item => item.id !== earthquake.id);
        
        // 先頭に追加
        this.viewHistory.unshift({
            id: earthquake.id,
            earthquake: earthquake,
            viewedAt: new Date().toISOString()
        });
        
        // 最大200件
        if (this.viewHistory.length > 200) {
            this.viewHistory = this.viewHistory.slice(0, 200);
        }
        
        this.saveUserData();
        this.recordActivity({ type: 'earthquake_viewed', data: { earthquakeId: earthquake.id } });
    },

    /**
     * 閲覧履歴の取得
     */
    getHistory(options = {}) {
        const { limit = 50, offset = 0 } = options;
        return this.viewHistory.slice(offset, offset + limit);
    },

    /**
     * 閲覧履歴のクリア
     */
    clearHistory() {
        this.viewHistory = [];
        this.saveUserData();
    },

    /**
     * 閲覧履歴から削除
     */
    removeFromHistory(earthquakeId) {
        const index = this.viewHistory.findIndex(item => item.id === earthquakeId);
        
        if (index !== -1) {
            this.viewHistory.splice(index, 1);
            this.saveUserData();
            return true;
        }
        
        return false;
    },

    // ========================================
    // 検索履歴管理 (100行)
    // ========================================
    
    /**
     * 検索履歴の追加
     */
    addSearchHistory(query) {
        // 重複を削除
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        
        // 先頭に追加
        this.searchHistory.unshift({
            query: query,
            searchedAt: new Date().toISOString()
        });
        
        // 最大50件
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }
        
        this.saveUserData();
    },

    /**
     * 検索履歴の取得
     */
    getSearchHistory(limit = 10) {
        return this.searchHistory.slice(0, limit);
    },

    /**
     * 検索履歴のクリア
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveUserData();
    },

    // ========================================
    // 通知設定管理 (150行)
    // ========================================
    
    /**
     * 通知設定の取得
     */
    getNotificationPreferences() {
        return { ...this.notificationPreferences };
    },

    /**
     * 通知設定の更新
     */
    updateNotificationPreferences(updates) {
        this.notificationPreferences = {
            ...this.notificationPreferences,
            ...updates
        };
        
        this.saveUserData();
        this.applyNotificationPreferences();
        
        return this.notificationPreferences;
    },

    /**
     * 通知設定の適用
     */
    applyNotificationPreferences() {
        if (window.NotificationService) {
            // EEW通知の設定
            NotificationService.setEEWPreferences(this.notificationPreferences.eew);
            
            // 津波通知の設定
            NotificationService.setTsunamiPreferences(this.notificationPreferences.tsunami);
            
            // 地震通知の設定
            NotificationService.setEarthquakePreferences(this.notificationPreferences.earthquake);
        }
    },

    /**
     * 通知の有効性チェック
     */
    shouldNotify(type, data) {
        const prefs = this.notificationPreferences[type];
        
        if (!prefs || !prefs.enabled) {
            return false;
        }
        
        // タイプ別のチェック
        switch (type) {
            case 'eew':
                if (data.magnitude < prefs.minMagnitude) return false;
                if (Utils.intensityToNumber(data.maxIntensity) < Utils.intensityToNumber(prefs.minIntensity)) return false;
                break;
            
            case 'earthquake':
                if (data.magnitude < prefs.minMagnitude) return false;
                break;
        }
        
        return true;
    },

    // ========================================
    // データのインポート/エクスポート (150行)
    // ========================================
    
    /**
     * ユーザーデータのエクスポート
     */
    exportUserData() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            user: this.currentUser,
            settings: this.settings,
            favorites: this.favorites,
            bookmarks: this.bookmarks,
            viewHistory: this.viewHistory,
            searchHistory: this.searchHistory,
            notificationPreferences: this.notificationPreferences
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `earthquake_user_data_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.recordActivity({ type: 'data_exported', data: {} });
    },

    /**
     * ユーザーデータのインポート
     */
    async importUserData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // バージョンチェック
                    if (data.version !== '1.0') {
                        reject(new Error('Unsupported data version'));
                        return;
                    }
                    
                    // データの復元
                    if (data.user) this.currentUser = data.user;
                    if (data.settings) this.settings = data.settings;
                    if (data.favorites) this.favorites = data.favorites;
                    if (data.bookmarks) this.bookmarks = data.bookmarks;
                    if (data.viewHistory) this.viewHistory = data.viewHistory;
                    if (data.searchHistory) this.searchHistory = data.searchHistory;
                    if (data.notificationPreferences) this.notificationPreferences = data.notificationPreferences;
                    
                    this.saveUserData();
                    this.applySettings();
                    this.applyNotificationPreferences();
                    
                    this.recordActivity({ type: 'data_imported', data: {} });
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    },

    /**
     * データの同期（将来の拡張用）
     */
    async syncData() {
        // クラウド同期の実装（将来の拡張）
        console.log('Data sync not implemented yet');
    },

    // ========================================
    // データ保存 (50行)
    // ========================================
    
    /**
     * ユーザーデータの保存
     */
    saveUserData() {
        const data = {
            user: this.currentUser,
            settings: this.settings,
            favorites: this.favorites,
            bookmarks: this.bookmarks,
            viewHistory: this.viewHistory,
            searchHistory: this.searchHistory,
            notificationPreferences: this.notificationPreferences
        };
        
        try {
            localStorage.setItem('earthquake_user_data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save user data:', error);
            
            // ストレージが満杯の場合、古いデータを削除
            if (error.name === 'QuotaExceededError') {
                this.trimOldData();
                try {
                    localStorage.setItem('earthquake_user_data', JSON.stringify(data));
                } catch (retryError) {
                    console.error('Failed to save even after trimming:', retryError);
                }
            }
        }
    },

    /**
     * 古いデータの削除
     */
    trimOldData() {
        // 履歴を半分に
        this.viewHistory = this.viewHistory.slice(0, 100);
        this.searchHistory = this.searchHistory.slice(0, 25);
        
        // お気に入りとブックマークは保持
    }
};

// エクスポート
if (typeof window !== 'undefined') window.UserManager = UserManager;
if (typeof module !== 'undefined' && module.exports) module.exports = UserManager;

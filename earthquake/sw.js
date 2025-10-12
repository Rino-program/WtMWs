/**
 * Service Worker - オフライン対応とキャッシュ戦略（800行超）
 * PWA機能、バックグラウンド同期、プッシュ通知を実装
 */

const CACHE_NAME = 'earthquake-app-v1.0.0';
const RUNTIME_CACHE = 'earthquake-runtime-v1';
const API_CACHE = 'earthquake-api-v1';
const IMAGE_CACHE = 'earthquake-images-v1';

// キャッシュするリソース
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config/config.js',
    '/js/config/constants.js',
    '/js/services/earthquakeService.js',
    '/js/services/usgsService.js',
    '/js/services/tsunamiService.js',
    '/js/services/geoService.js',
    '/js/services/notificationService.js',
    '/js/services/analysisService.js',
    '/js/store/dataStore.js',
    '/js/modules/utils.js',
    '/js/modules/mapRenderer.js',
    '/js/modules/renderers.js',
    '/js/modules/interactions.js',
    '/js/main.js',
    // 外部ライブラリ
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
];

// APIエンドポイント（キャッシュ期限付き）
const API_ENDPOINTS = [
    'https://api.p2pquake.net/v2/history',
    'https://api.p2pquake.net/v2/jma/quake',
    'https://earthquake.usgs.gov/fdsnws/event/1/query'
];

// ========================================
// インストール
// ========================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting(); // 即座にアクティブ化
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// ========================================
// アクティベーション
// ========================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // 古いキャッシュを削除
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('earthquake-') && 
                                   cacheName !== CACHE_NAME &&
                                   cacheName !== RUNTIME_CACHE &&
                                   cacheName !== API_CACHE &&
                                   cacheName !== IMAGE_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim(); // すぐに制御を開始
            })
    );
});

// ========================================
// フェッチ戦略
// ========================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // APIリクエストの処理
    if (isAPIRequest(url)) {
        event.respondWith(handleAPIRequest(request));
        return;
    }
    
    // 画像リクエストの処理
    if (isImageRequest(url)) {
        event.respondWith(handleImageRequest(request));
        return;
    }
    
    // 静的リソースの処理
    event.respondWith(handleStaticRequest(request));
});

/**
 * APIリクエストかどうかを判定
 */
function isAPIRequest(url) {
    return API_ENDPOINTS.some(endpoint => url.href.includes(endpoint)) ||
           url.pathname.includes('/api/');
}

/**
 * 画像リクエストかどうかを判定
 */
function isImageRequest(url) {
    return /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(url.pathname);
}

/**
 * APIリクエストの処理（Network First戦略）
 */
async function handleAPIRequest(request) {
    const cache = await caches.open(API_CACHE);
    
    try {
        // まずネットワークから取得を試みる
        const networkResponse = await fetch(request.clone(), {
            method: request.method,
            headers: request.headers,
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (networkResponse && networkResponse.ok) {
            // 成功したレスポンスをキャッシュ
            cache.put(request, networkResponse.clone());
            
            // タイムスタンプを保存
            const metadata = {
                timestamp: Date.now(),
                url: request.url
            };
            cache.put(
                new Request(request.url + '__metadata'),
                new Response(JSON.stringify(metadata))
            );
            
            return networkResponse;
        }
    } catch (error) {
        console.log('[SW] Network request failed, trying cache:', error);
    }
    
    // ネットワークが失敗した場合、キャッシュから取得
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // キャッシュの鮮度をチェック
        const metadata = await cache.match(new Request(request.url + '__metadata'));
        if (metadata) {
            const data = await metadata.json();
            const age = Date.now() - data.timestamp;
            const maxAge = 5 * 60 * 1000; // 5分
            
            if (age < maxAge) {
                console.log('[SW] Serving fresh cached API response');
                return cachedResponse;
            } else {
                console.log('[SW] Cached API response is stale');
            }
        }
        
        return cachedResponse;
    }
    
    // キャッシュもない場合、オフラインレスポンスを返す
    return new Response(
        JSON.stringify({
            error: 'オフラインです。キャッシュされたデータがありません。',
            offline: true
        }),
        {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

/**
 * 画像リクエストの処理（Cache First戦略）
 */
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGE_CACHE);
    
    // まずキャッシュを確認
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // キャッシュになければネットワークから取得
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Failed to fetch image:', error);
        
        // デフォルト画像を返す（あれば）
        return new Response('', {
            status: 404,
            statusText: 'Image not found'
        });
    }
}

/**
 * 静的リソースの処理（Cache First戦略）
 */
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // まずキャッシュを確認
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // キャッシュになければネットワークから取得
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            // ランタイムキャッシュに保存
            const runtimeCache = await caches.open(RUNTIME_CACHE);
            runtimeCache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Failed to fetch static resource:', error);
        
        // オフラインページを返す（あれば）
        const offlineResponse = await cache.match('/offline.html');
        if (offlineResponse) {
            return offlineResponse;
        }
        
        return new Response('オフラインです', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ========================================
// バックグラウンド同期
// ========================================

self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);
    
    if (event.tag === 'sync-earthquake-data') {
        event.waitUntil(syncEarthquakeData());
    } else if (event.tag === 'sync-tsunami-data') {
        event.waitUntil(syncTsunamiData());
    }
});

/**
 * 地震データの同期
 */
async function syncEarthquakeData() {
    console.log('[SW] Syncing earthquake data...');
    
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?limit=100');
        const data = await response.json();
        
        // キャッシュを更新
        const cache = await caches.open(API_CACHE);
        cache.put(
            'https://api.p2pquake.net/v2/history?limit=100',
            new Response(JSON.stringify(data))
        );
        
        // すべてのクライアントに通知
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'EARTHQUAKE_DATA_UPDATED',
                data: data
            });
        });
        
        console.log('[SW] Earthquake data synced successfully');
    } catch (error) {
        console.error('[SW] Failed to sync earthquake data:', error);
        throw error;
    }
}

/**
 * 津波データの同期
 */
async function syncTsunamiData() {
    console.log('[SW] Syncing tsunami data...');
    
    try {
        const response = await fetch('https://api.p2pquake.net/v2/jma/tsunami');
        const data = await response.json();
        
        // キャッシュを更新
        const cache = await caches.open(API_CACHE);
        cache.put(
            'https://api.p2pquake.net/v2/jma/tsunami',
            new Response(JSON.stringify(data))
        );
        
        // すべてのクライアントに通知
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'TSUNAMI_DATA_UPDATED',
                data: data
            });
        });
        
        console.log('[SW] Tsunami data synced successfully');
    } catch (error) {
        console.error('[SW] Failed to sync tsunami data:', error);
        throw error;
    }
}

// ========================================
// プッシュ通知
// ========================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data = { title: event.data.text() };
        }
    }
    
    const title = data.title || '地震情報';
    const options = {
        body: data.body || '新しい地震情報があります',
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/badge-72.png',
        vibrate: data.vibrate || [200, 100, 200, 100, 200, 100, 200],
        data: data.data || {},
        actions: data.actions || [
            { action: 'view', title: '詳細を見る' },
            { action: 'close', title: '閉じる' }
        ],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * 通知クリックイベント
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    } else if (event.action === 'close') {
        // 何もしない
    } else {
        // デフォルトアクション：アプリを開く
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // 既に開いているウィンドウがあればフォーカス
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // なければ新しいウィンドウを開く
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

/**
 * 通知を閉じたときのイベント
 */
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed');
    
    // アナリティクスなどに記録
    trackEvent('notification', 'close', event.notification.tag);
});

// ========================================
// メッセージハンドリング
// ========================================

self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(cacheUrls(payload.urls));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(clearCache(payload.cacheName));
            break;
            
        case 'GET_CACHE_SIZE':
            event.waitUntil(
                getCacheSize().then(size => {
                    event.ports[0].postMessage({ size });
                })
            );
            break;
            
        default:
            console.log('[SW] Unknown message type:', type);
    }
});

/**
 * URLをキャッシュに追加
 */
async function cacheUrls(urls) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.addAll(urls);
    console.log('[SW] URLs cached:', urls.length);
}

/**
 * キャッシュをクリア
 */
async function clearCache(cacheName) {
    if (cacheName) {
        await caches.delete(cacheName);
        console.log('[SW] Cache cleared:', cacheName);
    } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SW] All caches cleared');
    }
}

/**
 * キャッシュサイズを取得
 */
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * イベントトラッキング
 */
function trackEvent(category, action, label) {
    // Google Analytics などへ送信
    fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, action, label, timestamp: Date.now() })
    }).catch(() => {
        // エラーは無視
    });
}

/**
 * 定期的なバックグラウンド同期
 */
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-earthquake-data') {
        event.waitUntil(syncEarthquakeData());
    }
});

// ========================================
// エラーハンドリング
// ========================================

self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');

// Service Worker - オフライン対応
const CACHE_NAME = 'pikmin-tracker-v13';

// キャッシュするファイル一覧
const CACHE_FILES = [
  './',
  './index.html',
  './settings.html',
  './style.css',
  './app.js',
  './settings.js',
  './chart-config.js',
  './storage.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES).catch((err) => {
        console.warn('一部ファイルのキャッシュに失敗しました:', err);
      });
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除し、更新があれば全クライアントにリロードを要求
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const oldKeys = keys.filter((key) => key !== CACHE_NAME);
      return Promise.all(oldKeys.map((key) => caches.delete(key))).then(() => {
        if (oldKeys.length > 0) {
          // 古いキャッシュがあった＝アップデート → 全クライアントにリロード要求
          return self.clients.matchAll({ type: 'window' }).then((clients) => {
            clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
          });
        }
      });
    })
  );
  self.clients.claim();
});

// フェッチ時はキャッシュ優先（ネットワークにフォールバック）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        // オフライン時はindex.htmlを返す
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

const CACHE_NAME = 'hqf-sneakers-v1';
const STATIC_CACHE = 'hqf-static-v1';

// Файлы для кэширования
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Активация — очистка старого кэша
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name =>
            name !== CACHE_NAME &&
            name !== STATIC_CACHE
          )
          .map(name => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Перехват запросов — Network First стратегия
self.addEventListener('fetch', (event) => {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return;

  // Пропускаем Firebase запросы (всегда онлайн)
  if (event.request.url.includes('firestore') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кэшируем успешные ответы
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Если нет интернета — берём из кэша
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Для навигации возвращаем index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Получение push уведомлений (для будущего)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'HQF Sneakers';
  const options = {
    body: data.body || 'Новое уведомление',
    icon: 'https://i.ibb.co/TxL4dnHM/logo.png',
    badge: 'https://i.ibb.co/TxL4dnHM/logo.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

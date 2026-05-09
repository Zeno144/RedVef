const CACHE_NAME = 'redverifier-v3';
const SHELL_FILES = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('api.anthropic.com') ||
      url.includes('api.tavily.com') ||
      url.includes('workers.dev')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

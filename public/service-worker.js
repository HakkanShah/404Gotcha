self.addEventListener('install', event => {
	self.skipWaiting();
});

self.addEventListener('activate', event => {
	self.clients.claim();
});

// Optional: basic fetch passthrough (no caching)
self.addEventListener('fetch', () => {});
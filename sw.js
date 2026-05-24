self.addEventListener('install', function(e) {
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    self.registration.unregister()
        .then(function() {
            return self.clients.claim();
        })
        .then(function() {
            console.log('[Service Worker] Old ad service worker successfully unregistered and cleaned up.');
        });
});

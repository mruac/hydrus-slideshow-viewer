const CACHE_NAME = 'hsv_cache';
const URLS_TO_CACHE = [
    './index.html',
    './javascripts/anvaka_panzoom.js',
    './javascripts/ui_functions.js',
    './javascripts/file_functions.js',
    './javascripts/tag_functions.js',
    './javascripts/main.js',
    './stylesheets/style.css',
    './javascripts/jquery-3.7.1.min.js',
    './stylesheets/bootstrap.min.css',
    './javascripts/bootstrap.bundle.min.js'
];

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
            })
        })
    );
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
});


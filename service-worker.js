const CACHE_NAME = 'hsv_cache';
const URLS_TO_CACHE = [
    '/index.html',
    '/javascripts/jquery-3.5.1.js',
    '/javascripts/anvaka_panzoom.js',
    '/javascripts/ui_functions.js',
    '/javascripts/file_functions.js',
    '/javascripts/tag_functions.js',
    '/javascripts/main.js',
    '/stylesheets/style.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css'
];

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(()=>{
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


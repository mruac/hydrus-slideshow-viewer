const CACHE_NAME = 'vid-voter';
const URLS_TO_CACHE = [
    // "/offline.html",
    // "/css/bootstrap.min.css",
    // "/css/cover.css",
    // "/image/cover.jpg
    "index.html", 
    "icon.png",
    "./javascripts/jquery-3.5.1.js",
    "/javascripts/anvaka_panzoom.js",
    "./javascripts/ui_functions.js",
    "./javascripts/file_functions.js",
    "./javascripts/tag_functions.js",
    "./javascripts/main.js",
    "./stylesheets/style.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css"
];

self.addEventListener("fetch", function (event) {
    console.log("Fetch request for:", event.request.url);
    event.respondWith(
        fetch(event.request).catch(function () {
    //         return new Response(
    //             `
    // <html>
    // <body>
    // <style>
    // body {text-align: center; background-color: #333; color: #eee;}
    // </style>
    // <h1>Video Voter</h1>
    // <p>There seems to be a problem with your connection.</p>
    // </body>
    // </html>`,
    //             { headers: { "Content-Type": "text/html" } }
    //         );
    return caches.match(event.request).then(function(response) {
        if (response) {
            return response;
        } else if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("index.html");
        }
    });
        })
    );
});

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
});

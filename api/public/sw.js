const CACHE = "standup-v1";
const PRECACHE = ["/", "/css/main.css", "/js/app.js", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE).then(cache =>
            Promise.allSettled(PRECACHE.map(url =>
                cache.add(url).catch(() => {
                    // Individual resource failed — skip it, don't abort install
                })
            ))
        )
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network-first for navigation, cache fallback for assets
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Don't intercept API calls
    if (url.pathname.startsWith("/auth") ||
        url.pathname.startsWith("/plans") ||
        url.pathname.startsWith("/push")) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(res => {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(event.request, clone));
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});

// Push notifications
self.addEventListener("push", (event) => {
    if (!event.data) return;

    const data = event.data.json();

    event.waitUntil(
        self.registration.showNotification(data.title || "Daily Standup", {
            body: data.body || "",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            data: { url: "/" },
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(list => {
            const existing = list.find(c => c.url.includes(self.location.origin));
            if (existing) return existing.focus();
            return clients.openWindow("/today");
        })
    );
});

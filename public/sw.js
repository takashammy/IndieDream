const VERSION = "indie-dream-shell-v8";
const SHELL = [
  "/",
  "/offline.html",
  "/favicon.svg",
  "/icon-180.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/media/inner-soul-logo.png",
];
const STATIC = /\.(?:js|css|mjs|woff2?|png|jpg|jpeg|svg|webp|gif|ico|json)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function skip(url) {
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/__grok/")) return true;
  return false;
}

async function fromCache(request) {
  const cache = await caches.open(VERSION);
  return cache.match(request);
}

async function putCache(request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(VERSION);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    return putCache(request, fresh);
  } catch {
    const cached = await fromCache(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const shell = await fromCache("/");
      if (shell) return shell;
      const offline = await fromCache("/offline.html");
      if (offline) return offline;
    }
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(request) {
  const cached = await fromCache(request);
  const fetching = fetch(request)
    .then((fresh) => putCache(request, fresh))
    .catch(() => cached);
  return cached || fetching;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (skip(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (STATIC.test(url.pathname) || url.pathname.startsWith("/assets/")) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "Dreamin' Indie", body: "Someone new registered.", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client && url) client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

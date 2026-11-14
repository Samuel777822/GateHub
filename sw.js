// GateHub service worker — lets the app open even when the local server is off.
const VERSION = "gh-v14";
const SHELL = [
  "./", "index.html", "config.js", "css/app.css", "js/app.js", "js/fx.js", "js/content.js", "js/tests.js", "js/practice.js", "js/guide.js", "js/learn.js", "assets/brand/claude-icon.png",
  "manifest.webmanifest", "assets/emblem.svg", "assets/wallpaper-mobile.webp",
  "assets/techgates-lockup-gold.svg", "assets/techgates-lockup-ink.svg", "assets/techgates-mark-gold.svg", "assets/fonts/GateHubDisplay.woff2",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-32.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const cdn = /(^|\.)(jsdelivr\.net|googleapis\.com|gstatic\.com)$/.test(url.hostname);
  if (!sameOrigin && !cdn) return;

  // Question images: cache-first (they never change)
  if (sameOrigin && url.pathname.includes("/data/img/")) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
    }));
    return;
  }
  // CDN libraries & fonts: stale-while-revalidate
  if (cdn) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // App files: network-first so edits show up, cache as fallback
  e.respondWith(fetch(req).then((res) => {
    if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});

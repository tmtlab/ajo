// Adashe — service worker
// Caches ONLY the static app shell (HTML/manifest/icons) so the app installs
// and opens instantly. It deliberately does NOT touch RPC calls, WharfKit
// session traffic, or any cross-origin request — blockchain state must
// always come from the network, never from a cache. Any request that isn't
// a same-origin GET for one of the shell files below just passes straight
// through untouched.

const CACHE_VERSION = "v1";
const CACHE_NAME = `adashe-shell-${CACHE_VERSION}`;

const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only ever intervene for same-origin GET requests to our own shell files.
  // Everything else (RPC nodes, WharfKit, fonts, any POST) goes straight to
  // the network exactly as if no service worker were installed.
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isShellFile = SHELL_FILES.some((f) => url.pathname.endsWith(f.replace("./", "")));
  if (!isShellFile) return;

  // Network-first for the HTML itself, so a redeployed contract/UI update
  // is picked up on next load instead of being stuck on a stale cached
  // version; falls back to cache only if offline.
  if (url.pathname.endsWith("testthecontr-console.html") || url.pathname === "/" ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for icons/manifest — they rarely change and load instantly.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

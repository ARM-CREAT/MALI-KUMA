// KUMA — Service Worker
// • Page : réseau d'abord (les mises à jour déployées sur Vercel arrivent tout de suite),
//   copie en cache pour ouvrir l'app hors-ligne.
// • SDK Firebase (URLs versionnées) et icônes : cache d'abord (économie de data 2G/3G).
// • Les échanges temps réel avec Firebase ne sont jamais interceptés.
const CACHE = "kuma-v3";
const CORE = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigation : réseau d'abord, repli sur la copie en cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  const isFirebaseSdk = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  const isSameOrigin = url.origin === self.location.origin;
  if (!isFirebaseSdk && !isSameOrigin) return; // Firestore, Auth, Storage, reCAPTCHA : pas d'interception

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      // Réponse immédiate depuis le cache si possible ; la copie est rafraîchie en arrière-plan
      return cached || network;
    })
  );
});

// Clic sur une notification : ramène l'app au premier plan
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) { if ("focus" in client) return client.focus(); }
      return self.clients.openWindow("./");
    })
  );
});

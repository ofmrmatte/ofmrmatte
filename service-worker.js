// Cache network-first: installing a new ZIP must not leave the previous app stuck.
const CACHE = 'mf-stream-shell-v4-2-1';
const SHELL = ['/', '/index.html', '/src/styles.css', '/src/app.js', '/src/access-ui.mjs', '/vendor/gsap.js', '/vendor/plyr.js', '/vendor/plyr.css', '/vendor/plyr.svg', '/src/favicon.svg', '/src/xtream.mjs', '/src/content.mjs', '/src/playback.mjs', '/src/library.css', '/src/title-sheet.css', '/src/episode-tray.css', '/src/mobile.css', '/src/mobile.mjs', '/manifest.webmanifest', '/assets/icon-192.png', '/assets/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k.startsWith('mf-stream-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method!=='GET' || new URL(event.request.url).origin!==self.location.origin) return;
  const url=new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || !SHELL.includes(url.pathname)) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try {
      const fresh=await fetch(event.request,{cache:'no-store'});
      if (fresh.ok) await cache.put(event.request,fresh.clone());
      return fresh;
    } catch {
      return await cache.match(event.request) || Response.error();
    }
  })());
});

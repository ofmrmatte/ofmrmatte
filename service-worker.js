// Cache network-first: installing a new ZIP must not leave the previous app stuck.
const CACHE = 'scene-play-shell-v5-4-1';
const SHELL = ['/', '/index.html', '/src/styles.css', '/src/app.js', '/src/access-ui.mjs', '/vendor/gsap.js', '/vendor/plyr.js', '/vendor/plyr.css', '/vendor/plyr.svg', '/src/favicon.svg', '/src/xtream.mjs', '/src/content.mjs', '/src/playback.mjs', '/src/intro.mjs', '/src/library.css', '/src/title-sheet.css', '/src/episode-tray.css', '/src/mobile.css', '/src/mobile.mjs', '/src/highlights.mjs', '/src/highlights.css', '/src/scene.css', '/src/scene-ui.mjs', '/src/offline.mjs', '/src/offline-store.js', '/assets/scene-play.svg', '/src/discovery.css', '/src/hero-preview.mjs', '/manifest.webmanifest', '/assets/icon-192.png', '/assets/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>(k.startsWith('mf-stream-shell-')||k.startsWith('scene-play-shell-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
importScripts('/src/offline-store.js');
self.addEventListener('fetch', event => {
  const req=event.request,url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  const match=/^\/offline-media\/([^/]+)\/(vod|series)\/(\d{1,15})$/.exec(url.pathname);
  if(match&&(req.method==='GET'||req.method==='HEAD')){
    event.respondWith((async()=>{
      try{
        const scope=decodeURIComponent(match[1]);
        if(scope.length>500)return new Response('Identificação offline inválida.',{status:400});
        return await self.SceneOfflineStore.serve(req,scope,match[2]+'/'+match[3]);
      }catch{return new Response('Arquivo offline indisponível no dispositivo.',{status:503});}
    })());
    return;
  }
  if (req.method!=='GET') return;
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

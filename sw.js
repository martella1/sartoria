/* Atelier Tablet offline shell. This service worker caches only application code,
   NEVER clients, artworks, image fabrics or data backups. Data lives in IndexedDB. */
const CACHE_NAME = 'atelier-tablet-shell-' + /* BUILD_ID */ "30633aa43e1e";
const PRECACHE = /* BUILD_ASSETS */ ["./assets/index-CW3Drx25.js","./assets/index-zaa4rV99.css","./icons/atelier-192.png","./icons/atelier-512.png","./index.html","./manifest.webmanifest"];
const APP_SCOPE = self.registration.scope;
self.addEventListener('install', event=>{
  event.waitUntil((async()=>{
    if(PRECACHE.length){
      const cache=await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE.map(path=>new URL(path,APP_SCOPE).href));
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('atelier-tablet-shell-')&&n!==CACHE_NAME).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.href.startsWith(APP_SCOPE))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try {
        const response=await fetch(request);
        if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(new URL('./index.html',APP_SCOPE).href,response.clone());}
        return response;
      } catch {
        const cached=await caches.match(request)||await caches.match(new URL('./index.html',APP_SCOPE).href);
        return cached||new Response('Atelier non ancora installato. Collegati una volta a Internet e riapri.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());return;
  }
  // Solo risorse statiche sotto il percorso dell'app: nessuna API remota.
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok && ['script','style','font','image','manifest'].includes(request.destination)){
      const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());
    }
    return response;
  })());
});

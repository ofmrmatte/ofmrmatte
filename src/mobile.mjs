export function mobilePlaybackViewport(win=window){return win.matchMedia('(max-width:600px), (max-width:1100px) and (pointer:coarse)').matches;}

// Request fullscreen directly in the episode click, before any metadata/network await.
export function enterMobilePlayback(layout,{doc=document,orientation=screen.orientation,win=globalThis.window}={}){
  layout.classList.add('mobile-landscape');
  const portrait=!!win&&win.innerHeight>win.innerWidth;
  const fallback=()=>{layout.classList.add('is-full-window');if(portrait)layout.classList.add('is-portrait-player');};
  let request;
  try{request=doc.fullscreenElement===layout?Promise.resolve():layout.requestFullscreen?layout.requestFullscreen():Promise.reject(new Error('Fullscreen unavailable'));}
  catch(error){request=Promise.reject(error);}
  return Promise.resolve(request).catch(()=>{if(layout.classList.contains('mobile-landscape'))fallback();}).then(async()=>{
    if(!layout.classList.contains('mobile-landscape')){if(doc.fullscreenElement===layout)await doc.exitFullscreen?.();return;}
    try{if(typeof orientation?.lock!=='function')throw new Error('Orientation lock unavailable');await orientation.lock('landscape');if(!layout.classList.contains('mobile-landscape'))orientation?.unlock?.();}catch{
      if(layout.classList.contains('mobile-landscape')){fallback();if(doc.fullscreenElement===layout)await doc.exitFullscreen?.();}
    }
  });
}
export function unlockMobilePlayback(layout,orientation=screen.orientation){layout.classList.remove('mobile-landscape');layout.classList.remove('is-portrait-player');try{orientation?.unlock?.();}catch{}}
export function setupVisualViewport(win=window,doc=document){
  const update=()=>{doc.documentElement.style.setProperty('--visual-height',`${Math.round(win.visualViewport?.height||win.innerHeight)}px`);const layout=doc.querySelector('.mobile-landscape.is-full-window');if(layout)layout.classList.toggle('is-portrait-player',win.innerHeight>win.innerWidth);};
  update();win.visualViewport?.addEventListener('resize',update);win.addEventListener('resize',update);
}

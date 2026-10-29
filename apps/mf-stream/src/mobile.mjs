export function mobilePlaybackViewport(win=window){return win.matchMedia('(pointer:coarse), (max-width:600px)').matches;}
export async function enterNativePlayback(video,{doc=document,orientation=globalThis.screen?.orientation}={}){
  video.controls=true;video.playsInline=false;video.removeAttribute('playsinline');video.removeAttribute('webkit-playsinline');
  if(video.webkitDisplayingFullscreen||doc.fullscreenElement===video)return true;
  try{
    // On iPhone this hands playback to the system video player, not a page container.
    if(typeof video.webkitEnterFullscreen==='function'){video.webkitEnterFullscreen();return true;}
    if(typeof video.requestFullscreen==='function'){await video.requestFullscreen();try{await orientation?.lock?.('landscape');}catch{}return true;}
  }catch{/* The system can require another explicit tap after metadata loads. */}
  return false;
}
export function unlockMobilePlayback(_layout,orientation=globalThis.screen?.orientation){try{orientation?.unlock?.();}catch{}}
export function setupVisualViewport(win=window,doc=document){
  const update=()=>doc.documentElement.style.setProperty('--visual-height',String(Math.round(win.visualViewport?.height||win.innerHeight))+'px');
  update();win.visualViewport?.addEventListener('resize',update);win.addEventListener('resize',update);
}

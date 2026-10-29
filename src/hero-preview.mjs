export function allowAutomaticPreview({width,reducedMotion,saveData,effectiveType,hidden,visible,playing}){
  return width>=1100&&!reducedMotion&&!saveData&&!['slow-2g','2g'].includes(effectiveType)&&!hidden&&visible&&!playing;
}
let sdk;
function youtube(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(!sdk)sdk=new Promise((resolve,reject)=>{const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();resolve(window.YT);};const tag=document.createElement('script');tag.src='https://www.youtube.com/iframe_api';tag.async=true;tag.onerror=()=>{sdk=null;reject(Error('Trailer unavailable'));};document.head.append(tag);});
  return sdk;
}
export function createHeroPreview({container,launch,close,caption,onPlaying=()=>{},canAuto=()=>false}){
  let player=null,trailer=null,ticket=0,startTimer,endTimer,timeout,played=false,dismissed=false;
  function stop(reason='idle'){container.dataset.previewState=reason;ticket++;clearTimeout(startTimer);clearTimeout(endTimer);clearTimeout(timeout);try{player?.destroy();}catch{}player=null;played=false;container.hidden=true;container.querySelector('.preview-screen').replaceChildren();onPlaying(false);}
  async function start(manual=false){
    if(!trailer?.official||!manual&&(!canAuto()||dismissed))return;
    stop();const current=ticket,selected=trailer;container.hidden=false;caption.textContent='Trailer oficial · '+(selected.publisher||selected.source||'YouTube');const slot=document.createElement('div');container.querySelector('.preview-screen').append(slot);
    if(manual)container.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    container.dataset.previewState='loading';timeout=setTimeout(()=>stop('timeout'),14000);
    try{const YT=await youtube();if(current!==ticket||document.hidden)return;const frame=document.createElement('iframe');frame.id='mf-trailer-'+Date.now()+'-'+current;frame.title='Trailer oficial';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.src='https://www.youtube-nocookie.com/embed/'+selected.key+'?enablejsapi=1&autoplay=1&mute=1&playsinline=1&controls=1&rel=0&origin='+encodeURIComponent(location.origin);slot.replaceWith(frame);player=new YT.Player(frame.id,{host:'https://www.youtube-nocookie.com',events:{onReady:event=>{if(current!==ticket)return;container.dataset.previewState='ready';event.target.mute();event.target.playVideo();},onError:()=>{if(current===ticket)stop('error');},onAutoplayBlocked:()=>{if(current!==ticket)return;clearTimeout(timeout);container.dataset.previewState='blocked';launch.textContent='Reproduzir trailer';},onStateChange:event=>{if(current!==ticket)return;if(event.data===1){clearTimeout(timeout);container.dataset.previewState='playing';played=true;onPlaying(true);if(!manual){clearTimeout(endTimer);endTimer=setTimeout(stop,25000);}}if(event.data===0)stop();}}});}catch{if(current===ticket)stop();}
  }
  launch.onclick=()=>start(true);close.onclick=()=>{dismissed=true;stop();};
  const observer=new IntersectionObserver(entries=>{if(player&&played&&entries[0].intersectionRatio<.5)stop('offscreen');},{threshold:.5});observer.observe(container);
  return {set(value){stop();trailer=value;dismissed=false;launch.hidden=!value?.official;launch.textContent='Ver trailer';if(value?.official)startTimer=setTimeout(()=>start(false),2800);},stop};
}

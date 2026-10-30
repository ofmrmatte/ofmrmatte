// Scene Play previews use only compatible, authorized video from the connected IPTV provider.
// This is a muted excerpt of the title (not an external YouTube trailer).
export const HERO_PREVIEW_MAX_MS=90000;
export function directPreview(value){
 if(value?.kind!=='direct'||value.authorized!==true)return null;
 try{
  const url=new URL(value.url,'https://scene.invalid');
  return url.protocol==='https:'||value.url.startsWith('/')&&!value.url.startsWith('//')?value.url:null;
 }catch{return null;}
}
export function allowAutomaticPreview({width=0,reducedMotion=false,saveData=false,effectiveType='',hidden=false,visible=false,playing=false}={}){
 // iPhone Safari and Android can autoplay muted inline video when their platform permits.
 // A tap-to-play control remains available if WebKit rejects autoplay.
 return width>=320&&!reducedMotion&&!saveData&&!['slow-2g','2g'].includes(effectiveType)&&!hidden&&visible&&!playing;
}
export function togglePreviewAudio(media){
 if(!media)return false;
 media.muted=!media.muted;
 return !media.muted;
}
export function createHeroPreview({
 hero,getScene,launch,audioToggle,onPlaying=()=>{},onPreparing=()=>{},canAuto=()=>false,
 delay=2800,maxDuration=HERO_PREVIEW_MAX_MS,loadingTimeout=12000
}){
 let selected=null,video=null,startTimer=null,endTimer=null,watchdog=null,ticket=0,attempted=false,active=false,preparing=false;
 const audioLabel=audioToggle?.querySelector('#heroAudioLabel');
 const mutedIcon=audioToggle?.querySelector('[data-audio-icon="muted"]');
 const audibleIcon=audioToggle?.querySelector('[data-audio-icon="audible"]');
 function updateAudioButton(){
  if(!audioToggle)return;
  const audible=!!(video&&active&&!video.muted);
  audioToggle.hidden=!active;
  audioToggle.setAttribute('aria-pressed',String(audible));
  audioToggle.setAttribute('aria-label',audible?'Desativar áudio da prévia':'Ativar áudio da prévia');
  audioToggle.title=audible?'Desativar áudio da prévia':'Ativar áudio da prévia';
  if(audioLabel)audioLabel.textContent=audible?'Desativar áudio':'Ativar áudio';
  if(mutedIcon)mutedIcon.hidden=audible;
  if(audibleIcon)audibleIcon.hidden=!audible;
 }
 function setPreparing(value){
  if(preparing!==value){preparing=value;onPreparing(value);}
 }
 function stop(){
  ++ticket;
  clearTimeout(startTimer);clearTimeout(endTimer);clearTimeout(watchdog);
  startTimer=endTimer=watchdog=null;
  if(video){
   video.onerror=video.onended=null;
   video.pause();video.removeAttribute('src');video.load();video.remove();video=null;
  }
  hero.classList.remove('has-background-preview');
  if(active){active=false;onPlaying(false);}
  setPreparing(false);updateAudioButton();
  launch.setAttribute('aria-pressed','false');
  launch.textContent='Ver prévia';
 }
 function start(manual=false){
  clearTimeout(startTimer);startTimer=null;
  const source=directPreview(selected);
  if(video||!source||(!manual&&!canAuto()))return;
  const scene=getScene();if(!scene||!scene.isConnected)return;
  attempted=true;
  const current=++ticket,media=document.createElement('video');
  video=media;
  media.className='highlight-video';
  media.muted=true;media.defaultMuted=true;media.autoplay=true;
  media.playsInline=true;media.controls=false;media.preload='auto';
  media.setAttribute('muted','');media.setAttribute('autoplay','');
  media.setAttribute('playsinline','');media.setAttribute('webkit-playsinline','');
  media.setAttribute('aria-hidden','true');media.disablePictureInPicture=true;
  media.addEventListener('volumechange',updateAudioButton);
  media.onerror=()=>{if(current===ticket)stop();};
  media.onended=()=>{if(current===ticket)stop();};
  // Block the 9-second slideshow rotation *before* waiting for video.play().
  // Otherwise the slide changes and destroys the video while it is loading.
  setPreparing(true);
  launch.textContent='Carregando prévia…';
  scene.append(media);
  // A fully hidden scene can prevent iPhone WebKit from starting muted video.
  scene.classList.add('is-visible');
  media.src=source;
  watchdog=setTimeout(()=>{if(current===ticket&&!active)stop();},loadingTimeout);
  // Keep play() in the same user gesture on mobile; no await before it.
  let result;
  try{result=media.play();}
  catch{if(current===ticket)stop();return;}
  Promise.resolve(result).then(()=>{
   if(current!==ticket)return;
   clearTimeout(watchdog);watchdog=null;setPreparing(false);
   active=true;hero.classList.add('has-background-preview');
   updateAudioButton();
   launch.textContent='Parar prévia';launch.setAttribute('aria-pressed','true');
   onPlaying(true);
   endTimer=setTimeout(()=>{if(current===ticket)stop();},maxDuration);
  }).catch(()=>{
   // iOS may deny muted autoplay even with playsinline, e.g. low-power mode.
   // Keep 'Ver prévia' available: the user can tap to start explicitly.
   if(current===ticket)stop();
  });
 }
 function resume(){
  if(!attempted&&!video&&startTimer===null&&directPreview(selected)&&canAuto()){
   startTimer=setTimeout(()=>start(false),delay);
  }
 }
 if(audioToggle)audioToggle.onclick=()=>{
  if(!active||!video)return;
  togglePreviewAudio(video);updateAudioButton();
 };
 launch.onclick=()=>{
  if(video){stop();return;}
  start(true);
 };
 return {
  set(value){stop();selected=value;attempted=false;launch.hidden=!directPreview(selected);resume();},
  resume,stop,
  destroy(){stop();launch.onclick=null;if(audioToggle)audioToggle.onclick=null;}
 };
}

// Scene Play hero previews use only direct, authorized video from the connected provider.
// A preview plays the beginning of the title, muted, for a short interval. No YouTube embeds.
export function directPreview(value){
 if(value?.kind!=='direct'||value.authorized!==true)return null;
 try{
  const url=new URL(value.url,'https://scene.invalid');
  return url.protocol==='https:'||value.url.startsWith('/')&&!value.url.startsWith('//')?value.url:null;
 }catch{return null;}
}
export function allowAutomaticPreview({width=0,reducedMotion=false,saveData=false,effectiveType='',hidden=false,visible=false,playing=false}={}){
 return width>=1000&&!reducedMotion&&!saveData&&!['slow-2g','2g'].includes(effectiveType)&&!hidden&&visible&&!playing;
}
export function createHeroPreview({hero,getScene,launch,onPlaying=()=>{},canAuto=()=>false,delay=2800,maxDuration=18000}){
 let selected=null,video=null,timer=null,endTimer=null,ticket=0,attempted=false,active=false;
 function stop(){
  ++ticket;clearTimeout(timer);clearTimeout(endTimer);timer=endTimer=null;
  if(video){
   video.onended=null;video.onerror=null;
   video.pause();video.removeAttribute('src');video.load();video.remove();video=null;
  }
  hero.classList.remove('has-background-preview');
  if(active){active=false;onPlaying(false);}
  launch.setAttribute('aria-pressed','false');
  launch.textContent='Ver prévia';
 }
 async function start(manual=false){
  clearTimeout(timer);timer=null;
  if(video||!directPreview(selected)||(!manual&&!canAuto()))return;
  const scene=getScene();if(!scene||!scene.isConnected)return;
  attempted=true;const current=++ticket,media=document.createElement('video');
  video=media;media.className='highlight-video';
  media.muted=true;media.defaultMuted=true;media.playsInline=true;
  media.setAttribute('playsinline','');media.preload='metadata';
  media.setAttribute('aria-hidden','true');media.disablePictureInPicture=true;
  media.src=directPreview(selected);scene.append(media);
  media.onerror=()=>{if(current===ticket)stop();};
  media.onended=()=>{if(current===ticket)stop();};
  try{
   await media.play();
   if(current!==ticket){media.pause();return;}
   active=true;hero.classList.add('has-background-preview');
   launch.textContent='Parar prévia';
   launch.setAttribute('aria-pressed','true');
   onPlaying(true);
   endTimer=setTimeout(()=>{if(current===ticket)stop();},maxDuration);
  }catch{if(current===ticket)stop();}
 }
 function resume(){
  if(!attempted&&!video&&timer===null&&directPreview(selected)&&canAuto())timer=setTimeout(()=>start(),delay);
 }
 launch.onclick=()=>{if(video)stop();else start(true);};
 return {
  set(value){stop();selected=value;attempted=false;launch.hidden=!directPreview(selected);resume();},
  resume,stop,
  destroy(){stop();launch.onclick=null;}
 };
}

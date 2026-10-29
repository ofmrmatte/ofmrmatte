// Scene Play opening/intro marks. Xtream doesn't define a universal intro marker.
// Provider or user-confirmed timestamps take precedence over a clearly-labelled estimate.
const LIMIT_SECONDS=600;
function seconds(value){
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(typeof value!=='string'||!/^\d{1,3}(?::[0-5]?\d){0,2}(?:\.\d+)?$/.test(value.trim()))return null;
 const nums=value.trim().split(':').map(Number);
 if(nums.some(n=>!Number.isFinite(n)))return null;
 return nums.reduce((total,n)=>total*60+n,0);
}
export function validateIntro(segment,duration=Infinity){
 if(!segment||typeof segment!=='object')return null;
 const start=seconds(segment.start),end=seconds(segment.end);
 if(start===null||end===null||start<0||end>LIMIT_SECONDS||end-start<5)return null;
 if(Number.isFinite(duration)&&(duration<360||end>=duration-15||end>duration*.35))return null;
 return {start,end};
}
function metadataIntro(item,duration){
 const sources=[item?.intro,item?.skip_intro,item?.skipIntro,item?.info?.intro,
  item?.info?.skip_intro,item?.info?.skipIntro,
  {start:item?.intro_start??item?.introStart,end:item?.intro_end??item?.introEnd},
  {start:item?.info?.intro_start??item?.info?.introStart,end:item?.info?.intro_end??item?.info?.introEnd}];
 for(const src of sources){
  const intro=validateIntro(src,duration);
  if(intro)return {...intro,origin:'metadata'};
 }
 const chapters=Array.isArray(item?.chapters)?item.chapters:Array.isArray(item?.info?.chapters)?item.info.chapters:[];
 for(const chapter of chapters){
  if(!/(?:opening|intro|abertura)/i.test(String(chapter.title||chapter.name||'')))continue;
  const intro=validateIntro({start:chapter.start??chapter.start_time,end:chapter.end??chapter.end_time},duration);
  if(intro)return {...intro,origin:'metadata'};
 }
 return null;
}
export function introSeasonKey(episode){
 if(episode?.type!=='series'||!/^series:\d{1,15}$/.test(String(episode.parentId||'')))return null;
 const season=String(episode.season||'');
 if(!/^\d{1,3}$/.test(season))return null;
 return episode.parentId+':season:'+season;
}
export function resolveIntro(episode,duration,manualMarks={}){
 if(!introSeasonKey(episode)||!Number.isFinite(duration)||duration<360)return null;
 const saved=manualMarks?.[introSeasonKey(episode)];
 const manual=validateIntro(saved,duration);
 if(manual)return {...manual,origin:'manual'};
 const provider=metadataIntro(episode,duration);
 if(provider)return provider;
 // This is NOT detection. Never pretend the tentative 85s window is confirmed.
 const estimate=validateIntro({start:0,end:Math.min(85,Math.floor(duration*.1))},duration);
 return estimate?{...estimate,origin:'estimated'}:null;
}
export function shouldOfferIntro(intro,current,duration){
 if(!intro||!Number.isFinite(current)||!Number.isFinite(duration))return false;
 return current>=Math.max(0,intro.start-2)&&current<intro.end-2&&intro.end<duration-15;
}
export function skipIntroPosition(intro,current,duration,seekable){
 if(!shouldOfferIntro(intro,current,duration))return null;
 let target=Math.min(intro.end,Math.max(0,duration-.5));
 // Seek to a supported buffered/seekable range; never seek backwards.
 if(seekable?.length){
  let inside=false;
  for(let i=0;i<seekable.length;i++){
   if(target>=seekable.start(i)&&target<=seekable.end(i)){inside=true;break;}
  }
  if(!inside)return null;
 }
 return target>current+1?target:null;
}
export function confirmedIntro(start,end,duration){
 const marker=validateIntro({start,end},duration);
 return marker?{...marker,origin:'manual'}:null;
}

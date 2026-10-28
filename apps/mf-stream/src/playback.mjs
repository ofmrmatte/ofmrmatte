export function formatTime(value=0){const seconds=Math.max(0,Math.floor(Number(value)||0));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
export function seekTarget(current,delta,duration,ranges){
  let target=Math.max(0,(Number(current)||0)+delta);
  if(Number.isFinite(duration))target=Math.min(target,Math.max(0,duration-.1));
  if(ranges?.length){for(let i=0;i<ranges.length;i++){if(target>=ranges.start(i)&&target<=ranges.end(i))return target;}const endpoints=[];for(let i=0;i<ranges.length;i++)endpoints.push(ranges.start(i),Math.max(ranges.start(i),ranges.end(i)-.1));target=endpoints.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target))[0];}
  return target;
}
export function progressRecord(item,current,duration,ended=false){
  if(!item||item.type==='live'||!Number.isFinite(current)||!Number.isFinite(duration)||duration<=0)return null;
  return {id:item.id,parentId:item.parentId||item.id,sourceId:item.sourceId,season:item.season,episodeNumber:item.episodeNumber,position:Math.max(0,Math.min(current,duration)),duration,completed:ended||current/duration>=.95,updatedAt:Date.now()};
}
export function flattenEpisodes(item,episodes){
  return Object.entries(episodes||{}).sort(([a],[b])=>Number(a)-Number(b)).flatMap(([season,rows])=>(Array.isArray(rows)?rows:[]).map((ep,index)=>({...ep,episode_num:Number(ep.episode_num)||index+1})).sort((a,b)=>a.episode_num-b.episode_num).filter(ep=>/^\d{1,15}$/.test(String(ep.id))).map(ep=>({...item,id:`series:${ep.id}`,parentId:item.id,sourceId:String(ep.id),seriesTitle:item.name,season:String(season),episodeNumber:ep.episode_num,name:`${item.name} — ${ep.title||`Episódio ${ep.episode_num}`}`,extension:ep.container_extension||'mp4'})));
}

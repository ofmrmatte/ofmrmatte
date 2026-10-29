import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {publicJson,readCache,writeCache,DAY,limitedBytes} from './public-metadata.mjs';
import {cleanTitle,searchTitle} from './ratings.mjs';
export const discoveryName=value=>cleanTitle(value).replace(/\s+(?:completa|completo)\s*$/,'');
export function remoteIndex(rows){
  const names=new Map(),ids=new Map();for(const row of rows){for(const value of [row.title,...(row.alt_titles||[]).map(a=>a.name)]){const key=discoveryName(value);if(!key)continue;const found=names.get(key)||new Map();found.set(String(row.ids?.simkl_id||row.id),row);names.set(key,found);}for(const type of ['tmdb','imdb'])if(row.ids?.[type])ids.set(type+':'+row.ids[type],row);}return {names,ids};
}
export function matchRemote(item,index){
  const tmdb=item.tmdb_id||item.tmdb,imdb=item.imdb_id||item.imdb;
  for(const [type,id]of [['tmdb',tmdb],['imdb',imdb]])if(id&&index.ids.has(type+':'+id))return index.ids.get(type+':'+id);
  const name=discoveryName(item.name),year=String(item.releaseDate||item.release_date||item.year||'').slice(0,4);
  if(name.length<4&&!/^\d{4}$/.test(year))return null;
  const candidates=[...(index.names.get(name)?.values()||[])].filter(row=>!/^\d{4}$/.test(year)||String(row.release_date||'').endsWith(year)||String(row.year||'')===year);
  return candidates.length===1?candidates[0]:null;
}
export function dailySelection(items,day,limit=8){
  const hash=value=>createHash('sha256').update(day+':'+value).digest().readUInt32BE(0);
  const seen=new Set();return [...items].sort((a,b)=>hash(a.id)-hash(b.id)).filter(item=>{const key=item.type+':'+discoveryName(item.name);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,limit);
}
const validArt=value=>typeof value==='string'&&/^[\w/-]{5,100}$/.test(value);
export function simklArtwork(row){return validArt(row?.fanart)?'https://wsrv.nl/?url='+encodeURIComponent('https://simkl.in/fanart/'+row.fanart+'_medium.jpg')+'&w=1920&output=webp':'';}
export function createDiscovery({cacheDir,fetcher=fetch,enabled=true,tmdb}={}){
  const file=resolve(cacheDir,'discovery.json');
  const artPending=new Map();
  let state={updatedAt:0,groups:{vod:[],series:[]}},pending=null,retryAt=0;const ready=readCache(file,state).then(s=>{if(s.groups&&Array.isArray(s.groups.vod)&&Array.isArray(s.groups.series))state=s;});
  async function refresh(){await ready;if(!enabled||Date.now()-state.updatedAt<DAY||Date.now()<retryAt)return;retryAt=Date.now()+300000;
    const sources=[['vod','movies'],['series','tv'],['series','anime']];const results=await Promise.allSettled(sources.map(async([type,path])=>{const rows=await publicJson(fetcher,'https://data.simkl.in/discover/trending/'+path+'/today_500.json');if(!Array.isArray(rows)||!rows.length)throw Error('Empty trends');return {type,rows:rows.filter(r=>r.title&&r.ids?.simkl_id).slice(0,500)};}));
    const groups={};for(const r of results)if(r.status==='fulfilled'){const {type,rows}=r.value;(groups[type]||=[]).push(...rows);}
    if(Object.keys(groups).length){for(const type of Object.keys(groups))groups[type]=[...new Map(groups[type].map(r=>[r.ids.simkl_id,r])).values()].sort((a,b)=>Number(b.watched||0)-Number(a.watched||0));state={updatedAt:Date.now(),groups:{...state.groups,...groups},partial:results.some(r=>r.status==='rejected')};await writeCache(file,state);}
  }
  async function snapshot(){if(!pending)pending=refresh().finally(()=>pending=null);await pending;return state;}
  const indexes=new WeakMap();function index(state,type){let map=indexes.get(state);if(!map){map={vod:remoteIndex(state.groups.vod),series:remoteIndex(state.groups.series)};indexes.set(state,map);}return map[type];}
  async function match(item,section){const s=await snapshot();return matchRemote(item,index(s,section));}
  function metadata(row){return {externalTitle:row.title,externalAliases:(row.alt_titles||[]).map(a=>a.name),externalYear:String(row.release_date||'').slice(-4),externalId:row.ids.simkl_id,tmdbId:String(row.ids.tmdb||''),backdrop:simklArtwork(row),externalDescription:String(row.overview||'').slice(0,6000),externalSource:'Simkl',externalUrl:'https://simkl.com'+(typeof row.url==='string'&&/^\/(movies|tv|anime)\/[\w/-]+$/.test(row.url)?row.url:'/'),externalWatched:Number(row.watched||0)};}
  return {snapshot,match,metadata,
    async build(items,allowed){const s=await snapshot(),day=new Date().toISOString().slice(0,10),matches=new Map(),rankings={vod:[],series:[]};
      for(const type of ['vod','series']){const seen=new Set();for(const item of items[type]){if(!allowed(item))continue;const row=matchRemote(item,index(s,type));if(row)matches.set(item.id,{...item,...metadata(row)});}
        const ordered=[...matches.values()].filter(item=>item.type===type).sort((a,b)=>b.externalWatched-a.externalWatched);
        rankings[type]=ordered.filter(item=>{if(seen.has(item.externalId))return false;seen.add(item.externalId);return true;}).slice(0,10).map((item,i)=>({...item,position:i+1}));}
      const pool=[...rankings.vod,...rankings.series];const highlights=dailySelection(pool.length?pool:[...items.vod,...items.series].filter(allowed),day);
      return {updatedAt:s.updatedAt?new Date(s.updatedAt).toISOString():null,nextRefreshAt:new Date(s.updatedAt?s.updatedAt+DAY:Date.now()+300000).toISOString(),status:!s.updatedAt?'unavailable':Date.now()-s.updatedAt>DAY?'stale':s.partial?'partial':'ready',day,highlights,rankings,source:{name:'Simkl',url:'https://simkl.com/',moviesUrl:'https://simkl.com/movies/best-movies/most-watched/',seriesUrl:'https://simkl.com/tv/best-shows/most-watched/'}};
    },
    async extra(item,section){const row=await match(item,section),remote=row?metadata(row):{};const tm=await tmdb?.lookup(searchTitle(item.name),section,String(item.releaseDate||item.release_date||item.year||'').slice(0,4),row?.ids?.tmdb||item.tmdb_id||'');return {...remote,...(tm?{backdrop:tm.backdrop||remote.backdrop,description:tm.description,metadataSource:'TMDB',metadataUrl:tm.sourceUrl,rating:tm.rating}:{}),trailer:null};},
    async artwork(url){
      if(artPending.has(url))return artPending.get(url);const job=(async()=>{
      if(!url||!(/^https:\/\/wsrv\.nl\/\?url=https%3A%2F%2Fsimkl\.in%2Ffanart%2F/i.test(url)||/^https:\/\/image\.tmdb\.org\/t\/p\/w1280\/[\w.-]+$/.test(url)))return null;
      const key=createHash('sha256').update(url).digest('hex'),path=resolve(cacheDir,'artwork',key);try{const meta=JSON.parse(await readFile(path+'.json','utf8'));return {type:meta.type,bytes:await readFile(path)};}catch{}
      const r=await fetcher(url,{signal:AbortSignal.timeout(12000),redirect:'error'}),type=r.headers.get('content-type')?.split(';')[0];if(!r.ok||!['image/jpeg','image/png','image/webp','image/avif'].includes(type)||Number(r.headers.get('content-length'))>5_000_000)return null;const bytes=Buffer.from(await limitedBytes(r,5_000_000));if(bytes.length>5_000_000)return null;await mkdir(resolve(cacheDir,'artwork'),{recursive:true});await writeFile(path,bytes);await writeFile(path+'.json',JSON.stringify({type}));return {type,bytes};
      })();artPending.set(url,job);try{return await job;}finally{artPending.delete(url);}
    }
  };
}

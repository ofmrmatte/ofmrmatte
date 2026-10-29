import {publicJson,readCache,writeCache,DAY} from './public-metadata.mjs';
import {cleanTitle} from './ratings.mjs';
import {certification} from '../src/content.mjs';
export function selectTmdb(rows,title,section,year='',id=''){
  const name=cleanTitle(title);const matches=rows.filter(row=>id?String(row.id)===String(id):[row.title,row.original_title,row.name,row.original_name].some(value=>value&&cleanTitle(value)===name)&&(!year||String(row.release_date||row.first_air_date||'').startsWith(String(year))));
  return matches.length===1?matches[0]:null;
}
export function createTmdb({token='',cachePath='',fetcher=fetch}={}){
  const cache=new Map();let writes=Promise.resolve();const ready=cachePath?readCache(cachePath,{}).then(saved=>{for(const [k,v]of Object.entries(saved))if(v.expires>Date.now())cache.set(k,v);}):Promise.resolve();
  const request=path=>publicJson(fetcher,'https://api.themoviedb.org/3/'+path,{headers:{Authorization:'Bearer '+token}});
  return {enabled:!!token,async lookup(title,section,year='',id=''){
    if(!token)return null;await ready;const kind=section==='series'?'tv':'movie',key=kind+':'+(id||cleanTitle(title)+':'+year);const old=cache.get(key);if(old?.promise)return old.promise;
    if(old?.expires>Date.now())return old.value;
    const promise=(async()=>{try{const search=id?{results:[{id:Number(id)}]}:await request('search/'+kind+'?language=pt-BR&query='+encodeURIComponent(title)+(year?'&'+(kind==='movie'?'year':'first_air_date_year')+'='+year:''));const found=selectTmdb(search.results||[],title,section,year,id);if(!found)return null;
      const row=await request(kind+'/'+found.id+'?language=pt-BR&append_to_response=videos,'+(kind==='movie'?'release_dates':'content_ratings'));
      const rating=certification(row);const trailer=(row.videos?.results||[]).filter(v=>v.site==='YouTube'&&v.official===true&&['Trailer','Teaser'].includes(v.type)&&/^[\w-]{11}$/.test(v.key)).sort((a,b)=>(b.iso_639_1==='pt')-(a.iso_639_1==='pt'))[0];
      return {id:row.id,title:row.title||row.name,description:row.overview||'',year:String(row.release_date||row.first_air_date||'').slice(0,4),backdrop:row.backdrop_path&&/^\/[\w.-]+$/.test(row.backdrop_path)?'https://image.tmdb.org/t/p/w1280'+row.backdrop_path:'',sourceUrl:'https://www.themoviedb.org/'+kind+'/'+row.id,rating:rating.ageLabel==='Não informada'?null:{...rating,ageSource:'TMDB',ageSourceUrl:'https://www.themoviedb.org/'+kind+'/'+row.id},trailer:trailer?{key:trailer.key,site:'YouTube',official:true,source:'TMDB · vídeo marcado oficial',url:'https://www.youtube.com/watch?v='+trailer.key}:null};
    }catch{return null;}})();cache.set(key,{promise,expires:Date.now()+60000});const value=await promise;cache.set(key,{value,expires:Date.now()+(value?DAY:300000)});if(cache.size>2000)cache.delete(cache.keys().next().value);writes=writes.catch(()=>{}).then(()=>writeCache(cachePath,Object.fromEntries([...cache].filter(([,v])=>'value'in v))));await writes.catch(()=>{});return value;
  }};
}

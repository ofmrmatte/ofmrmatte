import {certification} from '../src/content.mjs';
export const cleanTitle=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\([^)]*\)|\[[^\]]*\]/g,' ').replace(/\b(?:19|20)\d{2}\b/g,' ').replace(/\b(?:season|temporada)\s*\d+.*$/i,'').replace(/\b(?:FHD|UHD|HD|4K|DUBLADO|LEGENDADO)\b/gi,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function selectRating(results,title,section,year,country) {
  const name=cleanTitle(title);if(!name)return null;
  const matches=results.filter(row=>cleanTitle(section==='series'?row.collectionName:row.trackName)===name&&row.contentAdvisoryRating&&(!year||section==='series'||String(row.releaseDate||'').startsWith(String(year).slice(0,4))));
  // Ambiguous remakes and different certificates are left unresolved.
  if(new Set(matches.map(row=>row.contentAdvisoryRating)).size!==1)return null;
  const row=matches[0];if(!row)return null;
  return {...certification({contentAdvisoryRating:row.contentAdvisoryRating,ageCountry:country.toUpperCase(),ageSource:'Apple TV'}),ageSourceUrl:row.trackViewUrl||row.collectionViewUrl||''};
}
export function createRatingLookup(fetcher=fetch) {
  const cache=new Map(),requests=[];
  return async function lookup(title,section,year='',{refresh=false}={}) {
    const key=`${section}:${cleanTitle(title)}:${String(year).slice(0,4)}`;
    const cached=cache.get(key);if(!refresh&&cached&&cached.expires>Date.now())return cached.promise;
    const promise=(async()=>{
      for(const country of ['br','us']) {
        while(requests.length&&requests[0]<Date.now()-60000)requests.shift();
        if(requests.length>=18)return null;requests.push(Date.now());
        const url=new URL('https://itunes.apple.com/search');
        for(const[k,v]of Object.entries({term:cleanTitle(title),country,media:section==='series'?'tvShow':'movie',entity:section==='series'?'tvSeason':'movie',limit:'25'}))url.searchParams.set(k,v);
        try{
          const response=await fetcher(url,{signal:AbortSignal.timeout(4500),redirect:'error'});if(!response.ok)continue;
          const text=await response.text();if(text.length>500000)continue;
          const rating=selectRating(JSON.parse(text).results||[],title,section,year,country);
          if(rating&&rating.ageLabel!=='Não informada')return rating;
        }catch{/* Optional metadata must not break playback. */}
      }
      return null;
    })();
    if(cache.size>=500)cache.delete(cache.keys().next().value);
    const entry={promise,expires:Date.now()+600000};cache.set(key,entry);promise.then(value=>{if(value)entry.expires=Date.now()+86400000;});return promise;
  };
}

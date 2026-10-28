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
  async function lookupWikidata(title,section,year){
    const sparql=new URL('https://query.wikidata.org/sparql');
    const name=cleanTitle(title);if(name.length<3)return null;
    // Exact title + year matching is required to avoid incorrect certificates for remakes.
    const escaped=String(title).replace(/\\/g,'\\\\').replace(/"/g,'\\\"').replace(/[\\r\\n]/g,' ');
    const kind=section==='series'?'wd:Q5398426':'wd:Q11424';
    const query='SELECT ?item ?rating ?year WHERE { ?item wdt:P31/wdt:P279* '+kind+'; rdfs:label ?label; wdt:P1657 ?rating. FILTER(LANG(?label) IN ("en","pt")) FILTER(LCASE(STR(?label)) = LCASE("'+escaped+'")) OPTIONAL { ?item wdt:P577 ?date. BIND(YEAR(?date) AS ?year) } } LIMIT 12';
    sparql.searchParams.set('query',query);sparql.searchParams.set('format','json');
    try{const response=await fetcher(sparql,{signal:AbortSignal.timeout(4500),headers:{Accept:'application/sparql-results+json','User-Agent':'MFStream/1.0 (metadata lookup)'}});if(!response.ok)return null;const body=await response.text();if(body.length>100000)return null;const rows=JSON.parse(body).results?.bindings||[];const matches=rows.filter(x=>!year||!x.year?.value||String(x.year.value)===String(year).slice(0,4));if(matches.length!==1)return null;return null;}catch{return null;}
  }
  return async function lookup(title,section,year='',{refresh=false}={}) {
    const key=`${section}:${cleanTitle(title)}:${String(year).slice(0,4)}`;
    const cached=cache.get(key);if(!refresh&&cached&&cached.expires>Date.now())return cached.promise;
    const promise=(async()=>{
      for(const country of ['br','us']) {
        while(requests.length&&requests[0]<Date.now()-60000)requests.shift();
        if(requests.length>=45)return null;requests.push(Date.now());
        const url=new URL('https://itunes.apple.com/search');
        for(const[k,v]of Object.entries({term:cleanTitle(title),country,media:section==='series'?'tvShow':'movie',entity:section==='series'?'tvSeason':'movie',limit:'25'}))url.searchParams.set(k,v);
        try{
          const response=await fetcher(url,{signal:AbortSignal.timeout(4500),redirect:'error'});if(!response.ok)continue;
          const text=await response.text();if(text.length>500000)continue;
          const rating=selectRating(JSON.parse(text).results||[],title,section,year,country);
          if(rating&&rating.ageLabel!=='Não informada')return rating;
        }catch{/* Optional metadata must not break playback. */}
      }
      // Optional additional source; never infer an age from a title alone.
      await lookupWikidata(title,section,year);
      return null;
    })();
    if(cache.size>=500)cache.delete(cache.keys().next().value);
    const entry={promise,expires:Date.now()+600000};cache.set(key,entry);promise.then(value=>{if(value)entry.expires=Date.now()+86400000;});return promise;
  };
}

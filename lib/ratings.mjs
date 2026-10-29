import {certification} from '../src/content.mjs';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';

export const searchTitle=value=>String(value||'').replace(/^novela\s*[-–:]?\s*/i,'').replace(/\[[^\]]*\]/g,' ').replace(/\s*[-–]\s*(?:19|20)\d{2}(?:\s*\([^)]*\))*\s*$/,'').replace(/\s*\((?:19|20)\d{2}\)\s*$/,'').replace(/\s*\((?:L|D|HD|4K|DUBLADO|LEGENDADO)\)\s*$/i,'').replace(/\b(?:FHD|UHD|HD|4K|DUBLADO|LEGENDADO)\b/gi,'').trim();
export const cleanTitle=value=>searchTitle(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[()]/g,' ').replace(/\b(?:season|temporada)\s*\d+.*$/i,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function selectRating(results,title,section,year,country){
  const name=cleanTitle(title);if(!name)return null;
  const matches=results.filter(row=>cleanTitle(section==='series'?row.collectionName:row.trackName)===name&&row.contentAdvisoryRating&&(!year||section==='series'||String(row.releaseDate||'').startsWith(String(year).slice(0,4))));
  if(new Set(matches.map(row=>row.contentAdvisoryRating)).size!==1)return null;
  if(section!=='series'&&!year&&new Set(matches.map(row=>String(row.releaseDate||'').slice(0,4)).filter(Boolean)).size>1)return null;
  const row=matches[0];if(!row)return null;
  const rating=certification({contentAdvisoryRating:row.contentAdvisoryRating,ageCountry:country.toUpperCase(),ageSource:'Apple TV'});
  return rating.ageLabel==='Não informada'?null:{...rating,ageSourceUrl:row.trackViewUrl||row.collectionViewUrl||''};
}
export function selectWikidataRating(rows,year=''){
  const matches=rows.filter(row=>!year||String(row.year?.value||'')===String(year).slice(0,4));
  if(new Set(matches.map(row=>row.item?.value)).size!==1)return null;
  for(const country of ['BR','US']){
    const candidates=matches.filter(row=>row.country?.value===country).map(row=>{
      const rating=certification({certification:String(row.ratingLabel?.value||'').trim(),ageCountry:country,ageSource:'Wikidata'});
      return {...rating,ageSourceUrl:row.item?.value?.replace('http:','https:')||''};
    }).filter(row=>row.ageLabel!=='Não informada');
    if(candidates.length){if(new Set(candidates.map(row=>row.ageLabel)).size!==1)return null;return candidates[0];}
  }
  return null;
}
export function createRatingLookup(fetcher=fetch,{cachePath='',official=null,supplemental:catalogLookup=null}={}){
  const cache=new Map(),appleRequests=[],wikiRequests=[];let writes=Promise.resolve();
  const ready=cachePath?readFile(cachePath,'utf8').then(text=>{const saved=JSON.parse(text);for(const [key,entry] of Object.entries(saved.version===2?saved.entries||{}:{}).slice(-2000))if(entry.expires>Date.now()&&entry.value?.ageSource&&entry.value?.ageLabel!=='Não informada')cache.set(key,{...entry,promise:Promise.resolve(entry.value)});}).catch(()=>{}):Promise.resolve();
  async function persist(){if(!cachePath)return;const entries=Object.fromEntries([...cache].filter(([,entry])=>entry.value&&entry.expires>Date.now()).slice(-2000).map(([key,{value,expires}])=>[key,{value,expires}]));writes=writes.catch(()=>{}).then(async()=>{await mkdir(dirname(cachePath),{recursive:true});await writeFile(cachePath+'.tmp',JSON.stringify({version:2,entries}),{mode:0o600});await rename(cachePath+'.tmp',cachePath);});await writes.catch(()=>{});}
  function budget(list,limit){while(list.length&&list[0]<Date.now()-60000)list.shift();if(list.length>=limit)return false;list.push(Date.now());return true;}
  async function wikidata(title,section,year,entry){
    if(!budget(wikiRequests,12)){entry.queued=true;return null;}
    const kind=section==='series'?'wd:Q5398426':'wd:Q11424',term=JSON.stringify(searchTitle(title));
    async function queryItems(binding){
      const query='SELECT DISTINCT ?item ?itemLabel ?rating ?ratingLabel ?country ?year WHERE { '+binding+' ?item wdt:P31/wdt:P279* '+kind+'. OPTIONAL { { ?item wdt:P3216 ?rating. BIND("BR" AS ?country) } UNION { ?item wdt:P1657 ?rating. BIND("US" AS ?country) } } OPTIONAL { ?item (wdt:P577|wdt:P580) ?date. BIND(YEAR(?date) AS ?year) } '+(/^\d{4}$/.test(year)?'FILTER(?year = '+Number(year)+')':'')+' SERVICE wikibase:label { bd:serviceParam wikibase:language "en,pt". } } LIMIT 30';
      const url=new URL('https://query.wikidata.org/sparql');url.searchParams.set('query',query);url.searchParams.set('format','json');
      const response=await fetcher(url,{signal:AbortSignal.timeout(5000),headers:{Accept:'application/sparql-results+json','User-Agent':'MFStream/4.1 (public title metadata)'}});if(!response.ok){entry.failed=true;return [];}const text=await response.text();if(text.length>150000)return [];entry.responses++;return JSON.parse(text).results?.bindings||[];
    }
    try{
      let rows=await queryItems('VALUES ?label { '+term+'@pt '+term+'@en } ?item (rdfs:label|skos:altLabel) ?label.');
      if(!rows.length){
        const search=new URL('https://www.wikidata.org/w/api.php');for(const [k,v] of Object.entries({action:'wbsearchentities',search:searchTitle(title),language:'pt',uselang:'en',type:'item',limit:'5',format:'json'}))search.searchParams.set(k,v);
        const response=await fetcher(search,{signal:AbortSignal.timeout(4000)});if(response.ok){const text=await response.text();if(text.length<100000){const found=(JSON.parse(text).search||[]).filter(row=>/^Q\d+$/.test(row.id)&&[row.label,row.match?.text].some(value=>cleanTitle(value)===cleanTitle(title)));if(found.length)rows=await queryItems('VALUES ?item { '+found.map(row=>'wd:'+row.id).join(' ')+' }');}}
      }
      const matches=rows.filter(row=>!year||String(row.year?.value||'')===year);if(new Set(matches.map(row=>row.item?.value)).size!==1)return null;
      return {rating:selectWikidataRating(matches,year),englishTitle:matches.find(row=>row.itemLabel?.value)?.itemLabel.value||''};
    }catch{entry.failed=true;return null;}
  }
  const lookup=async function lookup(title,section,year='',{refresh=false,withStatus=false,aliases=[],externalId=''}={}){
    await ready;year=String(year).slice(0,4);const key=section+':'+cleanTitle(title)+':'+year;
    const format=(value,entry)=>!withStatus?value:value?{...value,ageLookupStatus:'confirmed'}:{age:null,ageLabel:'Não informada',ageCountry:'',ageSource:'',ageLookupStatus:entry.queued?'queued':entry.failed?'unavailable':'not_found'};const cached=cache.get(key);if(!refresh&&cached&&cached.expires>Date.now())return format(await cached.promise,cached);
    const entry={expires:Date.now()+30000,responses:0,failed:false,queued:false};
    entry.promise=(async()=>{
      const primary=await official?.lookup(title,section,year);if(primary)return primary;
      const extra=await catalogLookup?.(title,section,year,externalId);if(extra?.rating?.ageCountry==='BR')return extra.rating;
      let foreign=extra?.rating||null;
      for(const country of ['br','us']){
        if(!budget(appleRequests,18)){entry.queued=true;break;}
        const url=new URL('https://itunes.apple.com/search');
        for(const [k,v] of Object.entries({term:searchTitle(title),country,media:section==='series'?'tvShow':'movie',entity:section==='series'?'tvSeason':'movie',limit:'25'}))url.searchParams.set(k,v);
        try{const response=await fetcher(url,{signal:AbortSignal.timeout(4500),redirect:'error'});if(!response.ok){entry.failed=true;continue;}const text=await response.text();entry.responses++;if(text.length>500000)continue;const rows=JSON.parse(text).results||[];const rating=[title,...aliases].map(alias=>selectRating(rows,alias,section,year,country)).find(Boolean);if(rating){if(country==='br')return rating;foreign=rating;}}catch{entry.failed=true;}
      }
      const supplemental=await wikidata(title,section,year,entry);if(supplemental?.rating)return supplemental.rating;if(!foreign&&supplemental?.englishTitle&&cleanTitle(supplemental.englishTitle)!==cleanTitle(title)&&budget(appleRequests,18)){const url=new URL('https://itunes.apple.com/search');for(const [k,v]of Object.entries({term:supplemental.englishTitle,country:'us',media:section==='series'?'tvShow':'movie',entity:section==='series'?'tvSeason':'movie',limit:'25'}))url.searchParams.set(k,v);try{const response=await fetcher(url,{signal:AbortSignal.timeout(4500),redirect:'error'});if(response.ok){const text=await response.text();if(text.length<500000)foreign=selectRating(JSON.parse(text).results||[],supplemental.englishTitle,section,year,'us');}}catch{entry.failed=true;}}if(!foreign)for(const alias of [...new Set(aliases)].filter(a=>cleanTitle(a)!==cleanTitle(title)).slice(0,2)){if(!budget(appleRequests,18)){entry.queued=true;break;}const url=new URL('https://itunes.apple.com/search');for(const [k,v]of Object.entries({term:searchTitle(alias),country:'us',media:section==='series'?'tvShow':'movie',entity:section==='series'?'tvSeason':'movie',limit:'25'}))url.searchParams.set(k,v);try{const response=await fetcher(url,{signal:AbortSignal.timeout(4500),redirect:'error'});if(response.ok){const text=await response.text();if(text.length<500000){foreign=selectRating(JSON.parse(text).results||[],alias,section,year,'us');if(foreign)break;}}}catch{entry.failed=true;}}return foreign;
    })();
    if(cache.size>=2000)cache.delete(cache.keys().next().value);cache.set(key,entry);
    let value=await entry.promise;if(value){value={...value,ageUpdatedAt:new Date().toISOString(),ageExpiresAt:new Date(Date.now()+86400000).toISOString()};entry.promise=Promise.resolve(value);entry.value=value;entry.expires=Date.now()+86400000;await persist();}return format(value,entry);
  };
  lookup.peek=async(title,section,year='')=>{await ready;const entry=cache.get(section+':'+cleanTitle(title)+':'+String(year).slice(0,4));return entry?.expires>Date.now()?entry.value||null:null;};
  return lookup;
}

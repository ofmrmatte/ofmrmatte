import {certification} from '../src/content.mjs';
import {readFile} from 'node:fs/promises';
import {publicJson,readCache,writeCache,DAY,limitedBytes} from './public-metadata.mjs';
import {cleanTitle} from './ratings.mjs';
export function parseCsv(text){
  const rows=[];let row=[],cell='',quoted=false;const separator=text.split(/\r?\n/,1)[0].includes(';')?';':',';
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===separator&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
  if(cell||row.length){row.push(cell);rows.push(row);}return rows;
}
export function classindIndex(text){
  const rows=parseCsv(text.replace(/^\uFEFF/,'')),header=(rows.shift()||[]).map(x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,''));
  const find=names=>header.findIndex(h=>names.includes(h)),br=find(['titulonobrasil','titulobrasil','titulobr']),original=find(['titulooriginal']),year=find(['anodeproducao','anoproducao']),rating=find(['classificacao','classificacaoindicativa','classificacaoatribuida']);
  if(br<0||year<0||rating<0)throw new Error('Unrecognized ClassInd schema');
  return rows.map(row=>({title:row[br]||'',original:row[original]||'',year:String(row[year]||'').trim(),rating:certification({classification:row[rating],ageCountry:'BR'}).ageLabel})).filter(row=>row.title&&/^(livre|l|0|6|10|12|14|16|18)(?:\s*anos)?$/i.test(row.rating));
}
export function selectClassind(rows,title,year=''){
  const matches=rows.filter(row=>[row.title,row.original].some(n=>cleanTitle(n)===cleanTitle(title))&&(!year||row.year===String(year)));
  if(!matches.length||new Set(matches.map(r=>r.year)).size!==1||new Set(matches.map(r=>r.rating.toLowerCase().replace(/\s*anos/i,''))).size!==1)return null;
  const age=/livre|^l$|^0$/i.test(matches[0].rating)?0:Number.parseInt(matches[0].rating,10);
  return {age,ageLabel:age===0?'L':String(age),ageCountry:'BR',ageSource:'ClassInd · MJSP',ageSourceUrl:'https://classindportal.mj.gov.br/consulta-filmes'};
}
export function createClassind({cachePath='',file='',fetcher=fetch}={}){
  let state={rows:[],updatedAt:0},promise=null,retry=0;const ready=cachePath?readCache(cachePath,state).then(v=>{if(Array.isArray(v.rows))state=v;}):Promise.resolve();
  async function update(){await ready;if(Date.now()-state.updatedAt<DAY||Date.now()<retry)return;retry=Date.now()+3600000;
    try{let text;if(file)text=await readFile(file,'utf8');else{const info=await publicJson(fetcher,'https://dados.mj.gov.br/api/3/action/resource_show?id=527d195f-c60a-4e8a-8d36-178486ccb480',{},200000);const url=new URL(info.result?.url);if(url.protocol!=='https:'||url.hostname!=='dados.mj.gov.br')throw Error('Invalid ClassInd URL');const r=await fetcher(url,{signal:AbortSignal.timeout(12000),redirect:'error'});if(!r.ok||Number(r.headers?.get?.('content-length'))>60_000_000)throw Error('ClassInd unavailable');const bytes=new Uint8Array(await limitedBytes(r,60_000_000));if(bytes.length>60_000_000)throw Error('ClassInd too large');try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1252').decode(bytes);}}
      const rows=classindIndex(text);if(!rows.length)throw Error('ClassInd empty');state={rows,updatedAt:Date.now()};await writeCache(cachePath,state);
    }catch{/* The public dataset may be offline. Never bypass the login portal. */}}
  return {async lookup(title,section,year){if(!promise)promise=update().finally(()=>promise=null);await promise;return selectClassind(state.rows,title,year);},get status(){return {available:state.rows.length>0,updatedAt:state.updatedAt||null};}};
}

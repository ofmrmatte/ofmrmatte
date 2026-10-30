// Scene Play offline downloads v2. Large MP4 files are stored in resumable
// IndexedDB blocks instead of a single Cache API response or a giant Blob.
export const OFFLINE_CACHE_PREFIX='scene-play-offline-media-v1:';
export const MAX_OFFLINE_BYTES=2*1024*1024*1024;
const LIST_PREFIX='scene-play:offline-list:',LAST_PROFILE='scene-play:offline-last-profile';
const TYPES=new Set(['vod','series']);
const mimeTypes=new Set(['video/mp4','application/mp4','application/octet-stream','binary/octet-stream']);
const store=()=>globalThis.SceneOfflineStore;
export function offlineScope(userId,profileId='default'){
 const user=String(userId||'').trim(),profile=String(profileId||'default').trim();
 return user&&profile?encodeURIComponent(user)+'--'+encodeURIComponent(profile):'';
}
export function offlineKey(item){
 const type=String(item?.type||''),id=String(item?.sourceId||'');
 return TYPES.has(type)&&/^\d{1,15}$/.test(id)?type+'/'+id:'';
}
export function canDownload(item){
 return !!offlineKey(item)&&String(item?.extension||(item?.type==='vod'?'mp4':'')).toLowerCase().replace(/^\./,'')==='mp4';
}
export function formatDownloadSize(bytes){
 if(!Number.isFinite(bytes)||bytes<0)return 'Tamanho desconhecido';
 if(bytes<1024)return bytes+' B';
 const unit=bytes<1024**2?'KB':bytes<1024**3?'MB':'GB';
 const div=unit==='KB'?1024:unit==='MB'?1024**2:1024**3;
 return (bytes/div).toLocaleString('pt-BR',{maximumFractionDigits:1})+' '+unit;
}
export function offlineMediaRequest(scope,item){
 const key=typeof item==='string'?item:offlineKey(item);
 if(!scope||!/^(vod|series)\/\d{1,15}$/.test(key))throw new Error('Título offline inválido.');
 return new Request(new URL('/offline-media/'+encodeURIComponent(scope)+'/'+key,location.origin));
}
function readLegacy(scope){
 try{
  const list=JSON.parse(localStorage.getItem(LIST_PREFIX+scope)||'[]');
  return Array.isArray(list)?list.filter(row=>/^(vod|series)\/\d{1,15}$/.test(String(row?.key))):[];
 }catch{return [];}
}
function writeLegacy(scope,rows){try{localStorage.setItem(LIST_PREFIX+scope,JSON.stringify(rows));}catch{}}
export function rememberOfflineProfile(scope,name){
 if(!scope)return;
 try{localStorage.setItem(LAST_PROFILE,JSON.stringify({scope,name:String(name||'Seu perfil').slice(0,50)}));}catch{}
}
export function lastOfflineProfile(){
 try{
  const value=JSON.parse(localStorage.getItem(LAST_PROFILE)||'null');
  return value&&typeof value.scope==='string'&&value.scope.length<500?value:null;
 }catch{return null;}
}
export function isMobileSafari(){
 if(typeof navigator==='undefined')return false;
 const ua=navigator.userAgent||'';
 return /(?:iPhone|iPad|iPod)/i.test(ua)&&/WebKit/i.test(ua);
}
export function offlineError(error){
 if(error?.name==='AbortError')return new Error('Download pausado. Abra Downloads e toque em Retomar.');
 if(error?.name==='QuotaExceededError'||error?.name==='UnknownError'&&isMobileSafari())
  return new Error('O iPhone ficou sem espaço disponível para este download. Libere armazenamento e tente retomar.');
 if(error?.name==='InvalidStateError')return new Error('O armazenamento foi interrompido. Feche outras abas do Scene Play e tente retomar.');
 if(error instanceof TypeError)return new Error('Conexão interrompida ou resposta do provedor indisponível. Verifique sua internet e tente retomar.');
 return error instanceof Error?error:new Error('O download não pôde ser concluído neste navegador.');
}
function ensureStore(){
 const s=store();
 if(!s?.open||!('indexedDB'in globalThis))throw new Error('Este navegador não oferece o armazenamento de downloads necessário.');
 return s;
}
function validateMime(response){
 const mime=String(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
 if(!mimeTypes.has(mime))throw new Error('Este vídeo não é um arquivo MP4 compatível. HLS, TS e conteúdo protegido não podem ser baixados.');
}
async function safeCapacity(required){
 if(!Number.isFinite(required)||required<=0)return;
 try{
  const estimate=await navigator.storage?.estimate?.();
  if(Number.isFinite(estimate?.quota)&&Number.isFinite(estimate?.usage)&&estimate.quota>0){
   const free=estimate.quota-estimate.usage;
   if(free<required+Math.min(64*1024*1024,required*.08))
    throw new Error('Espaço insuficiente no armazenamento do navegador. Libere espaço no iPhone ou escolha um episódio menor.');
  }
 }catch(error){if(String(error?.message||'').startsWith('Espaço insuficiente'))throw error;}
}
export async function listOffline(scope){
 if(!scope)return [];
 const saved=await ensureStore().entries(scope);
 const items=saved.map(row=>({...row,legacy:false,partial:row.status!=='complete'}));
 // Retain readable videos saved by the previous version without migrating them into RAM.
 if('caches'in globalThis){
  try{
   const cache=await caches.open(OFFLINE_CACHE_PREFIX+scope);
   for(const row of readLegacy(scope)){
    if(items.some(item=>item.key===row.key))continue;
    if(await cache.match(offlineMediaRequest(scope,row.key)))items.push({...row,legacy:true,partial:false});
   }
  }catch{}
 }
 return items.sort((a,b)=>(b.savedAt||b.updatedAt||0)-(a.savedAt||a.updatedAt||0));
}
export async function removeOffline(scope,key){
 const s=ensureStore(),id=s.idFor(scope,key);
 await s.remove(id);
 if('caches'in globalThis){
  try{const cache=await caches.open(OFFLINE_CACHE_PREFIX+scope);await cache.delete(offlineMediaRequest(scope,key));}catch{}
 }
 writeLegacy(scope,readLegacy(scope).filter(row=>row.key!==key));
}
export async function openOffline(scope,key){
 const s=ensureStore(),id=s.idFor(scope,key),meta=await s.get(id);
 if(meta?.status==='complete'){
  if(!navigator.serviceWorker?.controller)
   throw new Error('Para reproduzir este arquivo no iPhone, feche e reabra o Scene Play instalado, permitindo que o modo offline seja ativado.');
  return new URL('/offline-media/'+encodeURIComponent(scope)+'/'+key,location.origin).href;
 }
 if(meta?.status==='partial')throw new Error('Este download ainda não terminou. Toque em Retomar para concluí-lo.');
 if(!('caches'in globalThis))throw new Error('Vídeo não encontrado neste dispositivo.');
 const cache=await caches.open(OFFLINE_CACHE_PREFIX+scope),response=await cache.match(offlineMediaRequest(scope,key));
 if(!response)throw new Error('O vídeo não está mais armazenado neste dispositivo.');
 if(isMobileSafari()&&Number(response.headers.get('Content-Length')||0)>96*1024*1024)
  throw new Error('Este download usa o formato antigo, incompatível com vídeos grandes no iPhone. Remova e baixe novamente.');
 return URL.createObjectURL(await response.blob());
}
function progress(onProgress,received,total){
 onProgress(total?Math.min(99,Math.floor(received/total*100)):null,received,total||null);
}
function createMeta(scope,item,key,existing){
 return existing||{
  id:store().idFor(scope,key),scope,key,name:String(item.name||'Título sem nome').slice(0,180),
  type:item.type,parentId:item.parentId||null,season:item.season??null,episodeNumber:item.episodeNumber??null,
  size:0,received:0,parts:0,status:'partial',savedAt:Date.now(),updatedAt:Date.now(),mode:null
 };
}
function setPartMeta(meta,partSize,total){
 meta.received+=partSize;meta.parts++;meta.size=total||meta.size;
 meta.updatedAt=Date.now();return {...meta};
}
async function completeDownload(s,meta,total,onProgress){
 if(!meta.received||meta.received!==total)throw new Error('O download não chegou ao fim. Toque em Retomar.');
 meta.status='complete';meta.size=total;meta.updatedAt=Date.now();meta.savedAt=Date.now();
 await s.put({...meta});onProgress(100,total,total);
 return {...meta,partial:false};
}
async function rangedDownload({s,meta,url,headers,signal,onProgress,first}){
 const blockSize=s.BLOCK_SIZE;
 let response=first;
 while(true){
  if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
  if(!response){
   const end=meta.size?Math.min(meta.size-1,meta.received+blockSize-1):meta.received+blockSize-1;
   response=await fetch(url,{headers:{...headers,Range:'bytes='+meta.received+'-'+end},cache:'no-store',credentials:'same-origin',signal});
  }
  if(response.status===200){
   if(meta.received){
    await s.remove(meta.id);
    meta.received=0;meta.parts=0;meta.size=0;meta.mode='stream';
    await s.put({...meta});
   }
   return sequentialDownload({s,meta,response,signal,onProgress});
  }
  if(response.status===401||response.status===403)throw new Error('Acesso ao arquivo expirou ou não foi autorizado. Reconecte sua conta.');
  if(response.status!==206)throw new Error('O provedor não permitiu baixar este trecho (HTTP '+response.status+').');
  validateMime(response);
  const range=s.parseContentRange(response.headers.get('Content-Range'));
  if(!range||range.start!==meta.received||range.end-range.start+1>blockSize||range.total>MAX_OFFLINE_BYTES)
   throw new Error('O provedor enviou um intervalo de vídeo inválido. Não é possível continuar com segurança.');
  if(meta.size&&range.total!==meta.size)throw new Error('O arquivo mudou no provedor. Remova o download parcial e tente novamente.');
  if(!meta.size){await safeCapacity(range.total);meta.size=range.total;}
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
  if(bytes.length!==range.end-range.start+1)throw new Error('Trecho recebido incompleto. Toque em Retomar.');
  // All nonfinal blocks must be full-sized so the Service Worker can locate them by offset.
  if(bytes.length!==blockSize&&range.end!==range.total-1)throw new Error('O provedor retornou um trecho truncado.');
  meta.mode='range';
  await s.commit(meta.id,meta.parts,bytes,setPartMeta(meta,bytes.length,range.total));
  progress(onProgress,meta.received,range.total);
  if(meta.received===range.total)return completeDownload(s,meta,range.total,onProgress);
  response=null;
 }
}
async function sequentialDownload({s,meta,response,signal,onProgress}){
 if(response.status!==200)throw new Error('O arquivo não foi disponibilizado por completo.');
 validateMime(response);
 const advertised=Number(response.headers.get('Content-Length'));
 const total=Number.isSafeInteger(advertised)&&advertised>0?advertised:null;
 if(total&&total>MAX_OFFLINE_BYTES)throw new Error('O vídeo supera o limite de 2 GB por download.');
 if(total)await safeCapacity(total);
 if(!response.body?.getReader)throw new Error('O navegador não permite baixar este arquivo de forma progressiva.');
 const reader=response.body.getReader(),blockSize=s.BLOCK_SIZE;
 let position=0,buffer=new Uint8Array(blockSize);
 try{
  while(true){
   if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
   const {value,done}=await reader.read();
   if(done)break;
   if(!value?.byteLength)continue;
   if(meta.received+position+value.byteLength>MAX_OFFLINE_BYTES)throw new Error('O vídeo supera o limite de 2 GB por download.');
   let offset=0;
   while(offset<value.byteLength){
    const n=Math.min(blockSize-position,value.byteLength-offset);
    buffer.set(value.subarray(offset,offset+n),position);
    offset+=n;position+=n;
    if(position===blockSize){
     meta.mode='stream';
     await s.commit(meta.id,meta.parts,buffer,setPartMeta(meta,blockSize,total));
     buffer=new Uint8Array(blockSize);position=0;
     progress(onProgress,meta.received,total);
    }
   }
  }
  if(position){
   meta.mode='stream';
   await s.commit(meta.id,meta.parts,buffer.slice(0,position),setPartMeta(meta,position,total));
  }
  const size=meta.received;
  if(total&&size!==total)throw new Error('O provedor encerrou o download antes de concluir. Tente novamente.');
  return completeDownload(s,meta,total||size,onProgress);
 }finally{reader.cancel().catch(()=>{});}
}
export async function saveOffline({scope,item,url,headers={},signal,onProgress=()=>{}}){
 if(!scope)throw new Error('Entre em seu perfil para baixar conteúdo.');
 if(!canDownload(item))throw new Error('Somente filmes e episódios MP4 compatíveis podem ser baixados.');
 if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
 const s=ensureStore(),key=offlineKey(item),id=s.idFor(scope,key);
 let meta=createMeta(scope,item,key,await s.get(id));
 if(meta.status==='complete')throw new Error('Este título já está salvo. Abra Downloads para assistir.');
 try{
  // Safari can decline persistence; this is best effort, not a guarantee.
  navigator.storage?.persist?.().catch(()=>{});
  if(!meta.received)await s.put({...meta});
  onProgress(meta.size?Math.floor(meta.received/meta.size*100):null,meta.received,meta.size||null);
  const response=await fetch(url,{
   headers:{...headers,Range:'bytes='+meta.received+'-'+(meta.received+s.BLOCK_SIZE-1)},
   signal,cache:'no-store',credentials:'same-origin'
  });
  return await rangedDownload({s,meta,url,headers,signal,onProgress,first:response});
 }catch(error){throw offlineError(error);}
}

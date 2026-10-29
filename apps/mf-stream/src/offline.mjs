// Scene Play offline downloads. Only complete, authorized MP4 files are supported.
export const OFFLINE_CACHE_PREFIX='scene-play-offline-media-v1:';
export const MAX_OFFLINE_BYTES=2*1024*1024*1024; // 2 GiB per title, subject to browser quota.
const LIST_PREFIX='scene-play:offline-list:';
const LAST_PROFILE='scene-play:offline-last-profile';
const SOURCES=new Set(['vod','series']);

export function offlineScope(userId,profileId='default'){
  const user=String(userId||'').trim(),profile=String(profileId||'default').trim();
  if(!user||!profile)return '';
  return encodeURIComponent(user)+'--'+encodeURIComponent(profile);
}
export function offlineKey(item){
  const type=String(item?.type||''),id=String(item?.sourceId||'');
  return SOURCES.has(type)&&/^\d{1,15}$/.test(id)?type+'/'+id:'';
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
function indexKey(scope){return LIST_PREFIX+scope;}
function indexFor(scope){
  try{
    const rows=JSON.parse(localStorage.getItem(indexKey(scope))||'[]');
    return Array.isArray(rows)?rows.filter(row=>row&&/^(vod|series)\/\d{1,15}$/.test(row.key)):[];
  }catch{return [];}
}
function storeIndex(scope,rows){localStorage.setItem(indexKey(scope),JSON.stringify(rows));}
export function rememberOfflineProfile(scope,name){
  if(!scope)return;
  localStorage.setItem(LAST_PROFILE,JSON.stringify({scope,name:String(name||'Seu perfil').slice(0,50)}));
}
export function lastOfflineProfile(){
  try{
    const value=JSON.parse(localStorage.getItem(LAST_PROFILE)||'null');
    return value&&typeof value.scope==='string'&&value.scope.length<500?value:null;
  }catch{return null;}
}
export async function listOffline(scope){
  if(!scope||!('caches'in window))return [];
  const cache=await caches.open(OFFLINE_CACHE_PREFIX+scope);
  const known=indexFor(scope),found=[];
  for(const item of known){
    if(await cache.match(offlineMediaRequest(scope,item.key)))found.push(item);
  }
  if(found.length!==known.length)storeIndex(scope,found);
  return found.sort((a,b)=>b.savedAt-a.savedAt);
}
export async function removeOffline(scope,key){
  if(!scope)return;
  const cache=await caches.open(OFFLINE_CACHE_PREFIX+scope);
  await cache.delete(offlineMediaRequest(scope,key));
  storeIndex(scope,indexFor(scope).filter(row=>row.key!==key));
}
export async function openOffline(scope,key){
  if(!scope||!indexFor(scope).some(row=>row.key===key))throw new Error('Download não encontrado neste perfil.');
  const cache=await caches.open(OFFLINE_CACHE_PREFIX+scope);
  const response=await cache.match(offlineMediaRequest(scope,key));
  if(!response)throw new Error('O vídeo não está mais armazenado neste dispositivo.');
  return URL.createObjectURL(await response.blob());
}
export async function saveOffline({scope,item,url,headers={},signal,onProgress=()=>{}}){
  if(!scope)throw new Error('Entre no seu perfil para baixar conteúdo.');
  if(!canDownload(item))throw new Error('Download offline disponível apenas para filmes ou episódios MP4 compatíveis.');
  if(!('caches'in window)||!window.ReadableStream||!navigator.storage?.estimate)
    throw new Error('Este navegador não oferece o armazenamento offline necessário.');
  if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
  const key=offlineKey(item),cache=await caches.open(OFFLINE_CACHE_PREFIX+scope),request=offlineMediaRequest(scope,key);
  if(await cache.match(request))throw new Error('Este título já está salvo. Abra Downloads para assistir.');
  const response=await fetch(url,{headers,signal,cache:'no-store',credentials:'same-origin'});
  if(!response.ok||response.status!==200)throw new Error('O servidor não disponibilizou o arquivo MP4 completo para download.');
  const mime=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
  if(!['video/mp4','application/mp4','application/octet-stream','binary/octet-stream'].includes(mime)){
    await response.body?.cancel();
    throw new Error('O provedor entregou outro formato. Downloads HLS/TS não estão disponíveis offline.');
  }
  const length=Number(response.headers.get('Content-Length'));
  if(!Number.isSafeInteger(length)||length<=0||length>MAX_OFFLINE_BYTES){
    await response.body?.cancel();
    throw new Error('O servidor não informou um tamanho MP4 válido ou o arquivo ultrapassa 2 GB.');
  }
  const {quota,usage}=await navigator.storage.estimate();
  if(Number.isFinite(quota)&&Number.isFinite(usage)&&quota-usage<length*1.12){
    await response.body?.cancel();
    throw new Error('Espaço insuficiente no navegador para armazenar este título.');
  }
  if(!response.body)throw new Error('O navegador não permite ler este vídeo para armazenamento.');
  const reader=response.body.getReader();let received=0,lastUpdate=0;
  const stream=new ReadableStream({
    async pull(controller){
      try{
        const {done,value}=await reader.read();
        if(done){
          if(received!==length)throw new Error('Download incompleto. Tente novamente.');
          onProgress(100,received,length);controller.close();return;
        }
        received+=value.byteLength;
        if(received>length||received>MAX_OFFLINE_BYTES)throw new Error('Tamanho do arquivo diferente do informado pelo servidor.');
        controller.enqueue(value);
        if(Date.now()-lastUpdate>150||received===length){
          lastUpdate=Date.now();onProgress(Math.min(99,Math.floor(received/length*100)),received,length);
        }
      }catch(error){controller.error(error);}
    },
    cancel(reason){reader.cancel(reason).catch(()=>{});}
  });
  try{
    await cache.put(request,new Response(stream,{status:200,headers:{'Content-Type':'video/mp4','Content-Length':String(length)}}));
    const saved={key,name:String(item.name||'Título sem nome').slice(0,180),
      type:item.type,season:item.season??null,episodeNumber:item.episodeNumber??null,
      size:length,savedAt:Date.now()};
    storeIndex(scope,[saved,...indexFor(scope).filter(row=>row.key!==key)]);
    onProgress(100,length,length);
    return saved;
  }catch(error){
    await cache.delete(request).catch(()=>{});
    if(signal?.aborted)throw new DOMException('Cancelado','AbortError');
    if(error?.name==='QuotaExceededError')throw new Error('O navegador ficou sem espaço para concluir o download.');
    throw error;
  }
}

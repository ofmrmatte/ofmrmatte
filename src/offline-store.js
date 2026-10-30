/* Scene Play v2 offline library — small IndexedDB blocks shared by app and Service Worker.
   No media tokens or server credentials are persisted here. */
(function(global){
'use strict';
const DB_NAME='scene-play-offline-v2', VERSION=1, BLOCK_SIZE=1024*1024;
let opening;
const idFor=(scope,key)=>String(scope)+'|'+String(key);
function requestResult(request){
 return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Falha ao ler o armazenamento do dispositivo.'));});
}
function transactionDone(tx){
 return new Promise((resolve,reject)=>{
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||new Error('Erro no armazenamento local.'));
  tx.onabort=()=>reject(tx.error||new Error('Gravação interrompida no dispositivo.'));
 });
}
function open(){
 if(!('indexedDB' in global))return Promise.reject(new Error('O armazenamento offline não está disponível neste navegador.'));
 if(!opening)opening=new Promise((resolve,reject)=>{
  const req=global.indexedDB.open(DB_NAME,VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('media'))db.createObjectStore('media',{keyPath:'id'});
   if(!db.objectStoreNames.contains('blocks')){
    const blocks=db.createObjectStore('blocks',{keyPath:['id','index']});
    blocks.createIndex('byMedia','id',{unique:false});
   }
  };
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
  req.onerror=()=>reject(req.error||new Error('Falha ao abrir o armazenamento offline.'));
  req.onblocked=()=>reject(new Error('Feche outras abas do Scene Play e tente novamente.'));
 }).catch(error=>{opening=null;throw error;});
 return opening;
}
async function get(id){
 const db=await open(),tx=db.transaction('media','readonly');
 return await requestResult(tx.objectStore('media').get(id))||null;
}
async function put(meta){
 const db=await open(),tx=db.transaction('media','readwrite'),done=transactionDone(tx);
 tx.objectStore('media').put(meta);await done;return meta;
}
async function block(id,index){
 const db=await open(),tx=db.transaction('blocks','readonly');
 const row=await requestResult(tx.objectStore('blocks').get([id,index]));
 return row?.bytes||null;
}
async function commit(id,index,bytes,meta){
 if(!(bytes instanceof Uint8Array)||!bytes.byteLength||bytes.byteLength>BLOCK_SIZE)throw new Error('Bloco de vídeo inválido.');
 const db=await open(),tx=db.transaction(['blocks','media'],'readwrite'),done=transactionDone(tx);
 tx.objectStore('blocks').put({id,index,bytes});
 tx.objectStore('media').put(meta);
 await done;return meta;
}
async function entries(scope){
 const db=await open(),tx=db.transaction('media','readonly');
 const list=await requestResult(tx.objectStore('media').getAll());
 return list.filter(row=>row.scope===scope);
}
async function remove(id){
 const db=await open(),tx=db.transaction(['media','blocks'],'readwrite'),done=transactionDone(tx);
 tx.objectStore('media').delete(id);
 const range=global.IDBKeyRange.only(id);
 const cursor=tx.objectStore('blocks').index('byMedia').openCursor(range);
 cursor.onsuccess=()=>{
  const item=cursor.result;
  if(item){item.delete();item.continue();}
 };
 await done;
}
function parseContentRange(value){
 const m=/^bytes (\d+)-(\d+)\/(\d+)$/i.exec(String(value||'').trim());
 if(!m)return null;
 const start=Number(m[1]),end=Number(m[2]),total=Number(m[3]);
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||!Number.isSafeInteger(total)||start<0||end<start||end>=total)return null;
 return {start,end,total};
}
function parseRequestRange(value,size){
 if(!Number.isSafeInteger(size)||size<=0)return null;
 if(!value)return {start:0,end:size-1,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/i.exec(value.trim());
 if(!m||(!m[1]&&!m[2]))return null;
 let start,end;
 if(!m[1]){
  const suffix=Number(m[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return null;
  start=Math.max(0,size-suffix);end=size-1;
 }else{
  start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),size-1):size-1;
 }
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return null;
 return {start,end,partial:true};
}
async function serve(request,scope,key){
 const id=idFor(scope,key),meta=await get(id);
 if(!meta||meta.status!=='complete'||!meta.size)return new Response('Título não disponível offline.',{status:404});
 const range=parseRequestRange(request.headers.get('Range'),meta.size);
 if(!range)return new Response('',{status:416,headers:{'Content-Range':'bytes */'+meta.size,'Accept-Ranges':'bytes'}});
 const {start,end,partial}=range;
 const headers=new Headers({
  'Content-Type':'video/mp4','Content-Length':String(end-start+1),
  'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
 });
 if(partial)headers.set('Content-Range','bytes '+start+'-'+end+'/'+meta.size);
 if(request.method==='HEAD')return new Response(null,{status:partial?206:200,headers});
 let offset=start;
 const stream=new ReadableStream({
  async pull(controller){
   if(offset>end){controller.close();return;}
   try{
    const index=Math.floor(offset/BLOCK_SIZE),bytes=await block(id,index);
    if(!bytes)throw new Error('Bloco offline ausente.');
    const begin=offset-index*BLOCK_SIZE;
    const slice=bytes.subarray(begin,Math.min(bytes.length,end-index*BLOCK_SIZE+1));
    if(!slice.length)throw new Error('Arquivo offline incompleto.');
    controller.enqueue(slice);
    offset+=slice.byteLength;
    if(offset>end)controller.close();
   }catch(error){controller.error(error);}
  }
 });
 return new Response(stream,{status:partial?206:200,headers});
}
global.SceneOfflineStore=Object.freeze({
 DB_NAME,BLOCK_SIZE,idFor,open,get,put,block,commit,entries,remove,
 parseContentRange,parseRequestRange,serve
});
})(globalThis);

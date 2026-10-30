import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../src/offline-store.js';
import {saveOffline,offlineScope,offlineKey,offlineError} from '../src/offline.mjs';

test('offline V2 validates HTTP byte ranges including iPhone suffix requests',()=>{
 const s=globalThis.SceneOfflineStore;
 assert.equal(s.BLOCK_SIZE,1024*1024);
 assert.deepEqual(s.parseContentRange('bytes 2-5/10'),{start:2,end:5,total:10});
 assert.equal(s.parseContentRange('bytes 4-19/10'),null);
 assert.deepEqual(s.parseRequestRange('bytes=0-1',10),{start:0,end:1,partial:true});
 assert.deepEqual(s.parseRequestRange('bytes=-3',10),{start:7,end:9,partial:true});
 assert.deepEqual(s.parseRequestRange('bytes=8-',10),{start:8,end:9,partial:true});
 assert.deepEqual(s.parseRequestRange(null,10),{start:0,end:9,partial:false});
 assert.equal(s.parseRequestRange('bytes=13-',10),null);
 assert.equal(s.parseRequestRange('bytes=0-1,3-4',10),null);
 assert.equal(offlineScope('user 1','profile 2'),'user%201--profile%202');
 assert.equal(offlineKey({type:'series',sourceId:'123'}),'series/123');
 assert.match(offlineError({name:'QuotaExceededError'}).message,/espaço/);
});

test('iOS offline streaming is served in chunks without ever allocating a full-video Blob',async()=>{
 const source=await readFile(new URL('../src/offline.mjs',import.meta.url),'utf8');
 const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 const server=await readFile(new URL('../server.mjs',import.meta.url),'utf8');
 assert.match(source,/new Uint8Array\(blockSize\)/);
 assert.doesNotMatch(source,/cache\.put\(request/);
 assert.match(source,/Range:'bytes='/);
 assert.match(sw,/SceneOfflineStore\.serve/);
 assert.match(sw,/importScripts\('\/src\/offline-store\.js'\)/);
 assert.match(html,/offlineProgress/);
 assert.match(html,/src\/offline-store\.js/);
 assert.match(app,/item\.partial\?resume:watch/);
 assert.match(server,/\/src\/offline-store\.js/);
});

test('range download saves each chunk durably and resumes after cancellation',async()=>{
 const previousStore=globalThis.SceneOfflineStore,previousFetch=globalThis.fetch;
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 const oldIndexed=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
 const media=new Map(),blocks=new Map(),payload=new TextEncoder().encode('abcdefghij'),ranges=[];
 const s={
  BLOCK_SIZE:4,idFor:(scope,key)=>scope+'|'+key,open:async()=>true,
  get:async id=>media.get(id)||null,
  put:async row=>{media.set(row.id,structuredClone(row));},
  commit:async(id,index,bytes,row)=>{blocks.set(index,Uint8Array.from(bytes));media.set(id,structuredClone(row));},
  remove:async id=>{media.delete(id);blocks.clear();},
  parseContentRange:previousStore.parseContentRange
 };
 const controller=new AbortController();
 try{
  Object.defineProperty(globalThis,'indexedDB',{value:{},configurable:true});
  Object.defineProperty(globalThis,'navigator',{value:{storage:{estimate:async()=>({quota:1e10,usage:0}),persist:async()=>true}},configurable:true});
  globalThis.SceneOfflineStore=s;
  globalThis.fetch=async(_url,options)=>{
   const range=options.headers.Range,r=/bytes=(\d+)-(\d+)/.exec(range);
   assert.ok(r,'Range must be requested');
   ranges.push(range);
   const start=+r[1],end=Math.min(+r[2],payload.length-1);
   return new Response(payload.slice(start,end+1),{status:206,headers:{'Content-Type':'video/mp4','Content-Range':'bytes '+start+'-'+end+'/'+payload.length}});
  };
  const config={scope:'test-profile',item:{type:'vod',sourceId:42,name:'Teste',extension:'mp4'},url:'/api/stream/example'};
  await assert.rejects(saveOffline({...config,signal:controller.signal,onProgress:(_percent,n)=>{if(n===4)controller.abort();}}),/pausado/);
  let row=media.get('test-profile|vod/42');
  assert.equal(row.received,4);assert.equal(row.status,'partial');assert.equal(row.parts,1);
  const done=await saveOffline(config);
  assert.equal(done.size,10);assert.equal(done.status,'complete');assert.equal(done.parts,3);
  assert.deepEqual(ranges,['bytes=0-3','bytes=4-7','bytes=8-9']);
  assert.equal([...blocks.values()].reduce((a,b)=>a+b.length,0),10);
 }finally{
  globalThis.SceneOfflineStore=previousStore;globalThis.fetch=previousFetch;
  if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;
  if(oldIndexed)Object.defineProperty(globalThis,'indexedDB',oldIndexed);else delete globalThis.indexedDB;
 }
});

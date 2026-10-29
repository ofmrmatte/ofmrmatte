import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
export const DAY=86400000;
export async function limitedBytes(response,limit){
  if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let length=0;try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw new Error('Metadata too large');}chunks.push(Buffer.from(value));}return Buffer.concat(chunks);}finally{reader.releaseLock();}}
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>limit)throw new Error('Metadata too large');return bytes;
}
export async function publicJson(fetcher,url,options={},limit=8_000_000){
  const response=await fetcher(url,{signal:AbortSignal.timeout(8000),redirect:'error',...options,headers:{Accept:'application/json','User-Agent':'MFStream/5.0 (public audiovisual metadata)',...options.headers}});
  if(!response.ok)throw new Error('Metadata HTTP '+response.status);
  if(Number(response.headers?.get?.('content-length'))>limit)throw new Error('Metadata too large');
  const text=response.body?.getReader?(await limitedBytes(response,limit)).toString('utf8'):await response.text();if(text.length>limit)throw new Error('Metadata too large');return JSON.parse(text);
}
export async function readCache(path,fallback){try{return JSON.parse(await readFile(path,'utf8'));}catch{return fallback;}}
export async function writeCache(path,data){if(!path)return;await mkdir(dirname(path),{recursive:true});await writeFile(path+'.tmp',JSON.stringify(data),{mode:0o600});await rename(path+'.tmp',path);}

// Only publisher-owned channels qualify for automatic previews. An arbitrary
// YouTube ID or a video with "official" in its title does not establish origin.
const publishers=new Set(['@netflix','@netflixbrasil','@20thcenturystudios','@marvel','@amazonmgmstudios','@primevideo','@primevideobr','@sonypictures','@sonypicturesbr','@warnerbrospictures','@warnerbrosbr','@universalpictures','@universalpicturesbr','@waltdisneystudios','@disneystudiosbr','@paramountpictures','@paramountbrasil','@a24','@appletv']);
export function verifiedTrailer(info,key){
  if(!/^[\w-]{11}$/.test(key||''))return null;
  try{const url=new URL(info.author_url);if(url.hostname!=='www.youtube.com'||!publishers.has(url.pathname.slice(1).toLowerCase())||!/(?:trailer|teaser)/i.test(info.title||''))return null;return {key,site:'YouTube',official:true,publisher:info.author_name,url:'https://www.youtube.com/watch?v='+key,source:'YouTube · '+info.author_name};}catch{return null;}
}
export function createTrailerLookup(fetcher=fetch,{cachePath=''}={}){
  const cache=new Map();let writes=Promise.resolve();const ready=cachePath?readCache(cachePath,{}).then(saved=>{for(const [key,row]of Object.entries(saved))if(row.expires>Date.now())cache.set(key,row);}):Promise.resolve();
  return async key=>{if(!/^[\w-]{11}$/.test(key||''))return null;await ready;const old=cache.get(key);if(old?.expires>Date.now())return old.value;try{const value=verifiedTrailer(await publicJson(fetcher,'https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+key),{},100000),key);cache.set(key,{value,expires:Date.now()+DAY});if(cache.size>500)cache.delete(cache.keys().next().value);writes=writes.catch(()=>{}).then(()=>writeCache(cachePath,Object.fromEntries(cache)));await writes.catch(()=>{});return value;}catch{return null;}};
}

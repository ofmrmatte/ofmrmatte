import {createHash} from 'node:crypto';
import {readCache,writeCache} from './public-metadata.mjs';
export function audienceKey(base,type,id){return createHash('sha256').update(base+'|'+type+'|'+id).digest('hex');}
export function createAudience({file,now=Date.now}={}){
  let days={},writes=Promise.resolve();const ready=readCache(file,{}).then(data=>days=data);
  return {async record(key,viewer){await ready;const day=new Date(now()).toISOString().slice(0,10),hash=createHash('sha256').update(viewer).digest('hex');const rows=days[day]||={};const viewers=rows[key]||=[];if(viewers.includes(hash))return false;viewers.push(hash);const threshold=now()-30*86400000;for(const date of Object.keys(days))if(Date.parse(date)<threshold)delete days[date];writes=writes.catch(()=>{}).then(()=>writeCache(file,days));await writes;return true;},
    async rankings(items,keyFor){await ready;const combined=new Set();const entries=items.map(item=>{let views=0;const viewers=new Set();for(const rows of Object.values(days)){const list=rows[keyFor(item)]||[];views+=list.length;list.forEach(id=>{viewers.add(id);combined.add(id);});}return {...item,views,viewers:viewers.size};}).filter(i=>i.views>0).sort((a,b)=>b.views-a.views||a.id.localeCompare(b.id));return {available:entries.reduce((n,i)=>n+i.views,0)>=10&&entries.length>=3&&combined.size>=5,items:entries.slice(0,10).map((item,index)=>({...item,position:index+1})),periodDays:30,rule:'Uma visualização por perfil, título e dia após 30 segundos de reprodução.'};}}
}

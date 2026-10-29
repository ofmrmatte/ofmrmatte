// A small, bounded selection: no extra catalog or metadata requests for the slideshow.
export function selectHighlights(catalog,allowed,limit=8){
  const seen=new Set(),result=[];
  const lists=['vod','series'].map(type=>catalog[type]?.items||[]);
  for(let index=0;index<Math.max(...lists.map(list=>list.length));index++){
    for(const list of lists){
      const item=list[index];if(!item||!item.logo||!/^\d{1,15}$/.test(item.sourceId)||!allowed(item))continue;
      const name=item.type+':'+item.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(4k|fhd|hd|uhd|dublado|legendado)\b/g,'').replace(/[^a-z0-9]/g,'');
      if(seen.has(name))continue;seen.add(name);result.push(item);if(result.length>=limit)return result;
    }
  }
  return result;
}

export function createHighlightRotation({onChange,onState=()=>{},delay=9000,paused=false,setTimer=setTimeout,clearTimer=clearTimeout}){
  let items=[],current=-1,timer=null,stopped=paused;const blockers=new Set();
  const active=()=>items.length>1&&!stopped&&!blockers.size;
  function schedule(){if(timer!==null)clearTimer(timer);timer=null;onState({paused:stopped,rotating:active()});if(active())timer=setTimer(()=>{timer=null;move(1);},delay);}
  function move(delta){if(!items.length)return;current=(current+delta+items.length)%items.length;onChange(items[current],current,items.length);schedule();}
  return {
    update(next){const previous=items[current];const changed=next.map(i=>i.id).join('|')!==items.map(i=>i.id).join('|');items=next;if(!changed)return;current=Math.max(0,items.findIndex(item=>item.id===previous?.id));onChange(items[current]||null,current,items.length);schedule();},
    move,
    pause(value){stopped=!!value;schedule();},
    block(reason,value){const changed=value?!blockers.has(reason):blockers.has(reason);if(value)blockers.add(reason);else blockers.delete(reason);if(changed)schedule();},
    get paused(){return stopped;},
    destroy(){if(timer!==null)clearTimer(timer);timer=null;items=[];}
  };
}

export function displayTitle(value){return String(value||'').replace(/\s*[-–]\s*(?:19|20)\d{2}\s*(?:\([^)]*\))?\s*$/,'').replace(/\s*[\[(](?:L|D|HD|FHD|UHD|4K|DUBLADO|LEGENDADO)[\])]\s*$/i,'').trim();}

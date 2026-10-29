const rails=new Set();
export function railState(left,width,total){return {previous:left>2,next:left+width<total-2,step:Math.max(1,width*.85)};}
export function disposeRails(){for(const dispose of rails)dispose();rails.clear();}
export function mountRail(section,rail){
 const shell=document.createElement('div');shell.className='rail-shell';shell.append(rail);section.append(shell);rail.tabIndex=0;rail.setAttribute('role','group');rail.setAttribute('aria-label',(section.querySelector('h3')?.textContent||'Conteúdos')+' — use as setas para navegar');
 const buttons=[-1,1].map(d=>{const b=document.createElement('button');b.type='button';b.className='rail-arrow '+(d<0?'previous':'next');b.textContent=d<0?'‹':'›';b.setAttribute('aria-label',d<0?'Conteúdos anteriores':'Próximos conteúdos');b.onclick=()=>move(d);shell.append(b);return b;});
 function move(d){rail.scrollBy({left:d*railState(rail.scrollLeft,rail.clientWidth,rail.scrollWidth).step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 function update(){const s=railState(rail.scrollLeft,rail.clientWidth,rail.scrollWidth);buttons[0].disabled=!s.previous;buttons[1].disabled=!s.next;}
 rail.addEventListener('scroll',update,{passive:true});rail.addEventListener('keydown',e=>{if(e.target===rail&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
 let drag=null,moved=false;rail.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button,input,a'))return;drag={x:e.clientX,left:rail.scrollLeft};moved=false;});rail.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>8){moved=true;rail.setPointerCapture(e.pointerId);rail.scrollLeft=drag.left-dx;}});const end=()=>{drag=null;};for(const event of ['pointerup','pointercancel','lostpointercapture'])rail.addEventListener(event,end);rail.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false;}},true);
 const observer=new ResizeObserver(update);observer.observe(rail);rails.add(()=>observer.disconnect());requestAnimationFrame(update);return shell;
}
export function searchShouldCollapse(value,inside){return !inside&&!value.trim();}
export function bindSearch(root,input){
 const toggle=document.createElement('button'),close=document.createElement('button');
 toggle.type=close.type='button';toggle.className='search-toggle';close.className='search-close';
 toggle.setAttribute('aria-label','Abrir busca');toggle.setAttribute('title','Buscar no catálogo (/ )');
 toggle.setAttribute('aria-controls',input.id);toggle.setAttribute('aria-expanded','false');
 close.setAttribute('aria-label','Limpar e fechar busca');close.setAttribute('title','Limpar e fechar busca');
 toggle.innerHTML='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.75" cy="10.75" r="7.25"/><path d="m16.2 16.2 5 5"/></svg>';
 close.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
 root.prepend(toggle);root.append(close);
 function expand(value){
   root.classList.toggle('is-expanded',value);
   toggle.setAttribute('aria-expanded',String(value));
   input.tabIndex=value?0:-1;close.tabIndex=value?0:-1;
   if(value)input.focus({preventScroll:true});
 }
 function dismiss(){
   if(input.value){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}
   expand(false);toggle.focus({preventScroll:true});
 }
 toggle.addEventListener('click',event=>{event.preventDefault();expand(true);});
 close.addEventListener('click',event=>{event.preventDefault();dismiss();});
 input.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss();}});
 root.addEventListener('focusout',event=>{if(searchShouldCollapse(input.value,root.contains(event.relatedTarget)))expand(false);});
 expand(false);
}

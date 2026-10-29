import test from 'node:test';
import assert from 'node:assert/strict';
import {selectHighlights,createHighlightRotation} from '../src/highlights.mjs';

test('destaques alternam filmes e séries, deduplicam versões e respeitam bloqueios',()=>{
  const movie=(id,name,extra={})=>({id:'vod:'+id,sourceId:String(id),type:'vod',name,logo:'https://example.test/cover.jpg',...extra});
  const series={...movie(8,'Série'),id:'series:8',type:'series'};
  const catalog={vod:{items:[movie(1,'Filme HD'),movie(2,'Filme FHD'),movie(3,'Restrito',{blocked:true}),movie(4,'Sem imagem',{logo:''}),movie(5,'Outro')]},series:{items:[series]}};
  assert.deepEqual(selectHighlights(catalog,item=>!item.blocked).map(i=>i.id),['vod:1','series:8','vod:5']);
  assert.equal(selectHighlights(catalog,()=>true,2).length,2);
  assert.deepEqual(selectHighlights({},()=>true),[]);
});

test('rotação preserva seleção, suspende temporizadores e nunca reinicia pausa explícita',()=>{
  let callback=null,rotating;const changes=[];
  const rotation=createHighlightRotation({onChange:(item,index)=>changes.push([item?.id,index]),onState:s=>rotating=s.rotating,setTimer:fn=>{assert.equal(callback,null);callback=fn;return 1;},clearTimer:()=>{callback=null;}});
  const a={id:'a'},b={id:'b'},c={id:'c'};
  rotation.update([a,b]);assert.ok(rotating);assert.deepEqual(changes.at(-1),['a',0]);
  rotation.move(1);assert.deepEqual(changes.at(-1),['b',1]);
  rotation.update([a,b,c]);assert.deepEqual(changes.at(-1),['b',1]);
  rotation.block('modal',true);assert.equal(callback,null);
  rotation.block('hidden',true);rotation.block('modal',false);assert.equal(callback,null);
  rotation.block('hidden',false);assert.ok(callback);
  rotation.pause(true);rotation.block('hover',true);rotation.block('hover',false);assert.equal(callback,null);
  rotation.move(1);assert.deepEqual(changes.at(-1),['c',2]);assert.equal(callback,null);
  rotation.pause(false);const tick=callback;callback=null;tick();assert.deepEqual(changes.at(-1),['a',0]);
  rotation.update([a]);assert.equal(callback,null);
  rotation.update([]);assert.deepEqual(changes.at(-1),[undefined,0]);assert.equal(callback,null);
  rotation.destroy();
});

test('movimento reduzido inicia a apresentação pausada e permite navegação manual',()=>{
  let scheduled=false,last;
  const rotation=createHighlightRotation({paused:true,onChange:item=>last=item,setTimer:()=>{scheduled=true;},clearTimer:()=>{}});
  rotation.update([{id:'a'},{id:'b'}]);rotation.move(-1);
  assert.equal(last.id,'b');assert.equal(scheduled,false);rotation.destroy();
});

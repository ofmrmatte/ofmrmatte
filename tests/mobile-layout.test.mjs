import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');

test('installed iPhone adds standalone safe-area class before styles load',async()=>{
 const js=await read('../src/mobile-viewport.js');
 function run({ua='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',standalone=false,displayMode=false}={}){
  const classes=[];
  vm.runInNewContext(js,{
   navigator:{userAgent:ua,standalone},
   matchMedia:()=>({matches:displayMode}),
   document:{documentElement:{classList:{add:name=>classes.push(name)}}}
  });
  return classes;
 }
 assert.deepEqual(run({standalone:true}),['scene-ios-standalone']);
 assert.deepEqual(run({displayMode:true}),['scene-ios-standalone']);
 assert.deepEqual(run({standalone:false}),[]);
 assert.deepEqual(run({ua:'Mozilla/5.0 (Linux; Android 15)',displayMode:true}),[]);
 const html=await read('../index.html');
 assert.ok(html.indexOf('/src/mobile-viewport.js')<html.indexOf('/src/styles.css'));
});

test('iPhone header uses top safe inset and mobile hero is content-sized',async()=>{
 const css=await read('../src/scene.css');
 const lines=css.slice(css.indexOf('/* Scene Play mobile layout v5.4.2'));
 assert.match(lines,/html\.scene-ios-standalone\{--scene-app-safe-top:max\(47px,env\(safe-area-inset-top/);
 assert.match(lines,/height:calc\(58px \+ var\(--scene-app-safe-top\)\)!important/);
 assert.match(lines,/padding:var\(--scene-app-safe-top\)/);
 assert.match(lines,/height:auto!important;min-height:0!important;max-height:none!important/);
 assert.match(lines,/padding:clamp\(138px,44vw,185px\) 18px 64px!important/);
 assert.match(lines,/hero-data-note\{[\s\S]*?position:absolute!important/);
 assert.match(lines,/\.highlight-controls\{[\s\S]*?position:absolute!important/);
 assert.doesNotMatch(lines,/\+ 4 \*/);
 const server=await read('../server.mjs'),sw=await read('../service-worker.js');
 assert.match(server,/\/src\/mobile-viewport\.js/);
 assert.match(sw,/\/src\/mobile-viewport\.js/);
 assert.match(sw,/scene-play-shell-v5-4-3/);
});

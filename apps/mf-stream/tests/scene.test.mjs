import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {directPreview,allowAutomaticPreview} from '../src/hero-preview.mjs';import {railState,searchShouldCollapse} from '../src/scene-ui.mjs';
test('preview never starts without hover or an authorized direct media source',()=>{assert.equal(directPreview({official:true,key:'abcdefghijk'}),null);assert.equal(directPreview({kind:'direct',url:'https://a/video.mp4'}),null);assert.equal(directPreview({kind:'direct',authorized:true,url:'javascript:alert(1)'}),null);assert.equal(directPreview({kind:'direct',authorized:true,url:'/authorized.mp4'}),'/authorized.mp4');assert.equal(allowAutomaticPreview({width:1920,visible:true}),true);assert.equal(allowAutomaticPreview({hovered:true,width:1920,visible:true}),true);});
test('horizontal navigation respects beginning/end and viewport width',()=>{assert.deepEqual(railState(0,100,300),{previous:false,next:true,step:85});assert.deepEqual(railState(200,100,300),{previous:true,next:false,step:85});assert.equal(railState(0,400,100).next,false);});
test('search preserves query when focus moves to results',()=>{assert.equal(searchShouldCollapse('filme',false),false);assert.equal(searchShouldCollapse('',true),false);assert.equal(searchShouldCollapse(' ',false),true);});
test('public identity and PWA assets use Scene Play without changing persistent keys',async()=>{const html=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/SCENE PLAY/);assert.doesNotMatch(html,/id="heroPreview"/);const manifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url)));assert.equal(manifest.name,'Scene Play');for(const size of [192,512]){const bytes=await readFile(new URL('../assets/icon-'+size+'.png',import.meta.url));assert.equal(bytes.readUInt32BE(16),size);}const access=await readFile(new URL('../lib/access.mjs',import.meta.url),'utf8');assert.match(access,/mf-stream/);});

test('Scene Play header uses accessible search and a named profile button',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/scene.css',import.meta.url),'utf8');
 const ui=await readFile(new URL('../src/scene-ui.mjs',import.meta.url),'utf8');
 assert.match(html,/<div class="global-search" role="search"/);
 assert.match(html,/id="openAccountProfile"[^>]*aria-label="Gerenciar perfis"/);
 assert.match(css,/\.global-search\.is-expanded input\{opacity:1;pointer-events:auto\}/);
 assert.match(ui,/Limpar e fechar busca/);
 assert.match(ui,/aria-controls/);
});

test('offline download keys support only authenticated-catalog MP4 movies and episodes',async()=>{
 const {offlineScope,offlineKey,canDownload,formatDownloadSize,MAX_OFFLINE_BYTES}=await import('../src/offline.mjs');
 assert.equal(offlineKey({type:'vod',sourceId:123}),'vod/123');
 assert.equal(offlineKey({type:'series',sourceId:'45'}),'series/45');
 assert.equal(offlineKey({type:'live',sourceId:42}),'');
 assert.equal(offlineKey({type:'vod',sourceId:'javascript:1'}),'');
 assert.equal(canDownload({type:'vod',sourceId:123,extension:'mp4'}),true);
 assert.equal(canDownload({type:'vod',sourceId:123,extension:'m3u8'}),false);
 assert.equal(canDownload({type:'series',sourceId:123,extension:'mkv'}),false);
 assert.equal(offlineScope('user1','profile2'),'user1--profile2');
 assert.ok(formatDownloadSize(1024**2).includes('MB'));
 assert.ok(MAX_OFFLINE_BYTES>=1024**3);
});
test('offline screen is reachable from the persistent header and PWA shell',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const scene=await readFile(new URL('../src/scene.css',import.meta.url),'utf8');
 const js=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 const server=await readFile(new URL('../server.mjs',import.meta.url),'utf8');
 const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
 for(const id of ['downloadsButton','downloadsModal','offlineVideo','detailsDownload','installButton','refreshButton']){
  assert.equal(html.split('id="'+id+'"').length-1,1,'unique '+id);
 }
 assert.match(html,/header-utility-actions/);
 assert.match(scene,/header-search-slot/);
 assert.match(js,/downloadTitle\(ep,save\)/);
 assert.match(js,/rememberOfflineProfile\(offlineScope\(user\.id,profile\.id\)/);
 assert.match(server,/\/src\/offline\.mjs/);
 assert.match(sw,/\/src\/offline\.mjs/);
});

test('highlight autoplay works without mouse hover but honors visibility and data-saving',async()=>{
 const {allowAutomaticPreview}=await import('../src/hero-preview.mjs');
 assert.equal(allowAutomaticPreview({hovered:false,width:1600,visible:true}),true);
 assert.equal(allowAutomaticPreview({width:390,visible:true}),false);
 assert.equal(allowAutomaticPreview({width:1600,visible:true,saveData:true}),false);
 assert.equal(allowAutomaticPreview({width:1600,visible:true,reducedMotion:true}),false);
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 const preview=await readFile(new URL('../src/hero-preview.mjs',import.meta.url),'utf8');
 const discovery=await readFile(new URL('../lib/discovery.mjs',import.meta.url),'utf8');
 const tmdb=await readFile(new URL('../lib/tmdb.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(app,/data\.trailer|youtube\.com/);
 assert.doesNotMatch(preview,/youtube\.com|youtube-nocookie\.com/);
 assert.doesNotMatch(discovery,/createTrailerLookup|await trailer\(/);
 assert.doesNotMatch(tmdb,/append_to_response=videos|youtube\.com/);
 assert.match(app,/firstSeriesPreview/);
 assert.match(app,/heroPreview\?\.resume\(\)/);
});
test('cinematic hero keeps sharp portrait cover and only offers first-party previews',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/scene.css',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(html,/id="heroTrailer"[^>]*>Ver prévia<\/button>/);
 assert.match(css,/\.highlight-scene:not\(\.is-landscape\) \.highlight-cover/);
 assert.match(css,/filter:none!important;opacity:1!important/);
 assert.match(app,/playableHighlightPreview/);
 assert.match(app,/\/api\/catalog\?section=series&kind=info/);
});

test('preview audio control toggles mute without altering playback',async()=>{
 const {togglePreviewAudio}=await import('../src/hero-preview.mjs');
 const fake={muted:true};assert.equal(togglePreviewAudio(fake),true);
 assert.equal(fake.muted,false);assert.equal(togglePreviewAudio(fake),false);
 assert.equal(fake.muted,true);assert.equal(togglePreviewAudio(null),false);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 const module=await readFile(new URL('../src/hero-preview.mjs',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/scene.css',import.meta.url),'utf8');
 assert.equal(html.split('id="heroAudioToggle"').length-1,1);
 assert.match(html,/id="heroAudioToggle"[^>]*aria-pressed="false"[^>]*hidden/);
 assert.ok(app.includes("audioToggle:$('heroAudioToggle')"));
 assert.ok(module.includes('audioToggle.hidden=!active'));
 assert.ok(module.includes("media.addEventListener('volumechange',updateAudioButton)"));
 assert.ok(css.includes('.hero-audio-toggle[hidden]{display:none!important}'));
});

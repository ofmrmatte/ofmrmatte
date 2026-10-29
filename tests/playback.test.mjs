import test from 'node:test';
import assert from 'node:assert/strict';
import {seekTarget,formatTime,progressRecord,flattenEpisodes} from '../src/playback.mjs';
import {contentMetadata} from '../src/content.mjs';
import {selectRating,selectWikidataRating,createRatingLookup} from '../lib/ratings.mjs';
test('avanço de 10s respeita início, fim e intervalos disponíveis de DVR',()=>{
 assert.equal(seekTarget(4,-10,100),0);assert.equal(seekTarget(50,10,100),60);assert.equal(seekTarget(95,10,100),99.9);
 const ranges={length:2,start:i=>[20,60][i],end:i=>[40,90][i]};assert.equal(seekTarget(25,-10,Infinity,ranges),20);assert.equal(seekTarget(35,10,Infinity,ranges),39.9);
 assert.equal(formatTime(1439),'23:59');
});
test('progresso mantém episódio e temporada, identifica conclusão e ignora TV ao vivo',()=>{
 const item={id:'series:55',parentId:'series:3',sourceId:'55',type:'series',season:'4',episodeNumber:4};
 const record=progressRecord(item,120,1400);assert.equal(record.position,120);assert.equal(record.parentId,'series:3');assert.equal(record.completed,false);
 assert.equal(progressRecord(item,1390,1400).completed,true);assert.equal(progressRecord(item,100,NaN),null);assert.equal(progressRecord({...item,type:'live'},120,1400),null);
 assert.deepEqual(JSON.parse(JSON.stringify(record)),record);
});
test('fila ordena episódios numericamente e segue para a próxima temporada',()=>{
 const queue=flattenEpisodes({id:'series:3',type:'series',name:'Série'},{'10':[{id:110,episode_num:1}],'2':[{id:22,episode_num:2},{id:21,episode_num:1},{id:'invalid'}]});
 assert.deepEqual(queue.map(ep=>ep.sourceId),['21','22','110']);assert.equal(queue[2].season,'10');assert.equal(queue[0].parentId,'series:3');
});
test('classificação procura campos vazios, estruturas aninhadas e certificados BR',()=>{
 assert.equal(contentMetadata({age_rating:'',info:{content_rating:'16 anos'}}).age,16);
 assert.equal(contentMetadata({content_ratings:{results:[{iso_3166_1:'US',rating:'TV-14'},{iso_3166_1:'BR',rating:'16'}]}}).age,16);
 assert.equal(contentMetadata({rating:18}).age,null);assert.equal(contentMetadata({mpaa:'TV-14'}).ageLabel,'TV-14');
});
test('fonte complementar exige título exato e ano, e identifica região internacional',()=>{
 const rows=[{collectionName:'Classroom of the Elite, Season 2 (Original Japanese Version)',contentAdvisoryRating:'TV-14'}];
 const rating=selectRating(rows,'Classroom of the Elite','series','','us');assert.equal(rating.ageLabel,'TV-14');assert.equal(rating.ageCountry,'US');assert.equal(rating.ageSource,'Apple TV');
 assert.equal(selectRating(rows,'Outro anime','series','','us'),null);
 assert.equal(selectRating([{trackName:'Filme',releaseDate:'1990-01-01',contentAdvisoryRating:'A14'}],'Filme','vod','2020','br'),null);
 assert.equal(selectRating([...rows,{collectionName:'Classroom of the Elite',contentAdvisoryRating:'TV-MA'}],'Classroom of the Elite','series','','us'),null);
});
test('consulta complementar prefere Brasil, usa cache e falha sem interromper o player',async()=>{
 let calls=0;const lookup=createRatingLookup(async url=>{calls++;return {ok:true,text:async()=>JSON.stringify({results:url.searchParams.get('country')==='br'?[]:[{collectionName:'Série',contentAdvisoryRating:'TV-14'}]})};});
 const result=await lookup('Série','series');assert.equal(result.ageLabel,'TV-14');await lookup('Série','series');assert.equal(calls,4);await lookup('Série','series','',{refresh:true});assert.equal(calls,8);
 const unavailable=createRatingLookup(async()=>{throw new Error('offline');});assert.equal(await unavailable('Série','series'),null);
});

test('ClassInd complementar exige obra única e ano correto, preservando país e fonte',()=>{
 const row=(id,label,country='BR',year='2023')=>({item:{value:'http://www.wikidata.org/entity/'+id},ratingLabel:{value:label},country:{value:country},year:{value:year}});
 const certificate=selectWikidataRating([row('Q1','14'),row('Q1','R','US')],'2023');
 assert.equal(certificate.ageLabel,'14');assert.equal(certificate.ageCountry,'BR');assert.equal(certificate.ageSource,'Wikidata');
 assert.equal(certificate.ageSourceUrl,'https://www.wikidata.org/entity/Q1');
 assert.equal(selectWikidataRating([row('Q1','14')],'2020'),null);
 assert.equal(selectWikidataRating([row('Q1','14'),row('Q2','14')],'2023'),null);
 assert.equal(selectWikidataRating([row('Q1','14'),row('Q1','16')],'2023'),null);
 assert.equal(selectRating([{trackName:'Remake',releaseDate:'1990',contentAdvisoryRating:'R'},{trackName:'Remake',releaseDate:'2020',contentAdvisoryRating:'R'}],'Remake','vod','','us'),null);
});

test('classificações confirmadas sobrevivem à recriação do lookup sem nova consulta',async t=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const dir=await mkdtemp(join(tmpdir(),'mf-ratings-'));t.after(()=>rm(dir,{recursive:true,force:true}));const cachePath=join(dir,'ratings.json');
 const lookup=createRatingLookup(async url=>({ok:true,text:async()=>url.hostname==='itunes.apple.com'?JSON.stringify({results:[]}):JSON.stringify({results:{bindings:[{item:{value:'http://www.wikidata.org/entity/Q1'},ratingLabel:{value:'16'},country:{value:'BR'},year:{value:'2023'}}]}})}),{cachePath});
 const result=await lookup('Filme 2023','vod','2023');assert.equal(result.age,16);
 const restored=createRatingLookup(async()=>{throw new Error('Não deve consultar a rede');},{cachePath});assert.deepEqual(await restored('Filme 2023','vod','2023'),result);
});

test('lookup informa indisponibilidade sem inventar classificação',async()=>{const lookup=createRatingLookup(async()=>{throw Error('offline')});const result=await lookup('Filme','vod','',{withStatus:true});assert.equal(result.age,null);assert.equal(result.ageLookupStatus,'unavailable');});

test('intro skip uses markers, estimates conservatively, and validates seekability',async()=>{
 const {resolveIntro,introSeasonKey,shouldOfferIntro,skipIntroPosition,confirmedIntro}=await import('../src/intro.mjs');
 const ep={type:'series',parentId:'series:17',id:'series:102',season:'2',sourceId:'102'};
 const key=introSeasonKey(ep);assert.equal(key,'series:17:season:2');
 assert.deepEqual(resolveIntro(ep,1800,{}),{start:0,end:85,origin:'estimated'});
 assert.deepEqual(resolveIntro({...ep,info:{intro:{start:'0:45',end:'2:30'}}},1800,{}),{start:45,end:150,origin:'metadata'});
 const saved={[key]:{start:55,end:115}};
 assert.deepEqual(resolveIntro(ep,1800,saved),{start:55,end:115,origin:'manual'});
 assert.equal(shouldOfferIntro(resolveIntro(ep,1800,saved),56,1800),true);
 assert.equal(shouldOfferIntro(resolveIntro(ep,1800,saved),118,1800),false);
 assert.equal(skipIntroPosition(resolveIntro(ep,1800,saved),65,1800),115);
 assert.equal(skipIntroPosition(resolveIntro(ep,1800,saved),120,1800),null);
 assert.equal(skipIntroPosition(resolveIntro(ep,1800,saved),60,1800,{length:1,start:()=>120,end:()=>600}),null);
 assert.equal(confirmedIntro(32,132,1800).end,132);
 assert.equal(confirmedIntro(32,34,1800),null);
 assert.equal(confirmedIntro(0,900,1800),null);
 assert.equal(resolveIntro({...ep,type:'vod'},1800,{}),null);
 assert.equal(resolveIntro(ep,300,{}),null);
});
test('intro skip controls are series-specific and are bundled for PWA',async()=>{
 const {readFile}=await import('node:fs/promises');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 const server=await readFile(new URL('../server.mjs',import.meta.url),'utf8');
 const sw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
 for(const id of ['skipIntroButton','introAdjustButton','introSettings','markIntroStart','markIntroEnd','resetIntroMark'])assert.equal(html.split('id="'+id+'"').length-1,1);
 assert.match(app,/introSeasonKey\(state\.current\)/);
 assert.match(app,/updateIntroControls\(\);updateUpNext\(\)/);
 assert.match(app,/state\.introManual\[key\]=mark/);
 assert.match(app,/introStorageKey\(/);
 assert.match(server,/\/src\/intro\.mjs/);
 assert.match(sw,/\/src\/intro\.mjs/);
});

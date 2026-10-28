import test from 'node:test';
import assert from 'node:assert/strict';
import {seekTarget,formatTime,progressRecord,flattenEpisodes} from '../src/playback.mjs';
import {contentMetadata} from '../src/content.mjs';
import {selectRating,createRatingLookup} from '../lib/ratings.mjs';
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
 const result=await lookup('Série','series');assert.equal(result.ageLabel,'TV-14');await lookup('Série','series');assert.equal(calls,2);await lookup('Série','series','',{refresh:true});assert.equal(calls,4);
 const unavailable=createRatingLookup(async()=>{throw new Error('offline');});assert.equal(await unavailable('Série','series'),null);
});

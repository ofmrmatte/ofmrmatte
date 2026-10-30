import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDiscovery,remoteIndex,matchRemote,dailySelection,simklArtwork} from '../lib/discovery.mjs';
import {verifiedTrailer} from '../lib/public-metadata.mjs';
import {createTmdb,selectTmdb} from '../lib/tmdb.mjs';
import {classindIndex,selectClassind} from '../lib/classind.mjs';
import {mergeCatalogMetadata,certification} from '../src/content.mjs';
import {createAudience} from '../lib/audience.mjs';
import {allowAutomaticPreview} from '../src/hero-preview.mjs';
import {cleanTitle,selectRating} from '../lib/ratings.mjs';
import {displayTitle} from '../src/highlights.mjs';
const reply=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
const movie=(id,title,year='2024')=>({title,alt_titles:[{name:'Título '+id}],ids:{simkl_id:id,tmdb:String(id)},release_date:'01/01/'+year,watched:100-id,url:'/movies/'+id+'/title',fanart:'20/123456abc'});
test('cruzamento de tendências rejeita títulos ambíguos e remakes, usa aliases e IDs verificados',()=>{
  const rows=[movie(1,'Original'),movie(2,'Remake','1990'),movie(3,'Remake','2020')],index=remoteIndex(rows);
  assert.equal(matchRemote({name:'Título 1 – 2026 (L)'},index)?.ids.simkl_id,1);
  assert.equal(matchRemote({name:'Remake'},index),null);
  assert.equal(matchRemote({name:'Remake',releaseDate:'2020-01-01'},index)?.ids.simkl_id,3);
  assert.equal(matchRemote({name:'Original',year:'2023'},index),null);
  assert.equal(matchRemote({name:'Nome divergente',tmdb_id:'1'},index)?.ids.simkl_id,1);
  assert.equal(matchRemote({name:'Outro título'},index),null);
});
test('números que fazem parte do título não viram ano decorativo nem causam classificação de outra obra',()=>{
 assert.equal(cleanTitle('Blade Runner 2049'),'blade runner 2049');
 assert.equal(cleanTitle('2001: Uma Odisseia no Espaço'),'2001 uma odisseia no espaco');
 assert.equal(selectRating([{trackName:'Blade Runner',contentAdvisoryRating:'R'}],'Blade Runner 2049','vod','','us'),null);
 assert.equal(displayTitle('Ali G Ken e Eu – 2026 (L)'),'Ali G Ken e Eu');
});
test('seleção do dia é estável no mesmo dia e muda sem inventar audiência',()=>{
  const items=Array.from({length:40},(_,i)=>({id:'vod:'+i,type:'vod',name:'Filme '+i}));
  assert.deepEqual(dailySelection(items,'2026-10-29'),dailySelection(items,'2026-10-29'));
  assert.notDeepEqual(dailySelection(items,'2026-10-29'),dailySelection(items,'2026-10-30'));
});
test('descoberta persiste cache diário e só ranqueia correspondências disponíveis e permitidas',async t=>{
  const cacheDir=await mkdtemp(join(tmpdir(),'mf-discovery-'));t.after(()=>rm(cacheDir,{recursive:true,force:true}));let calls=0;
  const service=createDiscovery({cacheDir,fetcher:async url=>{calls++;return reply(url.includes('/movies/')?[movie(1,'Filme A'),movie(2,'Restrito')]:[movie(3,'Série A')]);}});
  const local=(id,type,name)=>({id:type+':'+id,sourceId:String(id),type,name,logo:'https://example.test/image'});
  const catalog={vod:[local(22,'vod','Filme A'),local(23,'vod','Restrito'),local(24,'vod','Indisponível na fonte')],series:[local(33,'series','Série A')]};
  const result=await service.build(catalog,item=>item.sourceId!=='23');
  assert.equal(calls,3);assert.equal(result.rankings.vod.length,1);assert.equal(result.rankings.vod[0].id,'vod:22');assert.equal(result.rankings.vod[0].position,1);assert.equal(result.source.name,'Simkl');
  const restored=createDiscovery({cacheDir,fetcher:()=>{throw Error('Cache deve evitar rede');}});assert.equal((await restored.build(catalog,()=>true)).status,'ready');
  assert.equal((await restored.build(catalog,()=>true)).rankings.vod.length,2);
});
test('imagens de fundo têm origem derivada e cache persistente sem download repetido',async t=>{
  const cacheDir=await mkdtemp(join(tmpdir(),'mf-art-'));t.after(()=>rm(cacheDir,{recursive:true,force:true}));let calls=0;
  const service=createDiscovery({cacheDir,enabled:false,fetcher:async()=>{calls++;return new Response('image fixture',{headers:{'Content-Type':'image/webp'}});}});
  const url=simklArtwork(movie(1,'Teste'));const [a,b]=await Promise.all([service.artwork(url),service.artwork(url)]);assert.equal(calls,1);assert.equal(a.bytes.toString(),b.bytes.toString());
  const restored=createDiscovery({cacheDir,enabled:false,fetcher:()=>{throw Error('Não baixar novamente');}});assert.equal((await restored.artwork(url)).bytes.toString(),'image fixture');assert.equal(await restored.artwork('http://localhost/private'),null);
});
test('trailers oficiais exigem canal publicador reconhecido; autoplay respeita conexão e dispositivo',()=>{
  const info={author_url:'https://www.youtube.com/@Netflix',author_name:'Netflix',title:'Obra | Trailer oficial'};
  assert.equal(verifiedTrailer(info,'abcdefghijk').official,true);
  assert.equal(verifiedTrailer({...info,author_url:'https://www.youtube.com/@canal-de-fas'},'abcdefghijk'),null);
  assert.equal(verifiedTrailer({...info,author_url:'https://www.youtube.com.evil/@Netflix'},'abcdefghijk'),null);
  assert.equal(verifiedTrailer(info,'invalid'),null);
  const context={hovered:true,width:1280,visible:true};assert.equal(allowAutomaticPreview(context),true);
  for(const extra of [{width:280},{reducedMotion:true},{saveData:true},{effectiveType:'2g'},{playing:true},{hidden:true},{visible:false}])assert.equal(allowAutomaticPreview({...context,...extra}),false);
});
test('TMDB opcional não faz chamadas sem chave; resolve BR e rejeita trailers não oficiais',async t=>{
  assert.equal(await createTmdb({fetcher:()=>{throw Error('Sem chave');}}).lookup('Filme','vod'),null);
  let calls=0;const service=createTmdb({token:'fixture-private-token',fetcher:async(url,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer fixture-private-token');return reply(url.includes('/search/')?{results:[{id:1,title:'Filme',release_date:'2024-01-01'}]}:{id:1,title:'Filme',overview:'Sinopse',release_dates:{results:[{iso_3166_1:'BR',release_dates:[{certification:'14'}]}]},videos:{results:[{site:'YouTube',type:'Trailer',key:'abcdefghijk',official:false}]}});}});
  const [a,b]=await Promise.all([service.lookup('Filme','vod','2024'),service.lookup('Filme','vod','2024')]);assert.equal(calls,2);assert.equal(a.rating.ageLabel,'14');assert.equal(a.rating.ageCountry,'BR');assert.equal(b.trailer,null);
  assert.equal(selectTmdb([{id:1,title:'Filme',release_date:'2000'}],'Filme','vod','2024'),null);
});
test('ClassInd normaliza CSV oficial, recusa divergências e não trata nota como idade',()=>{
  const rows=classindIndex('Título no Brasil;Título original;Ano de produção;Classificação Indicativa\n"Um; Filme";Original;2024;14 anos\nLivre Teste;Free;2020;Livre');
  assert.equal(rows[0].title,'Um; Filme');assert.equal(selectClassind(rows,'Original','2024').age,14);assert.equal(selectClassind(rows,'Free','2020').ageLabel,'L');assert.equal(selectClassind(rows,'Original','2023'),null);
  assert.equal(selectClassind([...rows,{...rows[0],rating:'16'}],'Original','2024'),null);assert.throws(()=>classindIndex('Título;Nota\nFilme;9.1'));
  assert.equal(certification({classification:'Não recomendado para menores de 16 anos'}).age,16);
  assert.equal(certification({rating:9.1,vote_average:8.8}).age,null);
});
test('revalidação de catálogo preserva classificação confirmada e prioriza certificado BR',()=>{
  const base={age:null,ageLabel:'Não informada',adult:false,description:''},verified={age:14,ageLabel:'14',ageSource:'Apple TV',ageCountry:'BR'};
  assert.equal(mergeCatalogMetadata(base,verified,null).age,14);
  assert.equal(mergeCatalogMetadata(base,{age:18,ageLabel:'TV-MA',ageSource:'Apple TV',ageCountry:'US'},verified).age,14);
  assert.equal(mergeCatalogMetadata(base,null,null).age,null);
});
test('audiência deduplica perfil/título/dia, persiste e exige amostra antes de liberar ranking interno',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'mf-audience-'));t.after(()=>rm(dir,{recursive:true,force:true}));let time=Date.parse('2026-10-29');const file=join(dir,'audience.json'),store=createAudience({file,now:()=>time}),items=[{id:'a'},{id:'b'},{id:'c'}];
  assert.equal(await store.record('a','profile1'),true);assert.equal(await store.record('a','profile1'),false);assert.equal((await store.rankings(items,i=>i.id)).available,false);
  for(let p=1;p<=5;p++)for(const key of ['a','b','c'])await store.record(key,'profile'+p);
  const ranking=await store.rankings(items,i=>i.id);assert.equal(ranking.available,true);assert.equal(ranking.items[0].views,5);assert.ok(!JSON.stringify(ranking).includes('profile1'));
  const restored=createAudience({file,now:()=>time});assert.equal((await restored.rankings(items,i=>i.id)).items[0].views,5);time+=86400000;assert.equal(await restored.record('a','profile1'),true);
});

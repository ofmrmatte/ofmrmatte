import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';

function fakeXtream(req,res){
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/player_api.php' && u.searchParams.get('username')==='offsite') {
  res.writeHead(302,{Location:'https://example.org/collect?username=offsite'});return res.end();
 }
 if(u.pathname==='/player_api.php' && u.searchParams.get('username')==='htmlresponse') {
  res.writeHead(200,{'Content-Type':'text/html'});return res.end('<html>Not an API</html>');
 }
 if(u.pathname==='/player_api.php' && u.searchParams.get('username')==='invalidschema') {
  res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Not an Xtream endpoint'}));
 }
 if(u.pathname==='/player_api.php'){
  if(u.searchParams.get('username')!=='testuser'||u.searchParams.get('password')!=='testpass'){
   res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({user_info:{auth:0}}));
  }
  const action=u.searchParams.get('action');let data;
  if(!action)data={user_info:{auth:1,status:'Active',max_connections:2,active_cons:0,exp_date:'0'}};
  else if(action.endsWith('_categories'))data=[{category_id:'1',category_name:'Ação'}];
  else if(action==='get_live_streams')data=[{stream_id:11,name:'Canal Teste',category_id:'1'}];
  else if(action==='get_vod_streams')data=[{stream_id:22,name:'Filme Teste',category_id:'1'}];
  else if(action==='get_series')data=[{series_id:33,name:'Série Teste',category_id:'1'}];
  else if(action==='get_series_info')data={info:{plot:'Descrição teste'},episodes:{'1':[{id:44,episode_num:1,title:'Piloto',container_extension:'mp4'}]}};
  else data=[];
  res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(data));
 }
 if(u.pathname==='/live/testuser/testpass/11.m3u8'){
  res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl'});
  return res.end('#EXTM3U\n#EXTINF:5,\n/segment.ts\n');
 }
 if(u.pathname==='/segment.ts'){
  res.writeHead(200,{'Content-Type':'video/mp2t'});return res.end('TS_EXAMPLE');
 }
 res.writeHead(404);res.end('not found');
}
async function startApp(t, {allowPrivate=true,ratings=false} = {}) {
 const dataDir=await mkdtemp(join(tmpdir(),'mfstream-integration-'));
 t.after(async()=>{assert.ok(resolve(dataDir).startsWith(resolve(tmpdir())+sep+'mfstream-integration-'));await rm(dataDir,{recursive:true,force:true});});
 const app=spawn(process.execPath,['server.mjs'],{cwd:resolve(import.meta.dirname,'..'),env:{...process.env,PORT:'0',APP_AUTH_ENABLED:'0',RATING_LOOKUP_ENABLED:ratings?'1':'0',APP_DATA_DIR:'',PARENTAL_DATA_DIR:dataDir,ALLOW_PRIVATE_XTREAM_HOSTS:allowPrivate?'1':'0'},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{if(app.exitCode===null){app.kill();await once(app,'exit');}});
 let stderr='';app.stderr.on('data',chunk=>{stderr+=chunk;});
 const lines=createInterface({input:app.stdout});
 try {
  return await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>finish(new Error('O servidor não iniciou.')),6000);
   function onExit(){finish(new Error(`O servidor encerrou antes de iniciar: ${stderr}`));}
   function finish(error,origin){clearTimeout(timer);app.off('exit',onExit);app.off('error',finish);error?reject(error):resolve(origin);}
   app.once('exit',onExit);app.once('error',finish);
   lines.on('line',line=>{const match=/disponível na porta (\d+)/.exec(line);if(match)finish(null,`http://127.0.0.1:${match[1]}`);});
  });
 } finally {lines.close();}
}

test('fluxo completo: app, login Xtream, catálogo, séries, manifesto e logout',async t=>{
 const provider=createServer(fakeXtream);provider.listen(0,'127.0.0.1');await once(provider,'listening');
 const providerPort=provider.address().port;
 t.after(()=>new Promise(resolve=>provider.close(resolve)));
 const origin=await startApp(t);
 const shell=await (await fetch(origin)).text();assert.match(shell,/MF Stream IPTV/);assert.match(shell,/id="listName"/);
 for(const asset of ['/manifest.webmanifest','/service-worker.js','/assets/icon-192.png','/src/styles.css','/src/title-sheet.css','/src/episode-tray.css','/src/mobile.css','/src/mobile.mjs','/vendor/gsap.js'])assert.equal((await fetch(origin+asset)).status,200,asset);
 let res=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://localhost:${providerPort}`,username:'testuser',password:'invalid'})});assert.equal(res.status,401);
 res=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listName:'iptv',url:`http://localhost:${providerPort}`,username:'testuser',password:'testpass'})});assert.equal(res.status,200);
 const {token,host,account}=await res.json();assert.ok(token);assert.equal(account.listName,'iptv');assert.equal(host,`http://localhost:${providerPort}`);
 // Diagnostic uses only the server URL; it must not send credentials.
 let diagnosis=await fetch(origin+'/api/diagnose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://localhost:${providerPort}`})});
 assert.equal(diagnosis.status,200);
 const diagnosticBody=await diagnosis.json();
 assert.equal(diagnosticBody.reachable,true);
 assert.equal(diagnosticBody.httpStatus,200);
 assert.equal(diagnosticBody.attempts[0].code,'HTTP_RESPONSE');
 assert.equal(diagnosticBody.attempts[0].protocol,'HTTP');
 assert.doesNotMatch(JSON.stringify(diagnosticBody),/testuser|testpass/);
 const invalidSyntax=await fetch(origin+'/api/diagnose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:'file:///etc/passwd'})});
 assert.equal(invalidSyntax.status,400); // rejected before touching the network
 const denied=await invalidSyntax.json();assert.equal(denied.code,'BAD_SERVER_URL');
 const nonJson=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://127.0.0.1:${providerPort}`,username:'htmlresponse',password:'any'})});
 assert.equal(nonJson.status,502);assert.equal((await nonJson.json()).code,'INVALID_JSON');
 const crossDomain=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://127.0.0.1:${providerPort}`,username:'offsite',password:'privateSecret'})});
 assert.equal(crossDomain.status,502);
 const prevented=await crossDomain.json();assert.equal(prevented.code,'REDIRECT_EXTERNAL');
 assert.doesNotMatch(JSON.stringify(prevented),/privateSecret|offsite/);
 const badSchema=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://127.0.0.1:${providerPort}`,username:'invalidschema',password:'any'})});
 assert.equal(badSchema.status,502);assert.equal((await badSchema.json()).code,'INVALID_XTREAM');
 const headers={'x-session-token':token};
 assert.equal((await fetch(origin+'/api/account',{headers})).status,200);
 const profile=await (await fetch(origin+'/api/account',{headers})).json();assert.equal(profile.account.listName,'iptv');
 for(const kind of ['live','vod','series']){
  const cats=await (await fetch(`${origin}/api/catalog?section=${kind}&kind=categories`,{headers})).json();assert.equal(cats.data[0].category_name,'Ação');
  const items=await (await fetch(`${origin}/api/catalog?section=${kind}&kind=items`,{headers})).json();assert.equal(items.data.length,1);
 }
 const info=await (await fetch(origin+'/api/catalog?section=series&kind=info&series_id=33',{headers})).json();assert.equal(info.data.episodes['1'][0].title,'Piloto');
 const playlist=await (await fetch(origin+`/api/stream/${token}/live/11.m3u8`)).text();assert.match(playlist,/\/api\/media\//);assert.doesNotMatch(playlist,/testpass/);
 const media=playlist.split('\n').find(x=>x.startsWith('/api/media/'));const segment=await (await fetch(origin+media)).text();assert.equal(segment,'TS_EXAMPLE');
 res=await fetch(origin+'/api/logout',{method:'POST',headers});assert.equal(res.status,200);
 assert.equal((await fetch(origin+'/api/account',{headers})).status,401);
});


test('diagnostica conexões recusadas sem revelar URL com credenciais',async t=>{
 const closedServer=createServer((_req,res)=>res.end('unused'));
 closedServer.listen(0,'127.0.0.1');await once(closedServer,'listening');
 const closedPort=closedServer.address().port;
 await new Promise((resolve,reject)=>closedServer.close(err=>err?reject(err):resolve()));
 const origin=await startApp(t);
 const res=await fetch(origin+'/api/diagnose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://127.0.0.1:${closedPort}`})});
 assert.equal(res.status,502);
 const body=await res.json();assert.equal(body.code,'CONNECTION_REFUSED');
 assert.match(body.hint,/porta/);assert.doesNotMatch(JSON.stringify(body),/password|username/);
});

test('login segue domínio Xtream e usa o destino para catálogo e mídia',async t=>{
 let receivedCredentials=false;
 const provider=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/player_api.php') receivedCredentials=url.searchParams.get('username')==='testuser' && url.searchParams.get('password')==='testpass';
  fakeXtream(req,res);
 });
 provider.listen(0,'127.0.0.1');await once(provider,'listening');
 t.after(()=>new Promise(resolve=>provider.close(resolve)));
 const target=`http://localhost:${provider.address().port}`;
 let redirects=0;
 const entry=createServer((req,res)=>{
  redirects++;
  res.writeHead(302,{Location:new URL(req.url,target).href});res.end();
 });
 entry.listen(0,'127.0.0.1');await once(entry,'listening');
 t.after(()=>new Promise(resolve=>entry.close(resolve)));
 const origin=await startApp(t);
 const response=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listName:'iptv',url:`http://127.0.0.1:${entry.address().port}`,username:'testuser',password:'testpass'})});
 assert.equal(response.status,200);
 const {token,host,account}=await response.json();
 assert.ok(token);assert.equal(host,target);assert.equal(account.status,'Active');assert.equal(account.listName,'iptv');assert.equal(receivedCredentials,true);
 const headers={'x-session-token':token};
 const catalog=await fetch(origin+'/api/catalog?section=live&kind=items',{headers});
 assert.equal(catalog.status,200);assert.equal((await catalog.json()).data[0].stream_id,11);
 const stream=await fetch(origin+`/api/stream/${token}/live/11.m3u8`);
 assert.equal(stream.status,200);
 const manifest=await stream.text();assert.doesNotMatch(manifest,/testpass/);
 const media=manifest.split('\n').find(line=>line.startsWith('/api/media/'));
 assert.equal(await (await fetch(origin+media)).text(),'TS_EXAMPLE');
 assert.equal(redirects,1);
 await fetch(origin+'/api/logout',{method:'POST',headers});
});

test('redirecionamento circular é interrompido sem criar sessão',async t=>{
 let redirects=0;
 const provider=createServer((req,res)=>{redirects++;res.writeHead(302,{Location:req.url});res.end();});
 provider.listen(0,'127.0.0.1');await once(provider,'listening');
 t.after(()=>new Promise(resolve=>provider.close(resolve)));
 const origin=await startApp(t);
 const response=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://127.0.0.1:${provider.address().port}`,username:'testuser',password:'testpass'})});
 const body=await response.json();
 assert.equal(response.status,502);assert.equal(body.code,'CONNECTION_RESET');assert.equal(body.token,undefined);
 assert.equal(redirects,5);assert.doesNotMatch(JSON.stringify(body),/testuser|testpass/);
});

test('conexão em produção continua recusando destinos privados antes de enviar credenciais',async t=>{
 let requests=0;
 const provider=createServer((_req,res)=>{requests++;res.end('{}');});
 provider.listen(0,'127.0.0.1');await once(provider,'listening');
 t.after(()=>new Promise(resolve=>provider.close(resolve)));
 const origin=await startApp(t,{allowPrivate:false});
 const response=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`http://127.0.0.1:${provider.address().port}`,username:'testuser',password:'testpass'})});
 const body=await response.json();
 assert.equal(response.status,400);assert.equal(body.code,'PRIVATE_ADDRESS');assert.equal(requests,0);
 assert.doesNotMatch(JSON.stringify(body),/testuser|testpass/);
});

test('proteção parental filtra API e bloqueia URLs diretas, detalhes e sessões paralelas',async t=>{
 const provider=createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),action=u.searchParams.get('action');
  if(action==='get_live_categories')return res.end(JSON.stringify([{category_id:'1',category_name:'Família'},{category_id:'2',category_name:'ADULTOS'}]));
  if(action==='get_live_streams')return res.end(JSON.stringify([{stream_id:11,name:'Canal Teste',category_id:'1',age_rating:'L'},{stream_id:12,name:'Canal privado',category_id:'2',is_adult:'1'}]));
  if(action==='get_vod_streams')return res.end(JSON.stringify([{stream_id:22,name:'Filme Teste',category_id:'1',age_rating:14},{stream_id:23,name:'Sem classificação',category_id:'1'}]));
  if(action==='get_vod_info')return res.end(JSON.stringify({info:{plot:'Sinopse fornecida pelo servidor',age_rating:16,genre:'Drama'}}));
  return fakeXtream(req,res);
 });
 provider.listen(0,'127.0.0.1');await once(provider,'listening');t.after(()=>new Promise(resolve=>provider.close(resolve)));
 const origin=await startApp(t),body={url:`http://127.0.0.1:${provider.address().port}`,username:'testuser',password:'testpass'};
 const login=async()=>(await (await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json()).token;
 const token=await login(),other=await login(),headers={'x-session-token':token};
 const update=async policy=>fetch(origin+'/api/parental',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(policy)});
 let response=await fetch(origin+'/api/catalog?section=live&kind=items',{headers});assert.deepEqual((await response.json()).data.map(x=>x.stream_id),[11]);
 response=await fetch(origin+'/api/catalog?section=live&kind=categories',{headers});assert.equal((await response.json()).data.length,1);
 assert.equal((await fetch(origin+`/api/stream/${token}/live/12.m3u8`)).status,403);
 response=await fetch(origin+'/api/catalog?section=vod&kind=info&vod_id=22',{headers});assert.equal(response.status,200);assert.equal((await response.json()).data.metadata.age,16);
 response=await fetch(origin+`/api/stream/${token}/live/11.m3u8`);const media=(await response.text()).split('\n').find(x=>x.startsWith('/api/media/'));
 response=await update({hideAdult:true,maxAge:12,blockUnknown:true,newPin:'7429'});assert.equal(response.status,200);assert.equal((await response.json()).pinSet,true);
 assert.equal((await fetch(origin+media)).status,404);
 assert.equal((await fetch(origin+`/api/stream/${other}/vod/22.mp4`)).status,403);
 assert.equal((await fetch(origin+'/api/catalog?section=vod&kind=info&vod_id=22',{headers})).status,403);
 response=await fetch(origin+'/api/catalog?section=vod&kind=items',{headers});assert.equal((await response.json()).data.length,0);
 response=await update({hideAdult:false,maxAge:null,blockUnknown:false,pin:'0000'});assert.equal(response.status,403);
 const newToken=await login();response=await fetch(origin+'/api/parental',{headers:{'x-session-token':newToken}});assert.equal((await response.json()).maxAge,12);
 response=await update({hideAdult:false,maxAge:null,blockUnknown:false,pin:'7429'});assert.equal(response.status,200);
 response=await fetch(origin+'/api/catalog?section=live&kind=items',{headers});assert.equal((await response.json()).data.length,2);
});

test('rotas individuais de filmes e séries servem o aplicativo',async t=>{
 const origin=await startApp(t);
 for(const path of ['/title/movie/22','/title/series/33','/title/movie/22/']){
  const response=await fetch(origin+path);
  assert.equal(response.status,200,path);
  assert.match(response.headers.get('content-type')||'',/text\/html/);
  assert.match(await response.text(),/id="detailsModal"/);
 }
 for(const path of ['/title/movie/invalid','/title/series/33/extra','/title/other/22'])
  assert.equal((await fetch(origin+path)).status,404,path);
});
test('o JavaScript da interface é sintaticamente válido',async()=>{
 const {execFileSync}=await import('node:child_process');
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check','src/app.js'],{cwd:resolve(import.meta.dirname,'..'),encoding:'utf8'}));
});

test('inicia com classificações habilitadas sem APP_DATA_DIR configurado',async t=>{const origin=await startApp(t,{ratings:true});const response=await fetch(origin+'/healthz');assert.equal(response.status,200);assert.equal((await response.json()).ok,true);});

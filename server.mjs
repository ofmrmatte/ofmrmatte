import { createServer } from 'node:http';
import http from 'node:http';
import https from 'node:https';
import { readFile, stat, writeFile, rename, mkdir } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup, resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';
import { randomBytes } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { isAllowedApiRedirect, pinnedLookup, tryAddresses } from './lib/connect.mjs';
import {createParentalStore,parentalKey} from './lib/parental.mjs';
import {contentMetadata,contentAllowed} from './src/content.mjs';
import {createRatingLookup} from './lib/ratings.mjs';
import {createAccess} from './lib/access.mjs';
const lookupRating=process.env.RATING_LOOKUP_ENABLED==='0'?async()=>null:createRatingLookup();
import { CATALOG_ACTIONS, SECTIONS, normalizeServerUrl, apiUrl, buildStreamUrl, rewriteHlsManifest } from './src/xtream.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
if(process.env.APP_AUTH_ENABLED!=='0'){try{process.loadEnvFile(resolve(root,'.env'));}catch(error){if(error.code!=='ENOENT')throw error;}}
const port = Number.parseInt(process.env.PORT || '3000', 10);
const fixedMode=process.env.APP_AUTH_ENABLED!=='0'&&!!(process.env.XTREAM_URL&&process.env.XTREAM_USERNAME&&process.env.XTREAM_PASSWORD);
if(process.env.APP_AUTH_ENABLED==='1'&&!fixedMode)throw new Error('Configure as variáveis XTREAM_URL, XTREAM_USERNAME e XTREAM_PASSWORD.');
const appBase=process.env.BETTER_AUTH_URL||(process.env.RAILWAY_PUBLIC_DOMAIN?'https://'+process.env.RAILWAY_PUBLIC_DOMAIN:`http://localhost:${port||3000}`);
const access=fixedMode?await createAccess({dataDir:process.env.APP_DATA_DIR||resolve(root,'.data'),baseURL:appBase,secret:process.env.BETTER_AUTH_SECRET,registrationCode:process.env.REGISTRATION_CODE,adminSetupToken:process.env.ADMIN_SETUP_TOKEN,databaseURL:process.env.DATABASE_URL,cookiePrefix:process.env.AUTH_COOKIE_PREFIX||'mf-stream'}):null;
const privateHosts = process.env.ALLOW_PRIVATE_XTREAM_HOSTS === '1';
const sessions = new Map();
const globalConfigPath=resolve(process.env.APP_DATA_DIR||resolve(root,'.data'),'xtream-global.json');
let globalXtream={};try{globalXtream=JSON.parse(await readFile(globalConfigPath,'utf8'))}catch(error){if(error.code!=='ENOENT')console.error('Global Xtream configuration:',error.message)}
const activeXtream=()=>({name:globalXtream.name||'MF Stream',url:globalXtream.url||process.env.XTREAM_URL,username:globalXtream.username||process.env.XTREAM_USERNAME,password:globalXtream.password||process.env.XTREAM_PASSWORD});

const parental=await createParentalStore(resolve(process.env.PARENTAL_DATA_DIR || resolve(root,'.data'),'parental.json'));
const SESSION_IDLE_MS = 2 * 60 * 60_000;
const MAX_BODY = 8_000;
const MAX_API_JSON = 30_000_000;
const MAX_MANIFEST = 2_000_000;
const DNS_WAIT_MS = 5500;
const CONNECT_WAIT_MS = 12000;
const staticPaths = new Set(['/', '/index.html', '/manifest.webmanifest', '/service-worker.js', '/src/favicon.svg', '/src/styles.css', '/src/app.js', '/src/access-ui.mjs', '/src/xtream.mjs', '/src/content.mjs', '/src/playback.mjs', '/src/library.css', '/admin', '/admin/', '/admin.html', '/src/admin.mjs', '/src/admin.css', '/assets/icon-192.png', '/assets/icon-512.png']);
const vendorPaths=new Map(['/vendor/plyr.js','/vendor/plyr.css','/vendor/plyr.svg'].map(path=>[path,resolve(root,'node_modules/plyr/dist',path.endsWith('.js')?'plyr.min.js':path.endsWith('.css')?'plyr.css':'plyr.svg')]));for(const path of vendorPaths.keys())staticPaths.add(path);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json' };
const securityHeaders = { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY' };

function send(res, status, data) {
  if (res.headersSent) return res.end();
  res.writeHead(status, { ...securityHeaders, 'Content-Type':'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
// Only expose predefined diagnoses to the browser: network errors can contain
// credentials in request URLs and must never be returned verbatim.
const KNOWN_FAILURES = Object.freeze({
  DNS_NOT_FOUND: ['O domínio do servidor não foi encontrado (DNS).', 'Confira se o endereço está correto e se o domínio continua ativo.'],
  DNS_TEMPORARY: ['Não foi possível consultar o DNS agora.', 'Verifique sua conexão ou DNS e tente novamente.'],
  CONNECTION_REFUSED: ['O servidor recusou a conexão.', 'Confirme com seu provedor a porta correta, caso exista (ex.: :8080).'],
  CONNECTION_RESET: ['O servidor encerrou a conexão antes de responder.', 'Confirme a URL e se o serviço permite conexão por HTTP ou HTTPS.'],
  NETWORK_UNREACHABLE: ['Não foi possível alcançar a rede do servidor.', 'Confira sua rede, VPN ou eventual bloqueio pelo provedor.'],
  TIMED_OUT: ['O servidor demorou demais para responder.', 'Confira se o serviço está disponível e se a porta informada está correta.'],
  TLS_ERROR: ['Falha na conexão HTTPS com o provedor.', 'Confirme se a URL utiliza o protocolo correto e se o certificado HTTPS está válido.'],
  INVALID_JSON: ['O servidor respondeu, mas não retornou JSON compatível com Xtream.', 'Confirme a URL, a porta e se o serviço oferece Xtream Codes API.'],
  INVALID_XTREAM: ['O endereço respondeu, mas não retornou uma conta Xtream reconhecível.', 'Verifique se o endereço corresponde à API Xtream, e não ao site ou portal comercial.'],
  CREDENTIALS_INVALID: ['O servidor Xtream recusou o usuário ou a senha.', 'Confira as credenciais com seu provedor.'],
  ACCOUNT_INACTIVE: ['A conta existe, mas não está ativa.', 'Entre em contato com o provedor para verificar a situação da assinatura.'],
  PRIVATE_ADDRESS: ['Este endereço é privado ou reservado e foi bloqueado.', 'Informe um domínio público ou habilite o modo de rede local apenas em ambiente confiável.'],
  BAD_SERVER_URL: ['Informe uma URL HTTP ou HTTPS válida, com domínio e porta quando necessário.', 'Exemplo: http://exemplo.com:8080 (sem usuário nem senha na URL).'],
  UNKNOWN: ['A conexão não pôde ser concluída.', 'Verifique o relatório técnico abaixo. Se o servidor não responder, confirme o endereço atualizado com o provedor.'],
  REDIRECT_EXTERNAL: ['O servidor retornou um redirecionamento incompatível com a API Xtream.', 'O destino deve manter a mesma API e os dados da consulta, sem reduzir a proteção HTTPS.'],
});
function fault(code, extra = {}) { return Object.assign(new Error(code), { publicCode:code, ...extra }); }
function classifyFailure(err) {
  if (err?.publicCode && KNOWN_FAILURES[err.publicCode]) return err.publicCode;
  const code = String(err?.code || err?.cause?.code || err?.errors?.[0]?.code || '');
  if (['ENOTFOUND', 'ENODATA'].includes(code)) return 'DNS_NOT_FOUND';
  if (code === 'EAI_AGAIN') return 'DNS_TEMPORARY';
  if (code === 'ECONNREFUSED') return 'CONNECTION_REFUSED';
  if (['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET'].includes(code)) return 'CONNECTION_RESET';
  if (['EHOSTUNREACH', 'ENETUNREACH'].includes(code)) return 'NETWORK_UNREACHABLE';
  if (['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT'].includes(code)) return 'TIMED_OUT';
  if (/^(ERR_TLS|ERR_SSL|CERT_|DEPTH_ZERO_SELF_SIGNED_CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE)/.test(code)) return 'TLS_ERROR';
  if (/^Endereço do servidor privado ou reservado/.test(String(err?.message || ''))) return 'PRIVATE_ADDRESS';
  if (/^(Informe|Use uma URL|URL do servidor)/.test(String(err?.message || ''))) return 'BAD_SERVER_URL';
  return 'UNKNOWN';
}
function safeFailure(err) {
  if (Number.isInteger(err?.providerStatus)) {
    const status = err.providerStatus;
    let hint = status === 404 ? 'O caminho player_api.php não foi encontrado; confirme o endereço e a porta.'
      : [401,403].includes(status) ? 'O servidor pode exigir outra URL ou restringir o acesso à API.'
      : status >= 500 ? 'O provedor está retornando um erro interno; tente mais tarde ou contate-o.'
      : 'Confirme a URL e a porta informadas pelo provedor.';
    return {code:'PROVIDER_HTTP', error:`O servidor respondeu HTTP ${status}.`, hint};
  }
  const code = classifyFailure(err);
  return {code, error:KNOWN_FAILURES[code][0], hint:KNOWN_FAILURES[code][1], stage:err?.stage || 'connection'};
}
function sendFailure(res, status, err) { return send(res,status,safeFailure(err)); }
function isPublicAddress(addr) {
  const ipType = isIP(addr);
  if (ipType === 4) {
    const [a,b,c] = addr.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && (b === 168 || b === 0 && c === 0 || b === 0 && c === 2) || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19 || b === 51 && c === 100) || a === 203 && b === 0 && c === 113 || a === 192 && b === 88 && c === 99);
  }
  if (ipType === 6) {
    const v = addr.toLowerCase();
    if (v.includes('.')) return false; // mapped IPv4 addresses are not permitted.
    return v.startsWith('2') || v.startsWith('3'); // 2000::/3 routable global addresses
  }
  return false;
}
// Resolve via the operating system first. If DNS is failing, query Cloudflare
// over authenticated HTTPS using its known public address (no credentials sent).
// This is a DNS fallback, not a way to override a reachable DNS response.
async function cloudflareDns(hostname) {
  const answers=[];
  for (const type of ['A','AAAA']) {
    try {
      const result = await new Promise((resolveAnswer,reject) => {
        const request = https.request({
          hostname:'1.1.1.1', port:443, path:`/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`,
          servername:'cloudflare-dns.com', method:'GET',
          headers:{Host:'cloudflare-dns.com',Accept:'application/dns-json','User-Agent':'MFStreamIPTV/3.1.0'},
          timeout:3500,agent:false,
        },async response=> {
          try {
            if (response.statusCode !== 200) {response.resume();return resolveAnswer([]);}
            const json=JSON.parse(await readLimited(response,100_000));
            if (json.Status !== 0 || !Array.isArray(json.Answer)) return resolveAnswer([]);
            resolveAnswer(json.Answer.filter(row => row.type === (type === 'A' ? 1 : 28) && isIP(row.data) === (type === 'A' ? 4 : 6)).map(row=>({ address:row.data, family:type==='A'?4:6 })));
          } catch(error){reject(error);}
        });
        request.on('timeout',()=>request.destroy(Object.assign(new Error('DNS timeout'),{code:'ETIMEDOUT'})));
        request.on('error',reject);request.end();
      });
      answers.push(...result);
      if (type==='A' && result.length) break;
    } catch { /* DNS fallback is best-effort; preserve the native DNS error. */ }
  }
  return answers;
}
// Resolve using multiple independent routes. Always pin the validated IP for
// the connection itself to prevent a DNS-rebinding attack after validation.
async function pinnedAddresses(hostname) {
  if (isIP(hostname)) {
    if (!privateHosts && !isPublicAddress(hostname)) throw fault('PRIVATE_ADDRESS',{stage:'dns'});
    return [{address:hostname,family:isIP(hostname)}];
  }
  let entries = [], originalError;
  try {
    let timeout;
    try {
      entries=await Promise.race([
        lookup(hostname, { all:true, verbatim:true }),
        new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Object.assign(new Error('DNS timeout'),{code:'ETIMEDOUT'})),DNS_WAIT_MS);}),
      ]);
    } finally {clearTimeout(timeout);}
  } catch(error) {originalError=error;}
  if (!entries.length) {
    const [ipv4,ipv6] = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
    if (ipv4.status==='fulfilled') entries.push(...ipv4.value.map(address=>({address,family:4})));
    if (ipv6.status==='fulfilled') entries.push(...ipv6.value.map(address=>({address,family:6})));
    if (!originalError) originalError=ipv4.reason || ipv6.reason;
  }
  if (!entries.length) entries=await cloudflareDns(hostname);
  if (!entries.length) {
    if (originalError) {originalError.stage='dns';throw originalError;}
    throw fault('DNS_NOT_FOUND',{stage:'dns'});
  }
  // Reject any response that includes a reserved address; do not use DNS
  // failover as a way to bypass private-network protections.
  if (!privateHosts && entries.some(entry=>!isPublicAddress(entry.address))) throw fault('PRIVATE_ADDRESS',{stage:'dns'});
  const unique=new Map();
  for (const entry of entries) if (!unique.has(entry.address)) unique.set(entry.address,entry);
  return [...unique.values()].sort((a,b)=>a.family-b.family).slice(0,6);
}
function oneRemoteRequest(url, ip, options, redirects) {
  const mod = url.protocol === 'https:' ? https : http;
  return new Promise((done, reject) => {
    const request = mod.request(url, {
      method:'GET',
      headers:{
        'User-Agent':'MFStreamIPTV/3.1.0',
        'Accept':'application/json, text/plain, */*',
        'Accept-Encoding':'identity',
        'Connection':'close',
        ...(options.range ? { Range:options.range } : {}),
      },
      lookup:pinnedLookup(ip),
      timeout:CONNECT_WAIT_MS,
      agent:false,
    }, response => {
      if ([301,302,303,307,308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        let destination;
        try {destination=new URL(response.headers.location,url);} catch {return reject(fault('BAD_SERVER_URL',{stage:'redirect'}));}
        // Allow provider domain rotation for the same Xtream request. getRemote
        // resolves and validates every destination again before sending data.
        if (options.credentialed && !isAllowedApiRedirect(url,destination)) {
          return reject(fault('REDIRECT_EXTERNAL',{stage:'redirect'}));
        }
        getRemote(destination.href, options, redirects+1).then(done,reject);
      } else done({response,finalUrl:url.href});
    });
    request.on('timeout',()=>request.destroy(Object.assign(new Error('Connection timeout'),{code:'ETIMEDOUT',stage:'connect'})));
    request.on('error',error=>{error.stage ||= 'connect';reject(error);});
    request.end();
  });
}
async function getRemote(urlString, options = {}, redirects = 0) {
  if (redirects > 4) throw fault('CONNECTION_RESET',{stage:'redirect'});
  const url = new URL(urlString);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw fault('BAD_SERVER_URL',{stage:'url'});
  const ips=await pinnedAddresses(url.hostname);
  // Preserve the hostname (Host/SNI) while attempting each validated IP.
  return tryAddresses(ips, ip => oneRemoteRequest(url,ip,options,redirects));
}
async function readLimited(stream, maxBytes) {
  const chunks = []; let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) { stream.destroy(); throw new Error('Resposta acima do tamanho permitido.'); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
async function providerJson(url, {withEndpoint=false} = {}) {
  const {response,finalUrl} = await getRemote(url,{credentialed:true});
  if (response.statusCode !== 200) { response.resume(); throw fault('PROVIDER_HTTP', { providerStatus: response.statusCode }); }
  const text = await readLimited(response, MAX_API_JSON);
  let data;
  try { data=JSON.parse(text); } catch { throw fault('INVALID_JSON'); }
  return withEndpoint ? {data,finalUrl} : data;
}
async function getJsonBody(req,limit=MAX_BODY) {
  let length = 0; const chunks=[];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw new Error('Requisição acima do tamanho permitido.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function catalogFor(session,section) {
  let cached=session.catalogs.get(section);
  if(cached && Date.now()-cached.time<60000) return cached.promise;
  const promise=(async()=>{
    const [categories,items]=await Promise.all(['categories','items'].map(kind=>providerJson(apiUrl(session.base,session.username,session.password,CATALOG_ACTIONS[section][kind]))));
    const cats=Array.isArray(categories)?categories:[], rows=Array.isArray(items)?items:[];
    const groups=new Map(cats.map(c=>[String(c.category_id),String(c.category_name||'')]));
    for(const item of rows){const id=String(section==='series'?item.series_id:item.stream_id);session.entries.set(`${section}:${id}`,session.details.get(`${section}:${id}`)?.metadata||contentMetadata(item,groups.get(String(item.category_id))||''));}
    return {categories:cats,items:rows};
  })();
  session.catalogs.set(section,{time:Date.now(),promise});
  try{return await promise;}catch(error){session.catalogs.delete(section);throw error;}
}
async function allowedEntry(session,section,id,details=false,refresh=false) {
  const catalog=await catalogFor(session,section);
  const key=`${section}:${id}`;let metadata=session.entries.get(key);
  if(refresh)session.details.delete(key);
  if(!metadata)return null;
  if(!contentAllowed(metadata,parental.get(session.policyKey)) && !(details && metadata.age===null && !metadata.adult))return null;
  if(details && section!=='live' && !session.details.has(key)){
    const data=await providerJson(apiUrl(session.base,session.username,session.password,section==='vod'?'get_vod_info':'get_series_info',{[section==='vod'?'vod_id':'series_id']:id}));
    const info=contentMetadata({...data?.movie_data,...data?.info,...data});
    const classification=info.ageLabel==='Não informada'?(refresh&&metadata.ageSource==='Apple TV'?{age:null,ageLabel:'Não informada',ageCountry:'',ageSource:'',ageSourceUrl:'',ageReference:false}:Object.fromEntries(Object.entries(metadata).filter(([key])=>key.startsWith('age')))):Object.fromEntries(Object.entries(info).filter(([key])=>key.startsWith('age')));
    metadata={...metadata,...info,...classification,adult:metadata.adult||info.adult};
    if(metadata.ageLabel==='Não informada'){
      const item=catalog.items.find(item=>String(section==='series'?item.series_id:item.stream_id)===String(id));
      if(item){const rating=await lookupRating(item.name||data?.info?.name,section,item.releaseDate||item.release_date||'',{refresh});if(rating)metadata={...metadata,...rating,adult:metadata.adult||rating.age===18};}
    }
    session.entries.set(key,metadata);session.details.set(key,{...data,metadata});
  }
  return contentAllowed(metadata,parental.get(session.policyKey))?metadata:null;
}
function sessionFor(token) {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.lastUsed > SESSION_IDLE_MS) { sessions.delete(token); return null; }
  session.lastUsed = Date.now();
  return session;
}
function registerMedia(session, url) {
  const id = randomBytes(15).toString('base64url');
  // Keep only a bounded number of registered HLS fragments per session.
  if (session.media.size > 12_000) { const first = session.media.keys().next().value; session.media.delete(first); }
  session.media.set(id, url);
  return `/api/media/${session.token}/${id}`;
}
async function relayMedia(req, res, session, url) {
  session.activeMedia.add(res);res.once('close',()=>session.activeMedia.delete(res));
  const range = req.headers.range;
  try {
    const { response, finalUrl } = await getRemote(url, { range: typeof range === 'string' && /^bytes=\d*-\d*$/.test(range) ? range : undefined });
    if (![200,206].includes(response.statusCode)) { response.resume(); return send(res, 502, { error:`O provedor retornou HTTP ${response.statusCode} para esta mídia.` }); }
    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const isHls = /\.m3u8(?:$|[?#])/i.test(finalUrl) || /(?:mpegurl|vnd\.apple\.mpegurl)/i.test(contentType);
    if (isHls) {
      const text = await readLimited(response, MAX_MANIFEST);
      const rewritten = rewriteHlsManifest(text, finalUrl, target => registerMedia(session, target));
      res.writeHead(200, { ...securityHeaders, 'Content-Type':'application/vnd.apple.mpegurl', 'Access-Control-Allow-Origin':'*' });
      return res.end(rewritten);
    }
    const headers = { ...securityHeaders, 'Content-Type': response.headers['content-type'] || 'application/octet-stream', 'Accept-Ranges': response.headers['accept-ranges'] || 'bytes' };
    if (response.headers['content-length']) headers['Content-Length'] = response.headers['content-length'];
    if (response.headers['content-range']) headers['Content-Range'] = response.headers['content-range'];
    res.writeHead(response.statusCode, headers);
    await pipeline(response, res);
  } catch (err) {
    if (!res.headersSent) sendFailure(res, 502, err);
    else res.destroy();
  }
}

async function route(req,res) {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return send(res,400,{error:'URL inválida.'}); }
  const pathname = url.pathname;
  if(pathname==='/healthz')return send(res,200,{ok:true,version:'4.0.0'});
  if(access&&pathname.startsWith('/api/auth/')){
    // Nenhum endpoint de administração do plugin fica acessível publicamente.
    if(!new Set(['/api/auth/sign-in/email','/api/auth/sign-out','/api/auth/get-session']).has(pathname))return send(res,404,{error:'Rota indisponível.'});
    return access.handler(req,res);
  }
  if(pathname==='/api/admin/bootstrap'){
    const identity=access?await access.identity(req):null;
    const owner=!!identity&&await access.isOwner(identity.user.id);
    return send(res,200,{enabled:!!access,configured:access?await access.hasOwner():false,owner,user:owner?{id:identity.user.id,name:identity.user.name,email:identity.user.email}:null});
  }
  if(pathname.startsWith('/api/admin/')){
    if(!access)return send(res,503,{error:'Autenticação não configurada.'});
    if(req.method!=='GET'&&req.method!=='HEAD'){
      if(!String(req.headers['content-type']||'').includes('application/json'))return send(res,415,{error:'Use JSON.'});
      if(req.headers.origin&&req.headers.origin!==new URL(appBase).origin)return send(res,403,{error:'Origem não autorizada.'});
    }
    if(pathname==='/api/admin/setup'&&req.method==='POST'){
      try{await access.setupOwner(await getJsonBody(req));return send(res,201,{ok:true});}
      catch(error){return send(res,error.status||400,{error:error.status?error.message:'Não foi possível criar o proprietário. Use e-mail ainda não cadastrado.'});}
    }
    const identity=await access.identity(req);
    if(!identity||!await access.isOwner(identity.user.id))return send(res,403,{error:'Acesso exclusivo do proprietário.'});
    if(pathname==='/api/admin/xtream'&&req.method==='GET'){const c=activeXtream();return send(res,200,{name:c.name,url:c.url,username:c.username,configured:!!(c.url&&c.username&&c.password)});}
    if(pathname==='/api/admin/xtream'&&req.method==='POST'){
      try{
        const body=await getJsonBody(req),current=activeXtream();const name=String(body.name||'').trim().slice(0,60),url=normalizeServerUrl(String(body.url||'')),username=String(body.username||'').trim(),password=String(body.password||'')||current.password;
        if(!name||!url||!username||!password||username.length>200||password.length>200)return send(res,400,{error:'Preencha os dados válidos da conexão.'});
        const response=await providerJson(apiUrl(url,username,password),{withEndpoint:true});const info=response.data?.user_info;
        if(!info||!(info.auth===1||info.auth==='1'||info.auth===true)||info.status&&String(info.status).toLowerCase()!=='active')return send(res,422,{error:'O servidor Xtream não confirmou uma conta ativa. A configuração anterior foi preservada.'});
        const verifiedUrl=normalizeServerUrl(new URL('.',response.finalUrl).href);const next={name,url:verifiedUrl,username,password},temp=globalConfigPath+'.tmp';await mkdir(resolve(globalConfigPath,'..'),{recursive:true});await writeFile(temp,JSON.stringify(next),{mode:0o600});await rename(temp,globalConfigPath);globalXtream=next;sessions.clear();return send(res,200,{ok:true,message:'Conexão validada e salva. Os espectadores precisarão reconectar.'});
      }catch(error){return send(res,422,{error:'Não foi possível validar a nova conexão. A lista anterior foi preservada.'});}
    }
    if(pathname==='/api/admin/users'&&req.method==='GET')return send(res,200,{users:await access.listUsers(identity.user.id)});
    const action=/^\/api\/admin\/users\/([A-Za-z0-9_-]{1,128})\/(suspension|revoke-sessions)$/.exec(pathname);
    if(action&&req.method==='POST'){
      try{
        if(action[2]==='suspension'){
          const body=await getJsonBody(req);
          if(typeof body.suspended!=='boolean')return send(res,400,{error:'Informe suspended como boolean.'});
          return send(res,200,await access.setSuspended(identity.user.id,action[1],body.suspended));
        }
        return send(res,200,await access.revokeSessions(identity.user.id,action[1]));
      }catch(error){return send(res,error.status||500,{error:error.status?error.message:'Não foi possível atualizar o usuário.'});}
    }
    return send(res,404,{error:'Rota administrativa não encontrada.'});
  }
  if(pathname==='/api/access/bootstrap'){
    const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&['localhost','127.0.0.1'].includes(String(req.headers.host||'').split(':')[0]);
    const identity=access?await access.identity(req):null;
    const owner=!!identity&&await access.isOwner(identity.user.id);
    const suspended=!!identity&&!owner&&await access.isSuspended(identity.user.id);
    return send(res,200,{fixedMode,owner,user:identity&&!owner&&!suspended?{id:identity.user.id,name:identity.user.name,email:identity.user.email}:null,canSetup:!!access&&local&&!await access.hasUsers()});
  }
  let identity=null;
  if(access&&pathname.startsWith('/api/')){
    if(req.method!=='GET'&&req.method!=='HEAD'){
      if(!String(req.headers['content-type']||'').includes('application/json'))return send(res,415,{error:'Use JSON.'});
      if(req.headers.origin&&req.headers.origin!==new URL(appBase).origin)return send(res,403,{error:'Origem não autorizada.'});
    }
    if(pathname==='/api/access/register'&&req.method==='POST'){
      try{const body=await getJsonBody(req);await access.register(body);return send(res,201,{ok:true});}catch(error){return send(res,Number.isInteger(error.status)?error.status:400,{error:Number.isInteger(error.status)?error.message:'Não foi possível criar o acesso. Confira e-mail e senha (mínimo 10 caracteres).'});}
    }
    identity=await access.identity(req);if(!identity)return send(res,401,{error:'Entre na sua conta para continuar.'});
    if(await access.isOwner(identity.user.id))return send(res,403,{error:'Conta administrativa: utilize /admin.'});
    if(await access.isSuspended(identity.user.id))return send(res,403,{error:'Sua conta está suspensa pelo administrador.'});
    if(pathname==='/api/profiles'){
      try{if(req.method==='GET')return send(res,200,{profiles:await access.profiles(identity.user.id)});if(req.method==='POST'){const body=await getJsonBody(req);return send(res,201,await access.createProfile(identity.user.id,body.name,body.avatar));}if(req.method==='PATCH'){const body=await getJsonBody(req);return send(res,200,await access.updateProfile(identity.user.id,body.id,body));}}catch(error){return send(res,error.status||500,{error:error.status?error.message:'Não foi possível salvar o perfil.'});}
    }
    if(pathname==='/api/preferences'){
      try{const profile=await access.profile(identity.user.id,String(req.headers['x-profile-id']||''));if(!profile)return send(res,404,{error:'Perfil não encontrado.'});if(req.method==='GET')return send(res,200,JSON.parse(profile.preferences));if(req.method==='PUT'){await access.savePreferences(identity.user.id,profile.id,await getJsonBody(req,250000));return send(res,200,{ok:true});}}catch(error){return send(res,Number.isInteger(error.status)?error.status:500,{error:'Não foi possível salvar o progresso.'});}
    }
    if(pathname==='/api/login')return send(res,403,{error:'A lista é gerenciada pelo servidor.'});
  }
  if (pathname.startsWith('/api/')) {
    // No credential-bearing data is cached or logged by this application.
    if (req.method === 'POST' && (pathname === '/api/login'||pathname==='/api/connect'&&access)) {
      try {
        let body = await getJsonBody(req),profile=null;
        if(access){profile=await access.profile(identity.user.id,body.profileId);if(!profile)return send(res,404,{error:'Perfil não encontrado.'});{const c=activeXtream();body={listName:c.name,url:c.url,username:c.username,password:c.password};}}
        const base = normalizeServerUrl(body.url);
        const username = String(body.username || '').trim(), password = String(body.password || '');
        const listName = String(body.listName || 'Minha lista').trim();
        if (!listName || listName.length > 60 || /[\x00-\x1f\x7f]/.test(listName)) return send(res,400,{error:'Nome da lista inválido (máximo de 60 caracteres).'});
        if (!username || !password || username.length > 200 || password.length > 200) return send(res,400,{error:'Informe usuário e senha válidos.'});
        let authentication;
        try { authentication=await providerJson(apiUrl(base,username,password),{withEndpoint:true}); }
        catch (initialError) {
          // A provider may have migrated an old http:// endpoint to HTTPS.
          // Probe HTTPS WITHOUT credentials before trying authentication there.
          const parsed=new URL(base);
          const eligible=parsed.protocol==='http:' && !parsed.port &&
            ['CONNECTION_REFUSED','CONNECTION_RESET','TIMED_OUT','INVALID_JSON','PROVIDER_HTTP'].includes(classifyFailure(initialError)) ||
            (parsed.protocol==='http:' && !parsed.port && Number.isInteger(initialError?.providerStatus));
          if (!eligible) throw initialError;
          const secureBase='https://' + parsed.host + parsed.pathname.replace(/\/$/,'');
          try {
            const {response}=await getRemote(secureBase+'/player_api.php');
            const status=response.statusCode;response.resume();
            if (status>=500 || status===404) throw initialError;
            authentication=await providerJson(apiUrl(secureBase,username,password),{withEndpoint:true});
          } catch {throw initialError;}
        }
        const info = authentication.data?.user_info;
        if (!info || typeof info !== 'object' || info.auth === undefined) return sendFailure(res,502,fault('INVALID_XTREAM'));
        if (!(info.auth === 1 || info.auth === '1' || info.auth === true)) return sendFailure(res,401,fault('CREDENTIALS_INVALID'));
        if (info.status && String(info.status).toLowerCase() !== 'active') return sendFailure(res,403,fault('ACCOUNT_INACTIVE'));
        const connectedBase=normalizeServerUrl(new URL('.',authentication.finalUrl).href);
        const token = randomBytes(32).toString('base64url');
        const account = { username, listName, status:String(info.status || 'Active'), expiration:info.exp_date || null, maxConnections:info.max_connections || null, activeConnections:info.active_cons || null, allowedFormats:Array.isArray(info.allowed_output_formats)?info.allowed_output_formats.filter(x=>['ts','m3u8'].includes(x)):[] };
        if(access){account.username=identity.user.email;account.listName=profile.name;account.profile=profile;}
        sessions.set(token, { token, base:connectedBase, username, password, account, policyKey:parentalKey(connectedBase,username),catalogs:new Map(),entries:new Map(),details:new Map(),episodes:new Map(),media:new Map(),activeMedia:new Set(), lastUsed:Date.now() });
        if(access){const session=sessions.get(token);session.ownerId=identity.user.id;session.profileId=profile.id;session.policyKey=parentalKey(connectedBase,identity.user.id);}
        return send(res,200,{token, host:connectedBase, account});
      } catch (err) { return sendFailure(res, ['BAD_SERVER_URL','PRIVATE_ADDRESS'].includes(classifyFailure(err))?400:502, err); }
    }
    if (req.method === 'POST' && pathname === '/api/diagnose') {
      try {
        const body = await getJsonBody(req);
        const base = normalizeServerUrl(body.url);
        // No username or password is required or sent for this diagnostic.
        const attempts=[];
        const candidates=[base];
        const parsed=new URL(base);
        // Only test standard HTTP/HTTPS on the SAME host. No random port scan.
        if (parsed.protocol==='http:' && !parsed.port) candidates.push(`https://${parsed.host}${parsed.pathname}`);
        for (const candidate of candidates) {
          const protocol=new URL(candidate).protocol.replace(':','').toUpperCase();
          try {
            const {response}=await getRemote(`${candidate}/player_api.php`);
            const status=response.statusCode;response.resume();
            attempts.push({protocol,reachable:true,httpStatus:status,code:'HTTP_RESPONSE',
              message:`${protocol}: servidor respondeu HTTP ${status}.`});
          } catch(error) {
            const result=safeFailure(error);
            attempts.push({protocol,reachable:false,code:result.code,message:`${protocol}: ${result.error}`,hint:result.hint});
          }
        }
        const best=attempts.find(a=>a.reachable && a.httpStatus!==404) || attempts.find(a=>a.reachable);
        if(best) return send(res,200,{reachable:true,httpStatus:best.httpStatus,attempts,
          message:best.message,
          hint:'O servidor respondeu. A validação das credenciais exige um login separado.'});
        return send(res,502,{reachable:false,code:attempts[0]?.code||'UNKNOWN',attempts,
          error:'Não foi possível estabelecer conexão com o endereço informado.',
          hint:'Verifique o domínio e a porta com o provedor. A falha ocorreu antes da autenticação.'});
      } catch (err) { return sendFailure(res,400,err); }
    }
    const token = String(req.headers['x-session-token'] || '');
    if (pathname === '/api/logout' && req.method === 'POST') {
      if (token) sessions.delete(token);
      return send(res,200,{ok:true});
    }
    const session = sessionFor(token);
    if(access&&session&&session.ownerId!==identity.user.id)return send(res,401,{error:'Sessão inválida.'});
    if(pathname==='/api/parental' && ['GET','POST'].includes(req.method)) {
      if(!session)return send(res,401,{error:'Conecte sua conta para configurar a proteção.'});
      if(req.method==='GET')return send(res,200,parental.get(session.policyKey));
      try{
        const policy=await parental.update(session.policyKey,await getJsonBody(req));
        for(const s of sessions.values())if(s.policyKey===session.policyKey){s.media.clear();for(const response of s.activeMedia)response.destroy();}
        return send(res,200,policy);
      }catch(error){return send(res,error.status||500,{error:error.status?error.message:'Não foi possível salvar a proteção parental.'});}
    }
    if (pathname === '/api/account' && req.method === 'GET') {
      if (!session) return send(res,401,{error:'Sessão expirada. Conecte novamente.'});
      return send(res,200,{host:session.base,account:session.account});
    }
    if (pathname === '/api/catalog' && req.method === 'GET') {
      if (!session) return send(res,401,{error:'Sessão expirada. Conecte novamente.'});
      const section = url.searchParams.get('section');
      const kind = url.searchParams.get('kind');
      if (!SECTIONS.has(section) || !['categories','items','info','rating'].includes(kind)) return send(res,400,{error:'Consulta inválida.'});
      let action, params={};
      if (kind === 'info'||kind==='rating') {
        if (!['series','vod'].includes(section)) return send(res,400,{error:'Detalhes disponíveis para filmes e séries.'});
        const seriesId = url.searchParams.get(section==='vod'?'vod_id':'series_id');
        if (!/^\d{1,15}$/.test(seriesId || '')) return send(res,400,{error:'Identificador de série inválido.'});
        action = section==='vod'?'get_vod_info':'get_series_info'; params[section==='vod'?'vod_id':'series_id'] = seriesId;
      } else {
        action = CATALOG_ACTIONS[section][kind];
        const catId = url.searchParams.get('category_id');
        if (kind === 'items' && catId && /^\d{1,15}$/.test(catId)) params.category_id = catId;
      }
      try {
        let data;
        if(kind==='info'||kind==='rating'){
          const id=params.series_id||params.vod_id;
          if(!await allowedEntry(session,section,id,true,url.searchParams.get('refresh')==='1'))return send(res,403,{error:'Conteúdo bloqueado pelo controle parental.'});
          if(kind==='rating')return send(res,200,{data:session.entries.get(`${section}:${id}`)});
          data=session.details.get(`${section}:${id}`);
          if(section==='series'){
            const parent=session.entries.get(`series:${id}`),policy=parental.get(session.policyKey),episodes={};
            for(const [season,rows] of Object.entries(data?.episodes||{}))if(Array.isArray(rows))episodes[season]=rows.filter(ep=>{
              const child=contentMetadata({...ep,...ep.info});const metadata={...parent,adult:parent.adult||child.adult,age:child.age===null?parent.age:Math.max(parent.age??0,child.age)};
              if(!contentAllowed(metadata,policy))return false;
              session.episodes.set(String(ep.id),{parentId:String(id),metadata});return true;
            });
            data={...data,episodes};
          }
        }else{
          const catalog=await catalogFor(session,section);const policy=parental.get(session.policyKey);
          data=kind==='categories'?catalog.categories.filter(c=>contentAllowed(contentMetadata(c,c.category_name),{...policy,blockUnknown:false})):
            catalog.items.filter(item=>{const id=String(section==='series'?item.series_id:item.stream_id);return (!params.category_id||String(item.category_id)===params.category_id)&&contentAllowed(session.entries.get(`${section}:${id}`),policy);});
        }
        if(kind==='items')data=data.map(item=>({...item,metadata:session.entries.get(`${section}:${section==='series'?item.series_id:item.stream_id}`)}));
        return send(res,200,{data});
      } catch (err) { return sendFailure(res,502,err); }
    }
    // Image relay: derive URL from the authenticated catalog, never accept arbitrary user URLs.
    const poster=/^\/api\/poster\/([A-Za-z0-9_-]{20,60})\/(live|vod|series)\/(\d{1,15})$/.exec(pathname);
    if(req.method==='GET'&&poster){
      const s=sessionFor(poster[1]);if(!s||access&&s.ownerId!==identity.user.id)return send(res,401,{error:'Sessão inválida.'});
      try{
        const section=poster[2],id=poster[3];if(!await allowedEntry(s,section,id,false))return send(res,403,{error:'Conteúdo indisponível.'});
        const catalog=await catalogFor(s,section),item=catalog.items.find(row=>String(section==='series'?row.series_id:row.stream_id)===id);
        const raw=item?.stream_icon||item?.cover||item?.cover_big||item?.movie_image||item?.poster||item?.image||item?.info?.movie_image||item?.info?.cover;
        if(!raw)return send(res,404,{error:'Provedor não informou pôster.'});
        const imageUrl=new URL(String(raw),s.base+'/');if(!['http:','https:'].includes(imageUrl.protocol)||imageUrl.username||imageUrl.password)return send(res,400,{error:'Imagem inválida.'});
        const {response}=await getRemote(imageUrl.href);
        const contentType=String(response.headers['content-type']||'').split(';')[0].trim().toLowerCase();
        if(response.statusCode!==200||!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(contentType)){response.resume();return send(res,502,{error:'Imagem indisponível no provedor.'});}
        const size=Number(response.headers['content-length']||0);if(size>5_000_000){response.resume();return send(res,413,{error:'Imagem muito grande.'});}
        res.writeHead(200,{'Content-Type':contentType,'Cache-Control':'private, max-age=1800','X-Content-Type-Options':'nosniff'});
        let count=0;for await(const chunk of response){count+=chunk.length;if(count>5_000_000){res.destroy();return;}if(!res.write(chunk))await new Promise(resolve=>res.once('drain',resolve));}res.end();return;
      }catch(error){return sendFailure(res,502,error);}
    }
    const stream = /^\/api\/stream\/([A-Za-z0-9_-]{20,60})\/(live|vod|series)\/(\d{1,15})\.([a-z0-9]{2,5})$/.exec(pathname);
    const media = /^\/api\/media\/([A-Za-z0-9_-]{20,60})\/([A-Za-z0-9_-]{15,30})$/.exec(pathname);
    if (req.method === 'GET' && stream) {
      const s = sessionFor(stream[1]);
      if (!s) return send(res,401,{error:'Sessão expirada.'});
      if(access&&s.ownerId!==identity.user.id)return send(res,401,{error:'Sessão inválida.'});
      try {
        const section=stream[2],episode=section==='series'?s.episodes.get(stream[3]):null,id=section==='series'?episode?.parentId:stream[3];
        if(episode&&!contentAllowed(episode.metadata,parental.get(s.policyKey)))return send(res,403,{error:'Episódio bloqueado pelo controle parental.'});
        if(!id||!await allowedEntry(s,section,id,true))return send(res,403,{error:'Conteúdo bloqueado ou indisponível. Abra a ficha do título.'});
        return await relayMedia(req,res,s,buildStreamUrl(s.base,s.username,s.password,section,stream[3],stream[4]));
      }
      catch (err) { return sendFailure(res,400,err); }
    }
    if (req.method === 'GET' && media) {
      const s = sessionFor(media[1]);
      if(access&&s&&s.ownerId!==identity.user.id)return send(res,401,{error:'Sessão inválida.'});
      if (!s || !s.media.has(media[2])) return send(res,404,{error:'Mídia não disponível ou sessão expirada.'});
      return relayMedia(req,res,s,s.media.get(media[2]));
    }
    return send(res,404,{error:'Rota não encontrada.'});
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res,405,{error:'Método não permitido.'});
  if (!staticPaths.has(pathname)) return send(res,404,{error:'Arquivo não encontrado.'});
  const path = pathname==='/admin'||pathname==='/admin/'?resolve(root,'admin.html'):vendorPaths.get(pathname)||resolve(root, '.' + pathname);
  if (path !== root && !path.startsWith(root + sep)) return send(res,403,{error:'Acesso negado.'});
  try {
    const filePath = (await stat(path)).isDirectory() ? resolve(path,'index.html') : path;
    const bytes = await readFile(filePath);
    res.writeHead(200,{...securityHeaders,'Content-Type':types[extname(filePath)] || 'application/octet-stream'});
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { send(res,404,{error:'Arquivo não encontrado.'}); }
}

const server = createServer((req,res) => { route(req,res).catch(() => { if (!res.headersSent) send(res,500,{error:'Erro interno.'}); else res.destroy(); }); });
server.listen(port,'0.0.0.0',() => console.log(`MF Stream IPTV disponível na porta ${server.address().port}`));
setInterval(() => { for (const [key, s] of sessions) if (Date.now()-s.lastUsed>SESSION_IDLE_MS) sessions.delete(key); },300_000).unref();




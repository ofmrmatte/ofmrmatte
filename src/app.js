import { normalizeCatalog } from './xtream.mjs';
import {contentAllowed} from './content.mjs';
import {formatTime,seekTarget,progressRecord,flattenEpisodes} from './playback.mjs';
import {setupAccess} from './access-ui.mjs';

const ICONS = {
 house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 tv:'<rect x="2.5" y="4" width="19" height="15" rx="2"/><path d="M8 22h8m-4-3v3"/>',
 film:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4m-4 8h4m10-8h4m-4 8h4"/>',
 clapperboard:'<path d="M3 11h18v9H3zM3 11V6l17-4 1 5-18 4Zm5-1L5 5m9 3-3-4m10 4-3-5"/>',
 heart:'<path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.8l-1.1-1.2a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 settings:'<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a2 2 0 0 0 .4 2.2l-2.6 2.6a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.6 1.6H10a2 2 0 0 0-1.6-1.6 2 2 0 0 0-2.2.4l-2.6-2.6A2 2 0 0 0 4 15a2 2 0 0 0-2-1.6v-3.7A2 2 0 0 0 4 8a2 2 0 0 0-.4-2.2l2.6-2.6A2 2 0 0 0 8.4 3 2 2 0 0 0 10 1.5h3.4A2 2 0 0 0 15 3a2 2 0 0 0 2.2.4l2.6 2.6A2 2 0 0 0 19.4 8a2 2 0 0 0 2 1.6v3.7a2 2 0 0 0-2 1.7Z"/>',
 'chevron-right':'<path d="m9 18 6-6-6-6"/>','chevron-down':'<path d="m6 9 6 6 6-6"/>',
 search:'<circle cx="10.8" cy="10.8" r="7.7"/><path d="m17 17 5 5"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>','arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>','arrow-down':'<path d="M12 4v16m-6-6 6 6 6-6"/>',
 plug:'<path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v5"/>',
 sparkles:'<path d="m12 2 2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2Zm7 14 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
 refresh:'<path d="M20 11a8 8 0 1 0-2.4 6M20 4v7h-7"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 x:'<path d="M18 6 6 18M6 6l12 12"/>',
 'shield-check':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
 'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 'log-out':'<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m7-4 4-4-4-4m4 4H9"/>',
 play:'<path d="m8 5 12 7-12 7V5Z"/>',
 maximize:'<path d="M8 3H3v5m0-5 6 6m7-6h5v5m0-5-6 6M3 16v5h5m-5 0 6-6m12 1v5h-5m5 0-6-6"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>',
 'alert-circle':'<circle cx="12" cy="12" r="10"/><path d="M12 8v5m0 4h.01"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>'
};
const $ = id => document.getElementById(id);
const icon = (key, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key] || ICONS.play}</svg>`;
const el = (tag, className='', text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const uiIcon = () => document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon, Number(node.dataset.size)||20); });
const kindMap = { live:'TV ao vivo', vod:'Filmes', series:'Séries' };
const types = ['live','vod','series'];
const storage = { get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } }, set(k, value) { try { localStorage.setItem(k, JSON.stringify(value)); } catch {} } };
const state = {
  section:'home', token: null, account: null, host:'', listName:'', favorites:new Set(), recents:[],
  catalog:Object.fromEntries(types.map(t => [t,{ loaded:false,loading:false,items:[],categories:[],promise:null,error:null }])),
  search:'', category:'', limit:30, sort:'name', current:null, currentEpisode:null, seriesDetails:null,
  deferredInstall:null, hls:null, playbackId:0, diagnosticReport:'',policy:{hideAdult:true,maxAge:null,blockUnknown:false,pinSet:false},detailItem:null,detailRequest:0
};
const cachedItem = new Map();
const ratingJobs=[],ratingPending=new Set(),ratingSeen=new Set();let ratingWorkers=0;
const ratingObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){ratingObserver.unobserve(entry.target);const item=cachedItem.get(entry.target.dataset.itemId);if(item&&!ratingSeen.has(item.id)&&!ratingPending.has(item.id)){ratingPending.add(item.id);ratingJobs.push({item,card:entry.target,token:state.token});pumpRatings();}}},{rootMargin:'100px'});
async function pumpRatings(){while(ratingWorkers<3&&ratingJobs.length){const job=ratingJobs.shift();if(job.token!==state.token){ratingPending.delete(job.item.id);continue;}ratingWorkers++;(async()=>{const badge=job.card.querySelector('.age-badge');if(badge)badge.textContent='…';try{const metadata=(await api(`/api/catalog?section=${job.item.type}&kind=rating&${job.item.type==='vod'?'vod_id':'series_id'}=${job.item.sourceId}`)).data;if(job.token!==state.token)return;Object.assign(job.item,metadata);if(badge){badge.textContent=metadata.ageLabel==='Não informada'?'—':metadata.ageLabel;badge.className='age-badge age-'+(metadata.age??'nc');badge.title=ratingText(metadata);}}catch(error){if(error.status===403&&job.token===state.token){job.card.remove();state.catalog[job.item.type].items=state.catalog[job.item.type].items.filter(item=>item.id!==job.item.id);}else if(badge){badge.textContent='—';badge.title='Classificação indisponível. Abra o título para tentar novamente.';}}finally{if(job.token===state.token){ratingSeen.add(job.item.id);ratingPending.delete(job.item.id);}ratingWorkers--;pumpRatings();}})();}}
state.progress={};state.seriesProgress={};state.episodeQueue=[];state.seriesRequest=0;
function scopeKey() { return `mfstream:${state.host}:${state.account?.profile?.id||state.account?.username||''}`; }
let cloudTimer,cloudSnapshot;
function cloudSave(){if(!state.fixedMode||!state.profile||!state.account)return;cloudSnapshot={profileId:state.profile.id,data:{favorites:[...state.favorites],recents:state.recents,progress:state.progress,seriesProgress:state.seriesProgress}};clearTimeout(cloudTimer);cloudTimer=setTimeout(flushCloud,700);}
function flushCloud(){const snapshot=cloudSnapshot;if(!snapshot)return;cloudSnapshot=null;const body=JSON.stringify(snapshot.data);fetch('/api/preferences',{method:'PUT',credentials:'same-origin',keepalive:body.length<60000,headers:{'Content-Type':'application/json','x-profile-id':snapshot.profileId},body}).catch(()=>{});}
function persist() { if (!state.account) return; storage.set(`${scopeKey()}:favorites`,[...state.favorites]); storage.set(`${scopeKey()}:recent`,state.recents);storage.set(`${scopeKey()}:progress`,state.progress);storage.set(`${scopeKey()}:seriesProgress`,state.seriesProgress);cloudSave(); }
function loadPrefs() { state.favorites = new Set(storage.get(`${scopeKey()}:favorites`,[])); state.recents = storage.get(`${scopeKey()}:recent`,[]); if (!Array.isArray(state.recents)) state.recents=[];state.progress=storage.get(`${scopeKey()}:progress`,{});state.seriesProgress=storage.get(`${scopeKey()}:seriesProgress`,{});if(!state.progress||typeof state.progress!=='object'||Array.isArray(state.progress))state.progress={};if(!state.seriesProgress||typeof state.seriesProgress!=='object'||Array.isArray(state.seriesProgress))state.seriesProgress={}; }
function toast(message) { const node=el('div','toast',message); $('toastHost').append(node); setTimeout(()=>node.remove(),4200); }
function number(n) { return new Intl.NumberFormat('pt-BR').format(n); }
function normalize(text) { return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function safeHttp(url) { try { const out=new URL(url,state.host||location.origin); return ['http:','https:'].includes(out.protocol) ? out.href : null; } catch { return null; } }
function sessionHeaders() { return {...(state.token?{'x-session-token':state.token}:{}),...(state.fixedMode?{'Content-Type':'application/json','x-profile-id':state.profile?.id||''}:{})}; }
async function api(path, options={}) {
  const response=await fetch(path,{cache:'no-store',...options,headers:{...sessionHeaders(),...(options.headers||{})}});
  let data; try { data=await response.json(); } catch { throw new Error('O aplicativo não recebeu uma resposta válida do servidor.'); }
  if (!response.ok) { if(response.status===401 && !['/api/login','/api/diagnose'].includes(path)) setDisconnected('Sua sessão expirou. Faça login novamente.'); if(response.status===401&&state.fixedMode)window.dispatchEvent(new Event('mf:profiles')); const err=new Error(data?.error||`Erro HTTP ${response.status}`);err.code=data?.code;err.hint=data?.hint;err.status=response.status;throw err; }
  return data;
}
function setDisconnected(msg) {
  ratingJobs.length=0;ratingSeen.clear();ratingPending.clear();ratingObserver.disconnect();
  saveProgress();playerReset();state.progress={};state.seriesProgress={};state.episodeQueue=[];state.seriesRequest++;
  state.token=null;state.account=null;state.host='';state.listName='';state.current=null;cachedItem.clear();state.favorites=new Set();state.recents=[];
  for(const t of types) state.catalog[t]={loaded:false,loading:false,items:[],categories:[],promise:null,error:null};
  sessionStorage.removeItem('mfstream:session');
  updateSessionUI();render();if(msg)toast(msg);
}
function updateSessionUI() {
  const on=Boolean(state.token&&state.account);
  $('connectionDot').classList.toggle('connected',on);
  $('connectionLabel').textContent=on?(state.listName||'Conta conectada'):'Conectar conta';
  $('heroPrimaryLabel').textContent=on?'Assistir TV ao vivo':'Conectar minha lista';
  $('topGreeting').textContent=on?'SUA CENTRAL DE ENTRETENIMENTO':'BOAS-VINDAS AO MF STREAM';
  $('loginForm').hidden=on;
  $('connectedInfo').hidden=!on;
  $('accountTitle').innerHTML=on?'Minha conexão<span class="heading-purple">.</span>':'Conecte sua conta<span class="heading-purple">.</span>';
  document.querySelector('.modal-headline p').textContent=on?'Sua conexão Xtream está ativa neste dispositivo.':'Informe os dados Xtream Codes fornecidos pelo seu serviço de streaming autorizado.';
  if(on){
    $('connectedUsername').textContent=`${state.listName||'Minha lista'} • ${state.account.username||''}`;
    const info=$('accountInfo'); info.replaceChildren();
    const rows=[['Lista',state.listName||'Minha lista'],['Servidor',state.host],['Status',state.account.status||'Ativa'],['Conexões',`${state.account.activeConnections||'0'} de ${state.account.maxConnections||'—'}`]];
    if(state.account.expiration && Number(state.account.expiration)>0){const d=new Date(Number(state.account.expiration)*1000); if(!Number.isNaN(d.getTime())) rows.push(['Validade',d.toLocaleDateString('pt-BR')]);}
    for(const [label,value] of rows){const row=el('div');row.append(el('span','',label),el('strong','',String(value)));info.append(row);}
  }
}
const focusReturn=new Map();
function showModal(id) { closeMenu(); const node=$(id);focusReturn.set(id,document.activeElement);node.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(()=>node.querySelector('input:not([type=hidden]),button,[tabindex]')?.focus());if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches)window.gsap.fromTo(node.querySelector('.modal-card'),{opacity:0,y:20},{opacity:1,y:0,duration:.35,ease:'power2.out',clearProps:'opacity,transform'}); }
function hideModal(id) { const node=$(id);if(node.hidden)return;node.hidden=true;if(id==='detailsModal')state.detailRequest++;if(![...document.querySelectorAll('.modal-layer')].some(n=>!n.hidden))document.body.style.overflow='';if(id==='playerModal'){$('playerLayout').classList.remove('is-full-window');if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});stopPlayback();render();}focusReturn.get(id)?.focus?.(); }
function closeMenu() {$('sidebar').classList.remove('open');$('mobileScrim').hidden=true;}
function showMenu() {$('sidebar').classList.add('open');$('mobileScrim').hidden=false;}
async function login(event) {
  event.preventDefault();
  const btn=$('loginSubmit'); $('loginError').hidden=true;$('diagnosticResult').hidden=true;btn.disabled=true;btn.querySelector('span:nth-child(2)').textContent='Conectando...';
  try {
    const listName=$('listName').value.trim();
    if (!listName || listName.length>60) throw new Error('Informe um nome para identificar sua lista (até 60 caracteres).');
    const url=$('serverUrl').value.trim();
    const username=$('xtreamUsername').value.trim(),password=$('xtreamPassword').value;
    const result=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listName,url,username,password})});
    state.token=result.token;state.account=result.account;state.host=result.host||url.replace(/\/+$/,'');state.listName=result.account?.listName||listName;
    state.diagnosticReport='';$('copyDiagnostics').hidden=true;
    sessionStorage.setItem('mfstream:session',JSON.stringify({token:state.token,host:state.host,account:state.account,listName:state.listName}));
    $('xtreamPassword').value='';loadPrefs();updateSessionUI();hideModal('accountModal');toast('Conta conectada ao MF Stream IPTV.');
    await loadParental();setSection('home',true);
  } catch (err) {
    $('loginError').textContent=[err.message,err.hint].filter(Boolean).join(' ');$('loginError').hidden=false;
    // Investigate the same hostname and protocol WITHOUT the password.
    await diagnoseServer();
  }
  finally {btn.disabled=false;btn.querySelector('span:nth-child(2)').textContent='Entrar no MF Stream';}
}
async function diagnoseServer() {
  const node=$('diagnosticResult');const btn=$('diagnoseButton');
  node.hidden=false;node.classList.remove('diagnostic-ok','diagnostic-error');
  node.textContent='Verificando o servidor sem transmitir usuário ou senha...';
  btn.disabled=true;$('copyDiagnostics').hidden=true;
  try {
    const response=await fetch('/api/diagnose',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:$('serverUrl').value.trim()})});
    const result=await response.json();
    const lines=[result.message||result.error||'Diagnóstico de conexão',...(result.attempts||[]).map(x=>`${x.message} [${x.code}]`),result.hint||''];
    node.classList.add(result.reachable?'diagnostic-ok':'diagnostic-error');
    node.textContent=lines.filter(Boolean).join('\n');
    // Safe report: contains only protocol, HTTP status and public failure codes.
    const report={app:'MF Stream IPTV 3.1.0',date:new Date().toISOString(),
      attempts:(result.attempts||[]).map(({protocol,reachable,httpStatus,code})=>({protocol,reachable,httpStatus,code})),
      result:result.reachable?'HOST_REACHABLE':result.code||'UNREACHABLE'};
    state.diagnosticReport=JSON.stringify(report,null,2);
    $('copyDiagnostics').hidden=false;
  } catch(err) {
    node.classList.add('diagnostic-error');
    node.textContent='Não foi possível contactar o serviço local do MF Stream. Reinicie o aplicativo (npm start).';
  } finally {btn.disabled=false;}
}

async function logout() {try {await api('/api/logout',{method:'POST'});}catch{}hideModal('accountModal');hideModal('playerModal');setDisconnected('Conta desconectada.');}
async function restoreSession() {
  let previous;try{previous=JSON.parse(sessionStorage.getItem('mfstream:session'));}catch{}
  if(!previous?.token)return;
  state.token=previous.token;
  try {const result=await api('/api/account');state.account=result.account;state.host=result.host||previous.host;state.listName=result.account?.listName||previous.listName||'Minha lista';loadPrefs();await loadParental();updateSessionUI();for(const type of types)loadSection(type);}
  catch {setDisconnected();}
}
async function loadSection(type, force=false) {
  if(!state.token||!types.includes(type))return;
  const cat=state.catalog[type];
  if(cat.promise&&!force)return cat.promise;
  if(cat.loaded&&!force)return;
  if(force){cat.loaded=false;cat.items=[];cat.categories=[];}
  cat.loading=true;cat.error=null;render();
  const promise=(async()=>{
    try{
      const [cats,items]=await Promise.all([api(`/api/catalog?section=${type}&kind=categories`),api(`/api/catalog?section=${type}&kind=items`)]);
      if(!state.token)return;
      cat.categories=Array.isArray(cats.data)?cats.data:[];
      cat.items=normalizeCatalog(items.data,cat.categories,type);
      cat.loaded=true;
      for(const item of cat.items)cachedItem.set(item.id,item);
    }catch(err){cat.error=err.message;if(state.token)toast(`Não foi possível carregar ${kindMap[type]}: ${err.message}`);}
    finally{cat.loading=false;cat.promise=null;render();}
  })();
  cat.promise=promise;return promise;
}
function targetType() {return types.includes(state.section)?state.section:'live';}
function setSection(section, keepSearch=false) {
  if(!['home','favorites','recents',...types].includes(section))return;
  state.section=section;document.body.dataset.page=section;state.category='';state.limit=30;
  if(!keepSearch){state.search='';$('globalSearch').value='';}
  closeMenu();render();
  if(state.token&&types.includes(section))loadSection(section);
  if(state.token&&section==='home')for(const type of types)loadSection(type);
  if(state.token&&(section==='favorites'||section==='recents'))for(const t of types) if(!state.catalog[t].loaded)loadSection(t);
}
function favorite(id) {if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);persist();render();}
function addRecent(id) {state.recents=[id,...state.recents.filter(x=>x!==id)].slice(0,60);persist();render();}
function listItems() {
  if(!state.token)return [];
  let source=[];
  if(state.search){source=types.flatMap(t=>state.catalog[t].items);}
  else if(state.section==='favorites'){source=[...state.favorites].map(id=>cachedItem.get(id)).filter(Boolean);}
  else if(state.section==='recents'){source=state.recents.map(id=>cachedItem.get(id)).filter(Boolean);}
  else source=state.catalog[targetType()].items;
  source=source.filter(item=>contentAllowed(item,state.policy));
  if(state.category&&!state.search)source=source.filter(item=>item.categoryId===state.category);
  if(state.search)source=source.filter(item=>normalize(item.name).includes(normalize(state.search))||normalize(item.group).includes(normalize(state.search)));
  if(state.sort==='name'&&state.section!=='recents')source=[...source].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{numeric:true}));
  return source;
}
function renderStats() {
  for(const t of types)$({live:'statLive',vod:'statVod',series:'statSeries'}[t]).textContent=state.catalog[t].loaded?number(state.catalog[t].items.length):'—';
  $('statFavorite').textContent=number(state.favorites.size);
  $('navFavoriteCount').textContent=state.favorites.size||'';
  $('navLiveCount').textContent=state.catalog.live.loaded?number(state.catalog.live.items.length):'';
}
function renderHeadings() {
  const titles={home:['SUA BIBLIOTECA','Descubra seu próximo favorito','Navegue pelos seus canais e encontre algo especial para assistir.'],live:['TRANSMISSÃO AO VIVO','Tudo o que acontece, agora','Seus canais organizados e prontos para assistir.'],vod:['SESSÃO DE CINEMA','Sua coleção de filmes','Escolha um título e prepare a pipoca.'],series:['MARATONE À VONTADE','Séries para acompanhar','Encontre sua próxima história favorita.'],favorites:['VOCÊ ESCOLHEU','Seus conteúdos favoritos','Os conteúdos que você salvou ficam por aqui.'],recents:['CONTINUE ASSISTINDO','Vistos recentemente','Retome conteúdos que você já abriu.']};
  const parts=state.search?['RESULTADOS DA BUSCA',`Resultados para “${state.search.slice(0,40)}”`,'Busca nos catálogos já carregados do seu servidor.']:titles[state.section];
  if(!state.search)parts[1]=({home:'Sua biblioteca',live:'TV ao vivo',vod:'Filmes',series:'Séries',favorites:'Minha lista',recents:'Continue assistindo'})[state.section];
  $('sectionEyebrow').textContent=parts[0];$('sectionTitle').textContent=parts[1];$('sectionTitle').append(el('span','heading-purple','.'));$('sectionDescription').textContent=parts[2];
  document.querySelectorAll('[data-nav]').forEach(node=>node.classList.toggle('active',node.dataset.nav===state.section));
  $('refreshButton').disabled=!state.token;
  $('sortSelect').value=state.sort;
}
function renderChips() {
  const wrapper=$('categoryChips');wrapper.replaceChildren();
  if(!state.token||state.search||['home','favorites','recents'].includes(state.section)){wrapper.hidden=true;return;}
  wrapper.hidden=false;
  const cat=state.catalog[targetType()];if(!cat.loaded){wrapper.hidden=true;return;}
  const categoryCount=new Map();for(const item of cat.items)categoryCount.set(item.categoryId,(categoryCount.get(item.categoryId)||0)+1);
  const list=[{id:'',name:'Todas as categorias',count:cat.items.length},...cat.categories.filter(x=>categoryCount.has(String(x.category_id))).map(x=>({id:String(x.category_id),name:String(x.category_name||'Sem categoria'),count:categoryCount.get(String(x.category_id))}))];
  for(const item of list){const btn=el('button','chip'+(state.category===item.id?' active':''),`${item.name}  ${number(item.count)}`);btn.type='button';btn.addEventListener('click',()=>{state.category=item.id;state.limit=30;render();});wrapper.append(btn);}
}
function emptyContent(title,description,buttonText,action) {
  const box=el('div','content-empty');const orb=el('span','empty-orb');orb.innerHTML=icon(state.token?'tv':'plug',27);box.append(orb,el('h3','',title),el('p','',description));
  if(buttonText){const btn=el('button','btn btn-primary',buttonText);btn.type='button';btn.addEventListener('click',action);box.append(btn);}return box;
}
function mediaCard(item) {
  const card=el('article','media-card '+item.type);card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Abrir ${item.name}`);
  card.dataset.itemId=item.id;if(item.type!=='live'&&item.ageLabel==='Não informada')ratingObserver.observe(card);
  const art=el('div','card-art');
  const placeholder=el('span','card-fallback',item.type==='live'?item.name.slice(0,9).toUpperCase():'MF');art.append(placeholder);
  const src=safeHttp(item.logo);
  const posterUrl=src&&state.token?'/api/poster/'+encodeURIComponent(state.token)+'/'+item.type+'/'+encodeURIComponent(item.sourceId):src;
  if(posterUrl){const image=el('img');image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';image.src=posterUrl;image.onerror=()=>{if(image.src!==src&&src){image.src=src;return;}image.hidden=true;};art.append(image);}
  if(item.type==='live'){const live=el('span','card-live-badge');live.append(el('span'),document.createTextNode('AO VIVO'));art.append(live);}
  else{art.append(el('span','card-category-tag',item.type==='series'?'SÉRIE':'FILME'));art.append(el('span','age-badge age-'+(item.age??'nc'),item.ageLabel==='Não informada'?'NC':item.ageLabel));}
  const fav=el('button','card-fav'+(state.favorites.has(item.id)?' active':''));fav.type='button';fav.title='Adicionar ou remover favorito';fav.setAttribute('aria-label',fav.title);fav.innerHTML=icon('heart',16);fav.addEventListener('click',event=>{event.stopPropagation();favorite(item.id);});
  art.append(fav);
  const hover=el('span','card-hover-play');const circle=el('span');circle.innerHTML=icon('play',24);hover.append(circle);art.append(hover);
  const caption=el('div','media-card-info');caption.append(el('strong','',item.name),el('small','',item.group || kindMap[item.type]));const saved=item.type==='series'?state.progress[state.seriesProgress[item.id]?.episodeId]:state.progress[item.id];if(saved&&!saved.completed&&saved.position>=5)caption.append(el('span','continue-label',item.type==='series'?'Continuar · T'+saved.season+' E'+saved.episodeNumber+' · '+formatTime(saved.position):'Continuar em '+formatTime(saved.position)));
  card.append(art,caption);
  if(item.type!=='live'){
    const preview=el('div','card-peek');preview.setAttribute('aria-hidden','true');
    const peekTitle=el('strong','card-peek-title',item.name);
    const peekMeta=el('div','card-peek-meta');
    const peekAge=el('span','card-peek-age',item.ageLabel==='Não informada'?'Classificação pendente':ratingText(item));
    peekMeta.append(peekAge,el('span','',item.year||''));
    const peekDescription=el('p','card-peek-description',item.description||item.group||'Selecione para ver mais informações.');
    const peekPlay=el('button','card-peek-play','▶ Assistir');peekPlay.type='button';peekPlay.addEventListener('click',event=>{event.stopPropagation();item.type==='series'?openSeries(item):playItem(item);});
    preview.append(peekTitle,peekMeta,peekDescription,peekPlay);card.append(preview);
    card.addEventListener('mouseenter',()=>{peekAge.textContent=item.ageLabel==='Não informada'?'Classificação pendente':ratingText(item);peekDescription.textContent=item.description||item.group||'Selecione para ver mais informações.';});
  }
  const open=()=>item.type==='live'?playItem(item):openDetails(item);
  card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
  return card;
}
function renderContent() {
  const area=$('contentArea');area.replaceChildren();
  const sectionCat=state.catalog[targetType()];
  $('loadMoreWrap').hidden=true;
  if(!state.token){area.append(emptyContent('Sua experiência começa com uma conexão','Entre com a URL do servidor, seu usuário e sua senha Xtream Codes para carregar seu catálogo.','Conectar minha conta',()=>showModal('accountModal')));return;}
  if(state.section==='home'&&!state.search){renderHome(area);return;}
  if(!state.search&&!['favorites','recents'].includes(state.section)&&sectionCat.loading){const grid=el('div','loading-grid');for(let i=0;i<10;i++)grid.append(el('div','loading-card'));area.append(grid);return;}
  if(!state.search&&!['favorites','recents'].includes(state.section)&&sectionCat.error&&!sectionCat.loaded){area.append(emptyContent('Não foi possível abrir este catálogo',sectionCat.error,'Tentar novamente',()=>loadSection(targetType(),true)));return;}
  const items=listItems();
  if(!items.length){
    let title='Nenhum conteúdo encontrado',desc='Experimente outro termo de busca ou escolha uma categoria diferente.';
    if(state.section==='favorites'&&!state.search){title='Nenhum favorito por enquanto';desc='Toque no coração de um canal, filme ou série para salvá-lo aqui.';}
    if(state.section==='recents'&&!state.search){title='Seu histórico está vazio';desc='Os conteúdos que você reproduzir aparecerão aqui.';}
    if(!state.search&&!['favorites','recents'].includes(state.section)&&sectionCat.loaded){title='Nenhum conteúdo nesta categoria';desc='Seu servidor não retornou conteúdos para este filtro.';}
    area.append(emptyContent(title,desc));return;
  }
  const grid=el('div','content-grid');for(const item of items.slice(0,state.limit))grid.append(mediaCard(item));area.append(grid);
  $('loadMoreWrap').hidden=items.length<=state.limit;
}
function render(){renderStats();renderHeadings();renderChips();renderContent();renderHero();}
function playerReset(){
  saveProgress();
  $('seekBack').disabled=true;$('seekForward').disabled=true;
  state.playbackId++;
  if(state.hls){try{state.hls.destroy();}catch{}state.hls=null;}
  const video=$('videoPlayer');video.pause();video.removeAttribute('src');video.load();
  $('videoPlaceholder').hidden=false;$('videoError').hidden=true;
}
function stopPlayback(){playerReset();state.current=null;}
function playbackFailure(message){$('videoPlaceholder').hidden=true;$('videoError').hidden=false;$('videoErrorText').textContent=message;}
function streamPath(item){const ext=(item.extension||((item.type==='live')?'m3u8':'mp4')).toLowerCase().replace(/[^a-z0-9]/g,'');return `/api/stream/${encodeURIComponent(state.token)}/${item.type}/${item.sourceId}.${ext}`;}
function playItem(item){
  if(!state.token){showModal('accountModal');return;}
  if(!contentAllowed(item,state.policy)){toast('Conteúdo bloqueado pelo controle parental.');return;}
  if(!/^\d{1,15}$/.test(String(item.sourceId||''))){toast('Este conteúdo possui um identificador inválido.');return;}
  saveProgress();playerReset();state.current=item;if(item.parentId)state.seriesProgress[item.parentId]={episodeId:item.id,updatedAt:Date.now()};addRecent(item.parentId||item.id);
  $('playerTitle').textContent=item.name;$('playerType').textContent=item.type==='live'?'TV AO VIVO':item.type==='vod'?'FILME':'SÉRIE / EPISÓDIO';
  $('playerFootText').textContent=`${item.group||kindMap[item.type]} • ${ratingText(item)}`;
  $('playerFavorite').classList.toggle('active',state.favorites.has(item.parentId||item.id));
  $('seriesModal').hidden=true;showModal('playerModal');
  renderPlayerQueue();
  startPlayback(item);
}
async function startPlayback(item){
  playerReset();const ticket=state.playbackId;const video=$('videoPlayer');let restored=false;
  video.onloadedmetadata=()=>{if(ticket!==state.playbackId||restored||item.type==='live')return;restored=true;const saved=state.progress[item.id];if(saved&&!saved.completed&&saved.position>=5&&Number.isFinite(video.duration)){video.currentTime=seekTarget(0,saved.position,video.duration);toast(`Retomando em ${formatTime(saved.position)}.`);}updateSeekButtons();};
  video.ondurationchange=updateSeekButtons;video.onprogress=updateSeekButtons;
  const url=streamPath(item);const isHls=/\.m3u8$/i.test(url);
  video.onerror=()=>{if(ticket===state.playbackId)playbackFailure('O formato de vídeo não é compatível, ou a transmissão não está disponível. Verifique o servidor e tente novamente.');};
  video.onplaying=()=>{if(ticket===state.playbackId){$('videoPlaceholder').hidden=true;$('videoError').hidden=true;}};
  try{
    if(isHls&&video.canPlayType('application/vnd.apple.mpegurl')){video.src=url;await video.play();}
    else if(isHls&&window.Hls?.isSupported()){
      const hls=new window.Hls({enableWorker:true,maxBufferLength:30,backBufferLength:20});state.hls=hls;
      hls.on(window.Hls.Events.ERROR,(_event,data)=>{if(data.fatal&&ticket===state.playbackId){playbackFailure('Falha na transmissão HLS. O servidor pode estar indisponível ou não fornecer este formato.');hls.destroy();if(state.hls===hls)state.hls=null;}});
      hls.on(window.Hls.Events.MANIFEST_PARSED,()=>{if(ticket===state.playbackId)video.play().catch(err=>{if(err.name!=='AbortError')$('videoPlaceholder').hidden=true;});});
      hls.loadSource(url);hls.attachMedia(video);
    } else if(isHls){playbackFailure('Seu navegador não oferece suporte HLS neste ambiente. Verifique a conexão para carregar o mecanismo de reprodução.');}
    else{video.src=url;await video.play();}
  }catch(err){if(ticket===state.playbackId&&err.name!=='AbortError'&&err.name!=='NotAllowedError')playbackFailure('Não foi possível iniciar o vídeo. O formato ou servidor pode não ser compatível.');else if(err.name==='NotAllowedError'){$('videoPlaceholder').hidden=true;}}
}
function ratingText(item){const label=item.ageLabel||'Não informada';return label==='Não informada'?'Classificação não informada':`Classificação: ${label}${item.ageCountry?' · '+item.ageCountry:''}${item.ageSource?' · '+item.ageSource:''}`;}
function saveProgress(ended=false){
  const video=$('videoPlayer'),item=state.current;
  const record=progressRecord(item,video.currentTime,video.duration,ended);if(!record||!state.account)return;
  state.progress[item.id]=record;if(item.parentId)state.seriesProgress[item.parentId]={episodeId:item.id,updatedAt:Date.now()};
  const records=Object.values(state.progress).sort((a,b)=>b.updatedAt-a.updatedAt);if(records.length>500)state.progress=Object.fromEntries(records.slice(0,500).map(row=>[row.id,row]));
  persist();
  const row=$('playerEpisodeList').querySelector('[aria-current="true"]');if(row){let bar=row.querySelector('progress');if(!bar){bar=el('progress','episode-progress');bar.setAttribute('aria-label','Progresso do episódio');row.append(bar);}bar.max=record.duration;bar.value=record.completed?record.duration:record.position;}
}
function updateSeekButtons(){const video=$('videoPlayer');const allowed=!!state.current&&(state.current.type!=='live'?Number.isFinite(video.duration)&&video.duration>0:video.seekable.length>0);$('seekBack').disabled=!allowed;$('seekForward').disabled=!allowed;}
function seekBy(delta){const video=$('videoPlayer');if($('seekBack').disabled)return;video.currentTime=seekTarget(video.currentTime,delta,video.duration,video.seekable);saveProgress();}
async function togglePlayerFullscreen(){const target=$('playerLayout');if(document.fullscreenElement){await document.exitFullscreen?.();return;}if(target.classList.contains('is-full-window')){target.classList.remove('is-full-window');return;}try{if(!target.requestFullscreen)throw new Error();await target.requestFullscreen();}catch{target.classList.add('is-full-window');}}
function queueEpisode(item){if(item.parentId)state.seriesProgress[item.parentId]={episodeId:item.id,updatedAt:Date.now()};persist();playItem(item);}
function nextEpisode(){const index=state.episodeQueue.findIndex(ep=>ep.id===state.current?.id);if(index>=0&&index+1<state.episodeQueue.length)queueEpisode(state.episodeQueue[index+1]);}
function episodeRow(item,active=false){
  const record=state.progress[item.id],row=el('button','queue-episode'+(active?' is-playing':''));row.type='button';if(active)row.setAttribute('aria-current','true');
  const copy=el('span','queue-episode-copy');copy.append(el('strong','',`T${item.season} · Ep. ${item.episodeNumber}`),el('span','',item.name.replace(item.seriesTitle+' — ','')),el('small','',active&&!$('videoPlayer').ended?'Reproduzindo':record?.completed?'Assistido':record?.position>=5?'Continuar em '+formatTime(record.position):'Não assistido'));
  row.append(copy);if(record?.duration){const progress=el('progress','episode-progress');progress.max=record.duration;progress.value=record.completed?record.duration:record.position;progress.setAttribute('aria-label','Progresso do episódio');row.append(progress);}
  row.onclick=()=>queueEpisode(item);return row;
}
function renderPlayerQueue(){
  const item=state.current,isSeries=item?.type==='series'&&!!item.parentId;$('playerEpisodes').hidden=!isSeries;$('playerLayout').classList.toggle('has-episodes',isSeries);$('nextEpisode').hidden=!isSeries;
  const index=state.episodeQueue.findIndex(ep=>ep.id===item?.id);$('nextEpisode').disabled=index<0||index===state.episodeQueue.length-1;$('nextEpisode').title=$('nextEpisode').disabled?'Você chegou ao último episódio':'Reproduzir próximo episódio';
  if(!isSeries)return;
  $('queueTitle').textContent=item.seriesTitle||'Episódios';const select=$('queueSeason');select.replaceChildren();for(const season of [...new Set(state.episodeQueue.map(ep=>ep.season))])select.add(new Option('Temporada '+season,season));select.value=item.season;
  const fill=()=>{const list=$('playerEpisodeList');list.replaceChildren();for(const ep of state.episodeQueue.filter(ep=>ep.season===select.value))list.append(episodeRow(ep,ep.id===state.current?.id));};select.onchange=fill;fill();updateSeekButtons();
}
async function openSeries(item) {
  if(!state.token){showModal('accountModal');return;}
  const request=++state.seriesRequest,token=state.token;
  $('seriesTitle').textContent=item.name;$('resumeSeriesButton').hidden=true;
  $('seriesDescription').textContent=item.group;
  $('episodesList').replaceChildren(emptyContent('Carregando episódios','Buscando temporadas no servidor...'));
  $('seasonSelect').replaceChildren();
  showModal('seriesModal');
  try{
    const data=(await api(`/api/catalog?section=series&kind=info&series_id=${encodeURIComponent(item.sourceId)}`)).data;
    if(request!==state.seriesRequest||token!==state.token||$('seriesModal').hidden)return;
    Object.assign(item,data.metadata);cachedItem.set(item.id,item);
    const queue=flattenEpisodes(item,data.episodes),seasons=[...new Set(queue.map(ep=>ep.season))];
    $('seriesDescription').textContent=[ratingText(item),data?.info?.plot||item.description||item.group].filter(Boolean).join(' · ');
    if(!seasons.length){$('episodesList').replaceChildren(emptyContent('Episódios indisponíveis','O servidor não retornou episódios para esta série.'));return;}
    for(const season of seasons)$('seasonSelect').add(new Option(`Temporada ${season}`,season));
    const play=episode=>{state.episodeQueue=queue;queueEpisode(episode);};
    const saved=queue.find(ep=>ep.id===state.seriesProgress[item.id]?.episodeId);
    const resume=saved&&state.progress[saved.id]?.completed?(queue[queue.indexOf(saved)+1]||saved):saved;
    if(resume){$('resumeSeriesButton').hidden=false;$('resumeSeriesButton').textContent=`Continuar · T${resume.season} E${resume.episodeNumber}${state.progress[resume.id]?.position&&!state.progress[resume.id]?.completed?' · '+formatTime(state.progress[resume.id].position):''}`;$('resumeSeriesButton').onclick=()=>play(resume);}
    const showEpisodes=season=>{
      const wrapper=$('episodesList');wrapper.replaceChildren();
      for(const ep of queue.filter(ep=>ep.season===season)){
        const row=episodeRow(ep);if(ep.id===resume?.id)row.classList.add('is-resume');row.onclick=()=>play(ep);wrapper.append(row);
      }
      if(!wrapper.children.length)wrapper.append(emptyContent('Nenhum episódio válido','O servidor não forneceu episódios compatíveis.'));
    };
    $('seasonSelect').onchange=e=>showEpisodes(e.target.value);
    $('seasonSelect').value=resume?.season||seasons[0];showEpisodes($('seasonSelect').value);
  }catch(err){if(request===state.seriesRequest)$('episodesList').replaceChildren(emptyContent('Não foi possível carregar episódios',err.message));}
}
async function loadParental(){state.policy=await api('/api/parental');}
function renderHome(area){
  const recent=state.recents.map(id=>cachedItem.get(id)).filter(item=>item&&contentAllowed(item,state.policy));
  const rows=[...(recent.length?[{title:'Continue de onde parou',items:recent,section:'recents'}]:[]),...types.map(type=>({title:kindMap[type],items:state.catalog[type].items.filter(item=>contentAllowed(item,state.policy)),section:type}))];
  for(const row of rows){const section=el('section','library-row'),head=el('div','row-heading');head.append(el('h3','',row.title));const more=el('button','text-action','Ver tudo →');more.type='button';more.onclick=()=>setSection(row.section);head.append(more);section.append(head);
    const rail=el('div','media-rail');if(state.catalog[row.section]?.loading){for(let i=0;i<6;i++)rail.append(el('div','loading-card'));}else if(!row.items.length){rail.append(el('p','rail-empty',state.catalog[row.section]?.error||'Nenhum título disponível nesta seção.'));}else for(const item of row.items.slice(0,16))rail.append(mediaCard(item));section.append(rail);area.append(section);
  }
}
let featuredId='';
function renderHero(){
  const hero=document.querySelector('.hero');hero.hidden=state.section!=='home'||!!state.search;
  const item=state.catalog.vod.items.find(item=>item.logo&&contentAllowed(item,state.policy));
  if(!state.token||!item){if(featuredId){document.querySelector('.hero-copy h1').textContent='O que vamos assistir hoje?';document.querySelector('.hero-copy p').textContent='Sua TV, seus filmes e suas séries. Tudo em um só lugar.';hero.querySelector('.feature-art')?.remove();featuredId='';}return;}
  if(item.id===featuredId)return;featuredId=item.id;
  hero.querySelector('.feature-art')?.remove();const src=safeHttp(item.logo);if(src){const image=el('img','feature-art');image.src=src;image.alt='';image.referrerPolicy='no-referrer';image.onerror=()=>image.remove();hero.prepend(image);}
  document.querySelector('.hero-copy h1').textContent=item.name;document.querySelector('.hero-copy p').textContent=item.description||'Uma nova história espera por você. Conheça o título e escolha seu próximo play.';
  document.querySelector('.hero-kicker').textContent='EM DESTAQUE NA SUA LISTA';$('heroPrimaryLabel').textContent='Conhecer o filme';
}
async function openDetails(item,refresh=false){
  state.detailItem=item;const ticket=++state.detailRequest;showModal('detailsModal');
  const fill=metadata=>{
    $('detailsTitle').textContent=item.name;$('detailsKind').textContent=kindMap[item.type];$('detailsDescription').textContent=metadata.description||'Sinopse não informada pelo provedor.';
    $('detailsMeta').replaceChildren(el('span','age-badge age-'+(metadata.age??'nc'),ratingText(metadata)),...[(item.year||'').slice(0,4),metadata.genre,metadata.duration?`${metadata.duration}`:''].filter(Boolean).map(value=>el('span','',value)));
    if(metadata.ageSourceUrl){try{const url=new URL(metadata.ageSourceUrl);if(url.protocol==='https:'&&['itunes.apple.com','tv.apple.com'].includes(url.hostname)){const link=el('a','rating-source','Ver fonte');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';$('detailsMeta').append(link);}}catch{}}
    $('detailsCredits').textContent=[metadata.director?`Direção: ${metadata.director}`:'',metadata.cast?`Elenco: ${metadata.cast}`:''].filter(Boolean).join(' · ');
    $('detailsFavorite').textContent=state.favorites.has(item.id)?'Remover da minha lista':'Adicionar à minha lista';
  };
  $('detailsArt').replaceChildren();const src=safeHttp(item.logo);if(src){const image=el('img');const proxy=state.token?'/api/poster/'+encodeURIComponent(state.token)+'/'+item.type+'/'+encodeURIComponent(item.sourceId):src;image.src=proxy;image.alt='';image.referrerPolicy='no-referrer';image.onerror=()=>{if(image.src!==src){image.src=src;}else image.hidden=true;};$('detailsArt').append(image);}fill(item);$('detailsPlay').disabled=true;
  $('refreshRating').disabled=true;if(item.ageLabel==='Não informada'||refresh)$('detailsMeta').replaceChildren(el('span','age-badge','Buscando classificação…'));
  try{const data=(await api(`/api/catalog?section=${item.type}&kind=info&${item.type==='vod'?'vod_id':'series_id'}=${item.sourceId}${refresh?'&refresh=1':''}`)).data;if(ticket!==state.detailRequest||$('detailsModal').hidden)return;Object.assign(item,data.metadata);cachedItem.set(item.id,item);state.detailItem=item;render();fill(state.detailItem);$('detailsPlay').disabled=false;}
  catch(error){if(ticket===state.detailRequest){$('detailsDescription').textContent=error.message;if(error.status===403)loadSection(item.type,true);}}
  finally{if(ticket===state.detailRequest)$('refreshRating').disabled=false;}
}
function bind() {
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&($('playerLayout').classList.contains('is-full-window')||document.fullscreenElement)){event.preventDefault();event.stopImmediatePropagation();togglePlayerFullscreen();}},true);
  const back=$('seekBack'),forward=$('seekForward'),next=$('nextEpisode');
  if(window.Plyr){
    state.playerUI=new window.Plyr($('videoPlayer'),{seekTime:10,listeners:{fullscreen:()=>{togglePlayerFullscreen();return false;}},iconUrl:'/vendor/plyr.svg',controls:['play-large','play','rewind','fast-forward','progress','current-time','duration','mute','volume','settings','pip','airplay','fullscreen'],settings:['speed'],speed:{selected:1,options:[.5,.75,1,1.25,1.5,1.75,2]},fullscreen:{enabled:true,fallback:true,iosNative:false,container:'#playerLayout'},i18n:{play:'Reproduzir',pause:'Pausar',rewind:'Retroceder {seektime} segundos',fastForward:'Avançar {seektime} segundos',seek:'Posição do vídeo',currentTime:'Tempo atual',duration:'Duração',mute:'Silenciar',unmute:'Ativar som',settings:'Configurações',speed:'Velocidade',normal:'Normal',enterFullscreen:'Tela cheia',exitFullscreen:'Sair da tela cheia'}});
    const controls=state.playerUI.elements.controls;
    if(controls){for(const [button,selector,label,text]of [[back,'[data-plyr="rewind"]','Retroceder 10 segundos','↶10'],[forward,'[data-plyr="fast-forward"]','Avançar 10 segundos','10↷']]){button.className='plyr__control skip-ten';button.innerHTML=`<span aria-hidden="true">${text}</span><span class="plyr__tooltip">${label}</span>`;controls.querySelector(selector)?.replaceWith(button);}next.className='plyr__control next-inline';next.setAttribute('aria-label','Próximo episódio');next.innerHTML='<span aria-hidden="true">▶|</span><span class="plyr__tooltip">Próximo episódio</span>';controls.insertBefore(next,controls.querySelector('[data-plyr="fullscreen"]'));document.querySelector('.playback-toolbar').remove();}
  }else{$('videoShell').append(document.querySelector('.playback-toolbar'));}
  const heading=document.querySelector('.catalog-heading');heading.insertBefore(document.querySelector('.topbar-actions'),document.querySelector('.catalog-actions'));document.querySelector('.topbar').append(heading);
  $('refreshRating').onclick=()=>{if(state.detailItem)openDetails(state.detailItem,true);};
  $('seekBack').onclick=()=>seekBy(-10);$('seekForward').onclick=()=>seekBy(10);$('nextEpisode').onclick=nextEpisode;
  let lastProgressSave=0;
  $('videoPlayer').addEventListener('timeupdate',()=>{if(Date.now()-lastProgressSave>3000){saveProgress();lastProgressSave=Date.now();}});
  $('videoPlayer').addEventListener('pause',()=>saveProgress());$('videoPlayer').addEventListener('seeked',()=>saveProgress());
  $('videoPlayer').addEventListener('ended',()=>{saveProgress(true);renderPlayerQueue();toast($('nextEpisode').disabled?'Conteúdo concluído.':'Episódio concluído. O próximo já está disponível.');});
  window.addEventListener('pagehide',()=>{saveProgress();flushCloud();});document.addEventListener('visibilitychange',()=>{if(document.hidden){saveProgress();flushCloud();}});
  document.addEventListener('keydown',event=>{if($('playerModal').hidden||event.target.closest('.plyr')||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowLeft'){event.preventDefault();seekBy(-10);}if(event.key==='ArrowRight'){event.preventDefault();seekBy(10);}});
  document.addEventListener('keydown',event=>{const modal=[...document.querySelectorAll('.modal-layer:not([hidden])')].at(-1);if(!modal)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();hideModal(modal.id);}if(event.key==='Tab'){const nodes=[...modal.querySelectorAll('button,input,select,[tabindex="0"]')].filter(node=>!node.disabled&&node.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}},true);
  uiIcon();
  document.querySelectorAll('[data-nav]').forEach(node=>node.addEventListener('click',()=>setSection(node.dataset.nav)));
  $('brandLink').addEventListener('click',e=>{e.preventDefault();setSection('home');});
  $('menuToggle').addEventListener('click',showMenu);$('mobileScrim').addEventListener('click',closeMenu);
  for(const id of ['openAccount','openAccountProfile','openAccountSidebar'])$(id).addEventListener('click',()=>state.fixedMode?window.dispatchEvent(new Event('mf:profiles')):showModal('accountModal'));
  document.querySelectorAll('[data-dismiss]').forEach(node=>node.addEventListener('click',()=>hideModal(node.dataset.dismiss)));
  $('heroPrimary').addEventListener('click',()=>{const item=cachedItem.get(featuredId);if(state.token&&item)openDetails(item);else if(state.token)setSection('live');else showModal('accountModal');});
  $('detailsPlay').onclick=()=>{const item=state.detailItem;if(!item)return;hideModal('detailsModal');item.type==='series'?openSeries(item):playItem(item);};
  $('detailsFavorite').onclick=()=>{if(state.detailItem){favorite(state.detailItem.id);$('detailsFavorite').textContent=state.favorites.has(state.detailItem.id)?'Remover da minha lista':'Adicionar à minha lista';}};
  $('openParental').onclick=async()=>{if(!state.token){showModal('accountModal');return;}try{await loadParental();$('hideAdult').checked=state.policy.hideAdult;$('maxAge').value=state.policy.maxAge??'';$('blockUnknown').checked=state.policy.blockUnknown;$('currentPinField').hidden=!state.policy.pinSet;$('parentalPin').required=state.policy.pinSet;$('newParentalPin').required=!state.policy.pinSet;$('newPinLabel').textContent=state.policy.pinSet?'Novo PIN (opcional)':'Criar PIN';for(const id of ['parentalPin','newParentalPin','confirmParentalPin'])$(id).value='';$('parentalError').hidden=true;showModal('parentalModal');}catch(error){toast(error.message);}};
  $('parentalForm').onsubmit=async event=>{event.preventDefault();$('parentalSave').disabled=true;$('parentalError').hidden=true;try{
    if($('newParentalPin').value!==$('confirmParentalPin').value)throw new Error('A confirmação do novo PIN não confere.');
    state.policy=await api('/api/parental',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hideAdult:$('hideAdult').checked,maxAge:$('maxAge').value===''?null:Number($('maxAge').value),blockUnknown:$('blockUnknown').checked,pin:$('parentalPin').value,newPin:$('newParentalPin').value})});
    stopPlayback();for(const id of ['playerModal','detailsModal','seriesModal','parentalModal'])hideModal(id);cachedItem.clear();featuredId='';for(const t of types)state.catalog[t]={loaded:false,loading:false,items:[],categories:[],promise:null,error:null};state.category='';render();for(const t of types)loadSection(t);toast('Proteção parental atualizada.');
  }catch(error){$('parentalError').textContent=error.message;$('parentalError').hidden=false;}finally{$('parentalSave').disabled=false;}};
  $('heroSecondary').addEventListener('click',()=>state.token?setSection('live'):showModal('accountModal'));
  $('loginForm').addEventListener('submit',login);$('diagnoseButton').addEventListener('click',diagnoseServer);$('copyDiagnostics').addEventListener('click',async()=>{if(state.diagnosticReport){try{await navigator.clipboard.writeText(state.diagnosticReport);toast('Relatório técnico copiado, sem credenciais.');}catch{toast('Seu navegador não permitiu copiar o relatório.');}}});$('logoutButton').addEventListener('click',logout);
  $('passwordToggle').addEventListener('click',()=>{$('xtreamPassword').type=$('xtreamPassword').type==='password'?'text':'password';});
  let searchTimer;
  $('globalSearch').addEventListener('input',e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.search=e.target.value.trim();state.category='';state.limit=30;render();if(state.search&&state.token)for(const type of types)if(!state.catalog[type].loaded)loadSection(type);},190);});
  $('sortSelect').addEventListener('change',e=>{state.sort=e.target.value;renderContent();});
  $('refreshButton').addEventListener('click',()=>{if(state.token)loadSection(targetType(),true);else showModal('accountModal');});
  $('loadMoreButton').addEventListener('click',()=>{state.limit+=30;renderContent();});
  $('playerFavorite').addEventListener('click',()=>{if(state.current)favorite(state.current.parentId||state.current.id);$('playerFavorite').classList.toggle('active',state.favorites.has(state.current?.parentId||state.current?.id));});
  $('playerRetry').addEventListener('click',()=>{if(state.current)startPlayback(state.current);});
  $('fullscreenButton').addEventListener('click',togglePlayerFullscreen);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!$('playerModal').hidden)hideModal('playerModal');else if(!$('seriesModal').hidden)hideModal('seriesModal');else if(!$('accountModal').hidden)hideModal('accountModal');else closeMenu();}if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){event.preventDefault();$('globalSearch').focus();}});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.deferredInstall=event;$('installButton').hidden=false;});
  $('installButton').addEventListener('click',async()=>{if(!state.deferredInstall){toast('Use o menu do navegador para instalar o aplicativo.');return;}const prompt=state.deferredInstall;state.deferredInstall=null;await prompt.prompt();$('installButton').hidden=true;});
  window.addEventListener('appinstalled',()=>{$('installButton').hidden=true;toast('MF Stream IPTV instalado.');});
  if('serviceWorker'in navigator&&['https:','http:'].includes(location.protocol)){navigator.serviceWorker.register('/service-worker.js').catch(()=>{});}
}
async function main(){bind();document.body.dataset.page='home';updateSessionUI();render();try{const fixed=await setupAccess({state,onReset:()=>{flushCloud();setDisconnected();},onConnected:async(result,profile,user)=>{state.token=result.token;state.account=result.account;state.host=result.host;state.listName=profile.name;state.profile=profile;state.appUser=user;$('openAccount').setAttribute('aria-label','Trocar perfil');$('openAccountSidebar').querySelector('span:not([data-icon])').textContent='Perfis';loadPrefs();const prefs=await api('/api/preferences');if(Array.isArray(prefs.favorites))state.favorites=new Set(prefs.favorites);if(Array.isArray(prefs.recents))state.recents=prefs.recents;if(prefs.progress&&typeof prefs.progress==='object')state.progress=prefs.progress;if(prefs.seriesProgress&&typeof prefs.seriesProgress==='object')state.seriesProgress=prefs.seriesProgress;await loadParental();updateSessionUI();setSection('home');}});if(!fixed)await restoreSession();}catch(error){document.body.classList.remove('auth-pending');toast('Não foi possível carregar o acesso. Atualize a página.');}}
main();


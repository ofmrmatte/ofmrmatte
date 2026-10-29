import {createHeroPreview,allowAutomaticPreview} from './hero-preview.mjs';
import {mountRail,disposeRails,bindSearch} from './scene-ui.mjs';
import {offlineScope,offlineKey,canDownload,formatDownloadSize,rememberOfflineProfile,lastOfflineProfile,listOffline,removeOffline,openOffline,saveOffline} from './offline.mjs';
import {selectHighlights,createHighlightRotation,displayTitle} from './highlights.mjs';
import { normalizeCatalog } from './xtream.mjs';
import {contentAllowed} from './content.mjs';
import {formatTime,seekTarget,progressRecord,flattenEpisodes} from './playback.mjs';
import {mobilePlaybackViewport,enterNativePlayback,unlockMobilePlayback,setupVisualViewport} from './mobile.mjs';
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
 'volume-x':'<path d="M11 5 6 9H3v6h3l5 4V5ZM17 9l5 6m0-6-5 6"/>',
 'volume-2':'<path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/>',
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
const PROFILE_HEADER_COLORS=['#aa95f5','#70b8cb','#d38c9d','#dea659','#7bb298','#8b9bd6','#bf9470','#9a9eac'];
function updateProfileButton(profile){
 const button=$('openAccountProfile');if(!button)return;
 if(!profile){
   button.innerHTML=icon('user',20);button.removeAttribute('data-profile');
   button.style.removeProperty('--profile-color');button.title='Gerenciar perfis';
   button.setAttribute('aria-label','Gerenciar perfis');return;
 }
 const name=String(profile.name||'Perfil').trim();
 button.textContent=name.slice(0,1).toLocaleUpperCase('pt-BR');
 button.dataset.profile='true';
 button.style.setProperty('--profile-color',PROFILE_HEADER_COLORS[Number(profile.avatar)]||PROFILE_HEADER_COLORS[0]);
 button.title='Trocar perfil: '+name;button.setAttribute('aria-label',button.title);
}

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
state.discovery=null;state.discoveryLoading=false;state.discoveryExpires=0;state.rankMode='external';state.blockedTitles=new Set();
const titleExtras=new Map();let discoveryRefillTimer;
function titleAllowed(item){return !state.blockedTitles.has(item.id)&&contentAllowed(item,state.policy);}
function ageBadgeText(item){return !item.ageLabel||item.ageLabel==='Não informada'?'—':item.ageLabel+(item.ageCountry&&item.ageCountry!=='BR'?' · '+item.ageCountry:'');}
function updateAgeBadges(item){for(const card of document.querySelectorAll('[data-item-id]'))if(card.dataset.itemId===item.id){const badge=card.querySelector('.age-badge');if(badge){badge.textContent=ageBadgeText(item);badge.className='age-badge age-'+(item.age??'nc');badge.title=ratingText(item);}}if(featuredId===item.id)paintHeroMeta(item);}
async function loadDiscovery(force=false){
  if(!state.token||state.discoveryLoading||!state.catalog.vod.loaded||!state.catalog.series.loaded||!force&&Date.now()<state.discoveryExpires)return;
  const token=state.token;state.discoveryLoading=true;
  try{const data=await api('/api/discovery');if(token!==state.token)return;for(const item of [...(data.highlights||[]),...Object.values(data.rankings||{}).flat()]){const previous=cachedItem.get(item.id);if(previous){Object.assign(previous,item,{...previous.ageLabel&&previous.ageLabel!=='Não informada'?Object.fromEntries(Object.entries(previous).filter(([k])=>k.startsWith('age'))):{}});}else cachedItem.set(item.id,item);}
    state.discovery=data;state.discoveryExpires=Math.max(Date.now()+60000,Date.parse(data.nextRefreshAt)||Date.now()+300000);if(state.section==='home'){renderContent();renderHero();}
  }catch{if(token===state.token){state.discoveryExpires=Date.now()+120000;if(!state.discovery)state.discovery={status:'unavailable',rankings:{vod:[],series:[]},highlights:[],internal:{}};if(state.section==='home')renderContent();}}finally{if(token===state.token)state.discoveryLoading=false;}
}
async function loadTitleExtra(item){
  const key=state.token+':'+item.id;const old=titleExtras.get(key);if(old&&old.expires>Date.now())return old.promise;
  const token=state.token,promise=api('/api/title-extra?section='+item.type+'&id='+item.sourceId).then(data=>{if(token!==state.token)return null;if(data.metadata)Object.assign(item,data.metadata);for(const field of ['externalTitle','externalDescription','externalSource','externalUrl','description','metadataSource','metadataUrl','backdrop','trailer'])if(data[field])item[field]=data[field];updateAgeBadges(item);return data;}).catch(()=>null);
  titleExtras.set(key,{promise,expires:Date.now()+3600000});if(titleExtras.size>100)titleExtras.delete(titleExtras.keys().next().value);return promise;
}

const ratingJobs=[],ratingPending=new Set(),ratingSeen=new Set();let ratingWorkers=0;
const ratingObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){ratingObserver.unobserve(entry.target);const item=cachedItem.get(entry.target.dataset.itemId);if(item&&!ratingSeen.has(item.id)&&!ratingPending.has(item.id)){ratingPending.add(item.id);ratingJobs.push({item,card:entry.target,token:state.token});pumpRatings();}}},{rootMargin:'100px'});
async function pumpRatings(){while(ratingWorkers<3&&ratingJobs.length){const job=ratingJobs.shift();if(job.token!==state.token){ratingPending.delete(job.item.id);continue;}ratingWorkers++;(async()=>{const badge=job.card.querySelector('.age-badge');if(badge)badge.textContent='…';try{const metadata=(await api(`/api/catalog?section=${job.item.type}&kind=rating&${job.item.type==='vod'?'vod_id':'series_id'}=${job.item.sourceId}`)).data;if(job.token!==state.token)return;Object.assign(job.item,metadata);updateAgeBadges(job.item);if(job.item.id===featuredId)renderHero();if(state.detailItem?.id===job.item.id&&!$('detailsModal').hidden)paintTitle(job.item);if(badge&&job.card.dataset.itemId===job.item.id){badge.textContent=ageBadgeText(metadata);badge.className='age-badge age-'+(metadata.age??'nc');badge.title=metadata.ageLabel==='Não informada'?ratingLookupMessage(metadata):ratingText(metadata);}}catch(error){if(error.status===403&&job.token===state.token){state.blockedTitles.add(job.item.id);if(job.card.classList.contains('media-card')){job.card.closest('.ranked-title')?.remove();job.card.remove();}renderHero();if(state.section==='home'){renderContent();clearTimeout(discoveryRefillTimer);discoveryRefillTimer=setTimeout(()=>loadDiscovery(true),500);}state.catalog[job.item.type].items=state.catalog[job.item.type].items.filter(item=>item.id!==job.item.id);}else if(badge){badge.textContent='—';badge.title='Classificação indisponível. Abra o título para tentar novamente.';}}finally{if(job.token===state.token){if(job.item.ageLabel&&job.item.ageLabel!=='Não informada')ratingSeen.add(job.item.id);else setTimeout(()=>{if(job.token===state.token)for(const card of document.querySelectorAll('[data-item-id]'))if(card.dataset.itemId===job.item.id)ratingObserver.observe(card);},65000);ratingPending.delete(job.item.id);}ratingWorkers--;pumpRatings();}})();}}
state.progress={};state.seriesProgress={};state.episodeQueue=[];state.seriesRequest=0;
function scopeKey() { return `mfstream:${state.host}:${state.account?.profile?.id||state.account?.username||''}`; }
let cloudTimer,cloudSnapshot;
function cloudSave(){if(!state.fixedMode||!state.profile||!state.account)return;cloudSnapshot={profileId:state.profile.id,data:{favorites:[...state.favorites],recents:state.recents,progress:state.progress,seriesProgress:state.seriesProgress,autoNext:state.autoNext}};clearTimeout(cloudTimer);cloudTimer=setTimeout(flushCloud,700);}
function flushCloud(){const snapshot=cloudSnapshot;if(!snapshot)return;cloudSnapshot=null;const body=JSON.stringify(snapshot.data);fetch('/api/preferences',{method:'PUT',credentials:'same-origin',keepalive:body.length<60000,headers:{'Content-Type':'application/json','x-profile-id':snapshot.profileId},body}).catch(()=>{});}
function persist() { if (!state.account) return; storage.set(`${scopeKey()}:favorites`,[...state.favorites]); storage.set(`${scopeKey()}:recent`,state.recents);storage.set(`${scopeKey()}:progress`,state.progress);storage.set(`${scopeKey()}:seriesProgress`,state.seriesProgress);storage.set(`${scopeKey()}:autoNext`,state.autoNext);cloudSave(); }
function loadPrefs() { state.autoNext=storage.get(`${scopeKey()}:autoNext`,true)!==false; state.favorites = new Set(storage.get(`${scopeKey()}:favorites`,[])); state.recents = storage.get(`${scopeKey()}:recent`,[]); if (!Array.isArray(state.recents)) state.recents=[];state.progress=storage.get(`${scopeKey()}:progress`,{});state.seriesProgress=storage.get(`${scopeKey()}:seriesProgress`,{});if(!state.progress||typeof state.progress!=='object'||Array.isArray(state.progress))state.progress={};if(!state.seriesProgress||typeof state.seriesProgress!=='object'||Array.isArray(state.seriesProgress))state.seriesProgress={}; }

// Offline library is isolated by the previously authenticated user and profile.
let downloadingOffline=null,offlineVideoUrl=null;
function currentOfflineProfile(){
 if(state.account){
  const scope=offlineScope(state.appUser?.id||state.account.username,state.profile?.id||'default');
  return {scope,name:state.profile?.name||state.listName||'Minha conta'};
 }
 return navigator.onLine===false||state.offlineMode?lastOfflineProfile():null;
}
function stopOfflineVideo(){
 const video=$('offlineVideo');if(!video)return;
 video.pause();video.removeAttribute('src');video.load();
 if(offlineVideoUrl){URL.revokeObjectURL(offlineVideoUrl);offlineVideoUrl=null;}
 $('offlinePlayback').hidden=true;$('offlineList').hidden=false;
}
async function refreshOfflineList(){
 const identity=currentOfflineProfile(),list=$('offlineList'),status=$('offlineStatus');
 if(!list||!identity?.scope){
  if(list)list.replaceChildren(el('p','offline-empty','Entre em um perfil para acessar seus downloads. Para assistir sem internet, use o mesmo navegador em que baixou os vídeos.'));
  return;
 }
 $('offlineProfileLabel').textContent='Perfil: '+identity.name+' · salvo neste dispositivo';
 list.replaceChildren(el('p','offline-empty','Verificando os arquivos armazenados…'));
 try{
  const items=await listOffline(identity.scope);
  list.replaceChildren();
  if(!items.length){list.append(el('p','offline-empty','Nenhum título salvo neste perfil. Abra um filme ou episódio MP4 no catálogo e selecione “Baixar offline”.'));return;}
  for(const item of items){
   const row=el('article','offline-entry');
   const image=el('span','offline-entry-cover','▶');image.setAttribute('aria-hidden','true');
   const data=el('div','offline-entry-data');
   data.append(el('strong','',item.name),el('small','',[
    item.type==='vod'?'Filme':'Episódio',
    item.season?'T'+item.season+' · E'+item.episodeNumber:'',
    formatDownloadSize(item.size),
    new Date(item.savedAt).toLocaleDateString('pt-BR')
   ].filter(Boolean).join(' · ')));
   const actions=el('div','offline-entry-actions');
   const watch=el('button','','Assistir offline');watch.type='button';watch.onclick=()=>playOfflineFile(identity.scope,item);
   const remove=el('button','offline-remove','Remover');remove.type='button';
   remove.onclick=async()=>{
    if(!confirm('Remover “'+item.name+'” deste dispositivo?'))return;
    remove.disabled=true;
    try{await removeOffline(identity.scope,item.key);status.textContent='Download removido deste dispositivo.';await refreshOfflineList();}
    catch(error){status.textContent=error.message;remove.disabled=false;}
   };
   actions.append(watch,remove);row.append(image,data,actions);list.append(row);
  }
 }catch(error){list.replaceChildren(el('p','offline-empty','Não foi possível consultar os arquivos armazenados. '+error.message));}
}
async function playOfflineFile(scope,item){
 const status=$('offlineStatus');status.textContent='Abrindo arquivo armazenado…';
 try{
  stopOfflineVideo();
  const src=await openOffline(scope,item.key);
  offlineVideoUrl=src;
  $('offlinePlayingTitle').textContent=item.name;
  $('offlineList').hidden=true;$('offlinePlayback').hidden=false;
  const video=$('offlineVideo');video.src=src;video.load();
  status.textContent='Reprodução local. Não é necessária conexão com o provedor.';
  await video.play().catch(error=>{
   if(error.name!=='NotAllowedError')status.textContent='Toque em reproduzir para assistir. Se o vídeo não abrir, o formato pode ser incompatível.';
  });
 }catch(error){status.textContent=error.message;}
}
function showDownloads(){
 if(!state.account&&navigator.onLine!==false&&!state.offlineMode){toast('Entre em um perfil para ver seus downloads.');return;}
 stopOfflineVideo();$('offlineStatus').textContent=downloadingOffline?'Download em andamento…':'';
 showModal('downloadsModal',$('downloadsButton'));refreshOfflineList();
}
async function downloadTitle(item,button){
 if(!state.token||!state.account){toast('Entre em seu perfil para baixar títulos.');return;}
 if(!canDownload(item)||(item.type==='series'&&!item.parentId)){
  toast('Somente filmes e episódios MP4 podem ser salvos para assistir offline.');return;
 }
 if(downloadingOffline){toast('Aguarde a conclusão do download atual.');return;}
 const identity=currentOfflineProfile();
 if(!identity?.scope){toast('Perfil não identificado. Reconecte-se.');return;}
 const controller=new AbortController(),key=offlineKey(item),previous=button?.textContent;
 downloadingOffline={controller,key,scope:identity.scope};$('offlineCancelDownload').hidden=false;
 const status=$('downloadStatus'),panelStatus=$('offlineStatus');
 if(status){status.hidden=false;status.textContent='Preparando o download de '+item.name+'…';}
 if(button){button.disabled=true;button.textContent='Preparando…';}
 if(panelStatus)panelStatus.textContent='Baixando '+item.name+'…';
 try{
  const saved=await saveOffline({
   scope:identity.scope,item,url:streamPath(item),headers:sessionHeaders(),signal:controller.signal,
   onProgress:(percent,received,total)=>{
    const progress='Baixando '+item.name+' · '+percent+'% ('+formatDownloadSize(received)+' de '+formatDownloadSize(total)+')';
    if(status)status.textContent=progress;
    if(panelStatus)panelStatus.textContent=progress;
    if(button)button.textContent=percent+'%';
   }
  });
  if(status)status.textContent='Download concluído · '+formatDownloadSize(saved.size)+' · disponível offline neste dispositivo.';
  if(panelStatus)panelStatus.textContent='Download concluído: '+item.name+'.';
  toast('“'+item.name+'” salvo para assistir offline.');
  if(!$('downloadsModal').hidden)refreshOfflineList();
 }catch(error){
  const message=error.name==='AbortError'?'Download cancelado.':error.message||'Não foi possível baixar este título.';
  if(status)status.textContent=message;
  if(panelStatus)panelStatus.textContent=message;
  toast(message);
 }finally{
  downloadingOffline=null;$('offlineCancelDownload').hidden=true;
  if(button){button.disabled=false;button.textContent=previous||'Baixar offline';}
 }
}

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
  state.discovery=null;state.discoveryLoading=false;state.discoveryExpires=0;state.blockedTitles.clear();titleExtras.clear();heroPreview?.stop();
  ratingJobs.length=0;ratingSeen.clear();ratingPending.clear();ratingObserver.disconnect();seriesPreviewCache.clear();
  saveProgress();playerReset();state.progress={};state.seriesProgress={};state.episodeQueue=[];state.seriesRequest++;
  state.token=null;state.account=null;state.host='';state.listName='';state.current=null;state.profile=null;state.appUser=null;updateProfileButton(null);cachedItem.clear();state.favorites=new Set();state.recents=[];
  for(const t of types) state.catalog[t]={loaded:false,loading:false,items:[],categories:[],promise:null,error:null};
  sessionStorage.removeItem('mfstream:session');
  updateSessionUI();render();if(msg)toast(msg);
}
function updateSessionUI() {
  const on=Boolean(state.token&&state.account);
  $('connectionDot').classList.toggle('connected',on);
  $('connectionLabel').textContent=on?(state.listName||'Conta conectada'):'Conectar conta';
  $('heroPrimaryLabel').textContent=on?'Assistir TV ao vivo':'Conectar minha lista';
  $('topGreeting').textContent=on?'SUA CENTRAL DE ENTRETENIMENTO':'BOAS-VINDAS AO SCENE PLAY';
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
const modalAnimations=new Map();
function showModal(id,origin){
  closeMenu();const node=$(id);if(!node)return;
  if(id==='playerModal'&&node.classList.contains('is-minimized')){node.classList.remove('is-minimized');node.style.width='';node.style.height='';node.querySelector('.player-modal').setAttribute('aria-modal','true');$('minimizePlayer').setAttribute('aria-label','Minimizar player');}
  if(!node.hidden&&!node.inert&&id!=='playerModal')return;
  focusReturn.set(id,origin||document.activeElement);node.hidden=false;node.inert=false;document.body.style.overflow='hidden';document.querySelector('.app-shell').inert=true;document.querySelector('.mobile-bottom-nav').inert=true;
  const card=node.querySelector('.modal-card'),scrim=node.querySelector('.modal-scrim');card.tabIndex=-1;card.scrollTop=0;
  modalAnimations.get(id)?.kill();
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!(id==='playerModal'&&mobilePlaybackViewport())){
    const rect=origin?.getBoundingClientRect?.(),target=card.getBoundingClientRect();
    const from=rect?{x:Math.max(-200,Math.min(200,rect.left+rect.width/2-target.left-target.width/2)),y:Math.max(-120,Math.min(120,rect.top+rect.height/2-target.top-target.height/2)),scale:.88}:{y:28,scale:.97};
    const timeline=window.gsap.timeline();modalAnimations.set(id,timeline);
    timeline.fromTo(scrim,{opacity:0},{opacity:1,duration:.25}).fromTo(card,{opacity:0,...from},{opacity:1,x:0,y:0,scale:1,duration:.44,ease:'power3.out',clearProps:'transform,opacity'},0).fromTo(card.querySelectorAll('.details-copy>*'),{opacity:0,y:12},{opacity:1,y:0,duration:.3,stagger:.04,clearProps:'opacity,transform'},.12);
  }
  syncHighlightVisibility();requestAnimationFrame(()=>card.focus?.());
}
function hideModal(id,{immediate=false,preserveRoute=false}={}){
  const node=$(id);if(!node||node.hidden)return;
  modalAnimations.get(id)?.kill();
  if(id==='detailsModal'){state.detailRequest++;if(!preserveRoute)restoreCatalogUrl();}
   if(id==='downloadsModal')stopOfflineVideo();
  if(id==='playerModal'){const video=$('videoPlayer');if(video.webkitDisplayingFullscreen)try{video.webkitExitFullscreen?.();}catch{}unlockMobilePlayback($('playerLayout'));$('playerLayout').classList.remove('is-full-window');setEpisodeTray(false);if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});stopPlayback();render();}
  const finish=()=>{node.classList.remove('is-minimized');node.style.width='';node.style.height='';node.hidden=true;node.inert=false;node.querySelector('.modal-card').style.cssText='';node.querySelector('.modal-scrim').style.cssText='';if(!document.querySelector('.modal-layer:not([hidden]):not(.is-minimized)')){document.body.style.overflow='';document.querySelector('.app-shell').inert=false;document.querySelector('.mobile-bottom-nav').inert=false;}focusReturn.get(id)?.focus?.();syncHighlightVisibility();};
  if(!immediate&&window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches){node.inert=true;const timeline=window.gsap.timeline({onComplete:finish});modalAnimations.set(id,timeline);timeline.to(node.querySelector('.modal-card'),{opacity:0,y:14,scale:.98,duration:.18,ease:'power2.in'}).to(node.querySelector('.modal-scrim'),{opacity:0,duration:.16},0);}else finish();
}
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
    rememberOfflineProfile(offlineScope(state.account?.username,'default'),state.listName);
    state.diagnosticReport='';$('copyDiagnostics').hidden=true;
    sessionStorage.setItem('mfstream:session',JSON.stringify({token:state.token,host:state.host,account:state.account,listName:state.listName}));
    $('xtreamPassword').value='';loadPrefs();updateSessionUI();hideModal('accountModal');toast('Conta conectada ao Scene Play.');
    await loadParental();setSection('home',true);
  } catch (err) {
    $('loginError').textContent=[err.message,err.hint].filter(Boolean).join(' ');$('loginError').hidden=false;
    // Investigate the same hostname and protocol WITHOUT the password.
    await diagnoseServer();
  }
  finally {btn.disabled=false;btn.querySelector('span:nth-child(2)').textContent='Entrar no Scene Play';}
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
    const report={app:'Scene Play 3.1.0',date:new Date().toISOString(),
      attempts:(result.attempts||[]).map(({protocol,reachable,httpStatus,code})=>({protocol,reachable,httpStatus,code})),
      result:result.reachable?'HOST_REACHABLE':result.code||'UNREACHABLE'};
    state.diagnosticReport=JSON.stringify(report,null,2);
    $('copyDiagnostics').hidden=false;
  } catch(err) {
    node.classList.add('diagnostic-error');
    node.textContent='Não foi possível contactar o serviço local do Scene Play. Reinicie o aplicativo (npm start).';
  } finally {btn.disabled=false;}
}

async function logout() {try {await api('/api/logout',{method:'POST'});}catch{}hideModal('accountModal');hideModal('playerModal');setDisconnected('Conta desconectada.');}
async function restoreSession() {
  let previous;try{previous=JSON.parse(sessionStorage.getItem('mfstream:session'));}catch{}
  if(!previous?.token)return;
  state.token=previous.token;
  try {const result=await api('/api/account');state.account=result.account;state.host=result.host||previous.host;state.listName=result.account?.listName||previous.listName||'Minha lista';rememberOfflineProfile(offlineScope(state.account?.username,'default'),state.listName);loadPrefs();await loadParental();updateSessionUI();for(const type of types)loadSection(type);}
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
      restoreTitleFromLocation();
    }catch(err){cat.error=err.message;if(state.token)toast(`Não foi possível carregar ${kindMap[type]}: ${err.message}`);}
    finally{cat.loading=false;cat.promise=null;render();}
  })();
  cat.promise=promise;return promise;
}
function targetType() {return types.includes(state.section)?state.section:'live';}
function setSection(section, keepSearch=false) {
  closeTitlePage();
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
  source=source.filter(item=>titleAllowed(item));
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
  card.dataset.itemId=item.id;if(item.type!=='live'&&(item.ageLabel==='Não informada'||item.ageExpiresAt&&Date.parse(item.ageExpiresAt)<=Date.now())){ratingSeen.delete(item.id);ratingObserver.observe(card);}
  const art=el('div','card-art');
  const placeholder=el('span','card-fallback',item.type==='live'?item.name.slice(0,9).toUpperCase():'▶');art.append(placeholder);
  const src=safeHttp(item.logo);
  const posterUrl=src&&state.token?'/api/poster/'+encodeURIComponent(state.token)+'/'+item.type+'/'+encodeURIComponent(item.sourceId):src;
  if(posterUrl){const image=el('img');image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';image.src=posterUrl;image.onerror=()=>{if(image.src!==src&&src){image.src=src;return;}image.hidden=true;};art.append(image);}
  if(item.type==='live'){const live=el('span','card-live-badge');live.append(el('span'),document.createTextNode('AO VIVO'));art.append(live);}
  else{art.append(el('span','card-category-tag',item.type==='series'?'SÉRIE':'FILME'));art.append(el('span','age-badge age-'+(item.age??'nc'),ageBadgeText(item)));}
  const fav=el('button','card-fav'+(state.favorites.has(item.id)?' active':''));fav.type='button';fav.title='Adicionar ou remover favorito';fav.setAttribute('aria-label',fav.title);fav.innerHTML=icon('heart',16);fav.addEventListener('click',event=>{event.stopPropagation();favorite(item.id);});
  art.append(fav);
  const hover=el('span','card-hover-play');const circle=el('span');circle.innerHTML=icon('play',24);hover.append(circle);art.append(hover);
  const caption=el('div','media-card-info');caption.append(el('strong','',item.name),el('small','',item.group || kindMap[item.type]));const saved=item.type==='series'?state.progress[state.seriesProgress[item.id]?.episodeId]:state.progress[item.id];if(saved&&!saved.completed&&saved.position>=5)caption.append(el('span','continue-label',item.type==='series'?'Continuar · T'+saved.season+' E'+saved.episodeNumber+' · '+formatTime(saved.position):'Continuar em '+formatTime(saved.position)));
  card.append(art,caption);
  const open=()=>item.type==='live'?playItem(item):openDetails(item,false,{origin:card});
  card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
  return card;
}
function renderContent() {
  disposeRails();
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
  state.playbackId++;$('upNextCard').hidden=true;$('openNativePlayer').hidden=true;
  if(state.hls){try{state.hls.destroy();}catch{}state.hls=null;}
  const video=$('videoPlayer');video.pause();video.removeAttribute('src');video.load();
  $('videoPlaceholder').hidden=false;$('videoError').hidden=true;
}
function stopPlayback(){playerReset();state.current=null;}
function minimizePlayback(){
  if(!state.current)return;
  const node=$('playerModal');modalAnimations.get('playerModal')?.kill();
  node.classList.add('is-minimized');node.inert=false;node.querySelector('.modal-card').style.cssText='';node.querySelector('.modal-scrim').style.cssText='';
  node.querySelector('.player-modal').setAttribute('aria-modal','false');$('minimizePlayer').setAttribute('aria-label','Restaurar player');
  setEpisodeTray(false);$('playerLayout').classList.remove('is-full-window');
  if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
  document.body.style.overflow='';document.querySelector('.app-shell').inert=false;document.querySelector('.mobile-bottom-nav').inert=false;
  focusReturn.get('playerModal')?.focus?.();syncHighlightVisibility();
}
function restorePlayback(){hideModal('detailsModal',{immediate:true});showModal('playerModal');}
function exitPlayback(){const minimized=$('playerModal').classList.contains('is-minimized');const current=state.current,item=cachedItem.get(current?.parentId||current?.id);hideModal('playerModal',{immediate:true});if(!minimized&&item&&item.type!=='live')openDetails(item,false,{episodes:item.type==='series'});}
function playbackFailure(message){$('videoPlaceholder').hidden=true;$('videoError').hidden=false;$('videoErrorText').textContent=message;}
function streamPath(item){const ext=(item.extension||((item.type==='live')?'m3u8':'mp4')).toLowerCase().replace(/[^a-z0-9]/g,'');return `/api/stream/${encodeURIComponent(state.token)}/${item.type}/${item.sourceId}.${ext}`;}
function playItem(item){
  if(mobilePlaybackViewport()){state.nativeMobile=true;document.body.classList.add('native-mobile');const video=$('videoPlayer');video.controls=true;video.playsInline=false;video.removeAttribute('playsinline');video.closest('.plyr')?.classList.remove('plyr--full-ui');}
  if(!state.token){showModal('accountModal');return;}
  if(!titleAllowed(item)){toast('Conteúdo bloqueado pelo controle parental.');return;}
  if(!/^\d{1,15}$/.test(String(item.sourceId||''))){toast('Este conteúdo possui um identificador inválido.');return;}
  hideModal('detailsModal',{immediate:true});
  saveProgress();playerReset();state.current=item;if(item.parentId)state.seriesProgress[item.parentId]={episodeId:item.id,updatedAt:Date.now()};addRecent(item.parentId||item.id);
  $('playerTitle').textContent=item.name;$('mobilePlayerTitle').textContent=item.name;$('exitMobilePlayer').setAttribute('aria-label',item.type==='live'?'Voltar à biblioteca':'Voltar aos detalhes');$('playerType').textContent=item.type==='live'?'TV AO VIVO':item.type==='vod'?'FILME':'SÉRIE / EPISÓDIO';
  $('playerFootText').textContent=`${item.group||kindMap[item.type]} • ${ratingText(item)}`;
  $('playerFavorite').classList.toggle('active',state.favorites.has(item.parentId||item.id));
  showModal('playerModal');
  renderPlayerQueue();
  startPlayback(item);
}
async function startPlayback(item){
  playerReset();state.nativeAttempts=0;const ticket=state.playbackId;const video=$('videoPlayer');let restored=false;state.watchSample={ticket,last:0,seconds:0,sent:false};
  video.onloadedmetadata=()=>{if(ticket!==state.playbackId)return;if(state.nativeMobile)requestNativePlayer();if(restored||item.type==='live')return;restored=true;const saved=state.progress[item.id];if(saved&&!saved.completed&&saved.position>=5&&Number.isFinite(video.duration)){video.currentTime=seekTarget(0,saved.position,video.duration);toast(`Retomando em ${formatTime(saved.position)}.`);}updateSeekButtons();};
  video.ondurationchange=updateSeekButtons;video.onprogress=updateSeekButtons;
  const url=streamPath(item);const isHls=/\.m3u8$/i.test(url);
  video.onerror=()=>{if(ticket===state.playbackId)playbackFailure('O formato de vídeo não é compatível, ou a transmissão não está disponível. Verifique o servidor e tente novamente.');};
  video.onplaying=()=>{if(ticket===state.playbackId){$('videoPlaceholder').hidden=true;$('videoError').hidden=true;if(state.nativeMobile&&state.nativeAttempts<3)requestNativePlayer();}};
  try{
    if(isHls&&video.canPlayType('application/vnd.apple.mpegurl')){video.src=url;if(state.nativeMobile)requestNativePlayer();await video.play();}
    else if(isHls&&window.Hls?.isSupported()){
      const hls=new window.Hls({enableWorker:true,maxBufferLength:30,backBufferLength:20});state.hls=hls;
      hls.on(window.Hls.Events.ERROR,(_event,data)=>{if(data.fatal&&ticket===state.playbackId){playbackFailure('Falha na transmissão HLS. O servidor pode estar indisponível ou não fornecer este formato.');hls.destroy();if(state.hls===hls)state.hls=null;}});
      hls.on(window.Hls.Events.MANIFEST_PARSED,()=>{if(ticket===state.playbackId)video.play().catch(err=>{if(err.name!=='AbortError')$('videoPlaceholder').hidden=true;});});
      hls.loadSource(url);hls.attachMedia(video);
    } else if(isHls){playbackFailure('Seu navegador não oferece suporte HLS neste ambiente. Verifique a conexão para carregar o mecanismo de reprodução.');}
    else{video.src=url;if(state.nativeMobile)requestNativePlayer();await video.play();}
  }catch(err){if(ticket===state.playbackId&&err.name!=='AbortError'&&err.name!=='NotAllowedError')playbackFailure('Não foi possível iniciar o vídeo. O formato ou servidor pode não ser compatível.');else if(err.name==='NotAllowedError'){$('videoPlaceholder').hidden=true;}}
}
function ratingText(item){const label=item.ageLabel||'Não informada';return label==='Não informada'?'Classificação não informada':`Classificação: ${label}${item.ageCountry?' · '+item.ageCountry:''}${item.ageSource?' · '+item.ageSource:''}`;}
function sampleAudience(){
  const sample=state.watchSample,item=state.current,video=$('videoPlayer');if(!sample||sample.ticket!==state.playbackId||!item||item.type==='live')return;const now=performance.now();if(!video.paused&&!video.seeking&&!video.ended&&video.readyState>=2&&sample.last)sample.seconds+=Math.min(2,(now-sample.last)/1000);sample.last=now;
  if(sample.seconds>=30&&!sample.sent){sample.sent=true;api('/api/watch-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:item.type,sourceId:item.parentId?item.parentId.split(':').at(-1):item.sourceId,seconds:Math.floor(sample.seconds)})}).catch(()=>{sample.sent=false;});}
}
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
async function requestNativePlayer(force=false){if($('playerModal').classList.contains('is-minimized'))return;if(!state.nativeMobile||!state.current||state.nativeBusy||(!force&&state.nativeOpenedTicket===state.playbackId))return;state.nativeBusy=true;const ticket=state.playbackId;state.nativeAttempts=(state.nativeAttempts||0)+1;const opened=await enterNativePlayback($('videoPlayer'));state.nativeBusy=false;if(opened)state.nativeOpenedTicket=ticket;if(ticket===state.playbackId)$('openNativePlayer').hidden=opened;}
function syncFullscreenButton(){const active=document.fullscreenElement===$('playerLayout')||$('playerLayout').classList.contains('is-full-window'),button=$('videoShell').querySelector('[data-plyr="fullscreen"]');if(button){button.setAttribute('aria-label',active?'Sair da tela cheia':'Tela cheia');button.setAttribute('aria-pressed',String(active));const tooltip=button.querySelector('.plyr__tooltip');if(tooltip)tooltip.textContent=active?'Sair da tela cheia':'Tela cheia';}}
async function togglePlayerFullscreen(){const target=$('playerLayout');try{if(document.fullscreenElement){unlockMobilePlayback(target);await document.exitFullscreen?.();return;}if(target.classList.contains('is-full-window')){target.classList.remove('is-full-window');unlockMobilePlayback(target);return;}if(state.nativeMobile){await requestNativePlayer();return;}try{if(!target.requestFullscreen)throw new Error();await target.requestFullscreen();}catch{target.classList.add('is-full-window');}}finally{syncFullscreenButton();}}
function queueEpisode(item){setEpisodeTray(false);if(item.parentId)state.seriesProgress[item.parentId]={episodeId:item.id,updatedAt:Date.now()};persist();playItem(item);}
function setEpisodeTray(open){$('playerLayout').classList.toggle('episodes-open',open);$('episodeTrayToggle').setAttribute('aria-expanded',String(open));if(open)renderPlayerQueue();}
function updateUpNext(){
  const video=$('videoPlayer'),index=state.episodeQueue.findIndex(ep=>ep.id===state.current?.id),next=state.episodeQueue[index+1];
  const remaining=video.duration-video.currentTime,show=state.current?.parentId&&index>=0&&next&&state.autoNext!==false&&state.dismissedNext!==state.current.id&&Number.isFinite(remaining)&&remaining>0&&remaining<=15;
  $('upNextCard').hidden=!show;
  if(show){$('upNextCountdown').textContent='Próximo episódio em '+Math.ceil(remaining)+'s';$('upNextTitle').textContent='T'+next.season+' · Ep. '+next.episodeNumber+' — '+next.name.replace(next.seriesTitle+' — ','');}
}
function nextEpisode(){const index=state.episodeQueue.findIndex(ep=>ep.id===state.current?.id);if(index>=0&&index+1<state.episodeQueue.length)queueEpisode(state.episodeQueue[index+1]);}
function episodeRow(item,active=false){
  const record=state.progress[item.id],row=el('button','queue-episode'+(active?' is-playing':''));row.type='button';if(active)row.setAttribute('aria-current','true');
  const copy=el('span','queue-episode-copy');copy.append(el('strong','',`T${item.season} · Ep. ${item.episodeNumber}`),el('span','',item.name.replace(item.seriesTitle+' — ','')),el('small','',active&&!$('videoPlayer').ended?'Reproduzindo':record?.completed?'Assistido':record?.position>=5?'Continuar em '+formatTime(record.position):'Não assistido'));
  row.append(copy);if(record?.duration){const progress=el('progress','episode-progress');progress.max=record.duration;progress.value=record.completed?record.duration:record.position;progress.setAttribute('aria-label','Progresso do episódio');row.append(progress);}
  row.onclick=()=>queueEpisode(item);return row;
}
function renderPlayerQueue(){
  const item=state.current,isSeries=item?.type==='series'&&!!item.parentId;$('episodeTrayToggle').hidden=!isSeries;$('autoNextToggle').checked=state.autoNext!==false;$('playerEpisodes').hidden=!isSeries;$('playerLayout').classList.toggle('has-episodes',isSeries);$('nextEpisode').hidden=!isSeries;
  const index=state.episodeQueue.findIndex(ep=>ep.id===item?.id);$('nextEpisode').disabled=index<0||index===state.episodeQueue.length-1;$('nextEpisode').title=$('nextEpisode').disabled?'Você chegou ao último episódio':'Reproduzir próximo episódio';
  if(!isSeries){setEpisodeTray(false);return;}
  const full=document.fullscreenElement===$('playerLayout')||$('playerLayout').classList.contains('is-full-window');$('queueTitle').textContent=full?'Próximos episódios':item.seriesTitle||'Episódios';const select=$('queueSeason');select.replaceChildren();for(const season of [...new Set(state.episodeQueue.map(ep=>ep.season))])select.add(new Option('Temporada '+season,season));select.value=item.season;
  const fill=()=>{const list=$('playerEpisodeList');list.replaceChildren();for(const ep of (full?state.episodeQueue.slice(Math.max(0,index),Math.max(0,index)+30):state.episodeQueue.filter(ep=>ep.season===select.value)))list.append(episodeRow(ep,ep.id===state.current?.id));};select.onchange=fill;fill();updateSeekButtons();
}
async function openSeries(item){
  if(!state.token){showModal('accountModal');return;}
  if(state.detailItem?.id!==item.id||$('detailsModal').hidden){await openDetails(item,false,{episodes:true});return;}
  revealTitleEpisodes();
}
function revealTitleEpisodes(){
  const item=state.detailItem;if(item?.type!=='series')return;
  $('titleEpisodes').hidden=false;$('detailsPlay').setAttribute('aria-expanded','true');
  if(state.titleData)renderTitleEpisodes(item,state.titleData);
  else if(state.titleError)renderEpisodeError();
  else $('episodesList').replaceChildren(emptyContent('Carregando episódios','Preparando as temporadas desta série…'));
  $('titleEpisodes').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches)window.gsap.fromTo($('titleEpisodes'),{opacity:0,y:18},{opacity:1,y:0,duration:.35,clearProps:'opacity,transform'});
}
function renderEpisodeError(){const error=emptyContent('Não foi possível carregar os episódios','Tente novamente para consultar as temporadas.','Tentar novamente',()=>openDetails(state.detailItem,true,{episodes:true}));$('episodesList').replaceChildren(error);}
function renderTitleEpisodes(item,data){
  const queue=flattenEpisodes(item,data.episodes),seasons=[...new Set(queue.map(ep=>ep.season))];
  const previous=$('seasonSelect').value;$('seasonSelect').replaceChildren();
  $('episodeCount').textContent=queue.length?'· '+queue.length:'';
  if(!seasons.length){$('episodesList').replaceChildren(emptyContent('Episódios indisponíveis','Ainda não há episódios disponíveis para esta série.'));$('resumeSeriesButton').hidden=true;return;}
  for(const season of seasons)$('seasonSelect').add(new Option('Temporada '+season,season));
  const play=episode=>{state.episodeQueue=queue;queueEpisode(episode);};
  const saved=queue.find(ep=>ep.id===state.seriesProgress[item.id]?.episodeId);
  const resume=saved&&state.progress[saved.id]?.completed?(queue[queue.indexOf(saved)+1]||saved):saved;
  $('resumeSeriesButton').hidden=!resume;
  if(resume){$('resumeSeriesButton').textContent='Continuar · T'+resume.season+' E'+resume.episodeNumber+(state.progress[resume.id]?.position&&!state.progress[resume.id]?.completed?' · '+formatTime(state.progress[resume.id].position):'');$('resumeSeriesButton').onclick=()=>play(resume);}
  const fill=()=>{const list=$('episodesList');list.replaceChildren();for(const ep of queue.filter(ep=>ep.season===$('seasonSelect').value)){const row=episodeRow(ep);row.classList.add('title-episode');if(ep.id===resume?.id)row.classList.add('is-resume');const thumb=el('span','episode-thumb');thumb.append(el('span','episode-number',String(ep.episodeNumber).padStart(2,'0')));const image=el('img');image.src='/api/episode-poster/'+encodeURIComponent(state.token)+'/'+encodeURIComponent(ep.sourceId);image.alt='';image.loading='lazy';image.referrerPolicy='no-referrer';let fallback=false;image.onerror=()=>{if(!fallback){fallback=true;image.src='/api/poster/'+encodeURIComponent(state.token)+'/series/'+encodeURIComponent(item.sourceId);}else image.remove();};thumb.append(image);thumb.append(el('span','episode-play','▶'));row.prepend(thumb);row.onclick=()=>play(ep);const wrap=el('div','episode-download-row');const save=el('button','episode-download-action',canDownload(ep)?'Baixar':'Indisponível');save.type='button';save.title=canDownload(ep)?'Baixar episódio para assistir offline':'Formato de vídeo não suportado para download';save.disabled=!canDownload(ep);save.onclick=event=>{event.preventDefault();event.stopPropagation();downloadTitle(ep,save);};wrap.append(row,save);list.append(wrap);}};
  $('seasonSelect').value=seasons.includes(previous)?previous:resume?.season||seasons[0];$('seasonSelect').onchange=fill;fill();
}
async function loadParental(){state.policy=await api('/api/parental');}
function rankingSection(type){
  const data=state.discovery,group=type==='vod'?'filmes':'séries',section=el('section','library-row ranking-section'),head=el('div','row-heading'),copy=el('div');
  const internal=data?.internal?.[type];const mode=state.rankMode==='internal'&&internal?.available?'internal':'external';
  copy.append(el('h3','',mode==='internal'?'Top 10 '+group+' mais assistidos no Scene Play':'Top 10 '+group+' · em alta no Simkl'));
  const note=el('p','ranking-note',mode==='internal'?'Audiência real · últimos 30 dias · uma visualização por perfil/título/dia':'Popularidade pública global · entre os títulos disponíveis na sua lista');copy.append(note);head.append(copy);
  const options=el('div','ranking-options');for(const [value,label]of [['external','Simkl'],['internal','Scene Play']]){const button=el('button','rank-source'+(mode===value?' active':''),label);button.type='button';button.disabled=value==='internal'&&!internal?.available;button.title=button.disabled?'Disponível após pelo menos 10 visualizações, 5 perfis e 3 títulos.':'';button.setAttribute('aria-pressed',String(mode===value));button.onclick=()=>{state.rankMode=value;renderContent();};options.append(button);}head.append(options);section.append(head);
  const source=el('div','ranking-source');if(data?.updatedAt){source.append(document.createTextNode('Atualizado em '+new Date(data.updatedAt).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+(data.status==='stale'?' · usando o último cache confirmado':'')+' · '));}const link=el('a','',mode==='internal'?'Como medimos':'Fonte: Simkl');if(mode==='internal'){link.href='#';link.onclick=e=>{e.preventDefault();toast(internal.rule);};}else{link.href=type==='vod'?'https://simkl.com/movies/best-movies/most-watched/':'https://simkl.com/tv/best-shows/most-watched/';link.target='_blank';link.rel='noopener noreferrer';}source.append(link);section.append(source);
  const items=(mode==='internal'?internal.items:data?.rankings?.[type]||[]).map(row=>({...cachedItem.get(row.id)||row,position:row.position,views:row.views})).filter(titleAllowed);
  const rail=el('div','media-rail ranking-rail');if(!data||state.discoveryLoading&&!items.length){rail.append(el('p','rail-empty','Cruzando as tendências com a sua lista…'));}else if(!items.length){rail.append(el('p','rail-empty',data.status==='unavailable'?'Fonte de tendências indisponível no momento. A biblioteca continua disponível.':'Nenhum título da sua lista coincide com o ranking público de hoje.'));}else for(const [index,item]of items.slice(0,10).entries()){const wrapper=el('div','ranked-title'),number=el('span','rank-number',String(index+1));number.setAttribute('aria-hidden','true');const card=mediaCard(item);card.setAttribute('aria-label',(index+1)+'º · '+item.name);wrapper.append(number,card);rail.append(wrapper);}mountRail(section,rail);return section;
}
function renderHome(area){
  const recent=state.recents.map(id=>cachedItem.get(id)).filter(item=>item&&titleAllowed(item));
  const rows=[...(recent.length?[{title:'Continue de onde parou',items:recent,section:'recents'}]:[]),...types.map(type=>({title:kindMap[type],items:state.catalog[type].items.filter(item=>titleAllowed(item)),section:type}))];
  for(const row of rows){if(row.section==='live'){area.append(rankingSection('vod'),rankingSection('series'));}if(!row.items.length&&state.catalog[row.section]?.loaded&&!state.catalog[row.section]?.error)continue;const section=el('section','library-row'),head=el('div','row-heading');head.append(el('h3','',row.title));const more=el('button','text-action','Ver tudo →');more.type='button';more.onclick=()=>setSection(row.section);head.append(more);section.append(head);
    const rail=el('div','media-rail');if(state.catalog[row.section]?.loading){for(let i=0;i<6;i++)rail.append(el('div','loading-card'));}else if(!row.items.length){rail.append(el('p','rail-empty',state.catalog[row.section]?.error||'Nenhum título disponível nesta seção.'));}else for(const item of row.items.slice(0,16))rail.append(mediaCard(item));mountRail(section,rail);area.append(section);
  }
}
let featuredId='',highlightTicket=0,heroPreview,heroVisible=false;
const seriesPreviewCache=new Map();
function playableHighlightPreview(item){
 const ext=String(item?.extension||'mp4').toLowerCase().replace(/^\./,'');
 if(!item||item.type!=='vod'||ext!=='mp4'||!state.token||!/^\d{1,15}$/.test(String(item.sourceId)))return null;
 return {kind:'direct',authorized:true,url:streamPath(item)};
}
async function firstSeriesPreview(item){
 if(!state.token||item?.type!=='series'||!/^\d{1,15}$/.test(String(item.sourceId)))return null;
 const key=state.token+':'+item.id,existing=seriesPreviewCache.get(key);
 if(existing&&existing.until>Date.now())return existing.promise;
 const promise=api('/api/catalog?section=series&kind=info&series_id='+encodeURIComponent(item.sourceId))
  .then(({data})=>{
   const first=flattenEpisodes(item,data?.episodes).find(ep=>
    String(ep.extension||'mp4').toLowerCase().replace(/^\./,'')==='mp4'&&
    /^\d{1,15}$/.test(String(ep.sourceId)));
   return first?{kind:'direct',authorized:true,url:streamPath(first)}:null;
  }).catch(()=>null);
 seriesPreviewCache.set(key,{promise,until:Date.now()+15*60*1000});
 if(seriesPreviewCache.size>25)seriesPreviewCache.delete(seriesPreviewCache.keys().next().value);
 return promise;
}

const highlightMotion=matchMedia('(prefers-reduced-motion: reduce)');
const highlightRotation=createHighlightRotation({paused:highlightMotion.matches,onChange:paintHighlight,onState:({paused,rotating})=>{
  const button=$('highlightPause');$('rotationAccess').textContent=paused?'Iniciar apresentação':'Pausar apresentação';button.textContent=paused?'▶':'Ⅱ';button.setAttribute('aria-label',paused?'Iniciar apresentação':'Pausar apresentação');
  document.querySelector('.hero-copy').setAttribute('aria-live',rotating?'off':'polite');
}});
function syncHighlightVisibility(){
  highlightRotation.block('page',state.section!=='home'||!!state.search||!state.token);
  highlightRotation.block('hidden',document.hidden);
  const modal=!!document.querySelector('.modal-layer:not([hidden]):not(.is-minimized)');highlightRotation.block('modal',modal);if(modal||document.hidden||state.section!=='home'||state.search||state.current)heroPreview?.stop();
}
function paintHighlight(item,index,total){
  if(item&&!titleAllowed(item)){renderHero();return;}
  const hero=document.querySelector('.hero'),copy=hero.querySelector('.hero-copy'),ticket=++highlightTicket;heroPreview?.set(null);hero.classList.remove('has-trailer','has-preview-source');
  featuredId=item?.id||'';const oldScenes=[...hero.querySelectorAll('.highlight-scene')];oldScenes.slice(1).forEach(node=>node.remove());
  $('highlightPause').hidden=true;$('highlightControls').hidden=total<2;
  if(!item){ratingObserver.unobserve(copy);delete copy.dataset.itemId;$('heroTitleMeta').replaceChildren();$('heroDataNote').replaceChildren();oldScenes.forEach(node=>node.remove());hero.classList.remove('has-feature-art');copy.querySelector('h1').textContent=state.token?'O que vamos assistir hoje?':'Seu universo de entretenimento.';copy.querySelector('p').textContent='Sua TV, seus filmes e suas séries. Tudo em um só lugar.';copy.querySelector('.hero-kicker').textContent='SUA PRÓXIMA HISTÓRIA';$('heroPrimaryLabel').textContent=state.token?'Explorar TV ao vivo':'Conectar minha lista';return;}
  copy.querySelector('h1').textContent=displayTitle(item.name);
  copy.querySelector('p').textContent=item.description||item.externalDescription||'Explore a ficha para conhecer esta história e escolher o seu próximo play.';
  copy.querySelector('.hero-kicker').textContent=(item.type==='series'?'SÉRIE':'FILME')+(item.externalSource?' · EM ALTA NO '+item.externalSource.toUpperCase():' · SELEÇÃO DO DIA');
  copy.setAttribute('aria-label',(index+1)+' de '+total);$('heroPrimaryLabel').textContent=item.type==='series'?'Conhecer a série':'Conhecer o filme';$('highlightCounter').textContent=String(index+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
  paintHeroMeta(item);copy.dataset.itemId=item.id;if(item.ageLabel==='Não informada'||item.ageExpiresAt&&Date.parse(item.ageExpiresAt)<=Date.now()){ratingSeen.delete(item.id);ratingObserver.observe(copy);}
  const scene=el('div','highlight-scene'),cover=el('img','highlight-cover');scene.setAttribute('aria-hidden','true');
  cover.alt='';cover.decoding='async';cover.referrerPolicy='no-referrer';
  const posterSource='/api/poster/'+encodeURIComponent(state.token)+'/'+item.type+'/'+encodeURIComponent(item.sourceId);
  cover.onload=()=>{
    if(ticket!==highlightTicket)return;
    cover.hidden=false;
    const landscape=cover.naturalWidth/cover.naturalHeight>1.25;
    scene.classList.toggle('is-landscape',landscape);
    scene.style.setProperty('--hero-poster-width',Math.max(240,Math.min(560,Math.round(cover.naturalWidth*1.1)))+'px');
    scene.querySelector('.highlight-atmosphere')?.remove();
    if(!landscape){const atmosphere=cover.cloneNode();atmosphere.className='highlight-atmosphere';scene.prepend(atmosphere);}
    requestAnimationFrame(()=>{scene.classList.add('is-visible');oldScenes.forEach(node=>node.classList.remove('is-visible'));});
    setTimeout(()=>oldScenes.forEach(node=>node.remove()),1200);
    hero.classList.add('has-feature-art');
  };
  cover.onerror=()=>{
    if(ticket!==highlightTicket)return;
    if(cover.src!==new URL(posterSource,location.origin).href){cover.src=posterSource;return;}
    cover.hidden=true;scene.classList.add('is-visible');oldScenes.forEach(node=>node.remove());hero.classList.remove('has-feature-art');
  };
  cover.src=item.backdrop?.startsWith('/api/artwork/')?item.backdrop:posterSource;scene.append(cover);hero.prepend(scene);
  const assignPreview=source=>{if(ticket!==highlightTicket||featuredId!==item.id)return;hero.classList.toggle('has-preview-source',!!source);heroPreview?.set(source);};
  if(item.type==='vod')assignPreview(playableHighlightPreview(item));
  else if(item.type==='series')firstSeriesPreview(item).then(assignPreview);
  loadTitleExtra(item).then(data=>{if(!data||ticket!==highlightTicket||featuredId!==item.id)return;paintHeroMeta(item);copy.querySelector('p').textContent=item.description||item.externalDescription||copy.querySelector('p').textContent;if(data.backdrop&&cover.src!==new URL(data.backdrop,location.origin).href)cover.src=data.backdrop;});
}
function renderHero(){
  const hero=document.querySelector('.hero');hero.hidden=state.section!=='home'||!!state.search;syncHighlightVisibility();
  const choices=state.discovery?.highlights?.map(item=>cachedItem.get(item.id)||item).filter(titleAllowed);highlightRotation.update(state.token?(choices?.length?choices:selectHighlights(state.catalog,item=>!!safeHttp(item.logo)&&titleAllowed(item))):[]);
  if(state.token)loadDiscovery();
}
function paintHeroMeta(item){
  const meta=$('heroTitleMeta');meta.replaceChildren();const badge=el('span','age-badge age-'+(item.age??'nc'),ageBadgeText(item));badge.title=ratingText(item);meta.append(badge);if(item.year&&/^\d{4}/.test(item.year))meta.append(el('span','',item.year.slice(0,4)));if(item.genre||item.group)meta.append(el('span','hero-genre',item.genre||item.group));
  const note=$('heroDataNote');note.replaceChildren();const text=el('span','',state.discovery?.updatedAt?'Seleção diária · '+new Date(state.discovery.updatedAt).toLocaleDateString('pt-BR'):'Seleção da sua biblioteca');note.append(text);if(item.externalUrl){const link=el('a','','Dados: '+item.externalSource);link.href=item.externalUrl;link.target='_blank';link.rel='noopener noreferrer';note.append(link);}if(item.ageSource){const label=el('span','',ratingText(item));note.append(label);}
}
function bindHighlights(){
  const hero=document.querySelector('.hero');
  heroPreview=createHeroPreview({hero,getScene:()=>hero.querySelector('.highlight-scene.is-visible')||hero.querySelector('.highlight-scene'),launch:$('heroTrailer'),audioToggle:$('heroAudioToggle'),onPlaying:value=>{hero.classList.toggle('has-preview',value);highlightRotation.block('preview',value);},canAuto:()=>allowAutomaticPreview({width:innerWidth,reducedMotion:highlightMotion.matches,saveData:navigator.connection?.saveData,effectiveType:navigator.connection?.effectiveType,hidden:document.hidden,visible:heroVisible,playing:!!state.current})});
  setInterval(()=>{if(!document.hidden&&state.section==='home')loadDiscovery();},60000);
  $('highlightPrevious').onclick=()=>highlightRotation.move(-1);$('highlightNext').onclick=()=>highlightRotation.move(1);
  $('highlightPause').onclick=()=>highlightRotation.pause(!highlightRotation.paused);
  hero.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')highlightRotation.block('hover',true);});hero.addEventListener('pointerleave',()=>highlightRotation.block('hover',false));
  hero.addEventListener('focusin',()=>highlightRotation.block('focus',true));hero.addEventListener('focusout',event=>{if(!hero.contains(event.relatedTarget))highlightRotation.block('focus',false);});$('rotationAccess').onclick=()=>highlightRotation.pause(!highlightRotation.paused);
  document.addEventListener('visibilitychange',()=>{syncHighlightVisibility();if(!document.hidden){loadDiscovery();heroPreview?.resume();}});highlightMotion.addEventListener('change',event=>{if(event.matches){highlightRotation.pause(true);heroPreview?.stop();}});
  const observer=new IntersectionObserver(entries=>{heroVisible=entries[0].intersectionRatio>=.5;highlightRotation.block('offscreen',!entries[0].isIntersecting);if(!entries[0].isIntersecting)heroPreview?.stop();else heroPreview?.resume();},{threshold:[0,.2,.5]});observer.observe(hero);
}

let titleReturnUrl=null;
function titleRoute(){const match=/^\/title\/(movie|series)\/(\d{1,15})\/?$/.exec(location.pathname);return match?{type:match[1]==='movie'?'vod':'series',id:match[2]}:null;}
function showTitlePage(item,origin){
  if(!titleRoute())titleReturnUrl=location.pathname+location.search;
  const url='/title/'+(item.type==='vod'?'movie':'series')+'/'+item.sourceId;
  if(location.pathname!==url)history.pushState({mfTitle:true},'',url);
  showModal('detailsModal',origin);
}
function restoreCatalogUrl(){if(titleRoute())history.replaceState(null,'',titleReturnUrl||'/');titleReturnUrl=null;}
function closeTitlePage(){hideModal('detailsModal',{immediate:true});}
function restoreTitleFromLocation(){
  const route=titleRoute();if(!route||!state.token)return;
  const item=cachedItem.get(route.type+':'+route.id);
  if(item&&($('detailsModal').hidden||state.detailItem?.id!==item.id))openDetails(item);
}
function initTitlePage(){window.addEventListener('popstate',()=>{if(titleRoute())restoreTitleFromLocation();else hideModal('detailsModal',{immediate:true,preserveRoute:true});});}
function ratingLookupMessage(item){return {queued:'Classificação na fila de consulta. A tentativa será refeita.',unavailable:'Fonte de classificação indisponível. Tente atualizar.',not_found:'Classificação não encontrada para esta obra nas fontes disponíveis.'}[item.ageLookupStatus]||'Classificação ainda não confirmada';}
function paintTitle(item){
  $('detailsTitle').textContent=item.name;$('detailsKind').textContent=item.type==='series'?'SCENE PLAY · SÉRIE':'SCENE PLAY · FILME';
  const badge=el('span','age-badge age-'+(item.age??'nc'),item.ageLabel==='Não informada'?'NC':item.ageLabel||'NC');badge.title=ratingText(item);
  $('detailsMeta').replaceChildren(badge,...[(item.year||'').slice(0,4),item.genre,item.duration].filter(Boolean).map(value=>el('span','',value)));
  $('ratingStatus').textContent=item.ageLabel&&item.ageLabel!=='Não informada'?ratingText(item):ratingLookupMessage(item);
  if(item.ageSourceUrl){try{const url=new URL(item.ageSourceUrl);if(url.protocol==='https:'&&['itunes.apple.com','tv.apple.com','www.wikidata.org'].includes(url.hostname)){const link=el('a','rating-source','Ver fonte');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';$('detailsMeta').append(link);}}catch{}}
  $('detailsDescription').textContent=item.description||'Sinopse não informada pelo provedor.';
  $('detailsCredits').textContent=[item.director?'Direção: '+item.director:'',item.cast?'Elenco: '+item.cast:''].filter(Boolean).join(' · ');
  $('detailsFavorite').textContent=state.favorites.has(item.id)?'✓ Na minha lista':'+ Minha lista';
  $('detailsDownload').hidden=item.type!=='vod';
  $('detailsDownload').disabled=!canDownload(item);
  $('detailsDownload').title=canDownload(item)?'Salvar filme MP4 neste dispositivo':'Formato indisponível para download offline';
}
async function refreshTitleRating(item,ticket,refresh=false){
  $('refreshRating').disabled=true;
  if(!item.ageLabel||item.ageLabel==='Não informada'||refresh)$('ratingStatus').textContent='Buscando classificação nas fontes disponíveis…';
  try{const metadata=(await api('/api/catalog?section='+item.type+'&kind=rating&'+(item.type==='vod'?'vod_id':'series_id')+'='+item.sourceId+(refresh?'&refresh=1':''))).data;if(ticket!==state.detailRequest||$('detailsModal').hidden)return;Object.assign(item,metadata);paintTitle(item);}
  catch{if(ticket===state.detailRequest)$('ratingStatus').textContent='Fonte de classificação indisponível. Tente novamente.';}
  finally{if(ticket===state.detailRequest)$('refreshRating').disabled=false;}
}
async function openDetails(item,refresh=false,{origin,episodes=false}={}){
  const same=state.detailItem?.id===item.id;
  state.detailItem=item;state.titleData=null;state.titleError=false;const ticket=++state.detailRequest;
  if(!same||$('detailsModal').hidden){$('titleEpisodes').hidden=true;$('seasonSelect').replaceChildren();$('detailsArt').replaceChildren();const src=safeHttp(item.logo);if(src){const image=el('img');image.src=state.token?'/api/poster/'+encodeURIComponent(state.token)+'/'+item.type+'/'+encodeURIComponent(item.sourceId):src;image.alt='';image.referrerPolicy='no-referrer';image.onerror=()=>{if(image.src!==src)image.src=src;else image.hidden=true;};const backdrop=image.cloneNode();backdrop.className='title-backdrop';backdrop.onerror=()=>backdrop.remove();$('detailsArt').append(backdrop,image);}}
  paintTitle(item);$('detailsPlay').disabled=false;$('detailsPlayLabel').textContent=item.type==='series'?'Assistir · Ver episódios':(state.progress[item.id]?.position&&!state.progress[item.id]?.completed?'Continuar filme':'Assistir agora');
  $('detailsPlay').setAttribute('aria-expanded',String(!$('titleEpisodes').hidden));$('detailsPlay').setAttribute('aria-controls',item.type==='series'?'titleEpisodes':'playerModal');
  showTitlePage(item,origin);loadTitleExtra(item).then(data=>{if(data&&ticket===state.detailRequest&&state.detailItem?.id===item.id&&!$('detailsModal').hidden)paintTitle(item);});if(episodes)revealTitleEpisodes();
  try{const data=(await api('/api/catalog?section='+item.type+'&kind=info&'+(item.type==='vod'?'vod_id':'series_id')+'='+item.sourceId)).data;
    if(ticket!==state.detailRequest||$('detailsModal').hidden)return;
    Object.assign(item,data.metadata);cachedItem.set(item.id,item);state.titleData=data;paintTitle(item);
    if(item.type==='series'&&!$('titleEpisodes').hidden)renderTitleEpisodes(item,data);
    if(item.ageLabel==='Não informada'||refresh)refreshTitleRating(item,ticket,refresh);
  }catch(error){if(ticket!==state.detailRequest)return;state.titleError=true;if(item.type==='series'&&!$('titleEpisodes').hidden)renderEpisodeError();$('ratingStatus').textContent=error.status===403?'Conteúdo restrito pelo controle parental.':'Informações adicionais indisponíveis no momento.';if(error.status===403){$('detailsPlay').disabled=true;loadSection(item.type,true);}else refreshTitleRating(item,ticket,refresh);}
}
function bind() {
  state.nativeMobile=mobilePlaybackViewport();document.body.classList.toggle('native-mobile',state.nativeMobile);
  setupVisualViewport();$('exitMobilePlayer').onclick=exitPlayback;$('openNativePlayer').onclick=()=>requestNativePlayer(true);$('videoPlayer').addEventListener('webkitbeginfullscreen',()=>{$('openNativePlayer').hidden=true;});
  $('minimizePlayer').onclick=()=>$('playerModal').classList.contains('is-minimized')?restorePlayback():minimizePlayback();
  setInterval(sampleAudience,1000);
  bindHighlights();
  initTitlePage();
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('playerLayout').classList.contains('episodes-open')){event.preventDefault();event.stopImmediatePropagation();setEpisodeTray(false);return;}if(event.key==='Escape'&&($('playerLayout').classList.contains('is-full-window')||document.fullscreenElement)){event.preventDefault();event.stopImmediatePropagation();togglePlayerFullscreen();}},true);
  const back=$('seekBack'),forward=$('seekForward'),next=$('nextEpisode'),tray=$('episodeTrayToggle');
  if(window.Plyr&&!state.nativeMobile){
    state.playerUI=new window.Plyr($('videoPlayer'),{seekTime:10,listeners:{fullscreen:()=>{togglePlayerFullscreen();return false;}},iconUrl:'/vendor/plyr.svg',controls:['play-large','play','rewind','fast-forward','progress','current-time','duration','mute','volume','settings','pip','airplay','fullscreen'],settings:['speed'],speed:{selected:1,options:[.5,.75,1,1.25,1.5,1.75,2]},fullscreen:{enabled:true,fallback:true,iosNative:false,container:'#playerLayout'},i18n:{play:'Reproduzir',pause:'Pausar',rewind:'Retroceder {seektime} segundos',fastForward:'Avançar {seektime} segundos',seek:'Posição do vídeo',currentTime:'Tempo atual',duration:'Duração',mute:'Silenciar',unmute:'Ativar som',settings:'Configurações',speed:'Velocidade',normal:'Normal',enterFullscreen:'Tela cheia',exitFullscreen:'Sair da tela cheia'}});
    const controls=state.playerUI.elements.controls;
    if(controls){for(const [button,selector,label,text]of [[back,'[data-plyr="rewind"]','Retroceder 10 segundos','↶10'],[forward,'[data-plyr="fast-forward"]','Avançar 10 segundos','10↷']]){button.className='plyr__control skip-ten';button.innerHTML=`<span aria-hidden="true">${text}</span><span class="plyr__tooltip">${label}</span>`;controls.querySelector(selector)?.replaceWith(button);}next.className='plyr__control next-inline';next.setAttribute('aria-label','Próximo episódio');next.innerHTML='<span aria-hidden="true">▶|</span><span class="plyr__tooltip">Próximo episódio</span>';controls.insertBefore(next,controls.querySelector('[data-plyr="fullscreen"]'));tray.className='plyr__control episode-menu-button';tray.innerHTML='<span aria-hidden="true">▤</span><span class="plyr__tooltip">Episódios</span>';controls.insertBefore(tray,next);document.querySelector('.playback-toolbar').remove();}
  }else{$('videoShell').append(document.querySelector('.playback-toolbar'));$('videoPlayer').controls=true;$('videoPlayer').playsInline=false;$('videoPlayer').removeAttribute('playsinline');}
  const header=$('sidebar'),tools=document.querySelector('.topbar-actions');header.append(tools);$('openAccount').hidden=true;$('openAccountSidebar').hidden=true;bindSearch(document.querySelector('.global-search'),$('globalSearch'));$('refreshButton').title='Sincronizar catálogo';$('refreshButton').setAttribute('aria-label','Sincronizar catálogo');$('openAccountProfile').setAttribute('aria-label','Gerenciar perfis');
  $('refreshRating').onclick=()=>{if(state.detailItem)refreshTitleRating(state.detailItem,state.detailRequest,true);};
  $('seekBack').onclick=()=>seekBy(-10);$('seekForward').onclick=()=>seekBy(10);$('nextEpisode').onclick=nextEpisode;
  tray.onclick=()=>setEpisodeTray(!$('playerLayout').classList.contains('episodes-open'));$('closeEpisodeTray').onclick=()=>setEpisodeTray(false);$('autoNextToggle').onchange=event=>{state.autoNext=event.target.checked;persist();updateUpNext();};$('playUpNext').onclick=nextEpisode;$('cancelUpNext').onclick=()=>{state.dismissedNext=state.current?.id;$('upNextCard').hidden=true;};document.addEventListener('fullscreenchange',()=>{requestAnimationFrame(syncFullscreenButton);if(!document.fullscreenElement&&!$('playerLayout').classList.contains('is-full-window')){setEpisodeTray(false);unlockMobilePlayback($('playerLayout'));}});
  let lastProgressSave=0;
  $('videoPlayer').addEventListener('timeupdate',()=>{updateUpNext();if(Date.now()-lastProgressSave>3000){saveProgress();lastProgressSave=Date.now();}});
  $('videoPlayer').addEventListener('pause',()=>saveProgress());$('videoPlayer').addEventListener('seeked',()=>saveProgress());
  $('videoPlayer').addEventListener('ended',()=>{saveProgress(true);renderPlayerQueue();if(!$('nextEpisode').disabled&&state.autoNext!==false&&state.dismissedNext!==state.current?.id){nextEpisode();return;}toast($('nextEpisode').disabled?'Conteúdo concluído.':'Episódio concluído. O próximo já está disponível.');});
  window.addEventListener('pagehide',()=>{saveProgress();flushCloud();});document.addEventListener('visibilitychange',()=>{if(document.hidden){saveProgress();flushCloud();}});
  document.addEventListener('keydown',event=>{if($('playerModal').hidden||event.target.closest('.plyr')||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowLeft'){event.preventDefault();seekBy(-10);}if(event.key==='ArrowRight'){event.preventDefault();seekBy(10);}});
  document.addEventListener('keydown',event=>{const modal=[...document.querySelectorAll('.modal-layer:not([hidden]):not(.is-minimized)')].at(-1);if(!modal)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();modal.id==='playerModal'?minimizePlayback():hideModal(modal.id);}if(event.key==='Tab'){const nodes=[...modal.querySelectorAll('button,input,select,[tabindex="0"]')].filter(node=>!node.disabled&&node.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}},true);
  uiIcon();
  document.querySelectorAll('[data-nav]').forEach(node=>node.addEventListener('click',()=>setSection(node.dataset.nav)));
  $('brandLink').addEventListener('click',e=>{e.preventDefault();setSection('home');});
  $('menuToggle').addEventListener('click',showMenu);$('mobileScrim').addEventListener('click',closeMenu);
  for(const id of ['openAccount','openAccountProfile','openAccountSidebar'])$(id).addEventListener('click',()=>state.fixedMode?window.dispatchEvent(new Event('mf:profiles')):showModal('accountModal'));
  document.querySelectorAll('[data-dismiss]').forEach(node=>node.addEventListener('click',()=>node.dataset.dismiss==='playerModal'?(node.classList.contains('modal-scrim')?minimizePlayback():exitPlayback()):hideModal(node.dataset.dismiss)));
  $('heroPrimary').addEventListener('click',()=>{const item=cachedItem.get(featuredId);if(state.token&&item)openDetails(item);else if(state.token)setSection('live');else showModal('accountModal');});
  $('detailsPlay').onclick=()=>{const item=state.detailItem;if(!item)return;item.type==='series'?openSeries(item):playItem(item);};
  $('detailsDownload').onclick=()=>{if(state.detailItem)downloadTitle(state.detailItem,$('detailsDownload'));};
  $('downloadsButton').onclick=showDownloads;
  $('offlineCancelDownload').onclick=()=>downloadingOffline?.controller.abort();
  $('offlineBack').onclick=stopOfflineVideo;
  $('detailsFavorite').onclick=()=>{if(state.detailItem){favorite(state.detailItem.id);$('detailsFavorite').textContent=state.favorites.has(state.detailItem.id)?'Remover da minha lista':'Adicionar à minha lista';}};
  $('openParental').onclick=async()=>{if(!state.token){showModal('accountModal');return;}try{await loadParental();$('hideAdult').checked=state.policy.hideAdult;$('maxAge').value=state.policy.maxAge??'';$('blockUnknown').checked=state.policy.blockUnknown;$('currentPinField').hidden=!state.policy.pinSet;$('parentalPin').required=state.policy.pinSet;$('newParentalPin').required=!state.policy.pinSet;$('newPinLabel').textContent=state.policy.pinSet?'Novo PIN (opcional)':'Criar PIN';for(const id of ['parentalPin','newParentalPin','confirmParentalPin'])$(id).value='';$('parentalError').hidden=true;showModal('parentalModal');}catch(error){toast(error.message);}};
  $('parentalForm').onsubmit=async event=>{event.preventDefault();$('parentalSave').disabled=true;$('parentalError').hidden=true;try{
    if($('newParentalPin').value!==$('confirmParentalPin').value)throw new Error('A confirmação do novo PIN não confere.');
    state.policy=await api('/api/parental',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hideAdult:$('hideAdult').checked,maxAge:$('maxAge').value===''?null:Number($('maxAge').value),blockUnknown:$('blockUnknown').checked,pin:$('parentalPin').value,newPin:$('newParentalPin').value})});
    state.blockedTitles.clear();state.discovery=null;state.discoveryExpires=0;stopPlayback();for(const id of ['playerModal','detailsModal','parentalModal'])hideModal(id);cachedItem.clear();featuredId='';for(const t of types)state.catalog[t]={loaded:false,loading:false,items:[],categories:[],promise:null,error:null};state.category='';render();for(const t of types)loadSection(t);toast('Proteção parental atualizada.');
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
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!$('playerModal').hidden&&!$('playerModal').classList.contains('is-minimized'))minimizePlayback();else if(!$('accountModal').hidden)hideModal('accountModal');else closeMenu();}if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){event.preventDefault();document.querySelector('.search-toggle').click();}});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.deferredInstall=event;$('installButton').hidden=false;});
  $('installButton').addEventListener('click',async()=>{if(!state.deferredInstall){toast('Use o menu do navegador para instalar o aplicativo.');return;}const prompt=state.deferredInstall;state.deferredInstall=null;await prompt.prompt();$('installButton').hidden=true;});
  window.addEventListener('appinstalled',()=>{$('installButton').hidden=true;toast('Scene Play instalado.');});
  if('serviceWorker'in navigator&&['https:','http:'].includes(location.protocol)){navigator.serviceWorker.register('/service-worker.js').catch(()=>{});}
}
async function main(){bind();document.body.dataset.page='home';updateSessionUI();render();try{const fixed=await setupAccess({state,onReset:()=>{flushCloud();setDisconnected();},onConnected:async(result,profile,user)=>{state.token=result.token;state.account=result.account;state.host=result.host;state.listName=profile.name;state.profile=profile;state.appUser=user;state.offlineMode=false;updateProfileButton(profile);rememberOfflineProfile(offlineScope(user.id,profile.id),profile.name);$('openAccount').setAttribute('aria-label','Trocar perfil');$('openAccountSidebar').querySelector('span:not([data-icon])').textContent='Perfis';loadPrefs();const prefs=await api('/api/preferences');if(Array.isArray(prefs.favorites))state.favorites=new Set(prefs.favorites);if(Array.isArray(prefs.recents))state.recents=prefs.recents;if(prefs.progress&&typeof prefs.progress==='object')state.progress=prefs.progress;if(prefs.seriesProgress&&typeof prefs.seriesProgress==='object')state.seriesProgress=prefs.seriesProgress;if(typeof prefs.autoNext==='boolean')state.autoNext=prefs.autoNext;await loadParental();updateSessionUI();setSection('home');}});if(!fixed)await restoreSession();}catch(error){document.body.classList.remove('auth-pending');if(lastOfflineProfile()?.scope){state.offlineMode=true;showDownloads();}else toast('Não foi possível carregar o acesso. Atualize a página.');}}
main();

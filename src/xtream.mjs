// Xtream Codes-compatible API helpers. No credentials are ever persisted to disk.
import {contentMetadata} from './content.mjs';
export const SECTIONS = new Set(['live', 'vod', 'series']);
export const CATALOG_ACTIONS = Object.freeze({
  live: { categories: 'get_live_categories', items: 'get_live_streams' },
  vod: { categories: 'get_vod_categories', items: 'get_vod_streams' },
  series: { categories: 'get_series_categories', items: 'get_series' },
});

export function normalizeServerUrl(value) {
  let url;
  try { url = new URL(String(value || '').trim()); } catch { throw new Error('Informe uma URL válida com http:// ou https://.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use uma URL HTTP ou HTTPS.');
  if (url.username || url.password || url.search || url.hash) throw new Error('Informe apenas a URL do servidor e a porta, sem usuário, senha ou parâmetros.');
  if (url.hostname.length > 250 || url.href.length > 1000) throw new Error('URL do servidor muito longa.');
  const basePath = url.pathname.replace(/\/+$/, '').replace(/\/(?:player_api\.php|get\.php)$/i, '');
  return `${url.origin}${basePath}`;
}

export function apiUrl(base, username, password, action = '', params = {}) {
  const url = new URL(`${base}/player_api.php`);
  url.searchParams.set('username', username);
  url.searchParams.set('password', password);
  if (action) url.searchParams.set('action', action);
  for (const [key, val] of Object.entries(params)) if (val != null) url.searchParams.set(key, String(val));
  return url.href;
}

export function buildStreamUrl(base, username, password, section, streamId, extension = '') {
  if (!SECTIONS.has(section)) throw new Error('Tipo de conteúdo inválido.');
  const id = String(streamId);
  if (!/^\d{1,15}$/.test(id)) throw new Error('Identificador de mídia inválido.');
  const ext = section === 'live' ? 'm3u8' : (String(extension).toLowerCase().replace(/^\./, '') || 'mp4');
  if (!/^[a-z0-9]{2,5}$/.test(ext)) throw new Error('Extensão de mídia inválida.');
  const segment = section === 'vod' ? 'movie' : section;
  const url = new URL(`${base}/${segment}/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${id}.${ext}`);
  return url.href;
}

export function normalizeCatalog(items, categories, section) {
  const groups = new Map((Array.isArray(categories) ? categories : []).map(cat => [String(cat.category_id), String(cat.category_name || 'Sem categoria')]));
  return (Array.isArray(items) ? items : []).map(item => {
    const id = String(section === 'series' ? item.series_id : item.stream_id || '');
    if (!/^\d+$/.test(id)) return null;
    const categoryId = String(item.category_id ?? '');
    return {
      id: `${section}:${id}`, sourceId: id, type: section,
      name: String(item.name || item.title || `Conteúdo ${id}`),
      group: groups.get(categoryId) || 'Sem categoria', categoryId,
      logo: String(item.stream_icon || item.cover || item.cover_big || item.movie_image || item.poster || item.image || item.info?.movie_image || item.info?.cover || ''),
      extension: String(item.container_extension || (section === 'live' ? 'm3u8' : 'mp4')),
      rating: String(item.rating || ''), year: String(item.releaseDate || item.release_date || ''),
      ...contentMetadata(item,groups.get(categoryId)||''),
      ...(item.metadata||{}),
    };
  }).filter(Boolean);
}

export function rewriteHlsManifest(text, originUrl, register) {
  return text.split(/\r?\n/).map(line => {
    if (line.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (_full, raw) => {
        try { const absolute = new URL(raw, originUrl); return `URI="${register(absolute.href)}"`; }
        catch { return 'URI=""'; }
      });
    }
    if (!line.trim()) return line;
    try { return register(new URL(line.trim(), originUrl).href); }
    catch { return ''; }
  }).join('\n');
}

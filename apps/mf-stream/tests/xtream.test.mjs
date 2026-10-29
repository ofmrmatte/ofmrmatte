import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeServerUrl,apiUrl,buildStreamUrl,normalizeCatalog,rewriteHlsManifest} from '../src/xtream.mjs';

test('normaliza URL base Xtream e elimina caminhos comuns de API',()=>{
 assert.equal(normalizeServerUrl('http://iptv.example:8080/player_api.php'),'http://iptv.example:8080');
 assert.equal(normalizeServerUrl('https://iptv.example/get.php/'),'https://iptv.example');
 assert.throws(()=>normalizeServerUrl('file:///etc/passwd'),/HTTP/);
 assert.throws(()=>normalizeServerUrl('http://user:pass@server.com/'),/apenas/);
});
test('monta URLs Xtream com escaping seguro para login e mídia',()=>{
 const api=apiUrl('https://server.example','joao+tv','s&2','get_vod_streams');
 assert.equal(new URL(api).searchParams.get('password'),'s&2');
 assert.equal(new URL(api).searchParams.get('action'),'get_vod_streams');
 const stream=buildStreamUrl('https://server.example','joao+tv','s&2','vod','432','mp4');
 assert.equal(stream,'https://server.example/movie/joao%2Btv/s%262/432.mp4');
 assert.throws(()=>buildStreamUrl('https://server.example','u','p','live','x11','m3u8'),/Identificador/);
});
test('normaliza listas de canais, filmes e séries',()=>{
 const cats=[{category_id:'10',category_name:'Brasil'}];
 const live=normalizeCatalog([{stream_id:44,name:'TV Brasil',category_id:10,stream_icon:'https://example.com/icon.png'}],cats,'live');
 assert.deepEqual([live[0].id,live[0].sourceId,live[0].group,live[0].extension],['live:44','44','Brasil','m3u8']);
 const series=normalizeCatalog([{series_id:77,name:'Minha série',cover:'https://example.com/poster.png'}],[],'series');
 assert.equal(series[0].id,'series:77');
});
test('reescreve playlists HLS, inclusive submanifestos, chaves e segmentos',()=>{
 const original='#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="keys/key.bin"\nlevel2/index.m3u8\n#EXTINF:3,\nsegment.ts\n';
 const targets=[];
 const rewritten=rewriteHlsManifest(original,'https://origin.example/hls/master.m3u8',url=>{targets.push(url);return `/api/media/token/${targets.length}`;});
 assert.deepEqual(targets,[
  'https://origin.example/hls/keys/key.bin',
  'https://origin.example/hls/level2/index.m3u8',
  'https://origin.example/hls/segment.ts'
 ]);
 assert.ok(rewritten.includes('URI="/api/media/token/1"'));
 assert.ok(rewritten.includes('/api/media/token/2'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, get } from 'node:http';
import { once } from 'node:events';
import { isAllowedApiRedirect, pinnedLookup, tryAddresses } from '../lib/connect.mjs';

test('aceita mudança de domínio Xtream mantendo credenciais e parâmetros da API', () => {
  const source=new URL('http://old.example/panel/player_api.php?username=test&password=secret&action=get_live_streams&category_id=2');
  const destination=new URL(source);
  destination.hostname='new.example';
  destination.protocol='https:';
  destination.searchParams.sort();
  destination.searchParams.set('route','new-server');
  assert.equal(isAllowedApiRedirect(source,destination),true);
  const login=new URL('http://old.example/player_api.php?username=test&password=secret');
  assert.equal(isAllowedApiRedirect(login,new URL('http://new.example/player_api.php?password=secret&username=test')),true);
});

test('rejeita mudança de domínio que altera endpoint, credenciais, ação ou HTTPS', () => {
  const source=new URL('https://old.example/player_api.php?username=test&password=secret&action=get_live_streams');
  const candidate=new URL(source);candidate.hostname='new.example';
  for (const mutate of [
    url=>{url.pathname='/collect';},
    url=>{url.searchParams.delete('password');},
    url=>{url.searchParams.set('username','other');},
    url=>{url.searchParams.set('action','get_vod_streams');},
    url=>{url.searchParams.append('password','other');},
    url=>{url.protocol='http:';},
    url=>{url.protocol='ftp:';},
    url=>{url.username='basic-login';},
  ]) {
    const destination=new URL(candidate);mutate(destination);
    assert.equal(isAllowedApiRedirect(source,destination),false);
  }
});

test('lookup fixado suporta as duas assinaturas DNS para IPv4 e IPv6', () => {
  for (const ip of [{ address:'127.0.0.1',family:4 }, { address:'::1',family:6 }]) {
    const lookup=pinnedLookup(ip);
    lookup('provider.invalid',{},(error,address,family)=> {
      assert.equal(error,null);
      assert.equal(address,ip.address);
      assert.equal(family,ip.family);
    });
    lookup('provider.invalid',{all:true},(error,addresses)=> {
      assert.equal(error,null);
      assert.deepEqual(addresses,[ip]);
    });
  }
});

for (const autoSelectFamily of [true,false]) {
  test(`conecta pelo IP validado e preserva Host com autoSelectFamily=${autoSelectFamily}`, async t => {
    const provider=createServer((req,res)=>res.end(req.headers.host));
    t.after(()=>new Promise(resolve=>provider.close(resolve)));
    provider.listen(0,'127.0.0.1');
    await once(provider,'listening');
    const host=`provider.invalid:${provider.address().port}`;
    const body=await new Promise((resolve,reject)=> {
      const request=get(`http://${host}/player_api.php`,{
        lookup:pinnedLookup({address:'127.0.0.1',family:4}),
        autoSelectFamily,agent:false,timeout:2000,
      },response=> {
        let text='';
        response.setEncoding('utf8');
        response.on('data',chunk=>{text+=chunk;});
        response.on('end',()=>resolve(text));
        response.on('error',reject);
      });
      request.on('error',reject);
      request.on('timeout',()=>request.destroy(new Error('Timeout no teste de lookup.')));
    });
    assert.equal(body,host);
  });
}

test('se o primeiro IP falhar, usa o segundo endereço validado', async () => {
  const ips = [{ address:'203.0.113.1',family:4 }, { address:'203.0.113.2',family:4 }];
  const attempted = [];
  const result = await tryAddresses(ips,async ip => {
    attempted.push(ip.address);
    if (attempted.length === 1) throw Object.assign(new Error('Conexão recusada'), { code:'ECONNREFUSED' });
    return { status: 200 };
  });
  assert.equal(result.status,200);
  assert.deepEqual(attempted,ips.map(x=>x.address));
});

test('erros de segurança interrompem as tentativas de endereços', async () => {
  const attempted=[];
  await assert.rejects(tryAddresses(['one','two'],async ip=> {
    attempted.push(ip);
    throw Object.assign(new Error('redirecionamento inseguro'),{publicCode:'REDIRECT_EXTERNAL'});
  }),{publicCode:'REDIRECT_EXTERNAL'});
  assert.deepEqual(attempted,['one']);
});

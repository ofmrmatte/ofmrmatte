import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createParentalStore,parentalKey} from '../lib/parental.mjs';
import {contentMetadata,contentAllowed} from '../src/content.mjs';

test('classificação indicativa usa metadados explícitos e nunca a nota de avaliação',()=>{
 assert.equal(contentMetadata({rating:'18'}).age,null);
 assert.equal(contentMetadata({age_rating:'14 anos'}).age,14);
 assert.equal(contentMetadata({certification:'Livre'}).age,0);
 assert.equal(contentMetadata({mpaa:'PG-13'}).ageLabel,'PG-13');
 assert.equal(contentMetadata({mpaa:'PG-13'}).ageCountry,'US');
 assert.equal(contentMetadata({name:'Canal',is_adult:'1'}).adult,true);
 assert.equal(contentMetadata({name:'Canal'},'ADULTOS').adult,true);
 assert.equal(contentMetadata({name:'XXX Premium'}).adult,true);
 assert.equal(contentMetadata({name:'História de 2018'}).adult,false);
 assert.equal(contentAllowed(contentMetadata({age_rating:16}),{hideAdult:true,maxAge:12,blockUnknown:false}),false);
 assert.equal(contentAllowed(contentMetadata({}),{hideAdult:true,maxAge:null,blockUnknown:true}),false);
});

test('PIN persiste somente como hash, protege alterações e limita tentativas entre sessões',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'mfstream-parental-'));
 t.after(async()=>{assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep+'mfstream-parental-'));await rm(dir,{recursive:true,force:true});});
 const path=join(dir,'parental.json'), key=parentalKey('https://example.org','testuser');
 let store=await createParentalStore(path);
 const settings={hideAdult:true,maxAge:12,blockUnknown:true,newPin:'7429'};
 await store.update(key,settings);
 const disk=await readFile(path,'utf8');assert.doesNotMatch(disk,/7429|testuser|example.org/);
 store=await createParentalStore(path);
 assert.deepEqual(store.get(key),{hideAdult:true,maxAge:12,blockUnknown:true,pinSet:true});
 assert.doesNotMatch(JSON.stringify(store.get(key)),/hash|salt/);
 await assert.rejects(store.update(key,{hideAdult:false,maxAge:null,blockUnknown:false}),/PIN incorreto/);
 assert.equal(store.get(key).hideAdult,true);
 await store.update(key,{hideAdult:false,maxAge:null,blockUnknown:false,pin:'7429',newPin:'9381'});
 for(let i=0;i<5;i++)await assert.rejects(store.update(key,{...settings,pin:'0000'}),/PIN incorreto/);
 await assert.rejects(store.update(key,{...settings,pin:'9381'}),/Muitas tentativas/);
});

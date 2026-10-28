import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createAccess} from '../lib/access.mjs';

test('login persistente, convites e perfis isolados com preferências em banco',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'mfstream-access-'));const config={dataDir:dir,baseURL:'http://localhost:3000',secret:randomBytes(48).toString('hex'),registrationCode:'fixture-invite'};
 let access=await createAccess(config);t.after(async()=>{await access.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep+'mfstream-access-'));await rm(dir,{force:true,recursive:true});});
 await assert.rejects(access.register({email:'a@example.test',password:'FixturePassword2026!',name:'A',code:'wrong'}),/convite/);
 const a=await access.register({email:'a@example.test',password:'FixturePassword2026!',name:'A',code:'fixture-invite'});
 const b=await access.register({email:'b@example.test',password:'OtherFixture2026!',name:'B',code:'fixture-invite'});
 const withoutInvite=await access.register({email:'c@example.test',password:'NoInvite2026!',name:'C'});
 assert.ok(withoutInvite.id);
 const profiles=await access.profiles(a.id);assert.equal(profiles.length,1);
 assert.equal(await access.profile(b.id,profiles[0].id),null);
 await assert.rejects(access.updateProfile(b.id,profiles[0].id,{name:'Invadido',avatar:1}),/encontrado/);
 await access.savePreferences(a.id,profiles[0].id,{progress:{'series:1':{position:42}},favorites:['vod:2']});
 const login=await access.auth.api.signInEmail({body:{email:'a@example.test',password:'FixturePassword2026!'},asResponse:true});assert.equal(login.status,200);
 const cookie=login.headers.getSetCookie().map(row=>row.split(';')[0]).join('; ');assert.ok(cookie);
 assert.equal((await access.identity({headers:{cookie}})).user.id,a.id);
 await access.close();access=await createAccess(config);
 assert.equal((await access.identity({headers:{cookie}})).user.id,a.id);
 assert.equal(JSON.parse((await access.profile(a.id,profiles[0].id)).preferences).progress['series:1'].position,42);
 for(let i=0;i<4;i++)await access.createProfile(a.id,'Pessoa '+i,i);
 await assert.rejects(access.createProfile(a.id,'Excesso',1),/cinco/);
 assert.equal((await access.profiles(b.id)).length,1);
 assert.equal((await readFile(join(dir,'stream.sqlite'))).includes(Buffer.from('FixturePassword2026!')),false);
});

test('cadastro sem código configurado não exige convite',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'mfstream-access-'));
 const access=await createAccess({dataDir:dir,baseURL:'http://localhost:3000',secret:randomBytes(48).toString('hex')});
 t.after(async()=>{await access.close();await rm(dir,{force:true,recursive:true});});
 const user=await access.register({email:'sem-convite@example.test',password:'OpenRegister2026!',name:'Sem convite'});
 assert.ok(user.id);
 await assert.rejects(access.register({email:'invalido@example.test',password:'OtherFixture2026!',name:'Inválido',code:'wrong'}),/convite/);
});

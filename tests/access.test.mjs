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

test('proprietário único independente de contas de espectadores',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'mfstream-access-'));
 const a=await createAccess({dataDir:dir,baseURL:'http://localhost:3000',secret:randomBytes(48).toString('hex'),adminSetupToken:'teste-de-token-seguro-com-mais-de-32-caracteres'});
 t.after(async()=>{await a.close();await rm(dir,{force:true,recursive:true});});
 const viewer=await a.register({name:'Espectador',email:'viewer@example.test',password:'ViewerPassword2026!'});
 assert.equal(await a.isOwner(viewer.id),false);
 await assert.rejects(a.setupOwner({name:'Admin',email:'admin@example.test',password:'AdminPassword2026!',token:'errado'}),/ativação inválida/);
 const owner=await a.setupOwner({name:'Admin',email:'admin@example.test',password:'AdminPassword2026!',token:'teste-de-token-seguro-com-mais-de-32-caracteres'});
 assert.equal(await a.isOwner(owner.id),true);assert.equal((await a.profiles(owner.id)).length,0);
 await assert.rejects(a.setupOwner({name:'Outro',email:'outro@example.test',password:'OutroPassword2026!',token:'teste-de-token-seguro-com-mais-de-32-caracteres'}),/já foi configurado/);
 await assert.rejects(a.listUsers(viewer.id),/exclusivo/);
 const users=await a.listUsers(owner.id);assert.equal(users.length,1);assert.equal(users[0].email,'viewer@example.test');
 await a.setSuspended(owner.id,viewer.id,true);assert.equal(await a.isSuspended(viewer.id),true);
 await a.setSuspended(owner.id,viewer.id,false);assert.equal(await a.isSuspended(viewer.id),false);
 await assert.rejects(a.setSuspended(owner.id,owner.id,true),/protegida/);
 await assert.rejects(a.revokeSessions(viewer.id,owner.id),/exclusivo/);
 assert.deepEqual(await a.revokeSessions(owner.id,viewer.id),{ok:true});
});

test('resumo administrativo conta sessões reais, protege detalhes e persiste auditoria',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'mfstream-admin-'));const config={dataDir:dir,baseURL:'http://localhost:3000',secret:randomBytes(48).toString('hex'),adminSetupToken:'fixture-owner-token'};
 let access=await createAccess(config);t.after(async()=>{await access.close();await rm(dir,{force:true,recursive:true});});
 const viewer=await access.register({name:'Ana',email:'ana@example.test',password:'ViewerPassword2026!'}),owner=await access.setupOwner({name:'Owner',email:'owner@example.test',password:'OwnerPassword2026!',token:'fixture-owner-token'});
 await access.auth.api.signInEmail({body:{email:'ana@example.test',password:'ViewerPassword2026!'}});
 const snapshot=await access.adminSnapshot(owner.id);assert.equal(snapshot.users.length,1);assert.equal(snapshot.summary.sessions,1);assert.equal(snapshot.summary.profiles,1);assert.equal(snapshot.summary.active,1);assert.equal(snapshot.users[0].sessionCount,1);
 const profile=(await access.profiles(viewer.id))[0];await access.savePreferences(viewer.id,profile.id,{favorites:['private-history']});
 const detail=await access.userDetails(owner.id,viewer.id);assert.equal(detail.sessions.length,1);assert.deepEqual(Object.keys(detail.sessions[0]).sort(),['createdAt','expiresAt']);assert.equal(detail.profiles[0].preferences,undefined);assert.equal(JSON.stringify(detail).includes('private-history'),false);
 await assert.rejects(access.adminSnapshot(viewer.id),/exclusivo/);await assert.rejects(access.userDetails(viewer.id,viewer.id),/exclusivo/);await assert.rejects(access.recordConnectionEvent(viewer.id,'connection.updated'),/exclusivo/);
 await access.setSuspended(owner.id,viewer.id,true);assert.equal((await access.adminSnapshot(owner.id)).summary.sessions,0);await access.recordConnectionEvent(owner.id,'connection.updated');
 await access.close();access=await createAccess(config);const restored=await access.adminSnapshot(owner.id);assert.equal(restored.summary.suspended,1);assert.equal(restored.events.length,2);assert.equal(restored.events.some(e=>e.action==='user.suspended'&&e.targetName==='Ana'),true);assert.equal(JSON.stringify(restored.events).includes('Password2026'),false);
});

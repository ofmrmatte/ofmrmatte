import {DatabaseSync} from 'node:sqlite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {betterAuth} from 'better-auth';
import {admin} from 'better-auth/plugins';
import {getMigrations} from 'better-auth/db/migration';
import {fromNodeHeaders,toNodeHandler} from 'better-auth/node';
import pg from 'pg';

export async function createAccess({dataDir,baseURL,secret,registrationCode='',adminSetupToken='',databaseURL='',cookiePrefix='mf-stream'}) {
 await mkdir(dataDir,{recursive:true});
 if(!secret){const path=resolve(dataDir,'auth-secret');try{secret=await readFile(path,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;secret=randomBytes(48).toString('base64url');await writeFile(path,secret,{mode:0o600,flag:'wx'});}}
 const database=databaseURL?new pg.Pool({connectionString:databaseURL,max:5}):new DatabaseSync(resolve(dataDir,'stream.sqlite'));
 if(!databaseURL){database.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');}
 const query=async(sql,params=[])=>databaseURL?(await database.query(sql,params)).rows:database.prepare(sql.replace(/\$\d+/g,'?')).all(...params);
 const auth=betterAuth({database,secret,baseURL,advanced:{cookiePrefix},trustedOrigins:[baseURL],emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:10},session:{expiresIn:60*60*24*30,updateAge:60*60*24},rateLimit:{enabled:true,window:60,max:30},plugins:[admin()]});
 const {runMigrations}=await getMigrations(auth.options);await runMigrations();
 await query('CREATE TABLE IF NOT EXISTS stream_profile (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, avatar INTEGER NOT NULL, preferences TEXT NOT NULL, created_at TEXT NOT NULL)');
 await query('CREATE INDEX IF NOT EXISTS stream_profile_owner ON stream_profile(owner_id)');
 await query('CREATE TABLE IF NOT EXISTS stream_owner (id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL)');
 await query('CREATE TABLE IF NOT EXISTS stream_access_control (user_id TEXT PRIMARY KEY, suspended INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)');
 const ownerId=async()=>(await query('SELECT user_id FROM stream_owner WHERE id=$1',['master']))[0]?.user_id||null;
 const hasOwner=async()=>!!await ownerId();
 const isOwner=async(id)=>!!id&&(await ownerId())===id;
 const isSuspended=async(id)=>!!id&&Number((await query('SELECT suspended FROM stream_access_control WHERE user_id=$1',[id]))[0]?.suspended||0)===1;
 const identity=req=>auth.api.getSession({headers:fromNodeHeaders(req.headers)});
 const profiles=owner=>query('SELECT id,name,avatar FROM stream_profile WHERE owner_id=$1 ORDER BY created_at,id',[owner]);
 const profile=async(owner,id)=>(await query('SELECT id,name,avatar,preferences FROM stream_profile WHERE owner_id=$1 AND id=$2',[owner,id]))[0]||null;
 let writes=Promise.resolve();const serialize=fn=>{const next=writes.then(fn);writes=next.catch(()=>{});return next;};
 const createProfile=(owner,name,avatar=0)=>serialize(async()=>{
  name=String(name||'').trim();if(!name||name.length>24||/[\x00-\x1f]/.test(name)||!Number.isInteger(avatar)||avatar<0||avatar>7)throw Object.assign(new Error('Informe um nome de até 24 caracteres.'),{status:400});
  if((await profiles(owner)).length>=5)throw Object.assign(new Error('Você pode criar até cinco perfis.'),{status:400});
  const id=randomBytes(16).toString('hex');await query('INSERT INTO stream_profile (id,owner_id,name,avatar,preferences,created_at) VALUES ($1,$2,$3,$4,$5,$6)',[id,owner,name,avatar,'{}',new Date().toISOString()]);return {id,name,avatar};
 });
 const register=body=>serialize(async()=>{
  const providedCode=String(body.code??'').trim();
  // Convites são opcionais. Se enviados, precisam corresponder ao código configurado.
  if(providedCode){
   const expected=Buffer.from(String(registrationCode||''));
   const provided=Buffer.from(providedCode);
   if(!expected.length||expected.length!==provided.length||!timingSafeEqual(expected,provided))throw Object.assign(new Error('Código de convite inválido.'),{status:403});
  }
  // O primeiro espectador não recebe privilégios de administrador.
  const result=await auth.api.createUser({body:{name:String(body.name||'').trim().slice(0,60),email:String(body.email||'').trim(),password:String(body.password||''),role:'user'}});
  // Inline insert avoids nesting the write queue.
  const id=randomBytes(16).toString('hex');await query('INSERT INTO stream_profile (id,owner_id,name,avatar,preferences,created_at) VALUES ($1,$2,$3,$4,$5,$6)',[id,result.user.id,'Meu perfil',0,'{}',new Date().toISOString()]);return result.user;
 });
 const setupOwner=body=>serialize(async()=>{
  if(!adminSetupToken)throw Object.assign(new Error('Ativação administrativa não configurada.'),{status:503});
  if(await hasOwner())throw Object.assign(new Error('O proprietário já foi configurado.'),{status:409});
  const expected=Buffer.from(adminSetupToken),provided=Buffer.from(String(body.token||''));
  if(!provided.length||expected.length!==provided.length||!timingSafeEqual(expected,provided))throw Object.assign(new Error('Chave de ativação inválida.'),{status:403});
  const name=String(body.name||'').trim(),email=String(body.email||'').trim(),password=String(body.password||'');
  if(!name||name.length>60||password.length<10||password.length>128)throw Object.assign(new Error('Nome ou senha inválidos (mínimo de 10 caracteres).'),{status:400});
  const result=await auth.api.createUser({body:{name,email,password,role:'admin'}});
  await query('INSERT INTO stream_owner(id,user_id,created_at) VALUES($1,$2,$3)',['master',result.user.id,new Date().toISOString()]);
  await query('UPDATE "user" SET role=$1 WHERE role=$2 AND id<>$3',['user','admin',result.user.id]);
  return {id:result.user.id};
 });
 const requireOwner=async(actor)=>{if(!await isOwner(actor))throw Object.assign(new Error('Acesso exclusivo do proprietário.'),{status:403});};
 const listUsers=async(actor)=>{
  await requireOwner(actor);
  return query('SELECT u.id,u.name,u.email,u."createdAt" AS createdAt,(SELECT COUNT(*) FROM stream_profile p WHERE p.owner_id=u.id) AS profileCount,COALESCE((SELECT suspended FROM stream_access_control c WHERE c.user_id=u.id),0) AS suspended FROM "user" u WHERE u.id<>$1 ORDER BY u."createdAt" DESC',[await ownerId()]);
 };
 const setSuspended=(actor,userId,suspended)=>serialize(async()=>{
  await requireOwner(actor);
  if(!userId||userId===await ownerId())throw Object.assign(new Error('Conta protegida.'),{status:403});
  if(!(await query('SELECT id FROM "user" WHERE id=$1',[userId])).length)throw Object.assign(new Error('Usuário não encontrado.'),{status:404});
  await query('INSERT INTO stream_access_control(user_id,suspended,updated_at) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET suspended=EXCLUDED.suspended,updated_at=EXCLUDED.updated_at',[userId,suspended?1:0,new Date().toISOString()]);
  if(suspended)await query('DELETE FROM "session" WHERE "userId"=$1',[userId]);
  return {ok:true,suspended:!!suspended};
 });
 const revokeSessions=(actor,userId)=>serialize(async()=>{
  await requireOwner(actor);
  if(!userId||userId===await ownerId())throw Object.assign(new Error('Conta protegida.'),{status:403});
  if(!(await query('SELECT id FROM "user" WHERE id=$1',[userId])).length)throw Object.assign(new Error('Usuário não encontrado.'),{status:404});
  await query('DELETE FROM "session" WHERE "userId"=$1',[userId]);return {ok:true};
 });
 return {auth,handler:toNodeHandler(auth),identity,profiles,profile,createProfile,register,setupOwner,hasOwner,isOwner,isSuspended,listUsers,setSuspended,revokeSessions,hasUsers:async()=>Number((await query('SELECT COUNT(*) AS total FROM "user"'))[0].total)>0,
  updateProfile:async(owner,id,body)=>{if(!await profile(owner,id))throw Object.assign(new Error('Perfil não encontrado.'),{status:404});const name=String(body.name||'').trim();const avatar=Number(body.avatar);if(!name||name.length>24||!Number.isInteger(avatar)||avatar<0||avatar>7)throw Object.assign(new Error('Perfil inválido.'),{status:400});await query('UPDATE stream_profile SET name=$1,avatar=$2 WHERE owner_id=$3 AND id=$4',[name,avatar,owner,id]);return {id,name,avatar};},
  savePreferences:async(owner,id,data)=>{if(!await profile(owner,id))throw Object.assign(new Error('Perfil não encontrado.'),{status:404});const text=JSON.stringify(data);if(text.length>250000)throw Object.assign(new Error('Preferências muito grandes.'),{status:413});await query('UPDATE stream_profile SET preferences=$1 WHERE owner_id=$2 AND id=$3',[text,owner,id]);},
  close:()=>databaseURL?database.end():database.close()};
}

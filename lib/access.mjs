import {DatabaseSync} from 'node:sqlite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {betterAuth} from 'better-auth';
import {admin} from 'better-auth/plugins';
import {getMigrations} from 'better-auth/db/migration';
import {fromNodeHeaders,toNodeHandler} from 'better-auth/node';
import pg from 'pg';

export async function createAccess({dataDir,baseURL,secret,registrationCode='',databaseURL='',cookiePrefix='mf-stream'}) {
 await mkdir(dataDir,{recursive:true});
 if(!secret){const path=resolve(dataDir,'auth-secret');try{secret=await readFile(path,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;secret=randomBytes(48).toString('base64url');await writeFile(path,secret,{mode:0o600,flag:'wx'});}}
 const database=databaseURL?new pg.Pool({connectionString:databaseURL,max:5}):new DatabaseSync(resolve(dataDir,'stream.sqlite'));
 if(!databaseURL){database.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');}
 const query=async(sql,params=[])=>databaseURL?(await database.query(sql,params)).rows:database.prepare(sql.replace(/\$\d+/g,'?')).all(...params);
 const auth=betterAuth({database,secret,baseURL,advanced:{cookiePrefix},trustedOrigins:[baseURL],emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:10},session:{expiresIn:60*60*24*30,updateAge:60*60*24},rateLimit:{enabled:true,window:60,max:30},plugins:[admin()]});
 const {runMigrations}=await getMigrations(auth.options);await runMigrations();
 await query('CREATE TABLE IF NOT EXISTS stream_profile (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, avatar INTEGER NOT NULL, preferences TEXT NOT NULL, created_at TEXT NOT NULL)');
 await query('CREATE INDEX IF NOT EXISTS stream_profile_owner ON stream_profile(owner_id)');
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
  const count=(await query('SELECT COUNT(*) AS total FROM "user"'))[0].total;
  const result=await auth.api.createUser({body:{name:String(body.name||'').trim().slice(0,60),email:String(body.email||'').trim(),password:String(body.password||''),role:Number(count)===0?'admin':'user'}});
  // Inline insert avoids nesting the write queue.
  const id=randomBytes(16).toString('hex');await query('INSERT INTO stream_profile (id,owner_id,name,avatar,preferences,created_at) VALUES ($1,$2,$3,$4,$5,$6)',[id,result.user.id,'Meu perfil',0,'{}',new Date().toISOString()]);return result.user;
 });
 return {auth,handler:toNodeHandler(auth),identity,profiles,profile,createProfile,register,hasUsers:async()=>Number((await query('SELECT COUNT(*) AS total FROM "user"'))[0].total)>0,
  updateProfile:async(owner,id,body)=>{if(!await profile(owner,id))throw Object.assign(new Error('Perfil não encontrado.'),{status:404});const name=String(body.name||'').trim();const avatar=Number(body.avatar);if(!name||name.length>24||!Number.isInteger(avatar)||avatar<0||avatar>7)throw Object.assign(new Error('Perfil inválido.'),{status:400});await query('UPDATE stream_profile SET name=$1,avatar=$2 WHERE owner_id=$3 AND id=$4',[name,avatar,owner,id]);return {id,name,avatar};},
  savePreferences:async(owner,id,data)=>{if(!await profile(owner,id))throw Object.assign(new Error('Perfil não encontrado.'),{status:404});const text=JSON.stringify(data);if(text.length>250000)throw Object.assign(new Error('Preferências muito grandes.'),{status:413});await query('UPDATE stream_profile SET preferences=$1 WHERE owner_id=$2 AND id=$3',[text,owner,id]);},
  close:()=>databaseURL?database.end():database.close()};
}

import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
const defaults={hideAdult:true,maxAge:null,blockUnknown:false};
export const parentalKey=(base,username)=>createHash('sha256').update(`${base}\n${username}`).digest('hex');
export async function createParentalStore(file) {
  let records={};
  try {records=JSON.parse(await readFile(file,'utf8'));} catch(error) {if(error.code!=='ENOENT') throw error;}
  const attempts=new Map();let queue=Promise.resolve();
  const get=key=>({...defaults,...records[key],pinSet:!!records[key]?.hash});
  const publicPolicy=key=>{const {hideAdult,maxAge,blockUnknown,pinSet}=get(key);return {hideAdult,maxAge,blockUnknown,pinSet};};
  async function update(key,body) {
    const run=async()=>{
      const current=get(key);const failed=attempts.get(key)||{count:0,until:0};
      if(failed.until>Date.now()) throw Object.assign(new Error('Muitas tentativas. Aguarde cinco minutos.'),{status:429});
      if(current.pinSet) {
        const input=String(body.pin||'');
        const digest=await scrypt(input.slice(0,100),current.salt,32);
        if(!timingSafeEqual(digest,Buffer.from(current.hash,'hex'))) {
          failed.count++;if(failed.count>=5){failed.until=Date.now()+300000;failed.count=0;}attempts.set(key,failed);
          throw Object.assign(new Error('PIN incorreto.'),{status:403});
        }
      }
      if(typeof body.hideAdult!=='boolean'||typeof body.blockUnknown!=='boolean'||![null,0,10,12,14,16,18].includes(body.maxAge)) throw Object.assign(new Error('Configuração parental inválida.'),{status:400});
      const next={hideAdult:body.hideAdult,maxAge:body.maxAge,blockUnknown:body.blockUnknown};
      if(!current.pinSet&&!body.newPin) throw Object.assign(new Error('Crie um PIN de 4 a 8 números para proteger as configurações.'),{status:400});
      if(body.newPin) {
        if(!/^\d{4,8}$/.test(String(body.newPin))) throw Object.assign(new Error('O novo PIN deve ter de 4 a 8 números.'),{status:400});
        next.salt=randomBytes(16).toString('hex');next.hash=(await scrypt(String(body.newPin),next.salt,32)).toString('hex');
      } else {next.salt=current.salt;next.hash=current.hash;}
      const updated={...records,[key]:next};
      await mkdir(dirname(file),{recursive:true});
      await writeFile(file+'.tmp',JSON.stringify(updated),{mode:0o600});await rename(file+'.tmp',file);
      records=updated;attempts.delete(key);return publicPolicy(key);
    };
    const result=queue.then(run);queue=result.catch(()=>{});return result;
  }
  return {get:publicPolicy,update};
}

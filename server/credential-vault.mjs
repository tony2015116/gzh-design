import {randomBytes} from 'node:crypto';
import {readFile,writeFile,chmod} from 'node:fs/promises';
import {resolve} from 'node:path';
import {encryptSecret,decryptSecret} from './dist/backend.mjs';

export async function initializeCredentialVault(db,dataDir,configuredKey){
 const apps=(await db.prepare('SELECT user_id,app_secret FROM feishu_apps').all()).results;
 const tokens=(await db.prepare('SELECT user_id,access_token,refresh_token FROM feishu_tokens').all()).results;
 const hasEncrypted=[...apps.map(r=>r.app_secret),...tokens.flatMap(r=>[r.access_token,r.refresh_token])].some(value=>value.startsWith('enc:'));
 let key=configuredKey;
 if(!key){
  const path=resolve(dataDir,'.credentials-key');
  try{key=(await readFile(path,'utf8')).trim();}
  catch(error){
   if(error.code!=='ENOENT')throw error;
   if(hasEncrypted)throw new Error('Credential encryption key is missing; restore the original key before startup');
   key=randomBytes(32).toString('base64');
   try{await writeFile(path,key+'\n',{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;key=(await readFile(path,'utf8')).trim();}
  }
  await chmod(path,0o600);
 }
 const env={CREDENTIALS_ENCRYPTION_KEY:key},writes=[];
 // Validate the key even when no Feishu credentials exist, without logging key material.
 const probe=await encryptSecret(env,'vault-key-check','startup');await decryptSecret(env,probe,'startup');
 const migrate=async(value,context)=>{
  if(value.startsWith('enc:')){await decryptSecret(env,value,context);return value;}
  const encrypted=await encryptSecret(env,value,context);
  if(await decryptSecret(env,encrypted,context)!==value)throw new Error('Credential migration verification failed');
  return encrypted;
 };
 for(const row of apps){const encrypted=await migrate(row.app_secret,`${row.user_id}:app_secret`);if(encrypted!==row.app_secret)writes.push(db.prepare('UPDATE feishu_apps SET app_secret=? WHERE user_id=? AND app_secret=?').bind(encrypted,row.user_id,row.app_secret));}
 for(const row of tokens){const access=await migrate(row.access_token,`${row.user_id}:access_token`),refresh=await migrate(row.refresh_token,`${row.user_id}:refresh_token`);if(access!==row.access_token||refresh!==row.refresh_token)writes.push(db.prepare('UPDATE feishu_tokens SET access_token=?,refresh_token=? WHERE user_id=? AND access_token=? AND refresh_token=?').bind(access,refresh,row.user_id,row.access_token,row.refresh_token));}
 if(writes.length)await db.batch(writes);
 return key;
}

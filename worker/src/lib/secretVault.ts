import type {Env} from '../types';
const PREFIX='enc:v1:';
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes));
const decode=(value:string)=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
export class SecretVaultError extends Error {
 constructor(){super('飞书凭证不可读取，请检查服务器加密密钥与数据备份');}
}
async function keyFor(env:Pick<Env,'CREDENTIALS_ENCRYPTION_KEY'>){
 try{
  const key=decode(env.CREDENTIALS_ENCRYPTION_KEY||'');
  if(key.length!==32)throw new Error();
  return await crypto.subtle.importKey('raw',key,{name:'AES-GCM'},false,['encrypt','decrypt']);
 }catch{throw new SecretVaultError();}
}
export async function encryptSecret(env:Pick<Env,'CREDENTIALS_ENCRYPTION_KEY'>,value:string,context:string):Promise<string>{
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(context)},await keyFor(env),new TextEncoder().encode(value));
 return PREFIX+encode(iv)+':'+encode(new Uint8Array(encrypted));
}
export async function decryptSecret(env:Pick<Env,'CREDENTIALS_ENCRYPTION_KEY'>,value:string,context:string):Promise<string>{
 try{
  if(!value.startsWith(PREFIX))throw new Error();
  const [iv,cipher,...extra]=value.slice(PREFIX.length).split(':');if(extra.length||!iv||!cipher)throw new Error();
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(iv),additionalData:new TextEncoder().encode(context)},await keyFor(env),decode(cipher)));
 }catch{throw new SecretVaultError();}
}

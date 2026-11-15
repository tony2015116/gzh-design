import type {Env} from '../types';
import {getBearerToken} from './http';
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
export function validFeishuRedirect(request:Request,env:Env,value:string):boolean{
 try{
  const url=new URL(value);
  const origins=env.RUNTIME==='node'?[new URL(request.url).origin]:env.ALLOWED_ORIGINS.split(',').map(origin=>origin.trim());
  return origins.includes(url.origin)&&['http:','https:'].includes(url.protocol)&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/feishu/callback'&&url.href===value;
 }catch{return false;}
}
export async function issueFeishuState(request:Request,env:Env,userId:string,appId:string,redirectUri:string):Promise<string>{
 const state=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
 await env.DB.prepare('DELETE FROM feishu_oauth_states WHERE expires_at<=?').bind(Date.now()).run();
 await env.DB.prepare(`INSERT INTO feishu_oauth_states(state_hash,user_id,session_hash,redirect_uri,app_id,expires_at) VALUES(?,?,?,?,?,?)
 ON CONFLICT(user_id,session_hash) DO UPDATE SET state_hash=excluded.state_hash,redirect_uri=excluded.redirect_uri,app_id=excluded.app_id,expires_at=excluded.expires_at`).bind(await hash(state),userId,await hash(getBearerToken(request)),redirectUri,appId,Date.now()+600000).run();
 return state;
}
export async function consumeFeishuState(request:Request,env:Env,userId:string,appId:string,state:string,redirectUri:string):Promise<boolean>{
 if(!/^[a-f0-9]{64}$/.test(state)||!validFeishuRedirect(request,env,redirectUri))return false;
 const row=await env.DB.prepare('DELETE FROM feishu_oauth_states WHERE state_hash=? AND user_id=? AND session_hash=? AND redirect_uri=? AND app_id=? AND expires_at>? RETURNING state_hash').bind(await hash(state),userId,await hash(getBearerToken(request)),redirectUri,appId,Date.now()).first();
 return Boolean(row);
}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApplication} from '../application.mjs';
import {readFile,rename} from 'node:fs/promises';
import {decryptSecret} from '../dist/backend.mjs';
const nativeFetch=globalThis.fetch;
async function fixture(config={}){
 const dir=await mkdtemp(join(tmpdir(),'gzh-security-'));let app,server;
 const start=async()=>{app=await createApplication({dataDir:dir,staticDir:dir,publicUrl:'http://localhost',config});server=createServer(app.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));};await start();
 return {dir,get app(){return app;},async restart(){await this.stop();await start();},async stop(){server.closeAllConnections();await new Promise(r=>server.close(r));await app.close();},async close(){if(server.listening)await this.stop();await rm(dir,{recursive:true,force:true});},async api(path,body,token,headers={}){const r=await nativeFetch(`http://127.0.0.1:${server.address().port}`+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,retry:r.headers.get('retry-after'),data:await r.json()};}};
}
test('registration throttle persists, counts invalid attempts and ignores forged client addresses',async()=>{
 const f=await fixture();try{
  for(let i=0;i<10;i++)assert.equal((await f.api('/api/auth/register',{},null,{'X-Real-IP':`198.51.100.${i}`,'CF-Connecting-IP':`198.51.100.${i}`})).status,400);
  const blocked=await f.api('/api/auth/register',{});assert.equal(blocked.status,429);assert.ok(Number(blocked.retry)>0);
  await f.restart();assert.equal((await f.api('/api/auth/register',{})).status,429);
 }finally{await f.close();}
});
test('trusted proxy isolates login failure counters and bounds authentication inputs',async()=>{
 const f=await fixture({TRUST_PROXY_LOOPBACK:'1'});try{
  const address={'X-Real-IP':'198.51.100.40'},other={'X-Real-IP':'198.51.100.41'};
  const user=await f.api('/api/auth/register',{email:'safe@example.test',password:'Security-test123'},null,address);assert.equal(user.status,200);
  for(let i=0;i<5;i++)assert.equal((await f.api('/api/auth/login',{email:'safe@example.test',password:'wrong'},null,address)).status,401);
  assert.equal((await f.api('/api/auth/login',{email:'safe@example.test',password:'Security-test123'},null,address)).status,429);
  assert.equal((await f.api('/api/auth/login',{email:'safe@example.test',password:'Security-test123'},null,other)).status,200);
  assert.equal((await f.api('/api/auth/register',{email:'invalid',password:'Security-test123'},null,other)).status,400);
  assert.equal((await f.api('/api/auth/register',{email:'long@example.test',password:'Aa1'.repeat(100)},null,other)).status,400);
 }finally{await f.close();}
});
test('Feishu state binds redirect, user, session and expiry, is consumed once, and tokens are encrypted',async()=>{
 const f=await fixture({FEISHU_APP_ID:'fixture-app',FEISHU_APP_SECRET:'fixture-secret'});let upstream=0;
 globalThis.fetch=async(url,options)=>{if(String(url).startsWith('https://open.feishu.cn/')){upstream++;return Response.json({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:7200,name:'fixture'});}return nativeFetch(url,options);};
 try{
  const auth=(await f.api('/api/auth/register',{email:'oauth@example.test',password:'Security-test123'})).data;
  const second=(await f.api('/api/auth/login',{email:'oauth@example.test',password:'Security-test123'})).data;
  const redirectUri='http://localhost/feishu/callback',urlPath='/api/feishu/oauth/url?redirectUri='+encodeURIComponent(redirectUri);
  assert.equal((await f.api('/api/feishu/oauth/url?redirectUri='+encodeURIComponent('https://evil.example/feishu/callback'),undefined,auth.token)).status,400);
  const issue=async()=>{const r=await f.api(urlPath,undefined,auth.token);assert.equal(r.status,200);return new URL(r.data.authorizeUrl).searchParams.get('state');};
  let state=await issue();const callback=(state,token=auth.token,uri=redirectUri)=>f.api('/api/feishu/oauth/callback',{code:'fixture-code',state,redirectUri:uri},token);
  assert.equal((await callback(auth.user.id+'.forged')).status,403);assert.equal((await callback(state,second.token)).status,403);assert.equal((await callback(state,auth.token,'http://localhost/other')).status,403);assert.equal(upstream,0);
  await f.app.db.prepare('UPDATE feishu_oauth_states SET expires_at=0').run();assert.equal((await callback(state)).status,403);
  state=await issue();const results=await Promise.all([callback(state),callback(state)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,403]);assert.equal(upstream,1);
  const row=await f.app.db.prepare('SELECT * FROM feishu_tokens WHERE user_id=?').bind(auth.user.id).first();assert.ok(row.access_token.startsWith('enc:v1:'));assert.ok(row.refresh_token.startsWith('enc:v1:'));assert.ok(!JSON.stringify(row).includes('fixture-access'));
  await f.app.db.prepare('UPDATE feishu_tokens SET expires_at=0 WHERE user_id=?').bind(auth.user.id).run();assert.equal((await f.api('/api/feishu/docs',undefined,auth.token)).status,200);
  const refreshed=await f.app.db.prepare('SELECT access_token FROM feishu_tokens WHERE user_id=?').bind(auth.user.id).first();assert.ok(refreshed.access_token.startsWith('enc:v1:'));assert.notEqual(refreshed.access_token,row.access_token);
  assert.equal((await f.api('/api/feishu/app-config',{appId:'user-app',appSecret:'saved-secret-value'},auth.token)).status,200);
  const appRow=await f.app.db.prepare('SELECT app_secret FROM feishu_apps WHERE user_id=?').bind(auth.user.id).first();assert.ok(appRow.app_secret.startsWith('enc:v1:'));
  state=await issue();await f.api('/api/feishu/app-config',{appId:'user-app',appSecret:'replacement-secret'},auth.token);assert.equal((await callback(state)).status,403);
  await f.restart();const config=await f.api('/api/feishu/app-config',undefined,auth.token);assert.equal(config.status,200);assert.equal(config.data.secretPreview,'****cret');
 }finally{globalThis.fetch=nativeFetch;await f.close();}
});

test('legacy credentials migrate transactionally; encrypted rows bind context and require the original key',async()=>{
 const f=await fixture();try{
  const auth=(await f.api('/api/auth/register',{email:'legacy@example.test',password:'Security-test123'})).data;
  await f.app.db.prepare('INSERT INTO feishu_apps(user_id,app_id,app_secret) VALUES(?,?,?)').bind(auth.user.id,'legacy-app','legacy-secret').run();
  await f.app.db.prepare('INSERT INTO feishu_tokens(user_id,access_token,refresh_token,expires_at) VALUES(?,?,?,?)').bind(auth.user.id,'legacy-access','legacy-refresh',Date.now()+7200000).run();
  await f.restart();const row=await f.app.db.prepare('SELECT * FROM feishu_apps WHERE user_id=?').bind(auth.user.id).first();const key=(await readFile(join(f.dir,'.credentials-key'),'utf8')).trim();const env={CREDENTIALS_ENCRYPTION_KEY:key};
  assert.equal(await decryptSecret(env,row.app_secret,`${auth.user.id}:app_secret`),'legacy-secret');
  await assert.rejects(()=>decryptSecret(env,row.app_secret,'other-user:app_secret'));
  const token=await f.app.db.prepare('SELECT access_token,refresh_token FROM feishu_tokens WHERE user_id=?').bind(auth.user.id).first();assert.equal(await decryptSecret(env,token.access_token,`${auth.user.id}:access_token`),'legacy-access');
  await f.stop();
  await assert.rejects(()=>createApplication({dataDir:f.dir,staticDir:f.dir,publicUrl:'http://localhost',config:{CREDENTIALS_ENCRYPTION_KEY:Buffer.alloc(32,1).toString('base64')}}));
  await rename(join(f.dir,'.credentials-key'),join(f.dir,'.credentials-key.saved'));
  await assert.rejects(()=>createApplication({dataDir:f.dir,staticDir:f.dir,publicUrl:'http://localhost',config:{}}),/key is missing/);
  await rename(join(f.dir,'.credentials-key.saved'),join(f.dir,'.credentials-key'));
  const restored=await createApplication({dataDir:f.dir,staticDir:f.dir,publicUrl:'http://localhost',config:{}});await restored.close();
 }finally{await f.close();}
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApplication} from '../application.mjs';
import {build} from 'esbuild';
import {resolve} from 'node:path';

test('phase-two frontend flag is forced off in production output',async()=>{
 for(const [dev,requested,expected] of [[false,'true',false],[false,'false',false],[true,'true',true],[true,'false',false]]){
  const result=await build({entryPoints:[resolve(import.meta.dirname,'../../app/src/services/releaseScope.ts')],bundle:true,write:false,format:'cjs',define:{'import.meta.env.DEV':String(dev),'import.meta.env.VITE_ENABLE_PHASE2':JSON.stringify(requested)}});
  const module={exports:{}};new Function('module','exports',result.outputFiles[0].text)(module,module.exports);
  assert.equal(module.exports.phaseTwoEnabled,expected);
  assert.equal(module.exports.accountsEnabled,dev);
 }
});

test('phase one disables phase-two API even for admin and a production enable flag',async()=>{
 for(const config of [{},{NODE_ENV:'production',ENABLE_PHASE2:'1',LOCAL_DISCOVERY_DEBUG:'1'}]){
  const dir=await mkdtemp(join(tmpdir(),'gzh-release-'));let app,server,calls=0;
  try{
   app=await createApplication({dataDir:dir,staticDir:dir,publicUrl:'http://localhost',config,redfoxFetch:async()=>{calls++;throw Error('Unexpected provider request');}});
   assert.equal(await app.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='discovery_articles'").first(),null);
   server=createServer(app.handle);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
   const base=`http://127.0.0.1:${server.address().port}`;
   const seed=await createApplication({dataDir:dir,staticDir:dir,publicUrl:'http://localhost'});
   const seedServer=createServer(seed.handle);await new Promise(resolve=>seedServer.listen(0,'127.0.0.1',resolve));
   const seedBase=`http://127.0.0.1:${seedServer.address().port}`;
   const auth=await(await fetch(seedBase+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'release@example.test',password:'Release-test123'})})).json();
   seedServer.closeAllConnections();await new Promise(resolve=>seedServer.close(resolve));await seed.close();
   await app.db.prepare("UPDATE users SET role='admin' WHERE id=?").bind(auth.user.id).run();
   for(const token of [null,auth.token]){
    for(const [path,method] of [['/api/articles','GET'],['/api/articles','POST'],['/api/articles/test','GET'],['/api/discovery/local-session','GET'],['/api/discovery/articles','GET'],['/api/discovery/sync','POST'],['/api/topics','GET'],['/api/topics','POST'],['/api/topics/test/briefs/generate','POST']]){
     const response=await fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{})},...(method==='POST'?{body:'{}'}:{})});
     assert.equal(response.status,404,`${method} ${path}`);
    }
   }
   assert.equal((await fetch(base+'/health')).status,200);
   assert.equal((await fetch(base+'/api/user/info',{headers:{Authorization:`Bearer ${auth.token}`}})).status,config.NODE_ENV==='production'?403:200);
   if(config.NODE_ENV==='production'){
    for(const path of ['/api/auth/register','/api/auth/login','/api/auth/logout','/api/auth/change-password','/api/user/presets','/api/admin/users','/api/feishu/auth','/upload']){
     assert.equal((await fetch(base+path,{method:'POST',headers:{Authorization:`Bearer ${auth.token}`},body:'{}'})).status,403,path);
    }
   }
   assert.equal(calls,0);
  }finally{if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}if(app)await app.close();await rm(dir,{recursive:true,force:true});}
 }
});

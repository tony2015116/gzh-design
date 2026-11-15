import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApplication} from '../application.mjs';

test('saved articles enforce real sessions, ownership, revision conflicts and persistent search pagination',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gzh-articles-'));let app,server,base;
 const start=async()=>{app=await createApplication({dataDir:dir,staticDir:dir,publicUrl:'http://localhost',config:{NODE_ENV:'development',ENABLE_PHASE2:'1'}});server=createServer(app.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;};
 const stop=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));await app.close();};
 const api=async(path,token,body,method=body===undefined?'GET':'POST')=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,data:await r.json()};};
 try{await start();
  const a=(await api('/api/auth/register',null,{email:'author-a@example.test',password:'Article-test123'})).data;
  const b=(await api('/api/auth/register',null,{email:'author-b@example.test',password:'Article-test123'})).data;
  assert.equal((await api('/api/articles')).status,401);
  assert.equal((await api('/api/articles',a.token,{title:' ',markdown:'test'})).status,400);
  assert.equal((await api('/api/articles',a.token,{title:'too long',markdown:'x'.repeat(1000001)})).status,413);
  const saved=await api('/api/articles',a.token,{title:'原稿',markdown:'# 正文\n\n![图片](https://example.test/image.png)'});assert.equal(saved.status,201);const article=saved.data.article;
  for(const method of ['GET','PATCH','DELETE'])assert.equal((await api('/api/articles/'+article.id,b.token,method==='GET'?undefined:{revision:1,title:'越权'},method)).status,404);
  const results=await Promise.all(['版本一','版本二'].map(title=>api('/api/articles/'+article.id,a.token,{title,revision:article.revision},'PATCH')));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal((await api('/api/articles/'+article.id,a.token,{revision:article.revision},'DELETE')).status,409);
  const current=(await api('/api/articles/'+article.id,a.token)).data.article;assert.equal(current.markdown,article.markdown);
  for(let i=0;i<32;i++)await api('/api/articles',a.token,{title:`检索 ${i}`,markdown:'完整正文'});
  const first=(await api('/api/articles?q='+encodeURIComponent('检索'),a.token)).data;assert.equal(first.total,32);assert.equal(first.items.length,30);assert.ok(first.nextCursor);assert.ok(!('markdown' in first.items[0]));
  const second=(await api('/api/articles?q='+encodeURIComponent('检索')+'&cursor='+encodeURIComponent(first.nextCursor),a.token)).data;assert.equal(second.items.length,2);assert.equal(new Set([...first.items,...second.items].map(a=>a.id)).size,32);
  assert.equal((await api('/api/articles',b.token)).data.total,0);
  await stop();await start();assert.equal((await api('/api/articles/'+article.id,a.token)).data.article.markdown,article.markdown);
  assert.equal((await api('/api/articles/'+article.id,a.token,{revision:current.revision},'DELETE')).status,200);assert.equal((await api('/api/articles/'+article.id,a.token)).status,404);
 }finally{if(server?.listening)await stop();await rm(dir,{recursive:true,force:true});}
});

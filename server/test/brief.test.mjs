import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../storage.mjs';
import {generateBrief} from '../topics/brief.mjs';
test('brief generation keeps provenance, bounds quota, preserves notes and refunds model failure',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gzh-brief-')),db=openDatabase(join(dir,'db.sqlite'));
 db.exec('CREATE TABLE topic_brief_usage(user_id TEXT,day TEXT,count INTEGER,PRIMARY KEY(user_id,day))');
 let saves=0,requests=0;
 const topics={detail:async()=>({topic:{revision:3,angle:'自己的角度',audience:'作者',notes:'不要改变我的素材'},sources:[{id:'source1',title:'参考标题',url:'https://mp.weixin.qq.com/s?__biz=test',content:'参考正文',summary:'摘要',readRaw:'10w+'}]}),saveBrief:async(id,input,user,kind,model)=>{saves++;assert.equal(input.revision,3);assert.equal(kind,'model');assert.equal(model,'test-model');assert.equal(input.snapshot.sources[0].readRaw,'10w+');return {brief:{markdown:input.markdown}};}};
 const config={OPENAI_API_KEY:'fake-test-key',OPENAI_MODEL:'test-model',BRIEF_DAILY_LIMIT:'1'};
 const fake=async(url,init)=>{requests++;assert.match(init.headers.Authorization,/fake-test-key/);const prompt=JSON.parse(init.body);assert.ok(prompt.messages[0].content.includes('不编造'));return Response.json({choices:[{message:{content:'# 原创简报\n\n这是用于验证模型响应保存流程的模拟简报。\n\n## 待核验\n\n请检查全部事实与引用。'}}]});};
 try{
  const brief=await generateBrief(db,topics,'id','user',3,config,fake);assert.match(brief.brief.markdown,/模拟简报/);assert.equal(saves,1);
  await assert.rejects(generateBrief(db,topics,'id','user',3,config,fake),e=>e.status===429);assert.equal(requests,1);
  await assert.rejects(generateBrief(db,topics,'id','user',2,config,fake),e=>e.status===409);assert.equal(requests,1);
  await assert.rejects(generateBrief(db,topics,'id','other',3,config,async()=>{throw Error('secret upstream error');}),e=>e.status===502&&!e.message.includes('secret'));
  assert.equal((await db.prepare("SELECT count FROM topic_brief_usage WHERE user_id='other'").first()).count,0);assert.equal(saves,1);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

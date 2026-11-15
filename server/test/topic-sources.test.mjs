import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../storage.mjs';
import {createTopics} from '../topics/repository.mjs';
test('removing a source checks owner/revision and preserves article, notes and saved brief',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gzh-topic-source-')),db=openDatabase(join(dir,'db.sqlite'));
 try{
  db.exec("CREATE TABLE users(id TEXT PRIMARY KEY);INSERT INTO users VALUES('owner'),('other')");db.exec(await readFile(new URL('../discovery/schema.sql',import.meta.url),'utf8'));
  for(const id of ['a','b'])await db.prepare('INSERT INTO discovery_articles VALUES(?,?,?,?,?,?,?,?)').bind(id,id,'author',null,null,'{}','now','now').run();
  const topics=createTopics(db,{article:async id=>({id,title:id})});let {topic}=await topics.create({title:'Reference management'},'owner');
  for(const articleId of ['a','b'])({topic}=await topics.attachSource(topic.id,{articleId,revision:topic.revision},'owner'));
  ({topic}=await topics.update(topic.id,{notes:'My notes',revision:topic.revision},'owner'));
  ({topic}=await topics.saveBrief(topic.id,{markdown:'# Keep the original brief',revision:topic.revision},'owner'));
  await assert.rejects(topics.removeSource(topic.id,{articleId:'a',revision:topic.revision},'other'),e=>e.status===404);
  const results=await Promise.allSettled(['a','b'].map(articleId=>topics.removeSource(topic.id,{articleId,revision:topic.revision},'owner')));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.status===409).length,1);
  const data=await topics.detail(topic.id,'owner');assert.equal(data.sources.length,1);assert.equal(data.topic.notes,'My notes');assert.equal(data.brief.markdown,'# Keep the original brief');
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM discovery_articles').first()).n,2);
  const remaining=data.sources[0].id;
  await assert.rejects(topics.removeSource(topic.id,{articleId:'missing',revision:data.topic.revision},'owner'),e=>e.status===404);
  await assert.rejects(topics.removeSource(topic.id,{articleId:remaining,revision:topic.revision},'owner'),e=>e.status===409);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

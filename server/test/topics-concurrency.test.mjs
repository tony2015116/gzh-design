import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../storage.mjs';
import {createTopics} from '../topics/repository.mjs';
test('concurrent source attachment grants exactly one revision and rejects the loser',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gzh-topics-concurrency-')),db=openDatabase(join(dir,'db.sqlite'));
 try{db.exec("CREATE TABLE users(id TEXT PRIMARY KEY);INSERT INTO users VALUES('user')");db.exec(await readFile(new URL('../discovery/schema.sql',import.meta.url),'utf8'));
  for(const id of ['a','b'])await db.prepare('INSERT INTO discovery_articles VALUES(?,?,?,?,?,?,?,?)').bind(id,id,'author',null,null,'{}','now','now').run();
  const topics=createTopics(db,{article:async id=>({id})});const {topic}=await topics.create({title:'test'},'user');
  const results=await Promise.allSettled(['a','b'].map(articleId=>topics.attachSource(topic.id,{articleId,revision:topic.revision},'user')));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.status===409).length,1);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

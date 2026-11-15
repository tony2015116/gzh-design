import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../storage.mjs';
import {createLibrary} from '../discovery/library.mjs';
import {normalizeArticle} from '../discovery/provider.mjs';
test('article contracts omit retired audience fields for new and historical data',async()=>{
 const a=normalizeArticle({photoId:'test',title:'Article',oriUrl:'https://mp.weixin.qq.com/s?__biz=test',clicksCount:'10w+',fans:123,content:'Keep content'},'科技数码');
 assert.equal('fans' in a,false);assert.equal('fans' in a.metrics,false);assert.equal('fans' in a.rawData,false);
 const dir=await mkdtemp(join(tmpdir(),'gzh-fields-')),db=openDatabase(join(dir,'db.sqlite'));let library;
 try{
  db.exec('CREATE TABLE users(id TEXT PRIMARY KEY)');db.exec(await readFile(new URL('../discovery/schema.sql',import.meta.url),'utf8'));
  const legacy={...a,fans:123,fansRaw:'123',metrics:{...a.metrics,fans:{value:123,exact:true}},rawData:{...a.rawData,fans:123}};
  await db.prepare('INSERT INTO discovery_articles VALUES(?,?,?,?,?,?,?,?)').bind(a.id,a.title,a.account,null,a.readCount,JSON.stringify(legacy),'now','now').run();library=createLibrary(db,{},()=>{throw Error('No external requests');});
  for(const record of [(await library.list(new URLSearchParams())).items[0],await library.article(a.id)]){assert.equal('fans' in record,false);assert.equal('fansRaw' in record,false);assert.equal('fans' in record.metrics,false);assert.equal(record.rawData?.fans,undefined);}
  assert.equal((await library.article(a.id)).content,'Keep content');assert.equal((await library.article(a.id)).readRaw,'10w+');
  assert.deepEqual(Object.keys((await library.status(false)).quality),['withContent']);
 }finally{if(library)await library.close();db.close();await rm(dir,{recursive:true,force:true});}
});

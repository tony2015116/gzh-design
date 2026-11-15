import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../storage.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('batch cannot swallow an unrelated write during transaction rollback',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gzh-atomic-')),db=openDatabase(join(dir,'db.sqlite'));
 try{db.exec('CREATE TABLE t(id TEXT PRIMARY KEY)');
  const batch=db.batch([db.prepare("INSERT INTO t VALUES('inside')"),db.prepare('INSERT INTO missing VALUES(1)')]);
  await db.prepare("INSERT INTO t VALUES('outside')").run();
  await assert.rejects(batch);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM t WHERE id='outside'").first()).n,1);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM t WHERE id='inside'").first()).n,0);
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

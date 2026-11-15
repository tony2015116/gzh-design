import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from '../storage.mjs';
import {createLibrary} from '../discovery/library.mjs';
const params={source:'original',category:'科技数码',startDate:'2026-11-01',endDate:'2026-11-03'};
test('coverage separates daily success, interval evidence and failures across full history; skipping costs no request',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gzh-coverage-')),db=openDatabase(join(dir,'db.sqlite'));let calls=0,library;
 try{
  db.exec('CREATE TABLE users(id TEXT PRIMARY KEY)');db.exec(await readFile(new URL('../discovery/schema.sql',import.meta.url),'utf8'));
  library=createLibrary(db,{REDFOX_API_KEY:'fixture',REDFOX_SYNC_COOLDOWN_SECONDS:'0',REDFOX_BATCH_INTERVAL_MS:'0'},async()=>{calls++;return Response.json({code:2000,data:[]});});
  await library.status(true);
  const seed=async(id,p,status,legacy=false)=>{
   await db.prepare('INSERT INTO discovery_jobs(id,status,params_json,created_at,finished_at) VALUES(?,?,?,?,?)').bind(id,status,JSON.stringify(p),'2026-11-12T12:00:00Z','2026-11-12T12:01:00Z').run();
   if(!legacy)await db.prepare('INSERT INTO discovery_job_steps(job_id,step_index,params_json,status,attempted,finished_at) VALUES(?,0,?,?,1,?)').bind(id,JSON.stringify(p),status,'2026-11-12T12:01:00Z').run();
  };
  await seed('old-single',{...params,endDate:params.startDate},'completed');
  await seed('legacy-window',params,'completed',true);
  await seed('failed',{...params,startDate:'2026-11-03'},'failed');
  await db.prepare("UPDATE discovery_job_steps SET finished_at='2026-11-12T12:02:00Z' WHERE job_id='failed'").run();
  for(let n=0;n<22;n++)await seed('other-'+n,{...params,category:'教育'},'completed');
  const data=await library.coverage(params);
  assert.deepEqual(data.days.map(d=>d.state),['daily','range','range']);
  assert.equal(data.days[2].lastAttempt.status,'failed');assert.equal(calls,0);
  assert.deepEqual((await library.coverage({...params,source:'tenw'})).days.map(d=>d.state),['missing','missing','missing']);
  await assert.rejects(library.coverage({...params,startDate:'bad'}),e=>e.status===400);
  const submitted=await library.sync({...params,mode:'daily',skipCollected:true});
  let job;for(let n=0;n<60;n++){job=(await library.status(true)).jobs.find(j=>j.id===submitted.jobId);if(job?.status==='completed')break;await new Promise(r=>setTimeout(r,10));}
  assert.equal(job.status,'completed');assert.equal(calls,2);assert.equal(job.request_budget,2);
  assert.deepEqual(job.params.skippedDates,['2026-11-01']);
  assert.deepEqual(job.steps.map(s=>s.params.startDate),['2026-11-02','2026-11-03']);
  assert.deepEqual((await library.coverage(params)).days.map(d=>d.state),['daily','daily','daily']);
  await assert.rejects(library.sync({...params,mode:'daily',skipCollected:true}),e=>e.status===409);assert.equal(calls,2);
 }finally{if(library)await library.close();db.close();await rm(dir,{recursive:true,force:true});}
});

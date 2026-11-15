import {validateSync} from './provider.mjs';

// A successful interval query is evidence of a request, never proof of daily/full coverage.
export async function readCoverage(db,input){
 const params=validateSync(input);
 const {results}=await db.prepare(`
  SELECT s.params_json,s.status,s.finished_at,s.started_at AS created_at,s.new_count,s.updated_count,s.skipped_count
  FROM discovery_job_steps s WHERE s.attempted=1
   AND json_extract(s.params_json,'$.category')=? AND json_extract(s.params_json,'$.source')=?
   AND json_extract(s.params_json,'$.startDate')<=? AND json_extract(s.params_json,'$.endDate')>=?
  UNION ALL
  SELECT j.params_json,j.status,j.finished_at,j.created_at,j.new_count,j.updated_count,j.skipped_count
  FROM discovery_jobs j WHERE j.status='completed' AND NOT EXISTS(SELECT 1 FROM discovery_job_steps s WHERE s.job_id=j.id)
   AND json_extract(j.params_json,'$.category')=? AND json_extract(j.params_json,'$.source')=?
   AND json_extract(j.params_json,'$.startDate')<=? AND json_extract(j.params_json,'$.endDate')>=?
  ORDER BY finished_at DESC,created_at DESC
 `).bind(params.category,params.source,params.endDate,params.startDate,params.category,params.source,params.endDate,params.startDate).all();
 const records=results.map(r=>({...r,params:JSON.parse(r.params_json)}));
 const count=(Date.parse(params.endDate)-Date.parse(params.startDate))/86400000+1;
 const days=Array.from({length:count},(_,i)=>{
  const date=new Date(Date.parse(params.startDate)+i*86400000).toISOString().slice(0,10);
  const matching=records.filter(r=>r.params.startDate<=date&&r.params.endDate>=date);
  const successful=matching.filter(r=>r.status==='completed');
  const daily=successful.find(r=>r.params.startDate===date&&r.params.endDate===date);
  const last=matching.sort((a,b)=>(b.finished_at||b.created_at||'').localeCompare(a.finished_at||a.created_at||''))[0];
  return {date,state:daily?'daily':successful.length?'range':'missing',lastSuccessAt:(daily||successful[0])?.finished_at??null,
   lastAttempt:last?{status:last.status,finishedAt:last.finished_at,newCount:last.new_count,updatedCount:last.updated_count,skippedCount:last.skipped_count}:null};
 });
 return {...params,days};
}

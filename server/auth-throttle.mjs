import {createHash} from 'node:crypto';
import {isIP} from 'node:net';
const LOOPBACK=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
export function trustedClientIp(req,config){
 const remote=req.socket.remoteAddress||'unknown';
 const supplied=req.headers['x-real-ip'];
 return config.TRUST_PROXY_LOOPBACK==='1'&&LOOPBACK.has(remote)&&typeof supplied==='string'&&isIP(supplied)?supplied:remote;
}
export function createAuthThrottle(db){
 db.exec('CREATE TABLE IF NOT EXISTS auth_request_limits (subject TEXT PRIMARY KEY,window_start INTEGER NOT NULL,hits INTEGER NOT NULL)');
 const policies={
  '/api/auth/register':{limit:10,seconds:3600},
  '/api/auth/login':{limit:60,seconds:600},
  '/api/auth/change-password':{limit:20,seconds:600},
 };
 return async(path,ip)=>{
  const policy=policies[path];if(!policy)return null;
  const now=Math.floor(Date.now()/1000),subject=createHash('sha256').update(path+'\0'+ip).digest('hex');
  await db.prepare('DELETE FROM auth_request_limits WHERE window_start<?').bind(now-86400).run();
  const row=await db.prepare(`INSERT INTO auth_request_limits(subject,window_start,hits) VALUES(?,?,1)
   ON CONFLICT(subject) DO UPDATE SET hits=CASE WHEN window_start<=? THEN 1 ELSE hits+1 END,
   window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING hits,window_start`)
   .bind(subject,now,now-policy.seconds,now-policy.seconds).first();
  return row.hits>policy.limit?Math.max(1,row.window_start+policy.seconds-now):null;
 };
}

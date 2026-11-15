import {randomUUID} from 'node:crypto';
import {authenticateUser} from '../dist/backend.mjs';
import {HttpError} from '../discovery/library.mjs';

export function createArticles(db,env){
 db.exec(`CREATE TABLE IF NOT EXISTS saved_articles (
  id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,markdown TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,updated_at TEXT NOT NULL
 ); CREATE INDEX IF NOT EXISTS saved_articles_owner_date ON saved_articles(user_id,updated_at DESC,id DESC);`);
 const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 const detail=async(id,owner)=>{const row=await db.prepare('SELECT * FROM saved_articles WHERE id=? AND user_id=?').bind(id,owner).first();if(!row)throw new HttpError(404,'文章不存在或已删除');return row;};
 const input=async request=>{
  const text=await request.text();if(text.length>6002000)throw new HttpError(413,'文章正文最多100万字符');
  try{const value=JSON.parse(text);if(!value||Array.isArray(value)||typeof value!=='object')throw 0;return value;}catch{throw new HttpError(400,'请求格式无效');}
 };
 const title=value=>{if(typeof value!=='string'||!value.trim()||value.trim().length>200)throw new HttpError(400,'文章标题需为1至200个字符');return value.trim();};
 const markdown=value=>{if(typeof value!=='string')throw new HttpError(400,'文章正文格式无效');if(value.length>1000000)throw new HttpError(413,'文章正文最多100万字符');return value;};
 return {async fetch(request){
  const url=new URL(request.url),path=url.pathname;
  if(path!=='/api/articles'&&!path.startsWith('/api/articles/'))return null;
  try{
   const user=await authenticateUser(request,env);if(!user)throw new HttpError(401,'请先登录后使用我的文章');
   const method=request.method;
   if(path==='/api/articles'&&method==='GET'){
    const q=(url.searchParams.get('q')||'').trim();if(q.length>200)throw new HttpError(400,'搜索词最多200字符');
    const params=[user.id,q,q],where='user_id=? AND (?=\'\' OR instr(lower(title),lower(?))>0)';
    const count=await db.prepare(`SELECT count(*) AS total FROM saved_articles WHERE ${where}`).bind(...params).first();
    let cursorWhere='';const cursor=url.searchParams.get('cursor');
    if(cursor){let value;try{value=JSON.parse(Buffer.from(cursor,'base64url').toString());}catch{throw new HttpError(400,'分页参数无效');}
     if(!Array.isArray(value)||value.length!==3||value[0]!==q||typeof value[1]!=='string'||typeof value[2]!=='string')throw new HttpError(400,'分页参数无效');
     cursorWhere=' AND (updated_at<? OR (updated_at=? AND id<?))';params.push(value[1],value[1],value[2]);
    }
    const {results}=await db.prepare(`SELECT id,title,revision,created_at,updated_at,length(markdown) AS characters FROM saved_articles WHERE ${where}${cursorWhere} ORDER BY updated_at DESC,id DESC LIMIT 31`).bind(...params).all();
    const items=results.slice(0,30),last=items.at(-1);
    return json({items,total:count.total,nextCursor:results.length>30?Buffer.from(JSON.stringify([q,last.updated_at,last.id])).toString('base64url'):null});
   }
   if(path==='/api/articles'&&method==='POST'){
    const value=await input(request),name=title(value.title),body=markdown(value.markdown),id=randomUUID(),stamp=new Date().toISOString();
    await db.prepare('INSERT INTO saved_articles(id,user_id,title,markdown,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,user.id,name,body,stamp,stamp).run();
    return json({article:await detail(id,user.id)},201);
   }
   const match=/^\/api\/articles\/([\w-]+)$/.exec(path);
   if(match){const id=match[1];const prior=await detail(id,user.id);
    if(method==='GET')return json({article:prior});
    if(method==='PATCH'||method==='DELETE'){
     const value=await input(request);if(!Number.isSafeInteger(value.revision)||value.revision<1)throw new HttpError(400,'文章版本无效');
     if(method==='DELETE'){
      const result=await db.prepare('DELETE FROM saved_articles WHERE id=? AND user_id=? AND revision=?').bind(id,user.id,value.revision).run();
      if(result.meta.changes!==1)throw new HttpError(409,'文章已在其他页面更新，请刷新后重试');return json({deleted:true});
     }
     const name=value.title===undefined?prior.title:title(value.title),body=value.markdown===undefined?prior.markdown:markdown(value.markdown);
     const row=await db.prepare('UPDATE saved_articles SET title=?,markdown=?,revision=revision+1,updated_at=? WHERE id=? AND user_id=? AND revision=? RETURNING *').bind(name,body,new Date().toISOString(),id,user.id,value.revision).first();
     if(!row)throw new HttpError(409,'文章已在其他页面更新，当前正文未丢失，请另存为新文章或重新载入');return json({article:row});
    }
   }
   throw new HttpError(404,'接口不存在');
  }catch(error){return json({error:error.status?error.message:'文章操作失败，请稍后重试'},error.status||500);}
 }};
}

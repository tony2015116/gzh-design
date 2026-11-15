import {randomUUID} from 'node:crypto';
import {HttpError} from '../discovery/library.mjs';
import {listTopics} from './list.mjs';
const now=()=>new Date().toISOString();
const clean=(x,max)=>typeof x==='string'?x.trim().slice(0,max):'';
export function createTopics(db,library){
 async function removeSource(id,input,userId){
  const prior=await detail(id,userId);
  if(!Number.isInteger(input.revision))throw new HttpError(400,'选题版本无效');
  if(prior.topic.revision!==input.revision)throw new HttpError(409,'选题版本已更新，请重新载入');
  if(!prior.sources.some(s=>s.id===input.articleId))throw new HttpError(404,'参考文章未关联到此选题');
  const writes=await db.batch([
   db.prepare('DELETE FROM topic_sources WHERE topic_id=? AND article_id=? AND EXISTS(SELECT 1 FROM topics WHERE id=? AND user_id=? AND revision=?)').bind(id,input.articleId,id,userId,input.revision),
   db.prepare('UPDATE topics SET revision=revision+1,updated_at=? WHERE id=? AND user_id=? AND revision=? AND changes()=1').bind(now(),id,userId,input.revision),
  ]);
  if(writes[1].meta.changes!==1)throw new HttpError(409,'选题版本已更新，未移除参考，请重新载入');
  return detail(id,userId);
 }
 const get=async(id,userId)=>db.prepare('SELECT * FROM topics WHERE id=? AND user_id=?').bind(id,userId).first();
 async function detail(id,userId){const topic=await get(id,userId);if(!topic)throw new HttpError(404,'选题不存在');
  const {results}=await db.prepare('SELECT article_id FROM topic_sources WHERE topic_id=?').bind(id).all();
  return {topic,sources:(await Promise.all(results.map(r=>library.article(r.article_id)))).filter(Boolean),brief:topic.current_brief?await db.prepare('SELECT id,markdown,kind,model,created_at FROM topic_briefs WHERE id=? AND topic_id=?').bind(topic.current_brief,id).first():null};
 }
 async function create(input,userId){
  if(input.articleId){const article=await library.article(String(input.articleId));if(!article)throw new HttpError(404,'文章尚未入库');
   const prior=await db.prepare('SELECT t.* FROM topics t JOIN topic_sources s ON t.id=s.topic_id WHERE t.user_id=? AND s.article_id=? ORDER BY t.created_at LIMIT 1').bind(userId,article.id).first();if(prior)return {topic:prior};
   const id=randomUUID(),stamp=now();await db.batch([
    db.prepare('INSERT INTO topics(id,user_id,title,created_at,updated_at) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM topics t JOIN topic_sources s ON s.topic_id=t.id WHERE t.user_id=? AND s.article_id=?)').bind(id,userId,article.title,stamp,stamp,userId,article.id),
    db.prepare('INSERT OR IGNORE INTO topic_sources(topic_id,article_id) SELECT id,? FROM topics WHERE id=? AND user_id=?').bind(article.id,id,userId),
   ]);return {topic:await db.prepare('SELECT t.* FROM topics t JOIN topic_sources s ON s.topic_id=t.id WHERE t.user_id=? AND s.article_id=? ORDER BY t.created_at LIMIT 1').bind(userId,article.id).first()};
  }
  const title=clean(input.title,300);if(!title)throw new HttpError(400,'请填写选题标题');const id=randomUUID(),stamp=now();await db.prepare('INSERT INTO topics(id,user_id,title,created_at,updated_at) VALUES(?,?,?,?,?)').bind(id,userId,title,stamp,stamp).run();return {topic:await get(id,userId)};
 }
 async function update(id,input,userId){const prior=await get(id,userId);if(!prior)throw new HttpError(404,'选题不存在');
  if(!Number.isInteger(input.revision))throw new HttpError(400,'选题版本无效');
  const title=input.title===undefined?prior.title:clean(input.title,300);if(!title)throw new HttpError(400,'标题不能为空');
  const status=input.status??prior.status;if(!['research','writing','imported','archived'].includes(status))throw new HttpError(400,'状态无效');
  const row=await db.prepare('UPDATE topics SET title=?,angle=?,audience=?,notes=?,status=?,revision=revision+1,updated_at=? WHERE id=? AND user_id=? AND revision=? RETURNING *').bind(title,input.angle===undefined?prior.angle:clean(input.angle,2000),input.audience===undefined?prior.audience:clean(input.audience,500),input.notes===undefined?prior.notes:clean(input.notes,15000),status,now(),id,userId,input.revision).first();
  if(!row)throw new HttpError(409,'选题已在其他页面更新，请重新载入后再保存');return {topic:row};
 }
 async function saveBrief(id,input,userId,kind='manual',model=null){await detail(id,userId);
  if(!Number.isInteger(input.revision)||!clean(input.markdown,1))throw new HttpError(400,'请填写简报内容和有效版本');
  if(input.markdown.length>40000)throw new HttpError(400,'简报最多40000字');
  const briefId=randomUUID(),stamp=now();
  await db.batch([
   db.prepare('INSERT INTO topic_briefs(id,topic_id,markdown,kind,model,input_json,created_at) SELECT ?,id,?,?,?,?,? FROM topics WHERE id=? AND user_id=? AND revision=?').bind(briefId,input.markdown,kind,model,JSON.stringify(input.snapshot??null),stamp,id,userId,input.revision),
   db.prepare('UPDATE topics SET current_brief=?,revision=revision+1,updated_at=? WHERE id=? AND user_id=? AND revision=?').bind(briefId,stamp,id,userId,input.revision),
  ]);
  const result=await detail(id,userId);if(result.topic.current_brief!==briefId)throw new HttpError(409,'选题已更新，未覆盖已有简报，请重新载入');return result;
 }
 async function attachSource(id,input,userId){const prior=await detail(id,userId);if(prior.topic.revision!==input.revision)throw new HttpError(409,'选题版本已更新，请重新载入');if(prior.sources.length>=10)throw new HttpError(400,'一个选题最多关联10篇参考');const article=await library.article(String(input.articleId));if(!article)throw new HttpError(404,'文章尚未入库');
  const writes=await db.batch([db.prepare('INSERT OR IGNORE INTO topic_sources(topic_id,article_id) SELECT id,? FROM topics WHERE id=? AND user_id=? AND revision=?').bind(article.id,id,userId,input.revision),db.prepare('UPDATE topics SET revision=revision+1,updated_at=? WHERE id=? AND user_id=? AND revision=?').bind(now(),id,userId,input.revision)]);
  if(writes[1].meta.changes!==1)throw new HttpError(409,'选题版本已更新，请重新载入');return detail(id,userId);
 }
 return {get,detail,create,update,saveBrief,attachSource,removeSource,list:(userId,query)=>listTopics(db,userId,query)};
}

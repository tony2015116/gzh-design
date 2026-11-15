import {ArrowUpRight,Trash2} from 'lucide-react';
import type {Article} from './api';
export function TopicSources({sources,busy,onView,onRemove}:{sources:Article[];busy:boolean;onView:(id:string)=>void;onRemove:(id:string)=>void}){
 return <div className="rf-source-list">{sources.map(s=><div className="rf-source-row" key={s.id}><div><button className="rf-source-title" disabled={busy} onClick={()=>onView(s.id)}>{s.title}</button><small>{s.account||'账号未提供'} · 阅读 {s.readRaw??'暂无'}</small></div><a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={'打开原文：'+s.title}>原文<ArrowUpRight size={13}/></a><button className="rf-button" disabled={busy} onClick={()=>onRemove(s.id)} aria-label={'移除参考：'+s.title}><Trash2 size={13}/><span>移除</span></button></div>)}{!sources.length&&<p className="rf-muted">还没有参考文章，可以从库里添加。自己的角度和笔记仍可独立整理。</p>}</div>;
}

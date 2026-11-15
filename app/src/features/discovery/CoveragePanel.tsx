import {useEffect,useState} from 'react';
import {api,dateText,type Coverage,type LibraryStatus} from './api';
const day=(offset:number)=>new Date(Date.now()+8*3600000+offset*86400000).toISOString().slice(0,10);
const labels={daily:'当日查询成功',range:'区间查询涉及',missing:'尚无成功记录'};
export function CoveragePanel({status}:{status:LibraryStatus}){
 const [open,setOpen]=useState(false),[category,setCategory]=useState('科技数码'),[source,setSource]=useState('original');
 const [startDate,setStartDate]=useState(()=>day(-14)),[endDate,setEndDate]=useState(()=>day(-1));
 const [result,setResult]=useState<{key:string;data?:Coverage;error?:string}|null>(null);
 const key=JSON.stringify([category,source,startDate,endDate,status.lastSuccessfulSyncAt]);
 const current=result?.key===key?result:null,data=current?.data,error=current?.error,loading=open&&!current;
 useEffect(()=>{
  if(!open)return;const controller=new AbortController();
  const query=new URLSearchParams({category,source,startDate,endDate});
  void api<Coverage>('/api/discovery/coverage?'+query,undefined,'GET',controller.signal).then(data=>{if(!controller.signal.aborted)setResult({key,data});}).catch(e=>{if(!controller.signal.aborted)setResult({key,error:e instanceof Error?e.message:'日期记录加载失败'});});
  return ()=>controller.abort();
 },[open,category,source,startDate,endDate,key,status]);
 return <section className="rf-coverage"><button className="rf-coverage-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}><strong>采集日期记录</strong><span>{open?'收起':'查看哪些日期查过、哪些还需补采'}</span></button>{open&&<div className="rf-coverage-body">
  <div className="rf-coverage-filters"><label>采集赛道<select aria-label="日期记录赛道" value={category} onChange={e=>setCategory(e.target.value)}>{status.categories.map(c=><option key={c}>{c}</option>)}</select></label><label>榜单<select aria-label="日期记录榜单" value={source} onChange={e=>setSource(e.target.value)}><option value="original">原创爆款榜</option><option value="tenw">十万阅读榜</option></select></label><label>开始日期<input aria-label="日期记录开始" type="date" value={startDate} max={endDate} onChange={e=>setStartDate(e.target.value)}/></label><label>结束日期<input aria-label="日期记录结束" type="date" value={endDate} min={startDate} max={day(0)} onChange={e=>setEndDate(e.target.value)}/></label></div>
  <p className="rf-muted">最多查看60天。查询成功只表示请求已完成，不代表收录齐全。区间涉及的日期仍可逐日补采。</p>
  {loading&&<p role="status">正在读取本地日期记录…</p>}{error&&<p role="alert" className="rf-error-text">{error}</p>}
  {data&&<><p className="rf-muted">当日查询成功 {data.days.filter(d=>d.state==='daily').length} 天 · 仅区间涉及 {data.days.filter(d=>d.state==='range').length} 天 · 尚无成功记录 {data.days.filter(d=>d.state==='missing').length} 天</p><div className="rf-coverage-grid">{data.days.map(d=><div className={'rf-coverage-day '+d.state} key={d.date} title={d.lastSuccessAt?'最近成功 '+dateText(d.lastSuccessAt):'没有成功查询记录'}><time>{d.date.slice(5)}</time><span>{labels[d.state]}</span>{d.lastAttempt&&['failed','interrupted'].includes(d.lastAttempt.status)&&<small>最近尝试未完成</small>}</div>)}</div></>}
 </div>}</section>;
}

import {useEffect,useMemo,useRef,useState} from 'react';
import {CheckCircle2,Loader2,PlugZap} from 'lucide-react';
import {testPersonalApi,type PersonalApiSettings} from '../../ai/testConnection';
import './api-connection-test.css';

type Result={config:PersonalApiSettings;kind:'testing'|'success'|'error';message:string};

export function ApiConnectionTest({apiKey,baseUrl,model}:PersonalApiSettings){
 const config=useMemo(()=>({apiKey,baseUrl,model}),[apiKey,baseUrl,model]);
 const [result,setResult]=useState<Result|null>(null);
 const pending=useRef<AbortController|null>(null);
 useEffect(()=>()=>{pending.current?.abort();pending.current=null;},[config]);
 const shown=result?.config===config?result:null,busy=shown?.kind==='testing';
 const run=async()=>{
  if(pending.current)return;
  const controller=new AbortController();pending.current=controller;
  setResult({config,kind:'testing',message:'正在测试连接…'});
  try{
   const response=await testPersonalApi(config,{signal:controller.signal});
   if(!controller.signal.aborted)setResult({config,kind:'success',message:`测试通过 · 响应耗时 ${(response.elapsedMs/1000).toFixed(2)} 秒`});
  }catch(error){
   if(!controller.signal.aborted)setResult({config,kind:'error',message:error instanceof Error?error.message:'测试失败，请检查配置后重试。'});
  }finally{if(pending.current===controller)pending.current=null;}
 };
 return <div className="api-connection-test">
  <button type="button" onClick={()=>void run()} disabled={busy||!apiKey.trim()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
   {busy?<Loader2 size={15} className="animate-spin"/>:shown?.kind==='success'?<CheckCircle2 size={15}/>:<PlugZap size={15}/>}{busy?'测试中…':'测试连接'}
  </button>
  <p className="mt-2 text-xs leading-5 text-gray-500">将发送一次简短模型请求，可能消耗少量 API 额度。无需先保存，失败也可保存设置。</p>
  {shown&&<p className={`api-connection-feedback is-${shown.kind}`} role={shown.kind==='error'?'alert':'status'} aria-live="polite">{shown.message}</p>}
 </div>;
}

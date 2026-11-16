import {ChatCompletionError,ossChatCompletion,resolveChatEndpoint} from './chatCompletion';

export interface PersonalApiSettings {apiKey:string;baseUrl:string;model:string}
export interface ConnectionTestOptions {signal?:AbortSignal;timeoutMs?:number}

export async function testPersonalApi(settings:PersonalApiSettings,options:ConnectionTestOptions={}){
 const apiKey=settings.apiKey.trim(),model=settings.model.trim()||'gpt-4o';
 if(!apiKey)throw new Error('请先填写 API Key。');
 let endpoint:URL;
 try{endpoint=new URL(resolveChatEndpoint(settings.baseUrl.trim()));}catch{throw new Error('接口地址无效，请填写完整的 HTTP 或 HTTPS 地址。');}
 if(!['http:','https:'].includes(endpoint.protocol)||endpoint.username||endpoint.password)throw new Error('接口地址需使用 HTTP 或 HTTPS，且不能包含账号密码。');
 if(typeof location!=='undefined'&&location.protocol==='https:'&&endpoint.protocol!=='https:')throw new Error('当前网站使用 HTTPS，请填写 HTTPS 接口地址。');
 if(options.signal?.aborted)throw new Error('测试已取消。');
 const controller=new AbortController();let timedOut=false;
 const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});
 const timeoutMs=options.timeoutMs??15000;
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 const started=performance.now();
 try{
  const content=await ossChatCompletion({endpoint:endpoint.href,apiKey,model,systemPrompt:'This is a connection test. Reply with OK only.',userContent:'Reply with OK only.',temperature:0,signal:controller.signal});
  if(controller.signal.aborted)throw new Error('Request aborted');
  if(typeof content!=='string'||!content.trim())throw new Error('Empty completion');
  return {model,elapsedMs:Math.round(performance.now()-started)};
 }catch(error){
  if(controller.signal.aborted)throw new Error(timedOut?`测试超时（${Math.ceil(timeoutMs/1000)}秒），请检查服务商响应速度或稍后重试。`:'测试已取消。');
  if(error instanceof ChatCompletionError){
   const status=error.status;
   if(status===401)throw new Error('密钥验证失败（HTTP 401），请检查 API Key 是否有效。');
   if(status===403)throw new Error('请求被拒绝（HTTP 403），请检查账号权限、余额或模型访问权限。');
   if(status===404)throw new Error('接口或模型不存在（HTTP 404），请检查接口地址和模型名称。');
   if(status===429)throw new Error('请求过于频繁或额度不足（HTTP 429），请检查服务商额度后重试。');
   if(status>=500)throw new Error(`服务商暂时异常（HTTP ${status}），请稍后重试。`);
   throw new Error(`服务商不接受当前请求（HTTP ${status}），请检查模型与接口兼容性。`);
  }
  if(error instanceof TypeError)throw new Error('无法连接服务商，请检查网络、接口地址或浏览器跨域设置。');
  // Do not expose a provider response, reflected key or arbitrary upstream error.
  throw new Error('接口未返回有效的模型内容，请检查接口地址和模型名称。');
 }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}

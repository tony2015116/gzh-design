import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const bundled=await build({entryPoints:[resolve(import.meta.dirname,'../../app/src/ai/testConnection.ts')],bundle:true,write:false,format:'esm',platform:'browser',define:{'import.meta.env.DEV':'false'}});
const dir=await mkdtemp(resolve(tmpdir(),'gzh-api-test-'));let testPersonalApi;
try{const file=resolve(dir,'test.mjs');await writeFile(file,bundled.outputFiles[0].text);({testPersonalApi}=await import(pathToFileURL(file).href));}finally{await rm(dir,{recursive:true,force:true});}
const config={apiKey:'private-test-only-key',baseUrl:'https://model.example.test',model:'custom-model'};
const success=()=>Response.json({choices:[{message:{content:'OK'}}]});

test('connection test uses unsaved configuration and an actual short model completion',async()=>{
 const original=globalThis.fetch;let requests=0;
 try{
  globalThis.fetch=async(url,options)=>{requests++;assert.equal(url,'https://model.example.test/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer '+config.apiKey);const body=JSON.parse(options.body);assert.equal(body.model,config.model);assert.ok(body.messages.every(message=>message.content.length<100));assert.ok(options.signal);return success();};
  const result=await testPersonalApi({...config,apiKey:' '+config.apiKey+' '});assert.equal(result.model,config.model);assert.ok(result.elapsedMs>=0);assert.equal(requests,1);assert.ok(!JSON.stringify(result).includes(config.apiKey));
 }finally{globalThis.fetch=original;}
});

test('connection test reports safe HTTP failures and never leaks upstream content or keys',async()=>{
 const original=globalThis.fetch;
 try{
  for(const [status,message] of [[401,/密钥/],[403,/权限/],[404,/地址|模型/],[429,/额度|频繁/],[500,/服务商/]]){
   globalThis.fetch=async()=>Response.json({error:{message:config.apiKey+' provider echoed secret'}},{status});
   await assert.rejects(testPersonalApi(config),error=>message.test(error.message)&&!error.message.includes(config.apiKey)&&!error.message.includes('provider echoed'));
  }
  globalThis.fetch=async()=>new Response('<html>'+config.apiKey+'</html>',{headers:{'Content-Type':'text/html'}});
  await assert.rejects(testPersonalApi(config),error=>/有效|内容|地址/.test(error.message)&&!error.message.includes(config.apiKey));
  globalThis.fetch=async()=>Response.json({choices:[]});await assert.rejects(testPersonalApi(config),/内容|空/);
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch '+config.apiKey);};await assert.rejects(testPersonalApi(config),error=>/网络|跨域/.test(error.message)&&!error.message.includes(config.apiKey));
 }finally{globalThis.fetch=original;}
});

test('connection test validates settings, supports SSE, timeout and cancellation',async()=>{
 const original=globalThis.fetch;
 try{
  let requests=0;globalThis.fetch=async()=>{requests++;return success();};
  await assert.rejects(testPersonalApi({...config,apiKey:' '}),/API Key/);
  await assert.rejects(testPersonalApi({...config,baseUrl:'file:///private'}),/HTTP|地址/);assert.equal(requests,0);
  globalThis.fetch=async()=>new Response('data: {"choices":[{"delta":{"content":"OK"}}]}\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
  assert.equal((await testPersonalApi(config)).model,config.model);
  globalThis.fetch=async(_,options)=>new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
  await assert.rejects(testPersonalApi(config,{timeoutMs:20}),/超时/);
  const controller=new AbortController();const pending=testPersonalApi(config,{signal:controller.signal});controller.abort();await assert.rejects(pending,/取消/);
 }finally{globalThis.fetch=original;}
});

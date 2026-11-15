import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'../..');
const bundled=await build({stdin:{contents:`export {getAITypesetMarkdown} from './app/src/ai/formatter';
export {generateCoverCopy} from './app/src/ai/coverCopy';
export {generateXhsCards} from './app/src/ai/xhsCards';
export {getAiTypesetAccess,getIllustrationAccess} from './app/src/services/accessControl';`,resolveDir:root,loader:'ts'},
 bundle:true,write:false,format:'esm',platform:'browser',jsx:'automatic',
 define:{'import.meta.env':JSON.stringify({DEV:false,VITE_APP_MODE:'online',VITE_AUTH_MODE:'real',VITE_ACCESS_MODE:'real',VITE_API_SAME_ORIGIN:'true'})}});
const bundleDir=await mkdtemp(resolve(tmpdir(),'gzh-personal-ai-'));
let ai;
try{const file=resolve(bundleDir,'client.mjs');await writeFile(file,bundled.outputFiles[0].text);ai=await import(pathToFileURL(file).href);}finally{await rm(bundleDir,{recursive:true,force:true});}
globalThis.window={location:{origin:'https://site.example.test'}};
const values=new Map();
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
const endpoint='https://personal-model.example.test/v1/chat/completions';
function setup(role){
 values.clear();values.set('openai_api_key','personal-test-key');values.set('openai_api_base','https://personal-model.example.test');values.set('openai_model','personal-model');
 if(role){values.set('auth_token','site-session-not-model-key');values.set('auth_user',JSON.stringify({id:'test-'+role,email:role+'@example.test',role}));}
}

test('production personal AI works for guest, free and VIP without using platform credentials',async()=>{
 const originalFetch=globalThis.fetch;
 try{
  for(const role of [null,'free','vip']){
   setup(role);const requests=[];
   globalThis.fetch=async(url,options)=>{
    assert.equal(url,endpoint);assert.equal(options.headers.Authorization,'Bearer personal-test-key');
    const body=JSON.parse(options.body);assert.equal(body.model,'personal-model');requests.push(body);
    return new Response(JSON.stringify({choices:[{message:{content:'# Personal result'}}]}),{headers:{'Content-Type':'application/json'}});
   };
   assert.equal(ai.getAiTypesetAccess(role?{id:'u',role}:null).allowed,true);
   assert.equal(ai.getIllustrationAccess(role?{id:'u',role}:null).allowed,true);
   assert.equal(await ai.getAITypesetMarkdown('personal-test-key','# Article','https://personal-model.example.test','personal-model'),'# Personal result');
   assert.equal(requests.length,1);
  }
 }finally{globalThis.fetch=originalFetch;}
});

test('production cover and card tools use the same personal endpoint',async()=>{
 setup(null);const originalFetch=globalThis.fetch;const seen=[];
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(url,endpoint);assert.equal(options.headers.Authorization,'Bearer personal-test-key');seen.push(url);throw new Error('personal endpoint reached');};
  await assert.rejects(ai.generateCoverCopy('# Article'),/personal endpoint reached/);
  await assert.rejects(ai.generateXhsCards('# Article'),/personal endpoint reached/);
  assert.equal(seen.length,2);
 }finally{globalThis.fetch=originalFetch;}
});

test('missing or failing personal key never falls back to platform API',async()=>{
 setup('vip');const originalFetch=globalThis.fetch;let requests=0;
 try{
  globalThis.fetch=async(url)=>{assert.equal(url,endpoint);requests++;return new Response(JSON.stringify({error:'personal provider rejected request'}),{status:401});};
  await assert.rejects(ai.getAITypesetMarkdown('','# Article'),/API Key/);
  values.delete('openai_api_key');
  await assert.rejects(ai.generateCoverCopy('# Article'),/API Key/);
  await assert.rejects(ai.generateXhsCards('# Article'),/API Key/);
  assert.equal(requests,0);
  await assert.rejects(ai.getAITypesetMarkdown('bad-key','# Article','https://personal-model.example.test'),/personal provider rejected/);
  assert.equal(requests,1);
 }finally{globalThis.fetch=originalFetch;}
});

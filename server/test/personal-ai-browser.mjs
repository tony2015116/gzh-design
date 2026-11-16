import {createServer} from 'node:http';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createApplication} from '../application.mjs';

const root=resolve(import.meta.dirname,'../..');
const dir=await mkdtemp(join(tmpdir(),'gzh-personal-ai-ui-'));
const out=join(root,'output/personal-ai');
let app,server,browser;
const errors=[],requests=[],platformRequests=[];
try{
 await mkdir(out,{recursive:true});
 server=createServer((req,res)=>app.handle(req,res));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 app=await createApplication({dataDir:join(dir,'data'),staticDir:join(root,'app/dist'),publicUrl:base,config:{NODE_ENV:'production'}});
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const role of ['guest','free','vip']){
  const context=await browser.createBrowserContext();
  try{
   let auth;
   if(role!=='guest'){
    // Historical browser identity must not enable accounts in a public build.
    auth={token:'old-test-token',user:{id:'old-'+role,email:role+'@personal-ai.example.test',role}};
   }
   const page=await context.newPage();page.setDefaultTimeout(15000);
   await page.setViewport({width:1440,height:1000});
   page.on('pageerror',error=>errors.push(error.message));
   await page.setRequestInterception(true);
   page.on('request',request=>{
    const url=request.url();
    if(url.startsWith('https://personal-model.example.test/')){
     if(request.method()==='OPTIONS'){void request.respond({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, content-type'}});return;}
     const body=JSON.parse(request.postData());
     requests.push({role,url,authorization:request.headers().authorization,model:body.model});
     void request.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({choices:[{message:{content:body.messages.find(message=>message.role==='user').content}}]})});
    }else{
     if(url.startsWith(base+'/api/format')||url.startsWith(base+'/api/cover-copy')||url.startsWith(base+'/api/xhs-cards'))platformRequests.push(url);
     if(url.startsWith(base)||url.startsWith('data:'))void request.continue();else void request.abort();
    }
   });
   await page.goto(base,{waitUntil:'networkidle0'});
   if(auth){await page.evaluate(auth=>{localStorage.setItem('auth_token',auth.token);localStorage.setItem('auth_user',JSON.stringify(auth.user));},auth);await page.reload({waitUntil:'networkidle0'});}
   const click=async text=>page.evaluate(text=>{const button=[...document.querySelectorAll('button')].find(element=>element.textContent.trim()===text);if(!button)throw new Error('Missing button: '+text);button.click();},text);
   const fill=async(selector,value)=>page.$eval(selector,(input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
   await click('AI 工具');await click('AI 一键排版');
   await page.waitForSelector('#personal-ai-key');assert.equal(new URL(page.url()).pathname,'/');
   await fill('#personal-ai-key','personal-browser-test-key');
   await fill('#personal-ai-base','https://personal-model.example.test');
   await fill('#personal-ai-model','my-personal-model');
   if(role==='guest')await page.screenshot({path:join(out,'settings-guest-desktop.png')});
   await click('保存设置');await page.reload({waitUntil:'networkidle0'});
   await click('工作台设置');await page.waitForSelector('#personal-ai-key');
   assert.equal(await page.$eval('#personal-ai-key',input=>input.value),'personal-browser-test-key');
   assert.equal(await page.$eval('#personal-ai-base',input=>input.value),'https://personal-model.example.test');
   if(role==='vip'){
    await page.setViewport({width:390,height:1000});
    await click('暗黑');
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('[aria-labelledby="workbench-settings-title"]')).backgroundColor==='rgb(25, 39, 31)');
    await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,300)));
    await page.screenshot({path:join(out,'settings-vip-mobile.png')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.setViewport({width:1440,height:1000});
   }
   await click('保存设置');await click('AI 工具');await click('AI 一键排版');await click('开始排版');
   await page.waitForFunction(()=>document.body.textContent.includes('确认 AI 排版结果'));
   assert.equal(new URL(page.url()).pathname,'/');
  }finally{await context.close();}
 }
 assert.equal(requests.length,3);
 for(const request of requests){assert.equal(request.url,'https://personal-model.example.test/v1/chat/completions');assert.equal(request.authorization,'Bearer personal-browser-test-key');assert.equal(request.model,'my-personal-model');}
 assert.deepEqual(platformRequests,[]);assert.deepEqual(errors,[]);
 const report={roles:['guest','free','vip'],productionBuild:true,settingsVisible:true,settingsPersisted:true,guestNotRedirected:true,personalRequests:requests.length,platformRequests:platformRequests.length,pageErrors:errors,paidRequests:0,temporaryDatabase:true};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{
 if(browser)await browser.close();
 if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 if(app)await app.close();
 await rm(dir,{recursive:true,force:true});
}

import {createServer} from 'node:http';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createApplication} from '../application.mjs';

const root=resolve(import.meta.dirname,'../..'),out=join(root,'output/api-connection');
const dir=await mkdtemp(join(tmpdir(),'gzh-api-connection-ui-'));
let app,server,browser,page,mode='success',phase='start';
const requests=[],errors=[];
try{
 await mkdir(out,{recursive:true});server=createServer((request,response)=>app.handle(request,response));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 app=await createApplication({dataDir:dir,staticDir:join(root,'app/dist'),publicUrl:base,config:{NODE_ENV:'production'}});
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 page=await browser.newPage();page.setDefaultTimeout(20000);await page.setViewport({width:1440,height:1100});page.on('pageerror',error=>errors.push(error.message));
 await page.setRequestInterception(true);
 page.on('request',request=>{void(async()=>{
  if(!request.url().startsWith('https://test-model.example.test/')){await request.continue();return;}
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
  if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
  requests.push({authorization:request.headers().authorization,body:JSON.parse(request.postData())});
  if(mode==='hold')return;
  await new Promise(resolve=>setTimeout(resolve,250));
  await request.respond({status:mode==='error'?401:200,contentType:'application/json',headers,body:JSON.stringify(mode==='error'?{error:{message:'unsaved-private-key echoed by provider'}}:{choices:[{message:{content:'OK'}}]})});
 })().catch(error=>errors.push('interception: '+error.message));});
 await page.goto(base+'/?settings=1',{waitUntil:'networkidle0'});await page.waitForSelector('#personal-ai-key');
 const click=async text=>page.evaluate(text=>{const button=[...document.querySelectorAll('button')].find(element=>element.textContent.trim()===text);if(!button)throw Error('Missing '+text);button.click();},text);
 const fill=async(selector,value)=>page.$eval(selector,(element,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const text=()=>page.$eval('.api-connection-test',element=>element.textContent);
 phase='unsaved config';assert.equal(await page.$eval('.api-connection-test button',button=>button.disabled),true);
 await fill('#personal-ai-key','saved-old-key');await fill('#personal-ai-base','https://test-model.example.test');await fill('#personal-ai-model','saved-model');await click('保存设置');
 await click('工作台设置');await fill('#personal-ai-key','unsaved-private-key');await fill('#personal-ai-model','unsaved-model');
 await click('测试连接');assert.equal(await page.$eval('.api-connection-test button',button=>button.disabled),true);await page.$eval('.api-connection-test button',button=>button.click());
 await page.waitForFunction(()=>document.querySelector('.api-connection-feedback')?.textContent.includes('测试通过'));
 assert.equal(requests.length,1);assert.equal(requests[0].authorization,'Bearer unsaved-private-key');assert.equal(requests[0].body.model,'unsaved-model');
 assert.equal(await page.evaluate(()=>localStorage.getItem('openai_api_key')),'saved-old-key');assert.match(await text(),/耗时/);
 await page.screenshot({path:join(out,'test-success-desktop.png')});
 phase='failure and save';mode='error';await click('测试连接');await page.waitForFunction(()=>document.querySelector('.api-connection-feedback')?.textContent.includes('401'));
 assert.ok(!(await text()).includes('unsaved-private-key'));assert.ok(!(await text()).includes('echoed by provider'));
 await click('保存设置');assert.equal(await page.evaluate(()=>localStorage.getItem('openai_api_key')),'unsaved-private-key');
 phase='changed settings cancel';await click('工作台设置');mode='hold';const before=requests.length;const changingRequest=page.waitForRequest(request=>request.method()==='POST'&&request.url().startsWith('https://test-model.example.test/'));await click('测试连接');await changingRequest;await page.waitForFunction(()=>document.querySelector('.api-connection-feedback')?.textContent.includes('正在测试'));
 await fill('#personal-ai-model','changed-model');await page.waitForFunction(()=>!document.querySelector('.api-connection-feedback'));
 mode='success';await click('测试连接');await page.waitForFunction(()=>document.querySelector('.api-connection-feedback')?.textContent.includes('测试通过'));assert.equal(requests.length,before+2);assert.equal(requests.at(-1).body.model,'changed-model');
 phase='close cancels';mode='hold';const closingRequest=page.waitForRequest(request=>request.method()==='POST'&&request.url().startsWith('https://test-model.example.test/'));await click('测试连接');await closingRequest;await page.waitForFunction(()=>document.querySelector('.api-connection-feedback')?.textContent.includes('正在测试'));await page.click('[aria-label="关闭工作台设置"]');await click('工作台设置');assert.equal(await page.$('.api-connection-feedback'),null);
 phase='timeout';await click('测试连接');await page.waitForFunction(()=>document.querySelector('.api-connection-feedback')?.textContent.includes('超时'),{timeout:22000});
 await click('暗黑');await page.setViewport({width:390,height:1100});await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,350)));await page.screenshot({path:join(out,'test-timeout-mobile-dark.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('auth_token')),null);assert.deepEqual(errors,[]);
 const report={productionBuild:true,guestCanTest:true,unsavedConfigurationUsed:true,noImplicitSave:true,duplicateRequestsBlocked:true,httpErrorRedacted:true,failedConfigCanSave:true,configChangeCancels:true,closeCancels:true,timeout15Seconds:true,mobileDark:true,pageErrors:errors,paidRequests:0,temporaryDatabase:true};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){console.error('FAILED PHASE',phase,error);if(page)await page.screenshot({path:join(out,'failure.png')});throw error;}finally{if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}if(app)await app.close();await rm(dir,{recursive:true,force:true});}

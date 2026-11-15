// Browser QA on a disposable real-library copy. No credentials or paid requests.
import {createServer} from 'node:http';
import {mkdtemp,copyFile,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createApplication} from '../application.mjs';
import {createPhaseTwoFrontend} from './phase-two-frontend.mjs';
const root=resolve(import.meta.dirname,'../..'),out=join(root,'output/local-discovery');
const dir=await mkdtemp(join(tmpdir(),'gzh-local-browser-'));let frontend,app,browser,server,calls=0;const errors=[];
try{
 await mkdir(out,{recursive:true});await copyFile(join(root,'server/data/gzh.sqlite'),join(dir,'gzh.sqlite'));
 frontend=await createPhaseTwoFrontend(root);server=createServer((req,res)=>frontend.handle(req,res,app));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 app=await createApplication({dataDir:dir,staticDir:join(root,'app/dist'),publicUrl:base,config:{ENABLE_PHASE2:'1',NODE_ENV:'development',LOCAL_DISCOVERY_DEBUG:'1'},redfoxFetch:async()=>{calls++;throw Error('Provider disabled');}});
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1500,height:1100});await page.goto(base+'/',{waitUntil:'networkidle0'});
 await page.click('button[aria-label="工作台设置"]');await page.waitForSelector('select[aria-label="调试身份"]');
 await page.select('select[aria-label="调试身份"]','vip');
 await page.click('button[aria-label="关闭工作台设置"]');
 await page.goto(base+'/discovery',{waitUntil:'networkidle0'});
 await page.waitForSelector('.rf-article');
 assert.equal(await page.evaluate(()=>localStorage.getItem('auth_token')),null);
 assert.match(await page.$eval('main',e=>e.textContent),/本地免登录调测/);
 await page.click('button[aria-label="工作台设置"]');await page.waitForSelector('select[aria-label="调试身份"]');
 assert.equal(await page.$eval('select[aria-label="调试身份"]',e=>e.value),'vip');
 await page.select('select[aria-label="调试身份"]','guest');
 await page.waitForFunction(()=>document.querySelectorAll('.rf-article').length===0&&document.body.textContent.includes('登录，打开你的创作资料库'));
 await page.select('select[aria-label="调试身份"]','admin');await page.waitForSelector('.rf-article');
 await page.screenshot({path:join(out,'identity-settings.png')});
 await page.select('select[aria-label="调试身份"]','vip');await page.waitForSelector('.rf-article');
 await page.click('dialog[open] button[aria-label="关闭"]');
 await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.rf-article');
 await page.screenshot({path:join(out,'discovery-desktop.png')});
 await page.click('.rf-title');await page.waitForSelector('dialog[open] .rf-original');
 const collect=await page.$$('dialog button');for(const b of collect){if((await b.evaluate(e=>e.textContent)).includes('收藏为选题')){await b.click();break;}}
 await page.waitForFunction(()=>document.body.textContent.includes('已加入我的选题'));
 await page.goto(base+'/topics',{waitUntil:'networkidle0'});await page.waitForSelector('.rf-topic-card');await page.click('.rf-topic-card');await page.waitForSelector('.rf-brief-editor');
 await page.$eval('.rf-sources',e=>e.scrollIntoView({block:'center'}));await page.screenshot({path:join(out,'topic-sources-desktop.png')});
 await page.setViewport({width:390,height:1000});await page.$eval('.rf-sources',e=>e.scrollIntoView({block:'center'}));await page.screenshot({path:join(out,'topic-sources-mobile.png')});
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('dialog[open]')].some(e=>e.scrollWidth>e.clientWidth)),false);
 await page.setViewport({width:1500,height:1100});
 await page.$eval('dialog textarea[maxlength="15000"]',e=>{const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(e,'本地免登录保存测试');e.dispatchEvent(new Event('input',{bubbles:true}));});
 const buttons=await page.$$('dialog button');for(const b of buttons){if((await b.evaluate(e=>e.textContent)).includes('保存选题与简报')){ // Add a brief before saving.
   await page.$eval('.rf-brief-editor',e=>{const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(e,'# 本地调测简报');e.dispatchEvent(new Event('input',{bubbles:true}));});await b.click();break;
 }}
 await page.waitForFunction(()=>document.body.textContent.includes('选题和简报已保存'));
 await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.rf-brief-editor');
 assert.equal(await page.$eval('dialog textarea[maxlength="15000"]',e=>e.value),'本地免登录保存测试');
 await page.goto(base+'/discovery',{waitUntil:'networkidle0'});await page.waitForSelector('.rf-article');await page.setViewport({width:390,height:1000});
 await page.screenshot({path:join(out,'discovery-mobile.png')});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);assert.deepEqual(errors,[]);assert.equal(calls,0);
 const report={noLogin:true,sharedIdentitySettings:true,guestBlocked:true,adminAndVipBrowse:true,persistedTopic:true,providerRequests:calls,browserErrors:errors,mobileOverflow:overflow,disposableDatabase:true};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(frontend)await frontend.close();if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));if(app)await app.close();await rm(dir,{recursive:true,force:true});}

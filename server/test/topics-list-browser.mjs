import {createServer} from 'node:http';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createApplication} from '../application.mjs';
const root=resolve(import.meta.dirname,'../..'),out=join(root,'output/topics-list'),dir=await mkdtemp(join(tmpdir(),'gzh-list-browser-'));
let app,server,browser,calls=0;const errors=[];
try{
 await mkdir(out,{recursive:true});server=createServer((req,res)=>app.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 app=await createApplication({dataDir:dir,staticDir:join(root,'app/dist'),publicUrl:base,config:{NODE_ENV:'development',LOCAL_DISCOVERY_DEBUG:'1'},redfoxFetch:async()=>{calls++;throw Error('No provider');}});
 const identity=await(await fetch(base+'/api/discovery/local-session',{headers:{'X-Local-Discovery-Role':'vip'}})).json();
 await app.db.batch(Array.from({length:211},(_,i)=>app.db.prepare('INSERT INTO topics(id,user_id,title,notes,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(String(i).padStart(3,'0'),identity.user.id,i===0?'[本地测试] 最早存档选题':'[本地测试] 日常选题 '+i,'仅用于本地验收',i%2?'writing':'research','2026-11-01','2026-11-01')));
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(()=>localStorage.setItem('dev_identity_role','vip'));
 await page.setViewport({width:1500,height:1100});await page.goto(base+'/topics',{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.querySelectorAll('.rf-topic-card').length===30);
 const click=async text=>{for(const b of await page.$$('button'))if((await b.evaluate(e=>e.textContent)).includes(text)){await b.click();return;}throw Error('Missing button '+text);};
 const fill=async value=>page.$eval('input[aria-label="搜索我的选题"]',(e,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await click('加载更多选题');await page.waitForFunction(()=>document.querySelectorAll('.rf-topic-card').length===60);
 assert.equal(await page.$$eval('.rf-topic-card',es=>new Set(es.map(e=>e.getAttribute('href'))).size),60);
 await fill('最早存档');await page.waitForFunction(()=>document.querySelectorAll('.rf-topic-card').length===1);assert.match(await page.$eval('.rf-topic-card',e=>e.textContent),/最早存档/);
 await click('待写');await page.waitForFunction(()=>document.body.textContent.includes('当前条件下没有选题'));
 await click('全部选题');await page.waitForSelector('.rf-topic-card');await fill('');await page.waitForFunction(()=>document.querySelectorAll('.rf-topic-card').length===30);
 await page.screenshot({path:join(out,'topics-desktop.png')});
 await page.setViewport({width:390,height:1000});await page.screenshot({path:join(out,'topics-mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 // Force an earlier search to arrive after a newer one.
 await page.setRequestInterception(true);let delayed;
 page.on('request',r=>{if(r.url().includes('q=late-old')){delayed=new Promise(resolve=>setTimeout(()=>{void r.continue();resolve();},600));}else void r.continue();});
 await fill('late-old');await page.waitForRequest(r=>r.url().includes('q=late-old'));await fill('最早存档');await page.waitForFunction(()=>document.querySelectorAll('.rf-topic-card').length===1);
 await delayed;await new Promise(r=>setTimeout(r,300));assert.match(await page.$eval('.rf-topic-card',e=>e.textContent),/最早存档/);
 page.removeAllListeners('request');let failNext=true;
 page.on('request',r=>{if(failNext&&r.url().includes('/api/topics?')){failNext=false;void r.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'本地模拟读取失败'})});}else void r.continue();});
 await fill('retry-probe');await page.waitForFunction(()=>document.body.textContent.includes('选题读取失败'));
 await click('刷新本地库');await page.waitForFunction(()=>document.body.textContent.includes('当前条件下没有选题'));
 assert.deepEqual(errors,[]);assert.equal(calls,0);
 const report={fixtureTopics:211,pageSize:30,loadMore:60,oldTopicSearch:true,statusFilter:true,staleResponseIgnored:true,failedReadRetry:true,pageErrors:errors,providerRequests:calls,mobileOverflow:false};await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));if(app)await app.close();await rm(dir,{recursive:true,force:true});}

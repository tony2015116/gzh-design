// Read-only acceptance against the user's running OSS Vite server.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import puppeteer from 'puppeteer-core';
const base=process.env.VITE_QA_URL||'http://127.0.0.1:5173';
const out=resolve(import.meta.dirname,'../../output/vite-discovery');await mkdir(out,{recursive:true});
let browser;const errors=[];let paid=0;
try{
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);page.on('request',r=>{if(/redfox\.hk|\/briefs\/generate|\/discovery\/sync/.test(r.url())){paid++;void r.abort();}else void r.continue();});
 await page.setViewport({width:1500,height:1100});await page.goto(base+'/discovery',{waitUntil:'networkidle0'});
 await page.waitForSelector('.rf-article');
 assert.equal(await page.evaluate(()=>localStorage.getItem('auth_token')),null);
 // A legacy remote upload backend must not divert local discovery requests.
 await page.evaluate(()=>localStorage.setItem('r2_upload_config',JSON.stringify({workerUrl:'https://old-worker.invalid',uploadSecret:''})));
 await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.rf-article');
 await page.click('button[aria-label="工作台设置"]');await page.waitForSelector('select[aria-label="调试身份"]');
 await page.select('select[aria-label="调试身份"]','guest');await page.waitForFunction(()=>!document.querySelector('.rf-article'));
 await page.select('select[aria-label="调试身份"]','vip');await page.waitForSelector('.rf-article');
 await page.select('select[aria-label="调试身份"]','admin');await page.waitForFunction(()=>document.body.textContent.includes('本地调测 · admin'));await page.waitForSelector('.rf-article');
 await page.screenshot({path:resolve(out,'settings.png')});
 await page.click('dialog[open] button[aria-label="关闭"]');await page.screenshot({path:resolve(out,'discovery.png')});
 assert.equal(await page.$('input[aria-label="低粉高阅读筛选"]'),null);
 assert.equal(await page.evaluate(()=>/粉丝|低粉/.test(document.querySelector('main').textContent)),false);
 await page.click('.rf-coverage-toggle');await page.waitForSelector('.rf-coverage-day');
 assert.ok((await page.$$('.rf-coverage-day.range')).length>0);
 await page.$eval('.rf-coverage',e=>e.scrollIntoView({block:'start'}));
 await page.screenshot({path:resolve(out,'coverage-desktop.png')});
 await page.setViewport({width:390,height:1000});await page.$eval('.rf-coverage',e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:resolve(out,'coverage-mobile.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewport({width:1500,height:1100});
 await page.click('.rf-title');await page.waitForSelector('dialog[open] .rf-original');
 assert.ok((await page.$eval('.rf-original',e=>e.textContent)).length>100);
 assert.deepEqual(errors,[]);assert.equal(paid,0);
 await page.goto(base+'/api/discovery/local-session',{waitUntil:'networkidle0'});
 const report={entry:'existing OSS npm run dev',base,noLogin:true,guestVipAdminSwitch:true,legacyRemoteConfigIgnored:true,coverageVisible:true,detailOpened:true,pageErrors:errors,paidRequests:paid};
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();}

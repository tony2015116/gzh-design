import {createServer} from 'node:http';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createApplication} from '../application.mjs';
const root=resolve(import.meta.dirname,'../..'),out=join(root,'output/local-import'),dir=await mkdtemp(join(tmpdir(),'gzh-import-ui-'));
let app,server,browser;const errors=[],nativeDialogs=[];
try{
 await mkdir(out,{recursive:true});const file=join(dir,'本地文章.md');await writeFile(file,'# 导入的新文章\n\n这是文件里的正文。');
 server=createServer((req,res)=>app.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;app=await createApplication({dataDir:join(dir,'data'),staticDir:join(root,'app/dist'),publicUrl:base,config:{}});
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,protocolTimeout:20000});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{nativeDialogs.push(d.message());await d.dismiss();});await page.setViewport({width:1440,height:1000});
 await page.goto(base+'/login',{waitUntil:'domcontentloaded'});await page.evaluate(()=>localStorage.setItem('gzh_editor_draft','# 原有正文'));await page.goto(base+'/',{waitUntil:'networkidle0'});await page.waitForSelector('textarea[aria-label="Markdown 正文"]');
 const value=()=>page.$eval('textarea[aria-label="Markdown 正文"]',e=>e.value);
 const click=async text=>page.evaluate(text=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===text);if(!e)throw Error('Missing button '+text);e.click();},text);
 const upload=async()=>{const input=await page.$('input[type="file"][accept*=".md"]');await input.uploadFile(file);await page.waitForSelector('dialog[open].import-article-modal');};
 await upload();assert.equal(await value(),'# 原有正文');assert.match(await page.$eval('.import-file',e=>e.textContent),/本地文章.md/);await page.screenshot({path:join(out,'import-desktop.png')});await click('取消');assert.equal(await value(),'# 原有正文');
 await upload();await page.keyboard.press('Escape');assert.equal(await value(),'# 原有正文');assert.equal(await page.$('dialog[open].import-article-modal'),null);
 await upload();await click('追加到末尾');assert.equal(await value(),'# 原有正文\n\n# 导入的新文章\n\n这是文件里的正文。');await click('AI 工具');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='撤销：导入追加'));await click('撤销：导入追加');assert.equal(await value(),'# 原有正文');
 await upload();await page.evaluate(()=>{window.__set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='gzh_editor_undo_snapshot')throw new DOMException('QA quota','QuotaExceededError');return window.__set.call(this,key,value);};});await click('替换正文');await page.waitForFunction(()=>document.querySelector('.import-article-error')?.textContent.includes('未导入'));assert.equal(await value(),'# 原有正文');await page.evaluate(()=>{Storage.prototype.setItem=window.__set;});await click('替换正文');assert.equal(await value(),'# 导入的新文章\n\n这是文件里的正文。');
 await click('AI 工具');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='撤销：导入覆盖'));await click('撤销：导入覆盖');assert.equal(await value(),'# 原有正文');
 await page.setViewport({width:390,height:900});await page.evaluate(()=>localStorage.setItem('gzh_ui_skin','dark'));await page.reload({waitUntil:'networkidle0'});await upload();await page.screenshot({path:join(out,'import-mobile-dark.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.click('button[aria-label="取消导入"]');assert.equal(await value(),'# 原有正文');
 assert.deepEqual(nativeDialogs,[]);assert.deepEqual(errors,[]);const report={nativeDialogs:0,cancelPreservesText:true,escapePreservesText:true,closePreservesText:true,appendAndUndo:true,replaceAndUndo:true,storageFailurePreservesText:true,reselectSameFile:true,mobileOverflow:false,pageErrors:errors,temporaryDatabase:true};await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}if(app)await app.close();await rm(dir,{recursive:true,force:true});}

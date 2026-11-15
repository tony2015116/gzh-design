import {createServer} from 'node:http';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createApplication} from '../application.mjs';
import {draftKeys} from '../../app/src/services/draftScope.ts';
const root=resolve(import.meta.dirname,'../..'),out=join(root,'output/draft-isolation'),dir=await mkdtemp(join(tmpdir(),'gzh-drafts-'));
let app,server,browser;const errors=[];let phase='setup';
try{
 await mkdir(out,{recursive:true});server=createServer((req,res)=>app.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 app=await createApplication({dataDir:dir,staticDir:join(root,'app/dist'),publicUrl:base,config:{}});
 const auth=async email=>await(await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Draft-test123'})})).json();const A=await auth('a@example.test'),B=await auth('b@example.test'),aKeys=draftKeys('user:'+A.user.id),bKeys=draftKeys('user:'+B.user.id);
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,protocolTimeout:15000});const page=await browser.newPage(),other=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));other.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1440,height:1000});await page.goto(base+'/login',{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.setItem('gzh_editor_draft','# 访客旧版正文');localStorage.setItem('gzh_editor_undo_snapshot',JSON.stringify({label:'访客快照',markdown:'访客旧快照',savedAt:1}));});
 await page.goto(base+'/',{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.querySelector('textarea[aria-label="Markdown 正文"]')?.value==='# 访客旧版正文');
 await other.goto(base+'/login',{waitUntil:'networkidle0'});
 const switchTo=async value=>other.evaluate(a=>{localStorage.setItem('auth_token',a.token);localStorage.setItem('auth_user',JSON.stringify(a.user));window.dispatchEvent(new Event('gzh-draft-owner-changed'));},value);
 const value=()=>page.$eval('textarea[aria-label="Markdown 正文"]',e=>e.value);
 const fill=async text=>page.$eval('textarea[aria-label="Markdown 正文"]',(e,v)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},text);
 const waitBody=async text=>page.waitForFunction(t=>document.querySelector('textarea[aria-label="Markdown 正文"]')?.value===t,{},text);
 await switchTo(A);await page.waitForSelector('.wb-draft-recovery');assert.notEqual(await value(),'# 访客旧版正文');await page.screenshot({path:join(out,'guest-recovery-desktop.png')});console.log('PASS legacy isolation');
 await fill('# A private, before autosave');await switchTo(B);await page.waitForFunction(()=>document.querySelector('.wb-account-main small')?.textContent==='b');assert.notEqual(await value(),'# A private, before autosave');assert.equal(await page.evaluate(k=>localStorage.getItem(k),aKeys.draft),'# A private, before autosave');
 await fill('# B private');await page.reload({waitUntil:'networkidle0'});await waitBody('# B private');await switchTo(A);await waitBody('# A private, before autosave');console.log('PASS account switching and immediate reload');
 // Hold A's identity refresh, sign into B in another tab, then release the old response.
 await page.setRequestInterception(true);let held,resolveHeld;const seen=new Promise(r=>{resolveHeld=r;});let hold=true;
 page.on('request',r=>{if(hold&&r.url().endsWith('/api/user/info')){hold=false;held=r;resolveHeld();}else void r.continue();});
 await page.reload({waitUntil:'domcontentloaded'});let deadline;try{await Promise.race([seen,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('No identity refresh request observed')),15000);})]);}finally{clearTimeout(deadline);}
 await switchTo(B);await waitBody('# B private');const response=page.waitForResponse(r=>r.request()===held);await held.continue();await response;await new Promise(r=>setTimeout(r,100));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('auth_user')).id),B.user.id);assert.equal(await value(),'# B private');console.log('PASS delayed identity response');
 phase='guest recovery';await fill('# B latest before recovery');await page.$eval('.wb-draft-recovery button',e=>e.click());await waitBody('# 访客旧版正文');assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).markdown,bKeys.undo),'# B latest before recovery');console.log('PASS explicit guest recovery');
 phase='undo recovery';await page.evaluate(()=>{const button=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='AI 工具');if(!button)throw Error('Missing AI menu');button.click();});
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='撤销：恢复访客草稿'));
 await page.evaluate(()=>{const button=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='撤销：恢复访客草稿');if(!button)throw Error('Missing undo menu item');button.click();});await waitBody('# B latest before recovery');
 assert.equal(await page.evaluate(()=>localStorage.getItem('gzh_editor_draft')),'# 访客旧版正文');
 console.log('PASS recovery undo');phase='session expiry';await app.db.prepare('DELETE FROM sessions WHERE token=?').bind(B.token).run();await page.reload({waitUntil:'domcontentloaded'});await waitBody('# 访客旧版正文');assert.equal(await page.evaluate(k=>localStorage.getItem(k),bKeys.draft),'# B latest before recovery');console.log('PASS session expiry');
 await switchTo(A);await waitBody('# A private, before autosave');await page.setViewport({width:390,height:1000});await page.screenshot({path:join(out,'drafts-mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);const report={crossAccountIsolation:true,crossTabSwitchFlush:true,refreshBeforeDebounce:true,lateIdentityIgnored:true,legacyGuestPreserved:true,explicitRecoveryWithUndo:true,expiredSessionPreservesDraft:true,mobileOverflow:false,pageErrors:errors,temporaryDatabase:true};await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){console.error('FAIL phase:',phase,e.message);throw e;}finally{if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}if(app)await app.close();await rm(dir,{recursive:true,force:true});}

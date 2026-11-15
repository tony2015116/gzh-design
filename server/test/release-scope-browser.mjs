import {createServer} from 'node:http';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {createApplication} from '../application.mjs';

const root=resolve(import.meta.dirname,'../..'),out=join(root,'output/release-scope');
const dir=await mkdtemp(join(tmpdir(),'gzh-release-ui-'));
let app,server,browser;
const errors=[],phaseTwoRequests=[];
try{
 await mkdir(out,{recursive:true});
 server=createServer((request,response)=>app.handle(request,response));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 app=await createApplication({dataDir:dir,staticDir:join(root,'app/dist'),publicUrl:base,config:{NODE_ENV:'production',ENABLE_PHASE2:'1'}});
 const auth=await(await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'scope-admin@example.test',password:'Scope-test123'})})).json();
 await app.db.prepare("UPDATE users SET role='admin' WHERE id=?").bind(auth.user.id).run();auth.user.role='admin';
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 for(const role of ['guest','admin']){
  const context=await browser.createBrowserContext();
  try{
   const page=await context.newPage();page.setDefaultTimeout(12000);await page.setViewport({width:1440,height:1000});
   page.on('pageerror',error=>errors.push(error.message));
   page.on('request',request=>{if(/^\/api\/(discovery|topics)(\/|$)/.test(new URL(request.url()).pathname))phaseTwoRequests.push(request.url());});
   await page.goto(base,{waitUntil:'networkidle0'});
   if(role==='admin'){await page.evaluate(auth=>{localStorage.setItem('auth_token',auth.token);localStorage.setItem('auth_user',JSON.stringify(auth.user));localStorage.setItem('dev_identity_role','admin');},auth);await page.reload({waitUntil:'networkidle0'});}
   const check=async()=>{
    assert.equal(await page.$('a[href="/discovery"],a[href^="/topics"]'),null);
    assert.doesNotMatch(await page.$eval('body',body=>body.textContent),/爆文|我的选题|选题与灵感|发现 · 选题|会员平台|RedFox/);
   };
   await check();await page.screenshot({path:join(out,role+'-desktop.png')});
   for(const path of ['/discovery','/topics','/topics/old-topic']){
    await page.goto(base+path,{waitUntil:'networkidle0'});await page.waitForFunction(()=>location.pathname==='/');await page.waitForSelector('textarea[aria-label="Markdown 正文"]');await check();
   }
   await page.goto(base+(role==='admin'?'/account':'/login'),{waitUntil:'networkidle0'});await check();
   if(role==='admin')assert.ok(await page.$('a[href="/articles"]'));
   await page.setViewport({width:390,height:900});await page.goto(base,{waitUntil:'networkidle0'});
   await page.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='导航')?.click());await check();
   await page.screenshot({path:join(out,role+'-mobile.png')});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(phaseTwoRequests,[]);
 const report={productionBuild:true,guestAndAdmin:true,desktopAndMobile:true,noPhaseTwoNavigation:true,directRoutesRedirected:true,loginAndAccountCopy:true,automaticPhaseTwoRequests:0,pageErrors:errors,temporaryDatabase:true,paidRequests:0};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{
 if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}if(app)await app.close();await rm(dir,{recursive:true,force:true});
}

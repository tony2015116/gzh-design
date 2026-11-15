// Real OSS development-mode login against an isolated local SQLite database.
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {localDiscoveryPlugin} from '../../app/scripts/local-discovery-plugin.ts';
const root=resolve(import.meta.dirname,'../..'),out=join(root,'output/login-qa'),dir=await mkdtemp(join(tmpdir(),'gzh-login-vite-'));
const require=createRequire(new URL('../../app/package.json',import.meta.url));
const {createServer}=await import(pathToFileURL(require.resolve('vite')).href);
const {default:react}=await import(pathToFileURL(require.resolve('@vitejs/plugin-react')).href);
const {default:tailwindcss}=await import(pathToFileURL(require.resolve('@tailwindcss/vite')).href);
let server,browser;const errors=[];
try{
 await mkdir(out,{recursive:true});server=await createServer({root:join(root,'app'),configFile:false,mode:'oss',plugins:[react(),tailwindcss(),localDiscoveryPlugin({dataDir:dir})],server:{host:'127.0.0.1',port:0}});await server.listen();const base=`http://127.0.0.1:${server.httpServer.address().port}`;
 browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1440,height:1000});await page.goto(base+'/discovery',{waitUntil:'networkidle0'});
 await page.evaluate(()=>localStorage.setItem('r2_upload_config',JSON.stringify({workerUrl:'https://old-worker.invalid',uploadSecret:''})));
 await page.waitForSelector('.wb-login');await page.click('.wb-login');await page.waitForSelector('#login-email');
 const fill=async(id,value)=>page.$eval(id,(e,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await page.click('.login-switch button:nth-child(2)');await fill('#login-email','local-writer@example.test');await fill('#login-password','Local-test123');await fill('#login-confirm','Local-test123');await page.click('.login-submit');await page.waitForFunction(()=>location.pathname==='/discovery');
 await page.waitForFunction(()=>document.body.textContent.includes('local-writer@example.test'));
 assert.equal(await page.evaluate(()=>document.body.textContent.includes('本地免登录调测')),false);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('auth_user')).role),'free');
 const upload=await page.evaluate(async()=>{const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jwZkAAAAASUVORK5CYII='),c=>c.charCodeAt(0));const form=new FormData();form.append('file',new Blob([bytes],{type:'image/png'}),'image.png');const denied=await fetch('/upload',{method:'POST',body:form});const response=await fetch('/upload',{method:'POST',headers:{Authorization:'Bearer '+localStorage.getItem('auth_token')},body:form});const data=await response.json();const image=await fetch(data.url);return {denied:denied.status,status:response.status,url:data.url,readStatus:image.status,bytes:(await image.arrayBuffer()).byteLength,expected:bytes.byteLength};});assert.equal(upload.denied,401);assert.equal(upload.status,200);assert.ok(upload.url.startsWith(base+'/file/'));assert.equal(upload.readStatus,200);assert.equal(upload.bytes,upload.expected);
 await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>document.body.textContent.includes('local-writer@example.test'));
 await page.click('.wb-account-main');await page.waitForFunction(()=>location.pathname==='/account');await page.waitForSelector('.account-profile');assert.match(await page.$eval('.account-profile',e=>e.textContent),/local-writer@example.test/);
 await page.goto(base+'/discovery',{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.body.textContent.includes('local-writer@example.test'));
 await page.click('button[aria-label="退出登录"]');await page.waitForFunction(()=>!localStorage.getItem('auth_token'));await page.waitForFunction(()=>document.body.textContent.includes('登录，打开你的创作资料库'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('dev_identity_role')),'guest');
 assert.deepEqual(errors,[]);const report={mode:'oss development',registerAndLogin:true,realUserOverridesDebug:true,legacyUploadConfigIgnored:true,authenticatedImageUpload:true,publicImageRead:true,logoutReturnsGuest:true,pageErrors:errors,temporaryDatabase:true};await writeFile(join(out,'vite-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(browser)await browser.close();if(server)await server.close();await rm(dir,{recursive:true,force:true});}

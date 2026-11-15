// Phase-two browser suites must use development source, never the phase-one dist.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';

export async function createPhaseTwoFrontend(root){
 const require=createRequire(join(root,'app/package.json'));
 const {createServer}=await import(pathToFileURL(require.resolve('vite')).href);
 const {default:react}=await import(pathToFileURL(require.resolve('@vitejs/plugin-react')).href);
 const {default:tailwindcss}=await import(pathToFileURL(require.resolve('@tailwindcss/vite')).href);
 const vite=await createServer({root:join(root,'app'),configFile:false,mode:'oss',plugins:[react(),tailwindcss()],server:{middlewareMode:true,hmr:false}});
 return {
  handle(request,response,application){
   if(/^\/(?:api(?:\/|$)|upload(?:\?|$)|file\/|health(?:\?|$))/.test(request.url||''))return application.handle(request,response);
   vite.middlewares(request,response,()=>{void application.handle(request,response);});
  },
  close:()=>vite.close(),
 };
}

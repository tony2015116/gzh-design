import {getAuthToken} from '../../services/authService';
export async function uploadArticleImage(file:File):Promise<string>{
 if(!getAuthToken())throw Error('上传到服务器需要先登录');
 if(!['image/jpeg','image/png','image/gif','image/webp','image/avif'].includes(file.type))throw Error('仅支持 JPG、PNG、GIF、WebP、AVIF 图片');
 if(!file.size||file.size>10*1024*1024)throw Error('图片需大于0字节且不超过10MB');
 const token=getAuthToken(),body=new FormData();body.append('file',file,file.name);
 const response=await fetch('/upload',{method:'POST',headers:{Authorization:`Bearer ${token}`},body});
 const result=await response.json().catch(()=>null);
 if(token!==getAuthToken())throw Error('账号已切换，未替换正文中的图片');
 if(!response.ok||!result?.url)throw Error(result?.error||'上传失败，请检查本地服务或服务器配置');
 return result.url;
}

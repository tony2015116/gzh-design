import {useMemo,useRef,useState} from 'react';
import {Image,Link,RefreshCw,Upload} from 'lucide-react';
import {Modal} from '../../components/ui/WorkspaceModal';
import {findArticleImages,replaceArticleImage,type ArticleImage} from './imageReferences';
import {uploadArticleImage} from './imageUpload';
import {safeImageUrl} from '../../core/safeHtml';
import {getAuthToken} from '../../services/authService';
import {accountsEnabled} from '../../services/releaseScope';
import {getDraftOwner} from '../../services/draftScope';
import './article-images.css';

function ImageItem({image,onEdit,onUpload,busy}:{image:ArticleImage;onEdit:()=>void;onUpload:()=>void;busy:boolean}){
 const [status,setStatus]=useState<'loading'|'loaded'|'failed'>('loading'),[retry,setRetry]=useState(0);
 const src=safeImageUrl(image.src),local=(()=>{try{const url=new URL(src,location.href);return url.hostname==='localhost'||url.hostname==='127.0.0.1'||url.protocol==='blob:'||url.protocol==='data:';}catch{return true;}})();
 return <article className="article-image-item"><div className="article-image-thumb">{src?<img key={retry} src={src} alt={image.alt||'正文图片'} onLoad={()=>setStatus('loaded')} onError={()=>setStatus('failed')}/>:<Image size={23}/>}</div><div className="article-image-info"><strong>{image.alt||'未命名图片'}</strong><span className={'article-image-state '+(!src||status==='failed'?'is-failed':'')}>{!src?'地址不可用':status==='loaded'?'加载正常':status==='failed'?'加载失败':'正在检测…'}</span><p title={image.src}>{image.src.length>160?image.src.slice(0,160)+'…':image.src}</p>{local&&<small>本机或内嵌地址，跨平台使用前请上传到公网服务器。</small>}<div className="article-image-actions"><button disabled={busy} onClick={onEdit}><Link size={13}/>更换链接</button><button disabled={busy||!accountsEnabled} onClick={onUpload}><Upload size={13}/>{accountsEnabled?'上传原图替换':'上传原图 · 后续开放'}</button><button disabled={busy} onClick={()=>{setStatus('loading');setRetry(x=>x+1);}} aria-label="重新检测图片"><RefreshCw size={13}/></button></div></div></article>;
}
export function ArticleImages({markdown,owner,onReplace}:{markdown:string;owner:string;onReplace:(expected:string,next:string)=>void}){
 const [open,setOpen]=useState(false),[selection,setSelection]=useState<{image:ArticleImage;source:string}|null>(null),[url,setUrl]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[uploadedUrl,setUploadedUrl]=useState(''),[busy,setBusy]=useState(false);
 const images=useMemo(()=>open?findArticleImages(markdown):[],[open,markdown]),latest=useRef(markdown),uploadTarget=useRef<{image:ArticleImage;source:string}|null>(null),input=useRef<HTMLInputElement>(null);latest.current=markdown;
 const replace=(target:{image:ArticleImage;source:string},newUrl:string)=>{
  if(getDraftOwner()!==owner)throw Error('账号已切换，请重新打开图片面板');
  if(latest.current!==target.source)throw Error('正文已变化，请重新选择这张图片');
  const next=replaceArticleImage(target.source,target.image,newUrl);onReplace(target.source,next);setSelection(null);setNotice('图片已替换，可在“AI 工具”撤销。服务器文章仍需手动保存。');
 };
 const upload=async(file:File)=>{
  const target=uploadTarget.current;if(!target)return;
  setBusy(true);setError('');setNotice('');setUploadedUrl('');let result='';
  try{result=await uploadArticleImage(file);replace(target,result);}catch(e){setError((result?'图片已上传，但正文未替换。':'')+(e instanceof Error?e.message:'上传失败'));setUploadedUrl(result);}finally{setBusy(false);uploadTarget.current=null;}
 };
 return <>
  <button className="article-images-trigger" onClick={()=>{setOpen(true);setError('');setNotice('');}}><Image size={15}/>文章图片</button>
  {open&&<Modal title="文章图片" onClose={()=>{if(!busy){setOpen(false);setSelection(null);}}}><div className="article-images-panel">
   <p className="article-images-intro">共 {images.length} 处 Markdown 图片。失效链接需要原图或新的可访问地址，上传替换会保留原图文件，不进行压缩。</p>
   {!getAuthToken()&&<p className="article-images-tip">{accountsEnabled?'更换链接可直接使用；上传原图到服务器需要先登录。':'更换链接可直接使用；服务器图片上传后续开放。'}</p>}
   {busy&&<p className="article-images-tip" role="status">正在上传原图，请勿关闭页面…</p>}
   {error&&<p className="article-images-error" role="alert">{error}</p>}{notice&&<p className="article-images-notice" role="status">{notice}</p>}
   {uploadedUrl&&<label className="article-image-recovery">已上传图片地址，可复制后更换链接<input aria-label="已上传图片地址" readOnly value={uploadedUrl} onFocus={e=>e.currentTarget.select()}/></label>}
   {selection&&<form className="article-image-link-form" onSubmit={e=>{e.preventDefault();try{setError('');replace(selection,url);}catch(e){setError(e instanceof Error?e.message:'替换失败');}}}><label htmlFor="article-image-url">新的图片链接</label><input id="article-image-url" type="url" required value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/><footer><button type="button" onClick={()=>setSelection(null)}>取消</button><button type="submit">应用链接</button></footer></form>}
   {!images.length?<div className="article-images-empty"><Image size={30}/><p>正文中还没有可管理的 Markdown 图片。</p><small>支持内联与引用式图片。HTML 图片或复杂跨行语法请在正文中修改。</small></div>:<div className="article-images-list">{images.map(image=><ImageItem key={image.start+':'+image.src} image={image} busy={busy} onEdit={()=>{setSelection({image,source:markdown});setUrl(image.src.startsWith('http')?image.src:'');setError('');setNotice('');}} onUpload={()=>{if(!getAuthToken()){setError('请先登录，再上传原图替换；当前正文保持原样。');return;}uploadTarget.current={image,source:markdown};input.current?.click();}}/>)}</div>}
   <input ref={input} className="article-image-upload" hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file);}}/>
   <p className="article-images-footnote">检测仅表示当前浏览器能否加载。部署到公网后上传的服务器图片才可供外部访问，公众号图片转存仍需实际粘贴验收。</p>
  </div></Modal>}
 </>;
}

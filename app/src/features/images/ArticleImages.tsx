import {useMemo,useRef,useState} from 'react';
import {Image,Link,RefreshCw} from 'lucide-react';
import {Modal} from '../../components/ui/WorkspaceModal';
import {findArticleImages,replaceArticleImage,type ArticleImage} from './imageReferences';
import {safeImageUrl} from '../../core/safeHtml';
import './article-images.css';

function ImageItem({image,onEdit}:{image:ArticleImage;onEdit:()=>void}){
 const [status,setStatus]=useState<'loading'|'loaded'|'failed'>('loading'),[retry,setRetry]=useState(0);
 const src=safeImageUrl(image.src),local=(()=>{try{const url=new URL(src,location.href);return url.hostname==='localhost'||url.hostname==='127.0.0.1'||url.protocol==='blob:'||url.protocol==='data:';}catch{return true;}})();
 return <article className="article-image-item"><div className="article-image-thumb">{src?<img key={retry} src={src} alt={image.alt||'正文图片'} onLoad={()=>setStatus('loaded')} onError={()=>setStatus('failed')}/>:<Image size={23}/>}</div><div className="article-image-info"><strong>{image.alt||'未命名图片'}</strong><span className={'article-image-state '+(!src||status==='failed'?'is-failed':'')}>{!src?'地址不可用':status==='loaded'?'加载正常':status==='failed'?'加载失败':'正在检测…'}</span><p title={image.src}>{image.src.length>160?image.src.slice(0,160)+'…':image.src}</p>{local&&<small>本机或内嵌地址，跨平台使用前请上传到公网服务器。</small>}<div className="article-image-actions"><button onClick={onEdit}><Link size={13}/>更换链接</button><button onClick={()=>{setStatus('loading');setRetry(x=>x+1);}} aria-label="重新检测图片"><RefreshCw size={13}/></button></div></div></article>;
}
export function ArticleImages({markdown,onReplace}:{markdown:string;onReplace:(expected:string,next:string)=>void}){
 const [open,setOpen]=useState(false),[selection,setSelection]=useState<{image:ArticleImage;source:string}|null>(null),[url,setUrl]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const images=useMemo(()=>open?findArticleImages(markdown):[],[open,markdown]),latest=useRef(markdown);latest.current=markdown;
 const replace=(target:{image:ArticleImage;source:string},newUrl:string)=>{
  if(latest.current!==target.source)throw Error('正文已变化，请重新选择这张图片');
  const next=replaceArticleImage(target.source,target.image,newUrl);onReplace(target.source,next);setSelection(null);setNotice('图片已替换，可在“AI 工具”撤销。');
 };
 return <>
  <button className="article-images-trigger" onClick={()=>{setOpen(true);setError('');setNotice('');}}><Image size={15}/>文章图片</button>
  {open&&<Modal title="文章图片" onClose={()=>{setOpen(false);setSelection(null);}}><div className="article-images-panel">
   <p className="article-images-intro">共 {images.length} 处 Markdown 图片。失效链接需要原图或新的可访问地址。</p>
   {error&&<p className="article-images-error" role="alert">{error}</p>}{notice&&<p className="article-images-notice" role="status">{notice}</p>}
   {selection&&<form className="article-image-link-form" onSubmit={e=>{e.preventDefault();try{setError('');replace(selection,url);}catch(e){setError(e instanceof Error?e.message:'替换失败');}}}><label htmlFor="article-image-url">新的图片链接</label><input id="article-image-url" type="url" required value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/><footer><button type="button" onClick={()=>setSelection(null)}>取消</button><button type="submit">应用链接</button></footer></form>}
   {!images.length?<div className="article-images-empty"><Image size={30}/><p>正文中还没有可管理的 Markdown 图片。</p><small>支持内联与引用式图片。HTML 图片或复杂跨行语法请在正文中修改。</small></div>:<div className="article-images-list">{images.map(image=><ImageItem key={image.start+':'+image.src} image={image} onEdit={()=>{setSelection({image,source:markdown});setUrl(image.src.startsWith('http')?image.src:'');setError('');setNotice('');}}/>)}</div>}
   <p className="article-images-footnote">检测仅表示当前浏览器能否加载。公众号图片转存仍需实际粘贴验收。</p>
  </div></Modal>}
 </>;
}

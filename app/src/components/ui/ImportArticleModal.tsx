import {useEffect,useRef} from 'react';
import {FileText,Plus,Replace,Undo2,X} from 'lucide-react';
import './import-article.css';

export interface PendingArticleImport {title:string;markdown:string;sourceKind:'feishu'|'markdown'|'plaintext'}
export function ImportArticleModal({source,error,hasContent,onImport,onClose}:{source:PendingArticleImport;error:string;hasContent:boolean;onImport:(mode:'replace'|'append')=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),cancel=useRef<HTMLButtonElement>(null);
 useEffect(()=>{dialog.current?.showModal();cancel.current?.focus();},[]);
 return <dialog ref={dialog} className="import-article-modal" aria-labelledby="article-import-title" aria-describedby="article-import-description" onCancel={e=>{e.preventDefault();onClose();}}>
  <header><div><span>导入内容</span><h2 id="article-import-title">这篇文章，放在哪里？</h2></div><button type="button" aria-label="取消导入" onClick={onClose}><X size={20}/></button></header>
  <div className="import-article-body">
   <section className="import-file"><span className="import-file-icon"><FileText size={23}/></span><div><strong>{source.title}</strong><p>{source.sourceKind==='feishu'?'飞书文档':source.sourceKind==='markdown'?'Markdown 文件':'纯文本文件'} · {source.markdown.replace(/\s/g,'').length.toLocaleString()} 字符</p></div></section>
   <p id="article-import-description">选择导入方式。替换会将编辑区正文换成这篇文章，追加会保留原文并接在末尾。</p>
   <div className="import-text-preview" aria-label="导入内容预览">{source.markdown.trim().slice(0,280)||'文件中没有正文内容。'}{source.markdown.trim().length>280?'…':''}</div>
   <p className="import-undo-note"><Undo2 size={15}/>导入前保留当前正文，可在“AI 工具”中撤销。</p>
   {error&&<p role="alert" className="import-article-error">{error}</p>}
  </div>
  <footer><button ref={cancel} type="button" onClick={onClose}>取消</button><div><button type="button" className="import-append" disabled={!hasContent} onClick={()=>onImport('append')}><Plus size={15}/>追加到末尾</button><button type="button" className="import-replace" onClick={()=>onImport('replace')}><Replace size={15}/>替换正文</button></div></footer>
 </dialog>;
}

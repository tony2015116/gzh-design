import MarkdownIt from 'markdown-it';
import imageRule from 'markdown-it/lib/rules_inline/image.mjs';
export interface ArticleImage {start:number;end:number;raw:string;src:string;alt:string;title:string;prefix:string}
const md=new MarkdownIt({html:false});
md.inline.ruler.at('image',(state,silent)=>{
 const start=state.pos,matched=imageRule(state,silent);
 if(matched&&!silent){const token=state.tokens.at(-1);if(token?.type==='image')token.meta={sourceStart:start,sourceEnd:state.pos,raw:state.src.slice(start,state.pos)};}
 return matched;
});
export function findArticleImages(source:string):ArticleImage[]{
 const removed:number[]=[];let count=0;
 const normalized=source.replace(/\r\n?/g,(value,index)=>{if(value.length===2){removed.push(index-count);count++;}return '\n';});
 const originalOffset=(offset:number)=>{let low=0,high=removed.length;while(low<high){const mid=(low+high)>>1;if(removed[mid]<offset)low=mid+1;else high=mid;}return offset+low;};
 const lines=[0];for(let i=0;i<normalized.length;i++)if(normalized[i]==='\n')lines.push(i+1);
 const images:ArticleImage[]=[];
 for(const token of md.parse(normalized,{})){
  if(token.type!=='inline'||!token.map)continue;
  const from=lines[token.map[0]]??0,to=lines[token.map[1]]??normalized.length;
  const relative=normalized.slice(from,to).indexOf(token.content);if(relative<0)continue;
  for(const child of token.children||[]){
   if(child.type!=='image'||!child.meta)continue;
   const start=originalOffset(from+relative+child.meta.sourceStart),end=originalOffset(from+relative+child.meta.sourceEnd),raw=source.slice(start,end);
   const prefixEnd=originalOffset(from+relative+child.meta.sourceStart+child.content.length+3);
   const prefix=source.slice(start,prefixEnd);
   images.push({start,end,raw,src:child.attrGet('src')||'',alt:child.content,title:child.attrGet('title')||'',prefix});
  }
 }
 return images;
}
export function replaceArticleImage(source:string,image:ArticleImage,newUrl:string):string{
 let url:URL;try{url=new URL(newUrl.trim());}catch{throw Error('请输入完整的 HTTP 或 HTTPS 图片链接');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('仅支持不含账号密码的 HTTP 或 HTTPS 图片链接');
 if(source.slice(image.start,image.end)!==image.raw)throw Error('正文已变化，请刷新图片列表后重试');
 const title=image.title?' "'+image.title.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"':'';
 return source.slice(0,image.start)+image.prefix+'(<'+url.href+'>'+title+')'+source.slice(image.end);
}

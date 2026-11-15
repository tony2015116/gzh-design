import sanitizeHtml from 'sanitize-html';

// Applied to complete rich-text fragments, so allowed inline tags keep their nesting.
const color=/^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\)|[a-z]+|var\(--[a-z-]+\))$/i;
const length=/^-?\d+(?:\.\d+)?(?:px|em|rem|%|pt)?$/;
const lengths=/^-?\d+(?:\.\d+)?(?:px|em|rem|%|pt)?(?:\s+-?\d+(?:\.\d+)?(?:px|em|rem|%|pt)?){0,3}$/;
const gradientColor='(?:#[\\da-f]{3,8}|rgba?\\([\\d.,%\\s]+\\)|[a-z]+)';
const gradientStop=`${gradientColor}\\s+\\d+(?:\\.\\d+)?%`;
const gradient=new RegExp(`^linear-gradient\\(\\s*-?\\d+(?:\\.\\d+)?deg\\s*,\\s*${gradientStop}(?:\\s*,\\s*${gradientStop}){1,7}\\s*\\)$`,'i');
export function safeImageUrl(value:string):string{
 const trimmed=value.trim();
 if(/^data:/i.test(trimmed))return /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z\d+/=\s]+$/i.test(trimmed)?trimmed:'';
 if([...trimmed].some(char=>char.charCodeAt(0)<=32||char.charCodeAt(0)===127))return '';
 return /^(?:https?:|blob:)/i.test(trimmed)||(!/^[^/?#]*:/.test(trimmed)&&!trimmed.startsWith('\\'))?trimmed:'';
}
export function sanitizeArticleHtml(html:string):string{
 return sanitizeHtml(html,{
  allowedTags:['p','br','hr','span','div','section','strong','b','em','i','s','del','u','mark','small','sub','sup','code','pre','blockquote','a','img','ul','ol','li','table','thead','tbody','tfoot','tr','th','td','h1','h2','h3','h4','h5','h6'],
  allowedAttributes:{'*':['style'],a:['href','title','target','rel'],img:['src','alt','title','width','height'],ol:['start'],li:['value'],th:['colspan','rowspan'],td:['colspan','rowspan']},
  allowedSchemes:['http','https','mailto','tel'],allowedSchemesByTag:{img:['http','https','data','blob']},allowProtocolRelative:true,
  allowedStyles:{'*':{
   color:[color],'background-color':[color],background:[color,gradient],
   'font-size':[length],'font-weight':[/^(?:normal|bold|bolder|lighter|[1-9]00)$/],'font-style':[/^(?:normal|italic|oblique)$/],
   'font-family':[/^[\w\s,'"\-\u4e00-\u9fff]+$/],
   'line-height':[length],'letter-spacing':[length],'text-align':[/^(?:left|right|center|justify|start|end)$/],
   'text-decoration':[/^(?:none|underline|line-through|overline)(?:\s+(?:solid|dotted|dashed))?$/],
   'text-transform':[/^(?:none|uppercase|lowercase|capitalize)$/],
   'white-space':[/^(?:normal|pre|pre-wrap|pre-line|break-spaces|nowrap)$/],'word-break':[/^(?:normal|break-all|keep-all|break-word)$/],
   padding:[lengths],margin:[lengths],'margin-top':[length],'margin-bottom':[length],'margin-left':[length],'margin-right':[length],
   'padding-top':[length],'padding-bottom':[length],'padding-left':[length],'padding-right':[length],
   'border-radius':[lengths],'border-bottom':[/^\d+(?:\.\d+)?px\s+(?:solid|dashed|dotted|double)\s+(?:#[\da-f]{3,8}|[a-z]+)$/i],
   'vertical-align':[/^(?:baseline|middle|top|bottom|sub|super)$/],
  }},
  transformTags:{
   a:(tagName,attribs)=>({tagName,attribs:{...attribs,rel:'noopener noreferrer'}}),
   img:(tagName,attribs)=>({tagName,attribs:{...attribs,src:safeImageUrl(attribs.src||'')}}),
  },
 });
}

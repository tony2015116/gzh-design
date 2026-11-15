import {atomicDraftWrite,draftKeys,type LocalDraftStorage} from './draftScope.ts';
export interface ArticleIdentity {id:string;title:string;revision:number}
export const ARTICLE_IDENTITY_EVENT='gzh-article-identity-changed';
export function loadArticleIdentity(owner:string,storage:LocalDraftStorage=localStorage):ArticleIdentity|null{
 if(owner==='guest')return null;
 try{const value=JSON.parse(storage.getItem(draftKeys(owner).article)||'null');return typeof value?.id==='string'&&/^[\w-]{1,100}$/.test(value.id)&&typeof value.title==='string'&&value.title.length<=200&&Number.isSafeInteger(value.revision)&&value.revision>0?{id:value.id,title:value.title,revision:value.revision}:null;}catch{return null;}
}
export function articleIdentityJson(value:ArticleIdentity|null):string|null{return value?JSON.stringify({id:value.id,title:value.title,revision:value.revision}):null;}
export function notifyArticleIdentity(){if(typeof window!=='undefined')window.dispatchEvent(new Event(ARTICLE_IDENTITY_EVENT));}
export function saveArticleIdentity(owner:string,value:ArticleIdentity|null,markdown:string,storage:LocalDraftStorage=localStorage){
 const keys=draftKeys(owner);atomicDraftWrite(storage,new Map([[keys.article,articleIdentityJson(value)],[keys.draft,markdown]]));notifyArticleIdentity();
}

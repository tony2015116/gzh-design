import {getAuthToken} from '../../services/authService';
export interface SavedArticle { id:string;title:string;markdown:string;revision:number;created_at:string;updated_at:string;characters?:number }
export interface ArticlePage {items:Omit<SavedArticle,'markdown'>[];total:number;nextCursor:string|null}
export class ArticleError extends Error {
  status:number;
  constructor(message:string,status:number){super(message);this.status=status;}
}
export async function articleApi<T>(path='',body?:unknown,method=body===undefined?'GET':'POST',signal?:AbortSignal):Promise<T>{
  const token=getAuthToken();
  const response=await fetch('/api/articles'+path,{method,signal,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(token!==getAuthToken())throw new ArticleError('账号已切换，请重新打开文章',409);
  if(!response.headers.get('content-type')?.includes('application/json'))throw new ArticleError('我的文章接口未接通，请检查服务器配置',503);
  const result=await response.json();
  if(!response.ok)throw new ArticleError(result.error||'文章操作失败',response.status);
  return result;
}

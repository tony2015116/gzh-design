export type LocalDraftStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export const DRAFT_OWNER_EVENT='gzh-draft-owner-changed';
export function getDraftOwner(storage?:LocalDraftStorage):string{
 try{storage??=localStorage;if(!storage.getItem('auth_token'))return 'guest';const user=JSON.parse(storage.getItem('auth_user')||'null');return typeof user?.id==='string'&&user.id?'user:'+user.id:'guest';}catch{return 'guest';}
}
export function draftKeys(owner:string){
 const prefix='gzh_editor:'+encodeURIComponent(owner);
 return {draft:owner==='guest'?'gzh_editor_draft':prefix+':draft',undo:owner==='guest'?'gzh_editor_undo_snapshot':prefix+':undo',article:prefix+':article',receipt:(id:string)=>owner==='guest'?'gzh_topic_import_'+id:prefix+':import:'+encodeURIComponent(id)};
}
export function notifyDraftOwnerChanged(){if(typeof window!=='undefined')window.dispatchEvent(new Event(DRAFT_OWNER_EVENT));}
export function atomicDraftWrite(storage:LocalDraftStorage,values:Map<string,string|null>){
 const previous=new Map([...values.keys()].map(key=>[key,storage.getItem(key)]));
 try{for(const [key,value] of values){if(value===null)storage.removeItem(key);else storage.setItem(key,value);}}
 catch(e){for(const [key,value] of previous){try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{/* Keep the original error; storage may be unavailable. */}}throw e;}
}

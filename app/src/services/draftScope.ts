export function draftKeys() {
  return { draft: 'gzh_editor_draft', undo: 'gzh_editor_undo_snapshot' };
}

export function atomicDraftWrite(storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,values:Map<string,string|null>){
 const previous=new Map([...values.keys()].map(key=>[key,storage.getItem(key)]));
 try{for(const [key,value] of values){if(value===null)storage.removeItem(key);else storage.setItem(key,value);}}
 catch(e){for(const [key,value] of previous){try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{/* Keep the original error; storage may be unavailable. */}}throw e;}
}

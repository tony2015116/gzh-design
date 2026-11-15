import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as drafts from '../../app/src/services/draftStorage.ts';
import {importTopicBrief} from '../../app/src/services/topicImport.ts';
function storage(){const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('account drafts and undo are isolated; legacy content remains a guest draft',()=>{
 const s=storage();globalThis.localStorage=s;
 try{
  s.setItem('gzh_editor_draft','Legacy guest');
  drafts.saveDraft('Private A','user:A');drafts.saveDraft('Private B','user:B');
  assert.equal(drafts.loadDraft('user:A'),'Private A');assert.equal(drafts.loadDraft('user:B'),'Private B');assert.equal(drafts.loadDraft('guest'),'Legacy guest');assert.equal(drafts.loadDraft('user:new'),null);
  drafts.saveUndoSnapshot({label:'A undo',markdown:'A before',savedAt:1},'user:A');assert.equal(drafts.loadUndoSnapshot('user:B'),null);assert.equal(drafts.loadUndoSnapshot('user:A').markdown,'A before');
  s.setItem('auth_token','token-A');s.setItem('auth_user',JSON.stringify({id:'A'}));assert.equal(drafts.getDraftOwner(),'user:A');
  s.removeItem('auth_token');assert.equal(drafts.getDraftOwner(),'guest');
 }finally{delete globalThis.localStorage;}
});
test('topic imports and receipts stay with the account, including rollback on storage failure',()=>{
 const s=storage();globalThis.localStorage=s;
 try{
  s.setItem('auth_token','token');s.setItem('auth_user',JSON.stringify({id:'A'}));drafts.saveDraft('A original');
  assert.equal(importTopicBrief(s,'brief1','A brief','append'),'imported');assert.match(drafts.loadDraft('user:A'),/A original.*A brief/s);
  s.setItem('auth_user',JSON.stringify({id:'B'}));assert.equal(importTopicBrief(s,'brief1','B brief','replace'),'imported');assert.equal(drafts.loadDraft('user:B'),'B brief');
  s.setItem('auth_user',JSON.stringify({id:'A'}));assert.equal(importTopicBrief(s,'brief1','duplicate','append'),'already-imported');
  const before=drafts.loadDraft();const original=s.setItem;let failed=false;
  s.setItem=(key,value)=>{if(!failed&&key===drafts.draftKeys('user:A').draft){failed=true;throw Error('quota');}return original(key,value);};
  assert.throws(()=>importTopicBrief(s,'brief2','bad replacement','replace'));assert.equal(drafts.loadDraft(),before);assert.equal(drafts.loadDraft('user:B'),'B brief');
 }finally{delete globalThis.localStorage;}
});
test('guest recovery preserves the latest private body as undo and does not consume the guest draft',()=>{
 const s=storage();globalThis.localStorage=s;
 try{
  s.setItem('gzh_editor_draft','Guest recovery');drafts.saveDraft('Stored A','user:A');drafts.saveDraft('Stored B','user:B');
  const restored=drafts.restoreGuestDraft('user:A','Unsaved A');assert.equal(restored.markdown,'Guest recovery');assert.equal(drafts.loadUndoSnapshot('user:A').markdown,'Unsaved A');assert.equal(drafts.loadDraft('guest'),'Guest recovery');assert.equal(drafts.loadDraft('user:B'),'Stored B');
  const write=s.setItem;let failed=false;s.setItem=(key,value)=>{if(!failed&&key===drafts.draftKeys('user:B').draft){failed=true;throw Error('quota');}return write(key,value);};
  assert.throws(()=>drafts.restoreGuestDraft('user:B','Unsaved B'));assert.equal(drafts.loadDraft('user:B'),'Stored B');assert.equal(drafts.loadUndoSnapshot('user:B'),null);assert.equal(drafts.loadDraft('guest'),'Guest recovery');
 }finally{delete globalThis.localStorage;}
});

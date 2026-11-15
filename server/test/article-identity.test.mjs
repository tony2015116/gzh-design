import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadArticleIdentity,saveArticleIdentity} from '../../app/src/services/articleIdentity.ts';
test('active article identity survives refresh, is scoped and rolls back with a failed draft write',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const a={id:'article-a',title:'原稿',revision:3};saveArticleIdentity('user:a',a,'未保存的新正文',storage);assert.deepEqual(loadArticleIdentity('user:a',storage),a);assert.equal(loadArticleIdentity('user:b',storage),null);assert.equal(loadArticleIdentity('guest',storage),null);
 const before=new Map(map);let fail=true;const broken={...storage,setItem:(k,v)=>{if(k.endsWith(':draft')&&fail){fail=false;throw Error('quota');}storage.setItem(k,v);}};
 assert.throws(()=>saveArticleIdentity('user:a',{...a,revision:4},'later',broken));assert.deepEqual(map,before);
});

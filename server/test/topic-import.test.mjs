import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importTopicBrief} from '../../app/src/services/topicImport.ts';
function store(fail){const map=new Map([['gzh_editor_draft','原始草稿']]);let failed=false;return {getItem:k=>map.get(k)??null,setItem:(k,v)=>{if(!failed&&k===fail){failed=true;throw Error('quota');}map.set(k,v);},removeItem:k=>map.delete(k)};}
test('topic import retains undo, prevents duplicate append, and rolls back failed storage writes',()=>{
 const s=store();assert.equal(importTopicBrief(s,'brief1','简报','append'),'imported');
 assert.match(s.getItem('gzh_editor_draft'),/原始草稿[\s\S]*简报/);
 assert.equal(JSON.parse(s.getItem('gzh_editor_undo_snapshot')).markdown,'原始草稿');
 const current=s.getItem('gzh_editor_draft');assert.equal(importTopicBrief(s,'brief1','简报','append'),'already-imported');assert.equal(s.getItem('gzh_editor_draft'),current);
 for(const key of ['gzh_editor_undo_snapshot','gzh_topic_import_brief2','gzh_editor_draft']){const failed=store(key);assert.throws(()=>importTopicBrief(failed,'brief2','简报','replace'));assert.equal(failed.getItem('gzh_editor_draft'),'原始草稿');assert.equal(failed.getItem('gzh_topic_import_brief2'),null);}
});

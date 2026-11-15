import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toWechatCompatibleHtml} from '../../app/src/core/wechatCompat.ts';
import {parseMarkdownToJSON} from '../../app/src/core/parser.ts';
test('preformatted HTML keeps blank lines between inline code spans',()=>{
 const html=toWechatCompatibleHtml('<pre><code><span>first</span>\n\n<span>  second</span>\n</code></pre>');
 assert.equal(html.replace(/<[^>]*>/g,''),'first\n\n  second\n');
});
test('Markdown references retain their destination when rendered',()=>{
 const paragraph=parseMarkdownToJSON('[参考链接](https://example.com/reference?a=1&b=2)').find(c=>c.type==='paragraph');
 assert.match(paragraph.content,/href="https:\/\/example.com\/reference\?a=1&amp;b=2"/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findArticleImages,replaceArticleImage} from '../../app/src/features/images/imageReferences.ts';
test('image spans preserve code, prose URLs, references and Windows line endings',()=>{
 const source='说明 https://example.test/a(1).png\r\n\r\n`![示例](https://code.test/a.png)` ![正文](https://example.test/a(1).png "标题")\r\n\r\n![引用][picture]\r\n\r\n[picture]: https://example.test/ref.png\r\n\r\n```md\r\n![代码](https://code.test/b.png)\r\n```';
 const images=findArticleImages(source);assert.equal(images.length,2);assert.equal(images[0].src,'https://example.test/a(1).png');
 const changed=replaceArticleImage(source,images[1],'https://new.test/replaced.png');assert.ok(changed.includes('![引用](<https://new.test/replaced.png>)'));assert.ok(changed.includes('[picture]: https://example.test/ref.png'));assert.ok(changed.includes('`![示例]'));assert.equal(changed.replace('![引用](<https://new.test/replaced.png>)','![引用][picture]'),source);
 assert.throws(()=>replaceArticleImage(source+'\n',images[0],'javascript:alert(1)'));
 assert.throws(()=>replaceArticleImage('changed'+source,images[0],'https://new.test/a.png'));
});

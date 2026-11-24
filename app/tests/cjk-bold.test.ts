import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdownToJSON } from '../src/core/parser';
import { DEFAULT_THEME } from '../src/core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../src/core/style';

const render = (source: string) => String(parseMarkdownToJSON(source, DEFAULT_THEME, DEFAULT_LAYOUT_STYLE)[0].content);
const strongCount = (html: string) => (html.match(/<strong/g) || []).length;

test('bold works next to Chinese text and punctuation', () => {
  const cases = [
    '转化率**提升了 12%**。',
    '约**30%**的人会划走',
    '打开率**翻了3倍！**真的',
    '**重点：**后面',
    '**“爆款”**的秘密',
    '我们**减少了预算**，加大了',
    '记住**这3点**：',
    '成本降到**$0.5**以下',
  ];
  for (const source of cases) {
    const html = render(source);
    assert.equal(strongCount(html), 1, `${source} → ${html}`);
    assert.ok(!html.includes('**'), `${source} left raw asterisks → ${html}`);
  }
});

test('English emphasis rules are unchanged', () => {
  assert.equal(strongCount(render('a **bold** word')), 1);
  assert.equal(strongCount(render('snake**case**word')), 1);
  assert.equal(strongCount(render('2 ** 3 is not bold')), 0);
  assert.equal(strongCount(render('**not closed')), 0);
});

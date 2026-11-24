import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeArticleHtml } from '../src/core/safeHtml';
import { parseMarkdownToJSON } from '../src/core/parser';
import { DEFAULT_THEME } from '../src/core/theme';
import { LAYOUT_STYLES } from '../src/core/style';
import { EMPHASIS_STYLES, DEFAULT_EMPHASIS_CONFIG } from '../src/core/emphasis';

// 不用 hex 的颜色写法也必须保住：主题色以后可能来自取色器或 CSS 变量
const COLORS = ['#0F766E', 'rgb(15, 118, 110)', 'hsl(174, 77%, 26%)', 'var(--brand-1)'];
// 这些组合下 strong 的样式不引用主题色或强调色
const COLORLESS = new Set(['plain-bold']);

const strongStyle = (html: string) => html.match(/<strong style="([^"]*)"/)?.[1] ?? '';

test('emphasis styles survive sanitizing for every layout and color format', () => {
  for (const color of COLORS) {
    const theme = { ...DEFAULT_THEME, primary: color, highlight: color, emphasis: color };
    for (const layout of Object.values(LAYOUT_STYLES)) {
      for (const emphasisStyle of EMPHASIS_STYLES) {
        const emphasis = { ...DEFAULT_EMPHASIS_CONFIG, styleId: emphasisStyle.id, color };
        const [block] = parseMarkdownToJSON('正文里的**重点**内容', theme, layout, emphasis);
        const style = strongStyle(String(block.content));
        const label = `${layout.id}/${emphasisStyle.id}/${color}`;
        assert.ok(style.includes('font-weight'), `${label}: strong lost its style → ${block.content}`);
        const usesColor = !COLORLESS.has(emphasisStyle.id);
        if (usesColor) assert.ok(style.replace(/\s/g, '').includes(color.replace(/\s/g, '')), `${label}: color dropped → ${style}`);
      }
    }
  }
});

test('dangerous markup is removed', () => {
  const cases: Array<[string, RegExp]> = [
    ['<a href="javascript:alert(1)">x</a>', /javascript:/i],
    ['<img src="x" onerror="alert(1)">', /onerror/i],
    ['<span style="background:url(https://evil.example/x)">x</span>', /url\(/i],
    ['<svg onload="alert(1)"></svg>', /<svg|onload/i],
    ['<iframe src="https://evil.example"></iframe>', /<iframe/i],
    ['<img src="data:image/svg+xml;base64,PHN2Zz4=">', /svg\+xml/i],
  ];
  for (const [input, forbidden] of cases) {
    assert.doesNotMatch(sanitizeArticleHtml(input), forbidden, input);
  }
});

test('cached results are identical to fresh results', () => {
  const html = '<p style="color:#123456"><strong style="font-weight:700">a</strong></p>';
  assert.equal(sanitizeArticleHtml(html), sanitizeArticleHtml(html));
});

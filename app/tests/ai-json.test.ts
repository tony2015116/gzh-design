import test from 'node:test';
import assert from 'node:assert/strict';
import { parseXhsDeck } from '../src/ai/xhsCards';

const deck = (source: string) => JSON.stringify({
  system: 'editorial',
  cards: [
    { layout: 'cover', title: '三步上手', subtitle: '', points: [] },
    { layout: 'quote', quote: '好工具让人专注内容', source },
    { layout: 'summary', heading: '记住这些', items: [{ label: '先写', detail: '再排' }, { label: '后排', detail: '再发' }] },
  ],
});

test('strict JSON containing URLs is parsed as-is', () => {
  const parsed = parseXhsDeck(deck('https://example.com/a'));
  const quote = parsed.cards.find((card) => card.layout === 'quote');
  assert.equal(quote?.layout === 'quote' ? quote.source : '', 'https://exa…' /* source 上限 12 字 */);
});

test('relaxed parsing strips comments and trailing commas but keeps URLs', () => {
  const raw = deck('https://x.co').replace('"cards":[', '"cards":[ // 卡片列表\n').replace(/\]\}$/, ',]}');
  const parsed = parseXhsDeck(raw);
  assert.equal(parsed.cards.length, 3);
  const quote = parsed.cards.find((card) => card.layout === 'quote');
  assert.equal(quote?.layout === 'quote' ? quote.source : '', 'https://x.co');
});

test('non-JSON output is rejected with a readable message', () => {
  assert.throws(() => parseXhsDeck('抱歉，我无法完成'), /不是有效 JSON/);
});

import { getAuthMode } from '../services/accessControl';
import { getAuthToken } from '../services/authService';
import { loadR2Config } from '../services/imageUpload';
import { ossChatCompletion, resolveChatEndpoint } from './chatCompletion';
import { XHS_THEME_PACKS } from '../components/ui/XhsCard';
import type { XhsCardSpec } from '../components/ui/XhsCard';

export interface XhsDeck {
  theme: string;
  cards: XhsCardSpec[];
}

const THEME_IDS = XHS_THEME_PACKS.map((t) => t.id);

// 内容规划方法论（压缩阶梯 / 页面角色 / 页数指导 / 钩子句式）参考了公开的
// guizang-social-card-skill 的设计思想，此处为重新表述，未复制其原文。
const XHS_CARDS_PROMPT = `
你是一位资深的小红书图文策划。请通读用户的 Markdown 文章，把它改写成一套小红书轮播图文卡片。

【内容规划方法】
- 图集是文章的视觉大纲：先提炼一句核心主张，再给出读者能收获什么的承诺，然后把正文拆成 4-8 个要点，每个要点一页。不要把全文搬上卡片。
- 页数指导：短文（600-1000 字）做 5-7 张；长文（1000-1800 字）做 7-9 张；更长则压缩到 9 张以内。
- 页面角色要错开，不要每张都是同一种卡片：钩子封面、清单、步骤流、前后对比、金句、数据、总结页，按内容挑选最合适的组合。
- 第一张必须是 cover，最后一张建议 summary。
- 文案规则：标题口语、锋利，用动词和结果，不用"背景介绍"这类抽象标签；封面钩子参考"先看这 5 个点""我替你踩过坑了"这种具体承诺，禁止空泛吆喝和标题党。
- 每页都要有一个 kicker（分类小标签，如 "AI TOOL · 2026"、"攻略 · 新手向"），不超过 16 字。

【版式与字数硬上限（超限必须砍文案，不允许堆砌）】
- cover: {"layout":"cover","kicker","title","subtitle","points":[]} — title ≤16 字，subtitle ≤24 字，points 0-4 条每条 ≤12 字
- checklist: {"layout":"checklist","kicker","heading","items":[{"label","detail"}]} — heading ≤18 字，3-6 条，label ≤12 字，detail ≤24 字
- steps: {"layout":"steps","kicker","heading","steps":[{"title","desc"}]} — 3-5 步，title ≤10 字，desc ≤22 字
- compare: {"layout":"compare","kicker","heading","before":{"label","points":[]},"after":{"label","points":[]}} — 每侧 2-4 条，每条 ≤16 字
- quote: {"layout":"quote","kicker","quote","source"} — quote ≤40 字，source ≤16 字；整套图最多出现一次
- data: {"layout":"data","kicker","heading","rows":[{"label","value","pct"}]} — 仅当文中有真实数字时使用，3-6 行，label ≤8 字，value ≤8 字，pct 为 0-100 的相对比例；禁止编造数据
- summary: {"layout":"summary","kicker","heading","items":[{"label","detail"}],"closing"} — 3-5 条，closing 是一句 ≤24 字的收尾金句

【主题】
theme 只能从 [${THEME_IDS.map((t) => `"${t}"`).join(', ')}] 中选择：科技/AI/方法论选 "indigo-porcelain"，通用选 "ink-classic"，自然/户外选 "forest-ink"，人文/阅读选 "kraft-paper"，年轻/消费选 "swiss-lemon"，游戏/影视/夜间题材选 "midnight-ink"。

只返回一个 JSON 对象，不要输出任何解释或代码围栏：
{"theme": "ink-classic", "cards": [{"layout": "cover", ...}]}
`;

// ---------------------------------------------------------------------------
// 解析与校验：每个版式执行字数/条数硬上限，超限截断，非法卡片丢弃
// ---------------------------------------------------------------------------

const cut = (value: unknown, max: number): string =>
  typeof value === 'string' ? (value.length > max ? `${value.slice(0, max - 1)}…` : value) : '';

const textList = (value: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(value) ? value.map((v) => cut(v, maxLen)).filter(Boolean).slice(0, maxItems) : [];

const labelDetails = (value: unknown, maxItems: number, labelMax: number, detailMax: number) =>
  Array.isArray(value)
    ? value
        .map((v: any) => ({ label: cut(v?.label, labelMax), detail: cut(v?.detail, detailMax) }))
        .filter((v) => v.label)
        .slice(0, maxItems)
    : [];

const sanitizeCard = (raw: any): XhsCardSpec | null => {
  if (!raw || typeof raw !== 'object') return null;
  const kicker = cut(raw.kicker, 16);

  switch (raw.layout) {
    case 'cover': {
      const title = cut(raw.title, 16);
      if (!title) return null;
      return { layout: 'cover', kicker, title, subtitle: cut(raw.subtitle, 24), points: textList(raw.points, 4, 12) };
    }
    case 'checklist': {
      const heading = cut(raw.heading, 18);
      const items = labelDetails(raw.items, 6, 12, 24);
      if (!heading || items.length < 2) return null;
      return { layout: 'checklist', kicker, heading, items };
    }
    case 'steps': {
      const heading = cut(raw.heading, 18);
      const steps = Array.isArray(raw.steps)
        ? raw.steps
            .map((s: any) => ({ title: cut(s?.title, 10), desc: cut(s?.desc, 22) }))
            .filter((s: { title: string }) => s.title)
            .slice(0, 5)
        : [];
      if (!heading || steps.length < 2) return null;
      return { layout: 'steps', kicker, heading, steps };
    }
    case 'compare': {
      const heading = cut(raw.heading, 18);
      const before = { label: cut(raw.before?.label, 8) || '之前', points: textList(raw.before?.points, 4, 16) };
      const after = { label: cut(raw.after?.label, 8) || '之后', points: textList(raw.after?.points, 4, 16) };
      if (!heading || before.points.length === 0 || after.points.length === 0) return null;
      return { layout: 'compare', kicker, heading, before, after };
    }
    case 'quote': {
      const quote = cut(raw.quote, 40);
      if (!quote) return null;
      return { layout: 'quote', kicker, quote, source: cut(raw.source, 16) };
    }
    case 'data': {
      const heading = cut(raw.heading, 18);
      const rows = Array.isArray(raw.rows)
        ? raw.rows
            .map((r: any) => ({
              label: cut(r?.label, 8),
              value: cut(r?.value, 8),
              pct: typeof r?.pct === 'number' ? Math.min(100, Math.max(0, Math.round(r.pct))) : 0,
            }))
            .filter((r: { label: string; value: string }) => r.label && r.value)
            .slice(0, 6)
        : [];
      if (!heading || rows.length < 2) return null;
      return { layout: 'data', kicker, heading, rows };
    }
    case 'summary': {
      const heading = cut(raw.heading, 18);
      const items = labelDetails(raw.items, 5, 12, 24);
      if (!heading || items.length < 2) return null;
      return { layout: 'summary', kicker, heading, items, closing: cut(raw.closing, 24) };
    }
    default:
      return null;
  }
};

export const parseXhsDeck = (content: string): XhsDeck => {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('AI 返回的内容不是有效 JSON，请重试。');
  }
  const data = JSON.parse(content.slice(start, end + 1));

  const theme = THEME_IDS.includes(data?.theme) ? data.theme : THEME_IDS[0];
  const cards = (Array.isArray(data?.cards) ? data.cards : [])
    .map(sanitizeCard)
    .filter((c: XhsCardSpec | null): c is XhsCardSpec => Boolean(c))
    .slice(0, 9);

  // 第一张必须是封面：AI 没给就用文章级兜底封面
  if (cards.length === 0 || cards[0].layout !== 'cover') {
    cards.unshift({
      layout: 'cover',
      kicker: '图文笔记',
      title: '这篇文章讲了什么',
      subtitle: '',
      points: [],
    });
  }

  if (cards.length < 3) {
    throw new Error('AI 生成的卡片数量太少，请重试。');
  }
  return { theme, cards };
};

// ---------------------------------------------------------------------------
// 调用：online 走 Worker /api/xhs-cards，OSS 浏览器直连（dev 走同源代理）
// ---------------------------------------------------------------------------

export const generateXhsCards = async (markdown: string): Promise<XhsDeck> => {
  if (!markdown.trim()) {
    throw new Error('正文为空，无法生成图文。');
  }

  const isOnlineMode = import.meta.env.VITE_APP_MODE === 'online';
  const baseUrl = localStorage.getItem('openai_api_base') || '';
  const model = localStorage.getItem('openai_model') || '';

  if (isOnlineMode) {
    const r2Config = loadR2Config();
    const workerUrl = r2Config?.workerUrl || '';
    const secret = r2Config?.uploadSecret;
    const authMode = getAuthMode();
    const authToken = getAuthToken();
    const bearerToken = authMode === 'real' ? authToken : authToken || secret;

    if (!workerUrl) {
      throw new Error('未配置 Worker URL，请先在在线模式配置可用的 Worker 地址。');
    }

    const response = await fetch(`${workerUrl.replace(/\/$/, '')}/api/xhs-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify({
        markdown,
        baseUrl: baseUrl || undefined,
        model: model || undefined,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text().catch(() => '');
      let errObj: any = {};
      try {
        errObj = JSON.parse(errTxt);
      } catch { /* 忽略解析失败，使用兜底错误信息 */ }
      throw new Error(errObj.error || `云端 AI 接口请求失败 (Status: ${response.status})`);
    }

    const data = await response.json();
    return parseXhsDeck(data?.choices?.[0]?.message?.content || '');
  }

  const apiKey = localStorage.getItem('openai_api_key') || '';
  if (!apiKey) {
    throw new Error('需要先在设置中配置 API Key，才能使用 AI 图文生成。');
  }

  const content = await ossChatCompletion({
    endpoint: resolveChatEndpoint(baseUrl),
    apiKey,
    model: model || 'gpt-4o',
    systemPrompt: XHS_CARDS_PROMPT,
    userContent: markdown,
    temperature: 0.7,
  });
  return parseXhsDeck(content);
};

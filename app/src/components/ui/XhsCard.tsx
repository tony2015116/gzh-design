import type { CSSProperties } from 'react';

export const XHS_CARD_WIDTH = 1080;
export const XHS_CARD_HEIGHT = 1440;

// ---------------------------------------------------------------------------
// 主题包：预设三色套装（背景 / 正文 / 强调），AI 与用户都只能整套选择
// ---------------------------------------------------------------------------

export interface XhsThemePack {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  /** 次要文字色 */
  subtle: string;
  /** 发丝线颜色 */
  line: string;
  /** 压在强调色上的文字色 */
  onAccent: string;
}

export const XHS_THEME_PACKS: XhsThemePack[] = [
  {
    id: 'ink-classic',
    name: '墨水经典',
    bg: '#F4F1E9',
    fg: '#17150F',
    accent: '#A63A2E',
    subtle: 'rgba(23,21,15,0.62)',
    line: 'rgba(23,21,15,0.18)',
    onAccent: '#F4F1E9',
  },
  {
    id: 'indigo-porcelain',
    name: '靛蓝瓷',
    bg: '#F1F3F5',
    fg: '#0A1F3D',
    accent: '#002FA7',
    subtle: 'rgba(10,31,61,0.60)',
    line: 'rgba(10,31,61,0.16)',
    onAccent: '#F1F3F5',
  },
  {
    id: 'forest-ink',
    name: '森林墨',
    bg: '#F5F1E6',
    fg: '#1A2E1F',
    accent: '#33623C',
    subtle: 'rgba(26,46,31,0.62)',
    line: 'rgba(26,46,31,0.18)',
    onAccent: '#F5F1E6',
  },
  {
    id: 'kraft-paper',
    name: '牛皮纸',
    bg: '#EDDFC6',
    fg: '#2A1E13',
    accent: '#9A5B24',
    subtle: 'rgba(42,30,19,0.62)',
    line: 'rgba(42,30,19,0.20)',
    onAccent: '#EDDFC6',
  },
  {
    id: 'swiss-lemon',
    name: '柠檬黄',
    bg: '#FCFBF4',
    fg: '#141414',
    accent: '#E0B400',
    subtle: 'rgba(20,20,20,0.60)',
    line: 'rgba(20,20,20,0.16)',
    onAccent: '#141414',
  },
  {
    id: 'midnight-ink',
    name: '午夜墨',
    bg: '#14120F',
    fg: '#ECE2CF',
    accent: '#D4A04A',
    subtle: 'rgba(236,226,207,0.60)',
    line: 'rgba(236,226,207,0.22)',
    onAccent: '#14120F',
  },
];

export const getXhsTheme = (id: string): XhsThemePack =>
  XHS_THEME_PACKS.find((t) => t.id === id) ?? XHS_THEME_PACKS[0];

// ---------------------------------------------------------------------------
// 卡片规格：AI 返回的 JSON 结构，每个版式都有字数硬上限（见 ai/xhsCards.ts）
// ---------------------------------------------------------------------------

export type XhsCardSpec =
  | { layout: 'cover'; kicker: string; title: string; subtitle: string; points: string[] }
  | { layout: 'checklist'; kicker: string; heading: string; items: { label: string; detail: string }[] }
  | { layout: 'steps'; kicker: string; heading: string; steps: { title: string; desc: string }[] }
  | {
      layout: 'compare';
      kicker: string;
      heading: string;
      before: { label: string; points: string[] };
      after: { label: string; points: string[] };
    }
  | { layout: 'quote'; kicker: string; quote: string; source: string }
  | { layout: 'data'; kicker: string; heading: string; rows: { label: string; value: string; pct: number }[] }
  | { layout: 'summary'; kicker: string; heading: string; items: { label: string; detail: string }[]; closing: string };

export const XHS_LAYOUT_IDS = [
  'cover',
  'checklist',
  'steps',
  'compare',
  'quote',
  'data',
  'summary',
] as const;

export type XhsLayoutId = (typeof XHS_LAYOUT_IDS)[number];

// ---------------------------------------------------------------------------
// 共享排版原子
// ---------------------------------------------------------------------------

const SERIF = "'Noto Serif SC', 'Songti SC', 'SimSun', serif";
const SANS = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace";

interface AtomProps {
  theme: XhsThemePack;
}

function Kicker({ theme, children }: AtomProps & { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 24,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: theme.subtle,
      }}
    >
      {children}
    </div>
  );
}

function Footer({ theme, page, total }: AtomProps & { page: number; total: number }) {
  const fmt = (n: number) => String(n).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 56,
        borderTop: `1px solid ${theme.line}`,
        paddingTop: 20,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 22,
        letterSpacing: '0.2em',
        color: theme.subtle,
      }}
    >
      <span>REDPRESS</span>
      <span>
        {fmt(page)} / {fmt(total)}
      </span>
    </div>
  );
}

const cardBase = (theme: XhsThemePack): CSSProperties => ({
  width: XHS_CARD_WIDTH,
  height: XHS_CARD_HEIGHT,
  position: 'relative',
  overflow: 'hidden',
  background: theme.bg,
  color: theme.fg,
  fontFamily: SANS,
  boxSizing: 'border-box',
  padding: '88px 80px 150px',
  display: 'flex',
  flexDirection: 'column',
});

const hairline = (theme: XhsThemePack): CSSProperties => ({
  borderTop: `1px solid ${theme.line}`,
});

// ---------------------------------------------------------------------------
// 版式实现
// ---------------------------------------------------------------------------

function CoverCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'cover' }>; theme: XhsThemePack }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Kicker theme={theme}>{card.kicker}</Kicker>
        <div style={{ width: 64, height: 64, background: theme.accent }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 108,
            lineHeight: 1.22,
            letterSpacing: '0.04em',
            wordBreak: 'normal', overflowWrap: 'anywhere',
          }}
        >
          {card.title}
        </div>
        {card.subtitle && (
          <div style={{ marginTop: 40, fontSize: 38, lineHeight: 1.5, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            {card.subtitle}
          </div>
        )}
        <div style={{ marginTop: 56, width: 120, height: 10, background: theme.accent }} />
      </div>
      {card.points.length > 0 && (
        <div
          style={{
            ...hairline(theme),
            paddingTop: 28,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px 28px',
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          {card.points.map((p, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 10, height: 10, background: theme.accent, display: 'inline-block' }} />
              {p}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function ChecklistCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'checklist' }>; theme: XhsThemePack }) {
  return (
    <>
      <Kicker theme={theme}>{card.kicker}</Kicker>
      <div style={{ marginTop: 28, fontSize: 68, fontWeight: 800, lineHeight: 1.25, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 48, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {card.items.map((item, i) => (
          <div
            key={i}
            style={{
              ...hairline(theme),
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 36,
              padding: '12px 0',
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, color: theme.accent, minWidth: 72 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{item.label}</div>
              {item.detail && (
                <div style={{ marginTop: 8, fontSize: 30, lineHeight: 1.45, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                  {item.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StepsCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'steps' }>; theme: XhsThemePack }) {
  return (
    <>
      <Kicker theme={theme}>{card.kicker}</Kicker>
      <div style={{ marginTop: 28, fontSize: 68, fontWeight: 800, lineHeight: 1.25, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 56, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {card.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
            <div
              style={{
                minWidth: 96,
                height: 96,
                background: i === 0 ? theme.accent : 'transparent',
                border: `2px solid ${theme.accent}`,
                color: i === 0 ? theme.onAccent : theme.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 38,
                fontWeight: 700,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{step.title}</div>
              {step.desc && (
                <div style={{ marginTop: 10, fontSize: 31, lineHeight: 1.5, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                  {step.desc}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CompareCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'compare' }>; theme: XhsThemePack }) {
  const block = (data: { label: string; points: string[] }, dimmed: boolean) => (
    <div
      style={{
        flex: 1,
        border: `2px solid ${dimmed ? theme.line : theme.accent}`,
        padding: '44px 44px 36px',
        opacity: dimmed ? 0.62 : 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          alignSelf: 'flex-start',
          background: dimmed ? 'transparent' : theme.accent,
          border: dimmed ? `1px solid ${theme.line}` : 'none',
          color: dimmed ? theme.subtle : theme.onAccent,
          fontFamily: MONO,
          fontSize: 24,
          letterSpacing: '0.18em',
          padding: '10px 20px',
          textTransform: 'uppercase',
        }}
      >
        {data.label}
      </div>
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {data.points.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, fontSize: 33, lineHeight: 1.45, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            <span style={{ color: dimmed ? theme.subtle : theme.accent, fontWeight: 800 }}>{dimmed ? '×' : '✓'}</span>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Kicker theme={theme}>{card.kicker}</Kicker>
      <div style={{ marginTop: 28, fontSize: 68, fontWeight: 800, lineHeight: 1.25, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 48, flex: 1, display: 'flex', flexDirection: 'column', gap: 36 }}>
        {block(card.before, true)}
        {block(card.after, false)}
      </div>
    </>
  );
}

function QuoteCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'quote' }>; theme: XhsThemePack }) {
  return (
    <>
      <Kicker theme={theme}>{card.kicker}</Kicker>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: 200, lineHeight: 0.6, color: theme.accent, marginBottom: 48 }}>
          &ldquo;
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 78,
            lineHeight: 1.4,
            letterSpacing: '0.03em',
            wordBreak: 'normal', overflowWrap: 'anywhere',
          }}
        >
          {card.quote}
        </div>
      </div>
      {card.source && (
        <div style={{ ...hairline(theme), paddingTop: 26, fontSize: 30, color: theme.subtle }}>{card.source}</div>
      )}
    </>
  );
}

function DataCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'data' }>; theme: XhsThemePack }) {
  return (
    <>
      <Kicker theme={theme}>{card.kicker}</Kicker>
      <div style={{ marginTop: 28, fontSize: 68, fontWeight: 800, lineHeight: 1.25, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 56, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {card.rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontSize: 36, fontWeight: 700, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{row.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, color: theme.accent }}>{row.value}</span>
            </div>
            <div style={{ height: 28, background: theme.line }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, row.pct))}%`, background: theme.accent }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SummaryCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'summary' }>; theme: XhsThemePack }) {
  return (
    <>
      <Kicker theme={theme}>{card.kicker}</Kicker>
      <div style={{ marginTop: 28, fontSize: 68, fontWeight: 800, lineHeight: 1.25, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 44, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {card.items.map((item, i) => (
          <div key={i} style={{ ...hairline(theme), padding: '26px 0', display: 'flex', gap: 28, alignItems: 'baseline' }}>
            <span style={{ fontFamily: MONO, fontSize: 30, color: theme.accent, fontWeight: 700 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <span style={{ fontSize: 36, fontWeight: 700, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{item.label}</span>
              {item.detail && (
                <span style={{ fontSize: 30, color: theme.subtle, marginLeft: 18, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                  {item.detail}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {card.closing && (
        <div
          style={{
            marginTop: 32,
            background: theme.accent,
            color: theme.onAccent,
            fontFamily: SERIF,
            fontSize: 42,
            fontWeight: 600,
            lineHeight: 1.4,
            padding: '32px 40px',
            wordBreak: 'normal', overflowWrap: 'anywhere',
          }}
        >
          {card.closing}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 入口组件
// ---------------------------------------------------------------------------

export interface XhsCardProps {
  card: XhsCardSpec;
  theme: XhsThemePack;
  page: number;
  total: number;
}

export function XhsCard({ card, theme, page, total }: XhsCardProps) {
  return (
    <div style={cardBase(theme)}>
      {card.layout === 'cover' && <CoverCard card={card} theme={theme} />}
      {card.layout === 'checklist' && <ChecklistCard card={card} theme={theme} />}
      {card.layout === 'steps' && <StepsCard card={card} theme={theme} />}
      {card.layout === 'compare' && <CompareCard card={card} theme={theme} />}
      {card.layout === 'quote' && <QuoteCard card={card} theme={theme} />}
      {card.layout === 'data' && <DataCard card={card} theme={theme} />}
      {card.layout === 'summary' && <SummaryCard card={card} theme={theme} />}
      <Footer theme={theme} page={page} total={total} />
    </div>
  );
}

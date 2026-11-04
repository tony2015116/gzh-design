import type { CSSProperties } from 'react';
import type { XhsCardSpec } from './XhsCard';

// ---------------------------------------------------------------------------
// 高概念海报：单一强烈饱和色 + 巨型粗黑体 + 极简装饰。
// 参考 zhouwei713/article-visual-director 里的 high-concept-poster 视觉 DNA。
// 定位：观点宣言 / 金句封面 / 反直觉判断 / 立场型内容。
// 这套系统故意"信息密度低、视觉密度高"，靠一句话说服人。
// ---------------------------------------------------------------------------

export interface XhsPosterTheme {
  id: string;
  name: string;
  bg: string;
  fg: string;
  /** 强调元素（横条、圆点、数字） */
  accent: string;
  subtle: string;
}

export const XHS_POSTER_THEMES: XhsPosterTheme[] = [
  {
    id: 'poster-neon',
    name: '荧光黄',
    bg: '#F4EE28',
    fg: '#0A0A0A',
    accent: '#0A0A0A',
    subtle: 'rgba(10,10,10,0.62)',
  },
  {
    id: 'poster-hot',
    name: '灼热粉',
    bg: '#FF3D7A',
    fg: '#0A0A0A',
    accent: '#FFFFFF',
    subtle: 'rgba(10,10,10,0.62)',
  },
  {
    id: 'poster-electric',
    name: '电子红',
    bg: '#E4382A',
    fg: '#FFFFFF',
    accent: '#F4EE28',
    subtle: 'rgba(255,255,255,0.7)',
  },
  {
    id: 'poster-ice',
    name: '碎冰蓝',
    bg: '#7EC8E3',
    fg: '#0A1F33',
    accent: '#0A1F33',
    subtle: 'rgba(10,31,51,0.62)',
  },
  {
    id: 'poster-void',
    name: '虚空黑',
    bg: '#0A0A0A',
    fg: '#F4EE28',
    accent: '#F4EE28',
    subtle: 'rgba(244,238,40,0.55)',
  },
  {
    id: 'poster-cream',
    name: '奶油底黑字',
    bg: '#F5F0E1',
    fg: '#141414',
    accent: '#E24545',
    subtle: 'rgba(20,20,20,0.6)',
  },
];

export const getPosterTheme = (id: string): XhsPosterTheme =>
  XHS_POSTER_THEMES.find((t) => t.id === id) ?? XHS_POSTER_THEMES[0];

const SANS = "'PingFang SC Bold', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

// ---------------------------------------------------------------------------
// 共享原子：一切都要"重"
// ---------------------------------------------------------------------------

const cardBase = (theme: XhsPosterTheme): CSSProperties => ({
  width: 1080,
  height: 1440,
  position: 'relative',
  overflow: 'hidden',
  background: theme.bg,
  color: theme.fg,
  fontFamily: SANS,
  boxSizing: 'border-box',
  padding: '80px 72px 140px',
  display: 'flex',
  flexDirection: 'column',
});

/** 粗黑边横条：海报里作为顶部/分节标记 */
const barLabel = (theme: XhsPosterTheme, size: 'sm' | 'lg' = 'sm'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  background: theme.fg,
  color: theme.bg,
  fontSize: size === 'lg' ? 32 : 24,
  fontWeight: 900,
  letterSpacing: '0.16em',
  padding: size === 'lg' ? '14px 28px' : '10px 22px',
});

/** 巨大数字：作为序号装饰 */
const bigNumber = (theme: XhsPosterTheme): CSSProperties => ({
  fontSize: 168,
  fontWeight: 900,
  color: theme.accent,
  lineHeight: 0.85,
  letterSpacing: '-0.04em',
});

/** 页脚：粗黑横条 + 页码 */
function PosterFooter({ theme, page, total }: { theme: XhsPosterTheme; page: number; total: number }) {
  const fmt = (n: number) => String(n).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 72,
        bottom: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <span style={{ flex: 1, height: 6, background: theme.fg }} />
      <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.2em', color: theme.fg }}>
        {fmt(page)} / {fmt(total)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 版式实现：所有版面都尽可能少信息、大字号
// ---------------------------------------------------------------------------

function CoverCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'cover' }>; theme: XhsPosterTheme }) {
  return (
    <>
      <span style={barLabel(theme)}>{card.kicker || 'MANIFESTO'}</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: 176,
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {card.title}
        </div>
        {card.subtitle && (
          <div
            style={{
              marginTop: 44,
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.35,
              color: theme.subtle,
              wordBreak: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
            {card.subtitle}
          </div>
        )}
      </div>
      {card.points.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {card.points.map((p, i) => (
            <span
              key={i}
              style={{
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: '0.06em',
                padding: '10px 20px',
                border: `4px solid ${theme.fg}`,
                background: 'transparent',
                color: theme.fg,
              }}
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function ChecklistCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'checklist' }>; theme: XhsPosterTheme }) {
  return (
    <>
      <span style={barLabel(theme)}>{card.kicker || 'LIST'}</span>
      <div
        style={{
          marginTop: 32,
          fontSize: 86,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          wordBreak: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {card.heading}
      </div>
      <div style={{ marginTop: 44, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {card.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 24,
              borderTop: `4px solid ${theme.fg}`,
              paddingTop: 16,
            }}
          >
            <span style={{ fontSize: 60, fontWeight: 900, minWidth: 92, lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  wordBreak: 'normal',
                  overflowWrap: 'anywhere',
                }}
              >
                {item.label}
              </div>
              {item.detail && (
                <div style={{ marginTop: 4, fontSize: 26, lineHeight: 1.4, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
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

function StepsCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'steps' }>; theme: XhsPosterTheme }) {
  return (
    <>
      <span style={barLabel(theme)}>{card.kicker || 'STEPS'}</span>
      <div
        style={{
          marginTop: 32,
          fontSize: 86,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          wordBreak: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {card.heading}
      </div>
      <div style={{ marginTop: 44, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {card.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <span style={bigNumber(theme)}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  wordBreak: 'normal',
                  overflowWrap: 'anywhere',
                }}
              >
                {step.title}
              </div>
              {step.desc && (
                <div style={{ marginTop: 6, fontSize: 28, lineHeight: 1.4, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
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

function CompareCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'compare' }>; theme: XhsPosterTheme }) {
  const block = (data: { label: string; points: string[] }, good: boolean) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          alignSelf: 'flex-start',
          background: good ? theme.fg : 'transparent',
          color: good ? theme.bg : theme.fg,
          border: `4px solid ${theme.fg}`,
          padding: '10px 22px',
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: '0.14em',
          marginBottom: 20,
        }}
      >
        {good ? '✓' : '✗'} {data.label}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.points.map((p, i) => (
          <div
            key={i}
            style={{
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 1.25,
              wordBreak: 'normal',
              overflowWrap: 'anywhere',
              textDecoration: good ? 'none' : 'line-through',
              color: good ? theme.fg : theme.subtle,
            }}
          >
            {p}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <>
      <span style={barLabel(theme)}>{card.kicker || 'VS'}</span>
      <div
        style={{
          marginTop: 32,
          fontSize: 76,
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          wordBreak: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {card.heading}
      </div>
      <div style={{ marginTop: 44, flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
        {block(card.before, false)}
        {block(card.after, true)}
      </div>
    </>
  );
}

function QuoteCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'quote' }>; theme: XhsPosterTheme }) {
  return (
    <>
      <span style={barLabel(theme, 'lg')}>{card.kicker || 'STATEMENT'}</span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            lineHeight: 0.72,
            color: theme.accent,
            marginBottom: 12,
          }}
        >
          "
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {card.quote}
        </div>
        {card.source && (
          <div style={{ marginTop: 40, fontSize: 30, fontWeight: 700, color: theme.subtle }}>— {card.source}</div>
        )}
      </div>
    </>
  );
}

function DataCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'data' }>; theme: XhsPosterTheme }) {
  return (
    <>
      <span style={barLabel(theme)}>{card.kicker || 'DATA'}</span>
      <div
        style={{
          marginTop: 32,
          fontSize: 76,
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          wordBreak: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {card.heading}
      </div>
      <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {card.rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  wordBreak: 'normal',
                  overflowWrap: 'anywhere',
                }}
              >
                {row.label}
              </span>
              <span style={{ fontSize: 68, fontWeight: 900, letterSpacing: '-0.02em' }}>{row.value}</span>
            </div>
            <div style={{ marginTop: 8, height: 20, background: `${theme.fg}22` }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, row.pct))}%`,
                  background: theme.fg,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SummaryCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'summary' }>; theme: XhsPosterTheme }) {
  return (
    <>
      <span style={barLabel(theme)}>{card.kicker || 'TAKEAWAYS'}</span>
      <div
        style={{
          marginTop: 32,
          fontSize: 76,
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          wordBreak: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {card.heading}
      </div>
      <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {card.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 20, borderTop: `4px solid ${theme.fg}`, paddingTop: 14 }}>
            <span style={{ fontSize: 54, fontWeight: 900, minWidth: 82, lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{item.label}</div>
              {item.detail && (
                <div style={{ marginTop: 4, fontSize: 24, lineHeight: 1.4, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                  {item.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {card.closing && (
        <div
          style={{
            marginTop: 20,
            background: theme.fg,
            color: theme.bg,
            padding: '22px 28px',
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: '0.02em',
            lineHeight: 1.25,
            textAlign: 'center',
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
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

export interface XhsPosterCardProps {
  card: XhsCardSpec;
  theme: XhsPosterTheme;
  page: number;
  total: number;
}

export function XhsPosterCard({ card, theme, page, total }: XhsPosterCardProps) {
  return (
    <div style={cardBase(theme)}>
      {card.layout === 'cover' && <CoverCard card={card} theme={theme} />}
      {card.layout === 'checklist' && <ChecklistCard card={card} theme={theme} />}
      {card.layout === 'steps' && <StepsCard card={card} theme={theme} />}
      {card.layout === 'compare' && <CompareCard card={card} theme={theme} />}
      {card.layout === 'quote' && <QuoteCard card={card} theme={theme} />}
      {card.layout === 'data' && <DataCard card={card} theme={theme} />}
      {card.layout === 'summary' && <SummaryCard card={card} theme={theme} />}
      <PosterFooter theme={theme} page={page} total={total} />
    </div>
  );
}

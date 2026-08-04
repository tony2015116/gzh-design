import type { CSSProperties } from 'react';
import type { XhsCardSpec } from './XhsCard';

// ---------------------------------------------------------------------------
// 简约风：现代极简 —— 纯白/浅灰底、细字重大标题、大量留白、单点强调色。
// 刻意区别于杂志风：不用衬线、不用发丝线分栏、不用 mono 大写标签、
// 不用直角色块，改用细字重 + 圆角软元素 + 底部细进度条。
// 与 XhsCard / XhsStickerCard 共用同一份 XhsCardSpec 数据。
// ---------------------------------------------------------------------------

export interface XhsMinimalTheme {
  id: string;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  /** 软元素底色（浅灰块） */
  soft: string;
  subtle: string;
}

export const XHS_MINIMAL_THEMES: XhsMinimalTheme[] = [
  { id: 'minimal-pure', name: '素白', bg: '#FFFFFF', fg: '#161616', accent: '#161616', soft: '#F4F4F2', subtle: 'rgba(22,22,22,0.45)' },
  { id: 'minimal-caramel', name: '米灰焦糖', bg: '#FAF8F5', fg: '#231F1A', accent: '#C08A3E', soft: '#F1EDE7', subtle: 'rgba(35,31,26,0.45)' },
  { id: 'minimal-cobalt', name: '灰白钴蓝', bg: '#F8F9FB', fg: '#1A1D24', accent: '#2F5FD0', soft: '#EEF0F5', subtle: 'rgba(26,29,36,0.45)' },
  { id: 'minimal-coral', name: '粉白珊瑚', bg: '#FCF8F7', fg: '#2A1F21', accent: '#E0606C', soft: '#F6EEED', subtle: 'rgba(42,31,33,0.45)' },
  { id: 'minimal-pine', name: '白绿松针', bg: '#F7FAF8', fg: '#1C2620', accent: '#3E7C59', soft: '#EDF3EF', subtle: 'rgba(28,38,32,0.45)' },
  { id: 'minimal-graphite', name: '石墨灰', bg: '#232427', fg: '#F2F1EE', accent: '#E8C468', soft: '#2E3034', subtle: 'rgba(242,241,238,0.45)' },
];

export const getMinimalTheme = (id: string): XhsMinimalTheme =>
  XHS_MINIMAL_THEMES.find((t) => t.id === id) ?? XHS_MINIMAL_THEMES[0];

const SANS = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

// ---------------------------------------------------------------------------
// 共享原子
// ---------------------------------------------------------------------------

const cardBase = (theme: XhsMinimalTheme): CSSProperties => ({
  width: 1080,
  height: 1440,
  position: 'relative',
  overflow: 'hidden',
  background: theme.bg,
  color: theme.fg,
  fontFamily: SANS,
  boxSizing: 'border-box',
  padding: '96px 88px 130px',
  display: 'flex',
  flexDirection: 'column',
});

/** 极小标签：强调色圆点 + 小字，不用胶囊 */
function Label({ theme, children }: { theme: XhsMinimalTheme; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: theme.accent }} />
      <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: '0.14em', color: theme.subtle }}>{children}</span>
    </div>
  );
}

/** 底部细进度条（代替页码/圆点） */
function ProgressFooter({ theme, page, total }: { theme: XhsMinimalTheme; page: number; total: number }) {
  return (
    <div style={{ position: 'absolute', left: 88, right: 88, bottom: 64, height: 6, borderRadius: 3, background: theme.soft }}>
      <div
        style={{
          height: '100%',
          width: `${(page / total) * 100}%`,
          borderRadius: 3,
          background: theme.accent,
        }}
      />
    </div>
  );
}

/** 巨大的轻字重标题是这套风格的核心 */
const displayTitle: CSSProperties = {
  fontSize: 104,
  fontWeight: 300,
  lineHeight: 1.32,
  letterSpacing: '0.06em',
  wordBreak: 'break-all',
};

const pageHeading: CSSProperties = {
  fontSize: 64,
  fontWeight: 400,
  lineHeight: 1.3,
  letterSpacing: '0.04em',
  wordBreak: 'break-all',
};

/** 幽灵序号：超大半透明数字 */
const ghostNumber = (theme: XhsMinimalTheme): CSSProperties => ({
  fontSize: 64,
  fontWeight: 200,
  color: theme.accent,
  lineHeight: 1,
  minWidth: 92,
});

// ---------------------------------------------------------------------------
// 版式实现
// ---------------------------------------------------------------------------

function CoverCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'cover' }>; theme: XhsMinimalTheme }) {
  return (
    <>
      <Label theme={theme}>{card.kicker || '笔记'}</Label>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={displayTitle}>{card.title}</div>
        <div style={{ marginTop: 52, width: 72, height: 8, borderRadius: 4, background: theme.accent }} />
        {card.subtitle && (
          <div style={{ marginTop: 44, fontSize: 36, fontWeight: 400, lineHeight: 1.55, color: theme.subtle, wordBreak: 'break-all' }}>
            {card.subtitle}
          </div>
        )}
      </div>
      {card.points.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 36px', fontSize: 28, fontWeight: 500, color: theme.subtle }}>
          {card.points.map((p, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent }} />
              {p}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function ChecklistCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'checklist' }>; theme: XhsMinimalTheme }) {
  return (
    <>
      <Label theme={theme}>{card.kicker || '清单'}</Label>
      <div style={{ marginTop: 40, ...pageHeading }}>{card.heading}</div>
      <div style={{ marginTop: 56, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {card.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 32, alignItems: 'center', background: theme.soft, borderRadius: 20, padding: '30px 36px' }}>
            <span style={ghostNumber(theme)}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-all' }}>{item.label}</div>
              {item.detail && (
                <div style={{ marginTop: 6, fontSize: 29, lineHeight: 1.5, color: theme.subtle, wordBreak: 'break-all' }}>
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

function StepsCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'steps' }>; theme: XhsMinimalTheme }) {
  return (
    <>
      <Label theme={theme}>{card.kicker || '步骤'}</Label>
      <div style={{ marginTop: 40, ...pageHeading }}>{card.heading}</div>
      <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {card.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: '18px 0' }}>
            <span style={ghostNumber(theme)}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-all' }}>{step.title}</div>
              {step.desc && (
                <div style={{ marginTop: 8, fontSize: 30, lineHeight: 1.5, color: theme.subtle, wordBreak: 'break-all' }}>
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

function CompareCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'compare' }>; theme: XhsMinimalTheme }) {
  const block = (data: { label: string; points: string[] }, good: boolean) => (
    <div
      style={{
        flex: 1,
        background: good ? theme.soft : 'transparent',
        border: good ? 'none' : `2px solid ${theme.soft}`,
        borderRadius: 24,
        padding: '44px 40px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: good ? theme.accent : theme.subtle }} />
        <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: '0.1em', color: good ? theme.fg : theme.subtle }}>
          {data.label}
        </span>
      </div>
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 22, opacity: good ? 1 : 0.6 }}>
        {data.points.map((p, i) => (
          <div key={i} style={{ fontSize: 32, fontWeight: 400, lineHeight: 1.5, wordBreak: 'break-all' }}>
            {p}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Label theme={theme}>{card.kicker || '对比'}</Label>
      <div style={{ marginTop: 40, ...pageHeading }}>{card.heading}</div>
      <div style={{ marginTop: 48, flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {block(card.before, false)}
        {block(card.after, true)}
      </div>
    </>
  );
}

function QuoteCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'quote' }>; theme: XhsMinimalTheme }) {
  return (
    <>
      <Label theme={theme}>{card.kicker || '划重点'}</Label>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 120, fontWeight: 200, lineHeight: 0.8, color: theme.accent, marginBottom: 40 }}>&ldquo;</div>
        <div style={{ fontSize: 68, fontWeight: 300, lineHeight: 1.5, letterSpacing: '0.04em', wordBreak: 'break-all' }}>
          {card.quote}
        </div>
        {card.source && (
          <div style={{ marginTop: 48, fontSize: 28, fontWeight: 400, color: theme.subtle }}>{card.source}</div>
        )}
      </div>
    </>
  );
}

function DataCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'data' }>; theme: XhsMinimalTheme }) {
  return (
    <>
      <Label theme={theme}>{card.kicker || '数据'}</Label>
      <div style={{ marginTop: 40, ...pageHeading }}>{card.heading}</div>
      <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {card.rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <span style={{ fontSize: 34, fontWeight: 500, wordBreak: 'break-all' }}>{row.label}</span>
              <span style={{ fontSize: 34, fontWeight: 600, color: theme.accent }}>{row.value}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: theme.soft }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, row.pct))}%`,
                  borderRadius: 5,
                  background: theme.accent,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SummaryCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'summary' }>; theme: XhsMinimalTheme }) {
  return (
    <>
      <Label theme={theme}>{card.kicker || '总结'}</Label>
      <div style={{ marginTop: 40, ...pageHeading }}>{card.heading}</div>
      <div style={{ marginTop: 48, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {card.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <span style={ghostNumber(theme)}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <span style={{ fontSize: 38, fontWeight: 600, wordBreak: 'break-all' }}>{item.label}</span>
              {item.detail && (
                <span style={{ fontSize: 30, color: theme.subtle, marginLeft: 20, wordBreak: 'break-all' }}>{item.detail}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {card.closing && (
        <div style={{ marginTop: 36, fontSize: 40, fontWeight: 400, lineHeight: 1.45, color: theme.accent, wordBreak: 'break-all' }}>
          {card.closing}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 入口组件
// ---------------------------------------------------------------------------

export interface XhsMinimalCardProps {
  card: XhsCardSpec;
  theme: XhsMinimalTheme;
  page: number;
  total: number;
}

export function XhsMinimalCard({ card, theme, page, total }: XhsMinimalCardProps) {
  return (
    <div style={cardBase(theme)}>
      {card.layout === 'cover' && <CoverCard card={card} theme={theme} />}
      {card.layout === 'checklist' && <ChecklistCard card={card} theme={theme} />}
      {card.layout === 'steps' && <StepsCard card={card} theme={theme} />}
      {card.layout === 'compare' && <CompareCard card={card} theme={theme} />}
      {card.layout === 'quote' && <QuoteCard card={card} theme={theme} />}
      {card.layout === 'data' && <DataCard card={card} theme={theme} />}
      {card.layout === 'summary' && <SummaryCard card={card} theme={theme} />}
      <ProgressFooter theme={theme} page={page} total={total} />
    </div>
  );
}

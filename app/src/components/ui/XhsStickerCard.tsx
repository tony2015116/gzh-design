import type { CSSProperties } from 'react';
import type { XhsCardSpec } from './XhsCard';

// ---------------------------------------------------------------------------
// 手账笔记风：浅色纸纹底 + 淡网格 + 白色模块卡 + 和纸胶带 + 荧光笔高亮
// 参考真实小红书干货笔记内页：视觉重心在文字，装饰克制，单强调色。
// 与 XhsCard（杂志风）共用同一份 XhsCardSpec 数据，只换渲染皮肤。
// ---------------------------------------------------------------------------

export interface XhsStickerTheme {
  id: string;
  name: string;
  /** 纸面底色 */
  bg: string;
  fg: string;
  /** 唯一强调色 */
  accent: string;
  /** 网格线颜色 */
  grid: string;
  /** 模块卡底色 */
  card: string;
  subtle: string;
  onAccent: string;
}

export const XHS_STICKER_THEMES: XhsStickerTheme[] = [
  {
    id: 'sticker-butter',
    name: '奶纸格',
    bg: '#FAF5EA',
    fg: '#2A2419',
    accent: '#E1553A',
    grid: 'rgba(42,36,25,0.055)',
    card: '#FFFFFF',
    subtle: 'rgba(42,36,25,0.55)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'sticker-sea',
    name: '淡蓝格',
    bg: '#EFF4FA',
    fg: '#1B2A3A',
    accent: '#2B6CB0',
    grid: 'rgba(43,93,142,0.08)',
    card: '#FFFFFF',
    subtle: 'rgba(27,42,58,0.55)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'sticker-peach',
    name: '蜜桃格',
    bg: '#FBF0F1',
    fg: '#33222A',
    accent: '#E14D68',
    grid: 'rgba(120,50,70,0.07)',
    card: '#FFFFFF',
    subtle: 'rgba(51,34,42,0.55)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'sticker-mint',
    name: '薄荷格',
    bg: '#EFF6F0',
    fg: '#1E2E22',
    accent: '#3E8E5A',
    grid: 'rgba(46,110,70,0.08)',
    card: '#FFFFFF',
    subtle: 'rgba(30,46,34,0.55)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'sticker-grape',
    name: '葡萄格',
    bg: '#F4F0FA',
    fg: '#2A2140',
    accent: '#7A5CCC',
    grid: 'rgba(90,70,140,0.08)',
    card: '#FFFFFF',
    subtle: 'rgba(42,33,64,0.55)',
    onAccent: '#FFFFFF',
  },
  {
    id: 'sticker-carbon',
    name: '墨黑纸',
    bg: '#1E1F24',
    fg: '#EDEAE2',
    accent: '#F0B429',
    grid: 'rgba(255,255,255,0.06)',
    card: '#28292F',
    subtle: 'rgba(237,234,226,0.55)',
    onAccent: '#1E1F24',
  },
];

export const getStickerTheme = (id: string): XhsStickerTheme =>
  XHS_STICKER_THEMES.find((t) => t.id === id) ?? XHS_STICKER_THEMES[0];

const SANS = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

// ---------------------------------------------------------------------------
// 共享原子
// ---------------------------------------------------------------------------

/** 纸面 + 淡网格底 */
const cardBase = (theme: XhsStickerTheme): CSSProperties => ({
  width: 1080,
  height: 1440,
  position: 'relative',
  overflow: 'hidden',
  background: theme.bg,
  backgroundImage: `linear-gradient(${theme.grid} 2px, transparent 2px), linear-gradient(90deg, ${theme.grid} 2px, transparent 2px)`,
  backgroundSize: '54px 54px',
  color: theme.fg,
  fontFamily: SANS,
  boxSizing: 'border-box',
  padding: '84px 72px 140px',
  display: 'flex',
  flexDirection: 'column',
});

/** 描边小胶囊标签 */
function Tag({ theme, children }: { theme: XhsStickerTheme; children: React.ReactNode }) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        border: `3px solid ${theme.fg}`,
        borderRadius: 999,
        padding: '10px 26px',
        fontSize: 26,
        fontWeight: 800,
        letterSpacing: '0.06em',
        color: theme.fg,
        background: theme.card,
      }}
    >
      {children}
    </span>
  );
}

/** 和纸胶带：贴在卡片顶部的半透明色条 */
function Tape({ theme, rotate = -3 }: { theme: XhsStickerTheme; rotate?: number }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: -24,
        left: '50%',
        width: 190,
        height: 48,
        transform: `translateX(-50%) rotate(${rotate}deg)`,
        background: theme.accent,
        opacity: 0.32,
        borderRadius: 4,
      }}
    />
  );
}

/** 荧光笔高亮文字 */
const marker = (theme: XhsStickerTheme): CSSProperties => ({
  backgroundImage: `linear-gradient(transparent 58%, ${theme.accent}55 58%, ${theme.accent}55 94%, transparent 94%)`,
  padding: '0 8px',
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
});

/** 白色模块卡（带轻微手账倾斜） */
const paperCard = (theme: XhsStickerTheme, rotate = 0): CSSProperties => ({
  position: 'relative',
  background: theme.card,
  borderRadius: 18,
  border: `2px solid ${theme.grid}`,
  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
  transform: rotate ? `rotate(${rotate}deg)` : undefined,
});

/** 页脚：淡色页码小字 */
function PageFooter({ theme, page, total }: { theme: XhsStickerTheme; page: number; total: number }) {
  const fmt = (n: number) => String(n).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        right: 72,
        bottom: 52,
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: theme.subtle,
      }}
    >
      {fmt(page)} / {fmt(total)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 版式实现
// ---------------------------------------------------------------------------

function CoverCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'cover' }>; theme: XhsStickerTheme }) {
  return (
    <>
      <Tag theme={theme}>{card.kicker || '笔记'}</Tag>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
          <span style={marker(theme)}>{card.title}</span>
        </div>
        <div
          style={{
            marginTop: 44,
            width: 150,
            height: 14,
            borderRadius: 7,
            background: theme.accent,
          }}
        />
        {card.subtitle && (
          <div
            style={{
              ...paperCard(theme, -0.8),
              marginTop: 52,
              alignSelf: 'flex-start',
              maxWidth: 880,
              padding: '30px 40px',
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.45,
              wordBreak: 'normal', overflowWrap: 'anywhere',
            }}
          >
            <Tape theme={theme} />
            {card.subtitle}
          </div>
        )}
      </div>
      {card.points.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {card.points.map((p, i) => (
            <span
              key={i}
              style={{
                background: theme.card,
                border: `3px solid ${theme.accent}`,
                borderRadius: 999,
                padding: '12px 28px',
                fontSize: 28,
                fontWeight: 700,
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

function RowCard({
  theme,
  index,
  title,
  detail,
  rotate = 0,
}: {
  theme: XhsStickerTheme;
  index: number;
  title: string;
  detail?: string;
  rotate?: number;
}) {
  return (
    <div style={{ ...paperCard(theme, rotate), padding: '34px 36px', display: 'flex', gap: 28, alignItems: 'center' }}>
      <span
        style={{
          minWidth: 76,
          height: 76,
          borderRadius: '50%',
          background: theme.accent,
          color: theme.onAccent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 38,
          fontWeight: 900,
        }}
      >
        {index + 1}
      </span>
      <div>
        <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{title}</div>
        {detail && (
          <div style={{ marginTop: 8, fontSize: 30, lineHeight: 1.45, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'checklist' }>; theme: XhsStickerTheme }) {
  return (
    <>
      <Tag theme={theme}>{card.kicker || '清单'}</Tag>
      <div style={{ marginTop: 34, fontSize: 68, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 24, width: 110, height: 12, borderRadius: 6, background: theme.accent }} />
      <div style={{ marginTop: 36, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
        {card.items.map((item, i) => (
          <RowCard key={i} theme={theme} index={i} title={item.label} detail={item.detail} rotate={i % 2 === 0 ? -0.5 : 0.5} />
        ))}
      </div>
    </>
  );
}

function StepsCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'steps' }>; theme: XhsStickerTheme }) {
  return (
    <>
      <Tag theme={theme}>{card.kicker || '步骤'}</Tag>
      <div style={{ marginTop: 34, fontSize: 68, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 24, width: 110, height: 12, borderRadius: 6, background: theme.accent }} />
      <div style={{ marginTop: 36, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
        {card.steps.map((step, i) => (
          <div
            key={i}
            style={{
              ...paperCard(theme, i % 2 === 0 ? 0.5 : -0.5),
              padding: '32px 36px',
              display: 'flex',
              gap: 26,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 56, fontWeight: 900, color: theme.accent, minWidth: 88, lineHeight: 1 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{step.title}</div>
              {step.desc && (
                <div style={{ marginTop: 8, fontSize: 30, lineHeight: 1.45, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
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

function CompareCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'compare' }>; theme: XhsStickerTheme }) {
  const block = (data: { label: string; points: string[] }, good: boolean, rotate: number) => (
    <div
      style={{
        ...paperCard(theme, rotate),
        flex: 1,
        padding: '40px 38px 32px',
        opacity: good ? 1 : 0.72,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Tape theme={theme} rotate={rotate > 0 ? 3 : -3} />
      <span
        style={{
          alignSelf: 'flex-start',
          border: `3px solid ${good ? theme.accent : theme.subtle}`,
          color: good ? theme.accent : theme.subtle,
          borderRadius: 999,
          padding: '8px 24px',
          fontSize: 28,
          fontWeight: 800,
          background: theme.card,
        }}
      >
        {good ? '✓ ' : '✗ '}
        {data.label}
      </span>
      <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {data.points.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, fontSize: 33, fontWeight: 600, lineHeight: 1.45, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            <span style={{ color: good ? theme.accent : theme.subtle, fontWeight: 900 }}>{good ? '✓' : '✗'}</span>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Tag theme={theme}>{card.kicker || '对比'}</Tag>
      <div style={{ marginTop: 34, fontSize: 68, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 24, width: 110, height: 12, borderRadius: 6, background: theme.accent }} />
      <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', gap: 36 }}>
        {block(card.before, false, -0.6)}
        {block(card.after, true, 0.6)}
      </div>
    </>
  );
}

function QuoteCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'quote' }>; theme: XhsStickerTheme }) {
  return (
    <>
      <Tag theme={theme}>{card.kicker || '划重点'}</Tag>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ ...paperCard(theme, -0.6), padding: '80px 56px 56px' }}>
          <Tape theme={theme} rotate={2} />
          <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.5, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            <span style={marker(theme)}>{card.quote}</span>
          </div>
          {card.source && (
            <div style={{ marginTop: 40, fontSize: 30, color: theme.subtle, textAlign: 'right' }}>{card.source}</div>
          )}
        </div>
      </div>
    </>
  );
}

function DataCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'data' }>; theme: XhsStickerTheme }) {
  return (
    <>
      <Tag theme={theme}>{card.kicker || '数据'}</Tag>
      <div style={{ marginTop: 34, fontSize: 68, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 24, width: 110, height: 12, borderRadius: 6, background: theme.accent }} />
      <div
        style={{
          ...paperCard(theme),
          marginTop: 40,
          flex: 1,
          padding: '52px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
        }}
      >
        <Tape theme={theme} />
        {card.rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontSize: 36, fontWeight: 800, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{row.label}</span>
              <span style={{ fontSize: 34, fontWeight: 900, color: theme.accent }}>{row.value}</span>
            </div>
            <div style={{ height: 26, borderRadius: 999, background: `${theme.accent}22` }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, row.pct))}%`,
                  borderRadius: 999,
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

function SummaryCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'summary' }>; theme: XhsStickerTheme }) {
  return (
    <>
      <Tag theme={theme}>{card.kicker || '总结'}</Tag>
      <div style={{ marginTop: 34, fontSize: 68, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 24, width: 110, height: 12, borderRadius: 6, background: theme.accent }} />
      <div style={{ marginTop: 36, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {card.items.map((item, i) => (
          <RowCard key={i} theme={theme} index={i} title={item.label} detail={item.detail} rotate={i % 2 === 0 ? -0.5 : 0.5} />
        ))}
      </div>
      {card.closing && (
        <div
          style={{
            marginTop: 28,
            background: theme.accent,
            color: theme.onAccent,
            borderRadius: 18,
            padding: '32px 40px',
            fontSize: 40,
            fontWeight: 900,
            lineHeight: 1.4,
            textAlign: 'center',
            wordBreak: 'normal', overflowWrap: 'anywhere',
            transform: 'rotate(-0.5deg)',
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

export interface XhsStickerCardProps {
  card: XhsCardSpec;
  theme: XhsStickerTheme;
  page: number;
  total: number;
}

export function XhsStickerCard({ card, theme, page, total }: XhsStickerCardProps) {
  return (
    <div style={cardBase(theme)}>
      {card.layout === 'cover' && <CoverCard card={card} theme={theme} />}
      {card.layout === 'checklist' && <ChecklistCard card={card} theme={theme} />}
      {card.layout === 'steps' && <StepsCard card={card} theme={theme} />}
      {card.layout === 'compare' && <CompareCard card={card} theme={theme} />}
      {card.layout === 'quote' && <QuoteCard card={card} theme={theme} />}
      {card.layout === 'data' && <DataCard card={card} theme={theme} />}
      {card.layout === 'summary' && <SummaryCard card={card} theme={theme} />}
      <PageFooter theme={theme} page={page} total={total} />
    </div>
  );
}

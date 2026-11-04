import type { CSSProperties } from 'react';
import type { XhsCardSpec } from './XhsCard';

// ---------------------------------------------------------------------------
// 深色系统脉冲：近黑底 + 极细扫描线 + 铜色/单色指示灯 + 等宽数字。
// 参考 zhouwei713/article-visual-director 里的 dark-system-pulse 视觉 DNA。
// 定位：基础设施 / 技术架构 / 监控 / 工程复盘等偏"读代码"的内容。
// ---------------------------------------------------------------------------

export interface XhsPulseTheme {
  id: string;
  name: string;
  bg: string;
  panel: string;
  fg: string;
  /** 主指示灯色（数据 / 强调 / 进度条） */
  accent: string;
  /** 网格与分隔线的颜色 */
  grid: string;
  subtle: string;
  onAccent: string;
}

export const XHS_PULSE_THEMES: XhsPulseTheme[] = [
  {
    id: 'pulse-copper',
    name: '铜脉冲',
    bg: '#0E0F12',
    panel: '#161820',
    fg: '#E7DDC7',
    accent: '#D68A3C',
    grid: 'rgba(214,138,60,0.14)',
    subtle: 'rgba(231,221,199,0.5)',
    onAccent: '#0E0F12',
  },
  {
    id: 'pulse-cyan',
    name: '青光矩阵',
    bg: '#080D14',
    panel: '#101821',
    fg: '#DDEAF2',
    accent: '#33B6C4',
    grid: 'rgba(51,182,196,0.14)',
    subtle: 'rgba(221,234,242,0.5)',
    onAccent: '#080D14',
  },
  {
    id: 'pulse-jade',
    name: '翡翠终端',
    bg: '#0A0F0C',
    panel: '#121B16',
    fg: '#DDE7DE',
    accent: '#4CB878',
    grid: 'rgba(76,184,120,0.14)',
    subtle: 'rgba(221,231,222,0.5)',
    onAccent: '#0A0F0C',
  },
  {
    id: 'pulse-alert',
    name: '警报红',
    bg: '#100A0A',
    panel: '#1B1112',
    fg: '#EADFDF',
    accent: '#E24545',
    grid: 'rgba(226,69,69,0.15)',
    subtle: 'rgba(234,223,223,0.5)',
    onAccent: '#100A0A',
  },
];

export const getPulseTheme = (id: string): XhsPulseTheme =>
  XHS_PULSE_THEMES.find((t) => t.id === id) ?? XHS_PULSE_THEMES[0];

const SANS = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";
const MONO = "'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace";

// ---------------------------------------------------------------------------
// 共享原子
// ---------------------------------------------------------------------------

/** 底：近黑 + 极细横向扫描线，模拟 CRT */
const cardBase = (theme: XhsPulseTheme): CSSProperties => ({
  width: 1080,
  height: 1440,
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bg} 100%),
    repeating-linear-gradient(0deg, transparent 0px, transparent 3px, ${theme.grid} 3px, ${theme.grid} 4px)`,
  backgroundBlendMode: 'normal',
  color: theme.fg,
  fontFamily: SANS,
  boxSizing: 'border-box',
  padding: '72px 64px 140px',
  display: 'flex',
  flexDirection: 'column',
});

/** 顶部系统信号条：三个 LED + mono 标签 */
function SignalBar({ theme, label }: { theme: XhsPulseTheme; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
      <span style={{ display: 'flex', gap: 10 }}>
        {[theme.accent, `${theme.accent}77`, `${theme.accent}33`].map((c, i) => (
          <span
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: c,
              boxShadow: i === 0 ? `0 0 12px ${theme.accent}` : 'none',
            }}
          />
        ))}
      </span>
      <span style={{ flex: 1, height: 1, background: theme.grid }} />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '0.16em',
          color: theme.accent,
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

/** 版式主标题 */
const heading = (): CSSProperties => ({
  fontSize: 66,
  fontWeight: 800,
  lineHeight: 1.24,
  letterSpacing: '0.01em',
  wordBreak: 'normal',
  overflowWrap: 'anywhere',
});

/** 页脚：铜色 mono 页码 + 状态指示 */
function TerminalFooter({ theme, page, total }: { theme: XhsPulseTheme; page: number; total: number }) {
  const fmt = (n: number) => String(n).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 64,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: `1px solid ${theme.grid}`,
        paddingTop: 20,
        fontFamily: MONO,
        fontSize: 22,
        color: theme.subtle,
        letterSpacing: '0.14em',
      }}
    >
      <span>
        <span style={{ color: theme.accent }}>●</span> ONLINE
      </span>
      <span style={{ color: theme.accent }}>
        PAGE {fmt(page)}/{fmt(total)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 版式实现
// ---------------------------------------------------------------------------

function CoverCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'cover' }>; theme: XhsPulseTheme }) {
  return (
    <>
      <SignalBar theme={theme} label={card.kicker || 'system'} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: theme.accent, letterSpacing: '0.2em', marginBottom: 40 }}>
          &gt;_ INIT
        </div>
        <div style={{ fontSize: 116, fontWeight: 900, lineHeight: 1.15, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
          {card.title}
        </div>
        <div
          style={{
            marginTop: 44,
            width: 160,
            height: 6,
            background: theme.accent,
            boxShadow: `0 0 24px ${theme.accent}`,
          }}
        />
        {card.subtitle && (
          <div
            style={{
              marginTop: 44,
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.5,
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
                fontFamily: MONO,
                fontSize: 22,
                letterSpacing: '0.1em',
                padding: '10px 20px',
                border: `1px solid ${theme.accent}`,
                color: theme.accent,
                background: 'transparent',
              }}
            >
              [ {p} ]
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function ListLikeCard({
  theme,
  kicker,
  headingText,
  items,
  numbered,
}: {
  theme: XhsPulseTheme;
  kicker: string;
  headingText: string;
  items: { title: string; detail?: string }[];
  numbered: boolean;
}) {
  return (
    <>
      <SignalBar theme={theme} label={kicker} />
      <div style={heading()}>{headingText}</div>
      <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              background: theme.panel,
              borderLeft: `4px solid ${theme.accent}`,
              padding: '24px 30px',
              display: 'flex',
              gap: 24,
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 34,
                fontWeight: 700,
                color: theme.accent,
                minWidth: 60,
                lineHeight: 1.2,
              }}
            >
              {numbered ? String(i + 1).padStart(2, '0') : '●'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                {it.title}
              </div>
              {it.detail && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 27,
                    lineHeight: 1.45,
                    color: theme.subtle,
                    wordBreak: 'normal',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {it.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ChecklistCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'checklist' }>; theme: XhsPulseTheme }) {
  return (
    <ListLikeCard
      theme={theme}
      kicker={card.kicker || 'checklist'}
      headingText={card.heading}
      items={card.items.map((it) => ({ title: it.label, detail: it.detail }))}
      numbered={false}
    />
  );
}

function StepsCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'steps' }>; theme: XhsPulseTheme }) {
  return (
    <ListLikeCard
      theme={theme}
      kicker={card.kicker || 'sequence'}
      headingText={card.heading}
      items={card.steps.map((s) => ({ title: s.title, detail: s.desc }))}
      numbered
    />
  );
}

function CompareCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'compare' }>; theme: XhsPulseTheme }) {
  const block = (data: { label: string; points: string[] }, good: boolean) => (
    <div
      style={{
        flex: 1,
        background: theme.panel,
        border: `1px solid ${good ? theme.accent : theme.grid}`,
        padding: '32px 34px',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: '0.14em',
          color: good ? theme.accent : theme.subtle,
          marginBottom: 20,
        }}
      >
        {good ? '[ PASS ]' : '[ FAIL ]'} {data.label.toUpperCase()}
      </div>
      {data.points.map((p, i) => (
        <div
          key={i}
          style={{
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.45,
            marginTop: i === 0 ? 0 : 14,
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
            color: good ? theme.fg : theme.subtle,
          }}
        >
          <span style={{ color: good ? theme.accent : theme.subtle, marginRight: 12 }}>{good ? '›' : '×'}</span>
          {p}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <SignalBar theme={theme} label={card.kicker || 'compare'} />
      <div style={heading()}>{card.heading}</div>
      <div style={{ marginTop: 36, flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {block(card.before, false)}
        {block(card.after, true)}
      </div>
    </>
  );
}

function QuoteCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'quote' }>; theme: XhsPulseTheme }) {
  return (
    <>
      <SignalBar theme={theme} label={card.kicker || 'note'} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: theme.accent, marginBottom: 24, letterSpacing: '0.16em' }}>
          &gt; ECHO
        </div>
        <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.4, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
          {card.quote}
        </div>
        <div style={{ marginTop: 44, width: 100, height: 4, background: theme.accent }} />
        {card.source && (
          <div style={{ marginTop: 30, fontSize: 26, fontFamily: MONO, color: theme.subtle }}>
            — {card.source}
          </div>
        )}
      </div>
    </>
  );
}

function DataCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'data' }>; theme: XhsPulseTheme }) {
  return (
    <>
      <SignalBar theme={theme} label={card.kicker || 'metrics'} />
      <div style={heading()}>{card.heading}</div>
      <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {card.rows.map((row, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 600, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{row.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 700, color: theme.accent, letterSpacing: '0.04em' }}>
                {row.value}
              </span>
            </div>
            <div style={{ height: 14, background: theme.panel, position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, row.pct))}%`,
                  background: theme.accent,
                  boxShadow: `0 0 14px ${theme.accent}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SummaryCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'summary' }>; theme: XhsPulseTheme }) {
  return (
    <>
      <SignalBar theme={theme} label={card.kicker || 'commit'} />
      <div style={heading()}>{card.heading}</div>
      <div style={{ marginTop: 30, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {card.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 20, borderBottom: `1px solid ${theme.grid}`, paddingBottom: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 32, color: theme.accent, minWidth: 60 }}>{String(i + 1).padStart(2, '0')}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
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
      {card.closing && (
        <div
          style={{
            marginTop: 22,
            padding: '20px 24px',
            background: theme.accent,
            color: theme.onAccent,
            fontFamily: MONO,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textAlign: 'center',
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          &gt; {card.closing}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 入口组件
// ---------------------------------------------------------------------------

export interface XhsPulseCardProps {
  card: XhsCardSpec;
  theme: XhsPulseTheme;
  page: number;
  total: number;
}

export function XhsPulseCard({ card, theme, page, total }: XhsPulseCardProps) {
  return (
    <div style={cardBase(theme)}>
      {card.layout === 'cover' && <CoverCard card={card} theme={theme} />}
      {card.layout === 'checklist' && <ChecklistCard card={card} theme={theme} />}
      {card.layout === 'steps' && <StepsCard card={card} theme={theme} />}
      {card.layout === 'compare' && <CompareCard card={card} theme={theme} />}
      {card.layout === 'quote' && <QuoteCard card={card} theme={theme} />}
      {card.layout === 'data' && <DataCard card={card} theme={theme} />}
      {card.layout === 'summary' && <SummaryCard card={card} theme={theme} />}
      <TerminalFooter theme={theme} page={page} total={total} />
    </div>
  );
}

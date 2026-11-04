import type { CSSProperties } from 'react';
import type { XhsCardSpec } from './XhsCard';

// ---------------------------------------------------------------------------
// 暖工作台风：木桌面 + 米色便签卡 + 荧光笔标记 + 手绘箭头
// 参考 zhouwei713/article-visual-director 里的 warm-workbench-map 视觉 DNA。
// 与其他三套系统的区别：这里 BG 有真实材质，不是纯色。
// ---------------------------------------------------------------------------

export interface XhsWorkbenchTheme {
  id: string;
  name: string;
  /** 木桌面主色 */
  wood: string;
  /** 木纹次色（用于交替条纹） */
  woodDark: string;
  /** 便签卡颜色 */
  paper: string;
  /** 便签阴影投在木面上的颜色（半透明） */
  shadow: string;
  fg: string;
  accent: string;
  highlight: string;
  subtle: string;
}

export const XHS_WORKBENCH_THEMES: XhsWorkbenchTheme[] = [
  {
    id: 'workbench-oak',
    name: '橡木工作台',
    wood: '#B58A5C',
    woodDark: '#A57B4E',
    paper: '#FBF5E7',
    shadow: 'rgba(58,36,14,0.24)',
    fg: '#2A1B0C',
    accent: '#C64A2E',
    highlight: 'rgba(240,180,32,0.42)',
    subtle: 'rgba(42,27,12,0.55)',
  },
  {
    id: 'workbench-walnut',
    name: '胡桃暗桌',
    wood: '#5B3D26',
    woodDark: '#4D3220',
    paper: '#F5EBD4',
    shadow: 'rgba(20,10,4,0.42)',
    fg: '#241708',
    accent: '#D4712A',
    highlight: 'rgba(240,196,80,0.5)',
    subtle: 'rgba(36,23,8,0.55)',
  },
  {
    id: 'workbench-linen',
    name: '亚麻粗纸',
    wood: '#D9C4A3',
    woodDark: '#CBB690',
    paper: '#FFF9EA',
    shadow: 'rgba(90,64,26,0.2)',
    fg: '#2A1E10',
    accent: '#3D6E4A',
    highlight: 'rgba(206,168,80,0.4)',
    subtle: 'rgba(42,30,16,0.55)',
  },
];

export const getWorkbenchTheme = (id: string): XhsWorkbenchTheme =>
  XHS_WORKBENCH_THEMES.find((t) => t.id === id) ?? XHS_WORKBENCH_THEMES[0];

const SANS = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

// ---------------------------------------------------------------------------
// 共享原子：木纹底、便签、荧光笔、手绘箭头
// ---------------------------------------------------------------------------

/** 木纹底：宽窄不一的横向色条模拟木板 */
const woodGrain = (theme: XhsWorkbenchTheme): CSSProperties => ({
  width: 1080,
  height: 1440,
  position: 'relative',
  overflow: 'hidden',
  background: `repeating-linear-gradient(
    92deg,
    ${theme.wood} 0px,
    ${theme.wood} 42px,
    ${theme.woodDark} 42px,
    ${theme.woodDark} 44px,
    ${theme.wood} 44px,
    ${theme.wood} 96px,
    ${theme.woodDark} 96px,
    ${theme.woodDark} 97px
  )`,
  color: theme.fg,
  fontFamily: SANS,
  boxSizing: 'border-box',
  padding: '72px 64px 130px',
  display: 'flex',
  flexDirection: 'column',
});

/** 便签卡：轻微旋转 + 投影，像贴在桌上 */
const stickyNote = (theme: XhsWorkbenchTheme, rotate = 0): CSSProperties => ({
  position: 'relative',
  background: theme.paper,
  borderRadius: 6,
  boxShadow: `${rotate < 0 ? '-' : ''}${Math.abs(rotate) * 4}px 18px 30px ${theme.shadow}`,
  transform: rotate ? `rotate(${rotate}deg)` : undefined,
});

/** 荧光笔高亮文字 */
const marker = (theme: XhsWorkbenchTheme): CSSProperties => ({
  backgroundImage: `linear-gradient(transparent 55%, ${theme.highlight} 55%, ${theme.highlight} 92%, transparent 92%)`,
  padding: '0 8px',
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
});

/** 手写体 kicker：模拟便签顶部标签 */
function TapedLabel({ theme, children }: { theme: XhsWorkbenchTheme; children: React.ReactNode }) {
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        background: theme.accent,
        color: theme.paper,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: '0.14em',
        padding: '10px 22px',
        borderRadius: 4,
        transform: 'rotate(-1.5deg)',
        boxShadow: `0 4px 10px ${theme.shadow}`,
      }}
    >
      {children}
    </div>
  );
}

/** 手绘箭头 SVG：小图标风 */
function HandArrow({ theme, size = 44 }: { theme: XhsWorkbenchTheme; size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 60 36" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M2 18 Q 20 4, 40 18 T 58 18 M50 10 L58 18 L50 26"
        stroke={theme.accent}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** 页脚：手写体页码 + 装订线孔 */
function DeskFooter({ theme, page, total }: { theme: XhsWorkbenchTheme; page: number; total: number }) {
  const fmt = (n: number) => String(n).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ display: 'flex', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: theme.shadow }} />
        ))}
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.14em', color: theme.paper }}>
        {fmt(page)} / {fmt(total)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 版式实现
// ---------------------------------------------------------------------------

function CoverCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'cover' }>; theme: XhsWorkbenchTheme }) {
  return (
    <>
      <TapedLabel theme={theme}>{card.kicker || '教程'}</TapedLabel>
      <div style={{ ...stickyNote(theme, -1.2), marginTop: 44, padding: '68px 60px' }}>
        <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1.25, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
          <span style={marker(theme)}>{card.title}</span>
        </div>
        {card.subtitle && (
          <div style={{ marginTop: 40, fontSize: 34, fontWeight: 500, lineHeight: 1.5, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            {card.subtitle}
          </div>
        )}
      </div>
      {card.points.length > 0 && (
        <div style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {card.points.map((p, i) => (
            <span
              key={i}
              style={{
                background: theme.paper,
                color: theme.fg,
                fontSize: 26,
                fontWeight: 700,
                padding: '12px 22px',
                borderRadius: 4,
                boxShadow: `0 4px 8px ${theme.shadow}`,
                transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
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

function ChecklistCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'checklist' }>; theme: XhsWorkbenchTheme }) {
  return (
    <>
      <TapedLabel theme={theme}>{card.kicker || '清单'}</TapedLabel>
      <div style={{ ...stickyNote(theme, 0.5), marginTop: 32, padding: '48px 52px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
          <span style={marker(theme)}>{card.heading}</span>
        </div>
        <div style={{ marginTop: 34, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
          {card.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
              <span
                style={{
                  minWidth: 44,
                  height: 44,
                  borderRadius: 6,
                  border: `3px solid ${theme.fg}`,
                  background: theme.paper,
                  position: 'relative',
                  marginTop: 4,
                }}
              >
                <span style={{ position: 'absolute', top: -10, left: 4, fontSize: 44, color: theme.accent, fontWeight: 900 }}>✓</span>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{item.label}</div>
                {item.detail && (
                  <div style={{ marginTop: 4, fontSize: 28, lineHeight: 1.45, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                    {item.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function StepsCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'steps' }>; theme: XhsWorkbenchTheme }) {
  return (
    <>
      <TapedLabel theme={theme}>{card.kicker || '步骤'}</TapedLabel>
      <div style={{ ...stickyNote(theme, -0.4), marginTop: 32, padding: '48px 52px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{card.heading}</div>
        <div style={{ marginTop: 34, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
          {card.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <span style={{ fontSize: 72, fontWeight: 900, color: theme.accent, lineHeight: 1, minWidth: 90 }}>{i + 1}</span>
              {i < card.steps.length - 1 ? <HandArrow theme={theme} size={40} /> : null}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{step.title}</div>
                {step.desc && (
                  <div style={{ marginTop: 4, fontSize: 28, lineHeight: 1.45, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                    {step.desc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CompareCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'compare' }>; theme: XhsWorkbenchTheme }) {
  const block = (data: { label: string; points: string[] }, good: boolean, rotate: number) => (
    <div
      style={{
        ...stickyNote(theme, rotate),
        flex: 1,
        padding: '36px 40px',
        opacity: good ? 1 : 0.85,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: '0.08em',
          color: good ? theme.accent : theme.subtle,
          marginBottom: 20,
        }}
      >
        {good ? '✓' : '✗'} {data.label}
      </div>
      {data.points.map((p, i) => (
        <div
          key={i}
          style={{
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.45,
            marginTop: i === 0 ? 0 : 12,
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
            color: good ? theme.fg : theme.subtle,
            textDecoration: good ? 'none' : 'line-through',
          }}
        >
          {p}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <TapedLabel theme={theme}>{card.kicker || '对比'}</TapedLabel>
      <div style={{ marginTop: 32, fontSize: 56, fontWeight: 900, color: theme.paper, lineHeight: 1.25, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
        {card.heading}
      </div>
      <div style={{ marginTop: 32, flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {block(card.before, false, -0.8)}
        {block(card.after, true, 0.8)}
      </div>
    </>
  );
}

function QuoteCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'quote' }>; theme: XhsWorkbenchTheme }) {
  return (
    <>
      <TapedLabel theme={theme}>{card.kicker || '划重点'}</TapedLabel>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ ...stickyNote(theme, -1.2), padding: '80px 60px 60px' }}>
          <div style={{ fontSize: 120, color: theme.accent, lineHeight: 0.7, marginBottom: 12 }}>&ldquo;</div>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.5, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            <span style={marker(theme)}>{card.quote}</span>
          </div>
          {card.source && (
            <div style={{ marginTop: 32, fontSize: 26, color: theme.subtle, textAlign: 'right' }}>— {card.source}</div>
          )}
        </div>
      </div>
    </>
  );
}

function DataCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'data' }>; theme: XhsWorkbenchTheme }) {
  return (
    <>
      <TapedLabel theme={theme}>{card.kicker || '数据'}</TapedLabel>
      <div style={{ ...stickyNote(theme, 0.4), marginTop: 32, padding: '48px 52px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{card.heading}</div>
        <div style={{ marginTop: 40, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
          {card.rows.map((row, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span style={{ fontSize: 32, fontWeight: 800, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{row.label}</span>
                <span style={{ fontSize: 34, fontWeight: 900, color: theme.accent }}>{row.value}</span>
              </div>
              <div style={{ height: 22, borderRadius: 4, background: theme.shadow, position: 'relative' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, row.pct))}%`,
                    borderRadius: 4,
                    background: theme.accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SummaryCard({ card, theme }: { card: Extract<XhsCardSpec, { layout: 'summary' }>; theme: XhsWorkbenchTheme }) {
  return (
    <>
      <TapedLabel theme={theme}>{card.kicker || '带走'}</TapedLabel>
      <div style={{ ...stickyNote(theme, -0.3), marginTop: 32, padding: '48px 52px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.28, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{card.heading}</div>
        <div style={{ marginTop: 30, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
          {card.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: theme.accent, minWidth: 44 }}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'anywhere' }}>{item.label}</div>
                {item.detail && (
                  <div style={{ marginTop: 4, fontSize: 27, lineHeight: 1.45, color: theme.subtle, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
                    {item.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {card.closing && (
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: theme.accent, textAlign: 'center', lineHeight: 1.4, wordBreak: 'normal', overflowWrap: 'anywhere' }}>
            <span style={marker(theme)}>{card.closing}</span>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// 入口组件
// ---------------------------------------------------------------------------

export interface XhsWorkbenchCardProps {
  card: XhsCardSpec;
  theme: XhsWorkbenchTheme;
  page: number;
  total: number;
}

export function XhsWorkbenchCard({ card, theme, page, total }: XhsWorkbenchCardProps) {
  return (
    <div style={woodGrain(theme)}>
      {card.layout === 'cover' && <CoverCard card={card} theme={theme} />}
      {card.layout === 'checklist' && <ChecklistCard card={card} theme={theme} />}
      {card.layout === 'steps' && <StepsCard card={card} theme={theme} />}
      {card.layout === 'compare' && <CompareCard card={card} theme={theme} />}
      {card.layout === 'quote' && <QuoteCard card={card} theme={theme} />}
      {card.layout === 'data' && <DataCard card={card} theme={theme} />}
      {card.layout === 'summary' && <SummaryCard card={card} theme={theme} />}
      <DeskFooter theme={theme} page={page} total={total} />
    </div>
  );
}

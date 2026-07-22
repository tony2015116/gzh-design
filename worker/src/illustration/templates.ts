import type { IllustrationPlanItem, IllustrationSectionContext, IllustrationStructuredSpec } from '../types';
import { shortenText, stripMarkdown } from '../lib/text';
import { engineDisplayName, illustrationPalette, illustrationTypeDisplayName } from './classify';

export function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPlaceholderSvg(item: IllustrationPlanItem): string {
  const palette = illustrationPalette(item.type);
  const title = escapeSvgText(item.alt);
  const subtitle = escapeSvgText(item.anchorLabel);
  const purpose = escapeSvgText(item.purpose);
  const badge = `${illustrationTypeDisplayName(item.type)} / ${engineDisplayName(item.engine)}`;
  const badgeText = escapeSvgText(badge);
  const styleText = escapeSvgText(`STYLE ${item.style.toUpperCase()}`);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg)"/>',
    `  <rect x="68" y="68" width="1064" height="539" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>`,
    `  <rect x="92" y="92" width="280" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.18" stroke="${palette.accent}" stroke-opacity="0.55"/>`,
    `  <text x="114" y="121" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badgeText}</text>`,
    `  <text x="92" y="248" fill="#ffffff" font-size="58" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>`,
    `  <text x="92" y="310" fill="rgba(255,255,255,0.80)" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="500">${subtitle}</text>`,
    '  <line x1="92" y1="350" x2="420" y2="350" stroke="rgba(255,255,255,0.32)" stroke-width="4"/>',
    `  <text x="92" y="418" fill="rgba(255,255,255,0.92)" font-size="26" font-family="Arial, Helvetica, sans-serif">${purpose}</text>`,
    `  <text x="92" y="566" fill="${palette.accent}" font-size="22" font-family="Arial, Helvetica, sans-serif" letter-spacing="2">${styleText}</text>`,
    '  <circle cx="1004" cy="190" r="86" fill="rgba(255,255,255,0.10)"/>',
    '  <circle cx="1004" cy="190" r="54" fill="rgba(255,255,255,0.18)"/>',
    '  <circle cx="1004" cy="190" r="18" fill="rgba(255,255,255,0.92)"/>',
    '  <rect x="840" y="404" width="212" height="28" rx="14" fill="rgba(255,255,255,0.12)"/>',
    '  <rect x="840" y="454" width="164" height="28" rx="14" fill="rgba(255,255,255,0.12)"/>',
    '  <rect x="840" y="504" width="240" height="28" rx="14" fill="rgba(255,255,255,0.12)"/>',
    '</svg>',
  ].join('');
}

export function buildHttpIllustrationPrompt(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
): string {
  const direction = item.type === 'cover'
    ? 'Create a striking hero illustration suitable for a WeChat article cover section.'
    : 'Create an editorial supporting illustration for the body of a WeChat article.';
  const style = item.style === 'auto' ? 'editorial minimalism' : item.style;

  return [
    direction,
    `Section title: ${item.anchorLabel}.`,
    `Image goal: ${item.purpose}`,
    `Preferred style: ${style}.`,
    `Content reference: ${shortenText(context.content || context.heading, 280)}.`,
    'Requirements:',
    '- high quality visual composition',
    '- no visible text, letters, watermarks, UI screenshots, or logos',
    '- suitable for Chinese knowledge article publishing',
    '- clean focal point and strong readability at article width',
  ].join('\n');
}

export function buildSvgListCards(points: string[], palette: { accent: string }): string {
  return points
    .slice(0, 3)
    .map((point, index) => {
      const y = 404 + index * 54;
      return [
        `  <rect x="782" y="${y}" width="320" height="38" rx="16" fill="rgba(255,255,255,0.12)" stroke="${palette.accent}" stroke-opacity="0.25"/>`,
        `  <text x="806" y="${y + 25}" fill="#ffffff" font-size="18" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(point, 22))}</text>`,
      ].join('\n');
    })
    .join('\n');
}

export function buildStructuredInfographicSvg(
  item: IllustrationPlanItem,
  spec: IllustrationStructuredSpec,
  palette: { start: string; end: string; accent: string },
): string {
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const cards = spec.highlights.slice(0, 3);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg-rich" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg-rich)"/>',
    '  <rect x="56" y="56" width="1088" height="563" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="88" y="88" width="340" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.16" stroke="${palette.accent}" stroke-opacity="0.48"/>`,
    `  <text x="112" y="117" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="88" y="196" fill="#ffffff" font-size="58" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(spec.title, 18))}</text>`,
    `  <text x="88" y="238" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.subtitle, 34))}</text>`,
    '  <line x1="88" y1="270" x2="332" y2="270" stroke="rgba(255,255,255,0.26)" stroke-width="4"/>',
    ...cards.flatMap((card, index) => {
      const x = 88 + index * 336;
      return [
        `  <rect x="${x}" y="322" width="296" height="178" rx="28" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>`,
        `  <circle cx="${x + 38}" cy="362" r="16" fill="${palette.accent}" fill-opacity="0.22" stroke="${palette.accent}" stroke-width="1.5"/>`,
        `  <text x="${x + 32}" y="368" fill="#ffffff" font-size="14" font-family="Arial, Helvetica, sans-serif" font-weight="700">${index + 1}</text>`,
        `  <text x="${x + 64}" y="370" fill="${palette.accent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700">关键点</text>`,
        `  <text x="${x + 28}" y="420" fill="#ffffff" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(card.label, 14))}</text>`,
        `  <text x="${x + 28}" y="464" fill="rgba(255,255,255,0.88)" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(card.detail, 28))}</text>`,
      ];
    }),
    '  <rect x="88" y="534" width="1024" height="70" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
    `  <text x="120" y="577" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">TAKEAWAY</text>`,
    `  <text x="258" y="577" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.takeaway, 44))}</text>`,
    '</svg>',
  ].join('\n');
}

export function buildStructuredProgressionSvg(
  item: IllustrationPlanItem,
  spec: IllustrationStructuredSpec,
  palette: { start: string; end: string; accent: string },
): string {
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const steps = spec.highlights.slice(0, 4);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg-progression" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg-progression)"/>',
    '  <rect x="56" y="56" width="1088" height="563" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="88" y="88" width="360" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.16" stroke="${palette.accent}" stroke-opacity="0.48"/>`,
    `  <text x="112" y="117" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="88" y="188" fill="#ffffff" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(spec.title, 18))}</text>`,
    `  <text x="88" y="232" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.subtitle, 34))}</text>`,
    '  <line x1="116" y1="430" x2="1084" y2="430" stroke="rgba(255,255,255,0.22)" stroke-width="6" stroke-linecap="round"/>',
    ...steps.flatMap((step, index) => {
      const x = 88 + index * 252;
      return [
        `  <rect x="${x}" y="322" width="216" height="176" rx="28" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>`,
        `  <circle cx="${x + 34}" cy="354" r="16" fill="${palette.accent}" fill-opacity="0.22" stroke="${palette.accent}" stroke-width="1.5"/>`,
        `  <text x="${x + 28}" y="360" fill="#ffffff" font-size="14" font-family="Arial, Helvetica, sans-serif" font-weight="700">${index + 1}</text>`,
        `  <text x="${x + 62}" y="360" fill="${palette.accent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700">STEP</text>`,
        `  <text x="${x + 24}" y="410" fill="#ffffff" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(step.label, 14))}</text>`,
        `  <text x="${x + 24}" y="454" fill="rgba(255,255,255,0.88)" font-size="19" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(step.detail, 24))}</text>`,
      ];
    }),
    '  <rect x="88" y="534" width="1024" height="70" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
    `  <text x="120" y="577" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">TAKEAWAY</text>`,
    `  <text x="258" y="577" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.takeaway, 44))}</text>`,
    '</svg>',
  ].join('\n');
}

export function buildStructuredBridgeSvg(
  item: IllustrationPlanItem,
  spec: IllustrationStructuredSpec,
  palette: { start: string; end: string; accent: string },
): string {
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const bridge = spec.bridge || {
    problem: spec.highlights[0]?.label || spec.title,
    tension: spec.highlights[1]?.label || spec.subtitle,
    decision: spec.highlights[2]?.label || spec.takeaway,
    outcome: spec.takeaway,
  };
  const stages = [
    { label: 'PROBLEM', value: bridge.problem },
    { label: 'TENSION', value: bridge.tension },
    { label: 'DECISION', value: bridge.decision },
    { label: 'OUTCOME', value: bridge.outcome },
  ];

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg-bridge" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg-bridge)"/>',
    '  <rect x="56" y="56" width="1088" height="563" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="88" y="88" width="360" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.16" stroke="${palette.accent}" stroke-opacity="0.48"/>`,
    `  <text x="112" y="117" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="88" y="188" fill="#ffffff" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(spec.title, 18))}</text>`,
    `  <text x="88" y="232" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.subtitle, 34))}</text>`,
    '  <line x1="116" y1="430" x2="1084" y2="430" stroke="rgba(255,255,255,0.22)" stroke-width="6" stroke-linecap="round"/>',
    ...stages.flatMap((stage, index) => {
      const x = 88 + index * 252;
      const centerX = x + 108;
      return [
        `  <rect x="${x}" y="312" width="216" height="190" rx="28" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>`,
        `  <circle cx="${centerX}" cy="430" r="18" fill="rgba(255,255,255,0.16)" stroke="${palette.accent}" stroke-width="2"/>`,
        `  <text x="${centerX - 5}" y="436" fill="#ffffff" font-size="14" font-family="Arial, Helvetica, sans-serif" font-weight="700">${index + 1}</text>`,
        `  <text x="${x + 24}" y="350" fill="${palette.accent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700">${stage.label}</text>`,
        `  <text x="${x + 24}" y="402" fill="#ffffff" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(stage.value, 18))}</text>`,
      ];
    }),
    '  <rect x="88" y="534" width="1024" height="70" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
    `  <text x="120" y="577" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">TAKEAWAY</text>`,
    `  <text x="258" y="577" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.takeaway, 44))}</text>`,
    '</svg>',
  ].join('\n');
}

export function buildStructuredComparisonSvg(
  item: IllustrationPlanItem,
  spec: IllustrationStructuredSpec,
  palette: { start: string; end: string; accent: string },
): string {
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const comparison = spec.comparison || {
    left: { title: '重点 A', points: [] },
    right: { title: '重点 B', points: [] },
    conclusion: spec.takeaway,
  };

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg-compare" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg-compare)"/>',
    '  <rect x="56" y="56" width="1088" height="563" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="88" y="88" width="340" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.16" stroke="${palette.accent}" stroke-opacity="0.48"/>`,
    `  <text x="112" y="117" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="88" y="188" fill="#ffffff" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(spec.title, 18))}</text>`,
    `  <text x="88" y="232" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.subtitle, 34))}</text>`,
    '  <rect x="88" y="286" width="472" height="248" rx="30" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>',
    '  <rect x="640" y="286" width="472" height="248" rx="30" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>',
    `  <text x="120" y="338" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">LEFT</text>`,
    `  <text x="120" y="382" fill="#ffffff" font-size="32" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(comparison.left.title, 14))}</text>`,
    ...comparison.left.points.slice(0, 3).map((point, index) => (
      [
        `  <circle cx="126" cy="${426 + index * 46}" r="6" fill="${palette.accent}"/>`,
        `  <text x="146" y="${433 + index * 46}" fill="rgba(255,255,255,0.9)" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(point, 28))}</text>`,
      ].join('\n')
    )),
    `  <text x="672" y="338" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">RIGHT</text>`,
    `  <text x="672" y="382" fill="#ffffff" font-size="32" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(comparison.right.title, 14))}</text>`,
    ...comparison.right.points.slice(0, 3).map((point, index) => (
      [
        `  <circle cx="678" cy="${426 + index * 46}" r="6" fill="${palette.accent}"/>`,
        `  <text x="698" y="${433 + index * 46}" fill="rgba(255,255,255,0.9)" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(point, 28))}</text>`,
      ].join('\n')
    )),
    '  <rect x="88" y="560" width="1024" height="44" rx="22" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
    `  <text x="120" y="589" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(comparison.conclusion, 52))}</text>`,
    '</svg>',
  ].join('\n');
}

export function buildStructuredFlowSvg(
  item: IllustrationPlanItem,
  spec: IllustrationStructuredSpec,
  palette: { start: string; end: string; accent: string },
): string {
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const steps = (spec.flow?.steps || []).slice(0, 4);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg-flow" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg-flow)"/>',
    '  <rect x="56" y="56" width="1088" height="563" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="88" y="88" width="340" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.16" stroke="${palette.accent}" stroke-opacity="0.48"/>`,
    `  <text x="112" y="117" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="88" y="188" fill="#ffffff" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(spec.title, 18))}</text>`,
    `  <text x="88" y="232" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.subtitle, 34))}</text>`,
    ...steps.flatMap((step, index) => {
      const x = 96 + index * 254;
      const connector = index < steps.length - 1
        ? [
            `  <line x1="${x + 198}" y1="410" x2="${x + 238}" y2="410" stroke="rgba(255,255,255,0.32)" stroke-width="6" stroke-linecap="round"/>`,
            `  <polygon points="${x + 238},410 ${x + 222},398 ${x + 222},422" fill="${palette.accent}" fill-opacity="0.9"/>`,
          ]
        : [];

      return [
        `  <rect x="${x}" y="332" width="206" height="160" rx="28" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>`,
        `  <circle cx="${x + 34}" cy="368" r="16" fill="${palette.accent}" fill-opacity="0.22" stroke="${palette.accent}" stroke-width="1.5"/>`,
        `  <text x="${x + 28}" y="374" fill="#ffffff" font-size="14" font-family="Arial, Helvetica, sans-serif" font-weight="700">${index + 1}</text>`,
        `  <text x="${x + 60}" y="374" fill="${palette.accent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700">STEP</text>`,
        `  <text x="${x + 24}" y="430" fill="#ffffff" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(step, 16))}</text>`,
        ...connector,
      ];
    }),
    '  <rect x="88" y="534" width="1024" height="70" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
    `  <text x="120" y="577" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">TAKEAWAY</text>`,
    `  <text x="258" y="577" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.takeaway, 46))}</text>`,
    '</svg>',
  ].join('\n');
}

export function buildStructuredFrameworkSvg(
  item: IllustrationPlanItem,
  spec: IllustrationStructuredSpec,
  palette: { start: string; end: string; accent: string },
): string {
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const framework = spec.framework || { core: spec.title, pillars: [] };

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg-framework" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg-framework)"/>',
    '  <rect x="56" y="56" width="1088" height="563" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="88" y="88" width="340" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.16" stroke="${palette.accent}" stroke-opacity="0.48"/>`,
    `  <text x="112" y="117" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="88" y="188" fill="#ffffff" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(spec.title, 18))}</text>`,
    `  <text x="88" y="232" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.subtitle, 34))}</text>`,
    '  <circle cx="600" cy="414" r="108" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)"/>',
    `  <text x="556" y="396" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">CORE</text>`,
    `  <text x="520" y="438" fill="#ffffff" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(framework.core, 14))}</text>`,
    ...framework.pillars.slice(0, 4).flatMap((pillar, index) => {
      const positions = [
        { x: 178, y: 314 },
        { x: 816, y: 314 },
        { x: 178, y: 460 },
        { x: 816, y: 460 },
      ];
      const pos = positions[index];
      const lineStartX = pos.x < 600 ? pos.x + 220 : pos.x;
      const lineEndX = pos.x < 600 ? 492 : 708;
      const lineY = pos.y + 42;
      return [
        `  <rect x="${pos.x}" y="${pos.y}" width="220" height="84" rx="24" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>`,
        `  <text x="${pos.x + 24}" y="${pos.y + 50}" fill="#ffffff" font-size="24" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(pillar, 16))}</text>`,
        `  <line x1="${lineStartX}" y1="${lineY}" x2="${lineEndX}" y2="${lineY}" stroke="rgba(255,255,255,0.28)" stroke-width="4" stroke-linecap="round"/>`,
      ];
    }),
    '  <rect x="88" y="560" width="1024" height="44" rx="22" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
    `  <text x="120" y="589" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.takeaway, 52))}</text>`,
    '</svg>',
  ].join('\n');
}

export function buildStructuredTimelineSvg(
  item: IllustrationPlanItem,
  spec: IllustrationStructuredSpec,
  palette: { start: string; end: string; accent: string },
): string {
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const stages = spec.timeline.slice(0, 4);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg-timeline" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg-timeline)"/>',
    '  <rect x="56" y="56" width="1088" height="563" rx="32" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="88" y="88" width="340" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.16" stroke="${palette.accent}" stroke-opacity="0.48"/>`,
    `  <text x="112" y="117" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="88" y="188" fill="#ffffff" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(spec.title, 18))}</text>`,
    `  <text x="88" y="232" fill="rgba(255,255,255,0.82)" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.subtitle, 34))}</text>`,
    '  <line x1="116" y1="426" x2="1084" y2="426" stroke="rgba(255,255,255,0.26)" stroke-width="6" stroke-linecap="round"/>',
    ...stages.flatMap((stage, index) => {
      const x = 154 + index * 256;
      return [
        `  <circle cx="${x}" cy="426" r="28" fill="rgba(255,255,255,0.16)" stroke="${palette.accent}" stroke-width="2"/>`,
        `  <text x="${x - 8}" y="434" fill="#ffffff" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">${index + 1}</text>`,
        `  <rect x="${x - 84}" y="328" width="168" height="58" rx="20" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>`,
        `  <text x="${x - 60}" y="365" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeSvgText(shortenText(stage.label, 12))}</text>`,
        `  <rect x="${x - 112}" y="466" width="224" height="92" rx="24" fill="rgba(10,14,28,0.18)" stroke="rgba(255,255,255,0.16)"/>`,
        `  <text x="${x - 84}" y="520" fill="rgba(255,255,255,0.9)" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(stage.note, 18))}</text>`,
      ];
    }),
    '  <rect x="88" y="584" width="1024" height="26" rx="13" fill="rgba(255,255,255,0.08)"/>',
    `  <text x="104" y="603" fill="${palette.accent}" font-size="16" font-family="Arial, Helvetica, sans-serif" font-weight="700">演进结论</text>`,
    `  <text x="216" y="603" fill="#ffffff" font-size="18" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(spec.takeaway, 58))}</text>`,
    '</svg>',
  ].join('\n');
}

export function buildInfographicSvg(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  structuredSpec?: IllustrationStructuredSpec,
): string {
  const palette = illustrationPalette(item.type);
  if (structuredSpec && item.type === 'infographic') {
    if (structuredSpec.layout === 'bridge') {
      return buildStructuredBridgeSvg(item, structuredSpec, palette);
    }

    if (structuredSpec.layout === 'linear-progression') {
      return buildStructuredProgressionSvg(item, structuredSpec, palette);
    }

    return buildStructuredInfographicSvg(item, structuredSpec, palette);
  }

  if (structuredSpec && item.type === 'comparison') {
    return buildStructuredComparisonSvg(item, structuredSpec, palette);
  }

  if (structuredSpec && item.type === 'flowchart') {
    return buildStructuredFlowSvg(item, structuredSpec, palette);
  }

  if (structuredSpec && item.type === 'framework') {
    return buildStructuredFrameworkSvg(item, structuredSpec, palette);
  }

  if (structuredSpec && item.type === 'timeline') {
    return buildStructuredTimelineSvg(item, structuredSpec, palette);
  }

  const points = context.points.length > 0 ? context.points : [item.purpose];
  const title = escapeSvgText(shortenText(item.alt, 22));
  const subtitle = escapeSvgText(shortenText(context.heading || item.anchorLabel, 28));
  const badge = escapeSvgText(illustrationStyleBadge(item));
  const rightPanel = buildSvgListCards(points, palette);

  let centerMarkup = '';

  if (item.type === 'timeline') {
    centerMarkup = points
      .slice(0, 4)
      .map((point, index) => {
        const x = 164 + index * 184;
        return [
          `  <circle cx="${x}" cy="454" r="22" fill="${palette.accent}" fill-opacity="0.28" stroke="${palette.accent}" stroke-width="2"/>`,
          `  <text x="${x - 6}" y="461" fill="#ffffff" font-size="14" font-family="Arial, Helvetica, sans-serif" font-weight="700">${index + 1}</text>`,
          `  <text x="${x - 42}" y="510" fill="#ffffff" font-size="18" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(point, 8))}</text>`,
        ].join('\n');
      })
      .join('\n');

    centerMarkup = [
      '  <line x1="160" y1="454" x2="720" y2="454" stroke="rgba(255,255,255,0.26)" stroke-width="6" stroke-linecap="round"/>',
      centerMarkup,
    ].join('\n');
  } else if (item.type === 'comparison') {
    const left = points[0] || item.anchorLabel;
    const right = points[1] || item.purpose;
    const footer = points[2] || 'Reader takeaway';
    centerMarkup = [
      '  <rect x="116" y="380" width="272" height="168" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
      '  <rect x="432" y="380" width="272" height="168" rx="24" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
      `  <text x="146" y="424" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">LEFT</text>`,
      `  <text x="462" y="424" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">RIGHT</text>`,
      `  <text x="146" y="472" fill="#ffffff" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(left, 18))}</text>`,
      `  <text x="462" y="472" fill="#ffffff" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(right, 18))}</text>`,
      `  <text x="146" y="524" fill="rgba(255,255,255,0.82)" font-size="18" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(footer, 44))}</text>`,
    ].join('\n');
  } else if (item.type === 'flowchart') {
    centerMarkup = points
      .slice(0, 3)
      .map((point, index) => {
        const x = 126 + index * 208;
        const arrow = index < Math.min(points.length, 3) - 1
          ? `  <line x1="${x + 168}" y1="462" x2="${x + 206}" y2="462" stroke="rgba(255,255,255,0.30)" stroke-width="6" stroke-linecap="round"/>`
          : '';
        return [
          `  <rect x="${x}" y="404" width="168" height="116" rx="22" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>`,
          `  <text x="${x + 24}" y="442" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">STEP ${index + 1}</text>`,
          `  <text x="${x + 24}" y="486" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(point, 14))}</text>`,
          arrow,
        ].join('\n');
      })
      .join('\n');
  } else if (item.type === 'framework') {
    centerMarkup = [
      '  <circle cx="410" cy="454" r="88" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)"/>',
      `  <text x="352" y="446" fill="${palette.accent}" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">CORE</text>`,
      `  <text x="332" y="484" fill="#ffffff" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(item.anchorLabel, 12))}</text>`,
      ...points.slice(0, 3).map((point, index) => {
        const positions = [
          { x: 118, y: 398 },
          { x: 548, y: 368 },
          { x: 548, y: 500 },
        ];
        const pos = positions[index];
        return [
          `  <rect x="${pos.x}" y="${pos.y}" width="168" height="76" rx="22" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>`,
          `  <text x="${pos.x + 20}" y="${pos.y + 44}" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(point, 12))}</text>`,
        ].join('\n');
      }),
    ].join('\n');
  } else {
    centerMarkup = [
      '  <rect x="124" y="392" width="596" height="144" rx="26" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>',
      ...points.slice(0, 3).map((point, index) => (
        [
          `  <circle cx="162" cy="${430 + index * 34}" r="7" fill="${palette.accent}"/>`,
          `  <text x="184" y="${437 + index * 34}" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeSvgText(shortenText(point, 34))}</text>`,
        ].join('\n')
      )),
    ].join('\n');
  }

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" fill="none">',
    '<defs>',
    `  <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">`,
    `    <stop stop-color="${palette.start}"/>`,
    `    <stop offset="1" stop-color="${palette.end}"/>`,
    '  </linearGradient>',
    '</defs>',
    '  <rect width="1200" height="675" rx="40" fill="url(#bg)"/>',
    '  <rect x="64" y="64" width="1072" height="547" rx="30" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>',
    `  <rect x="92" y="92" width="360" height="44" rx="22" fill="${palette.accent}" fill-opacity="0.18" stroke="${palette.accent}" stroke-opacity="0.55"/>`,
    `  <text x="116" y="121" fill="#ffffff" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">${badge}</text>`,
    `  <text x="92" y="232" fill="#ffffff" font-size="56" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>`,
    `  <text x="92" y="292" fill="rgba(255,255,255,0.80)" font-size="28" font-family="Arial, Helvetica, sans-serif">${subtitle}</text>`,
    '  <line x1="92" y1="332" x2="360" y2="332" stroke="rgba(255,255,255,0.32)" stroke-width="4"/>',
    centerMarkup,
    rightPanel,
    '</svg>',
  ].join('\n');
}

export function buildInfographicHtml(
  item: IllustrationPlanItem,
  context: IllustrationSectionContext,
  structuredSpec?: IllustrationStructuredSpec,
): string {
  const palette = illustrationPalette(item.type);

  if (structuredSpec && item.type === 'infographic') {
    if (structuredSpec.layout === 'bridge') {
      const badge = escapeSvgText(illustrationStyleBadge(item));
      const bridge = structuredSpec.bridge || {
        problem: structuredSpec.highlights[0]?.label || structuredSpec.title,
        tension: structuredSpec.highlights[1]?.label || structuredSpec.subtitle,
        decision: structuredSpec.highlights[2]?.label || structuredSpec.takeaway,
        outcome: structuredSpec.takeaway,
      };
      const stages = [
        { label: 'PROBLEM', value: bridge.problem },
        { label: 'TENSION', value: bridge.tension },
        { label: 'DECISION', value: bridge.decision },
        { label: 'OUTCOME', value: bridge.outcome },
      ];

      return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: linear-gradient(145deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame { width: 1200px; height: 675px; padding: 56px; }
    .shell {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background: radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 34%), rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: ${palette.accent};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title { margin-top: 10px; font-size: 56px; line-height: 1.04; font-weight: 800; max-width: 860px; }
    .subtitle { max-width: 760px; font-size: 24px; line-height: 1.42; color: rgba(255,255,255,0.84); }
    .rail {
      position: relative;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      align-items: stretch;
      margin-top: 8px;
      flex: 1;
    }
    .rail::before {
      content: "";
      position: absolute;
      left: 24px;
      right: 24px;
      top: 118px;
      height: 6px;
      border-radius: 999px;
      background: rgba(255,255,255,0.20);
    }
    .stage {
      position: relative;
      min-height: 206px;
      border-radius: 28px;
      padding: 24px;
      background: linear-gradient(180deg, rgba(10,14,28,0.18), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      z-index: 1;
    }
    .stage-index {
      position: absolute;
      top: 102px;
      left: 50%;
      transform: translate(-50%, 0);
      width: 34px;
      height: 34px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.16);
      border: 2px solid ${palette.accent};
      font-size: 14px;
      font-weight: 700;
    }
    .stage-kicker {
      color: ${palette.accent};
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.06em;
    }
    .stage-title {
      margin-top: 18px;
      font-size: 30px;
      line-height: 1.16;
      font-weight: 800;
    }
    .takeaway {
      border-radius: 24px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .takeaway-label { color: ${palette.accent}; font-size: 17px; font-weight: 800; letter-spacing: 0.08em; }
    .takeaway-text { font-size: 22px; line-height: 1.4; color: #fff; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="shell">
      <div class="badge">${badge}</div>
      <div class="title">${escapeSvgText(shortenText(structuredSpec.title, 18))}</div>
      <div class="subtitle">${escapeSvgText(shortenText(structuredSpec.subtitle, 34))}</div>
      <div class="rail">
        ${stages.map((stage, index) => `
          <div class="stage">
            <div class="stage-kicker">${stage.label}</div>
            <div class="stage-title">${escapeSvgText(shortenText(stage.value, 18))}</div>
            <div class="stage-index">0${index + 1}</div>
          </div>
        `).join('')}
      </div>
      <div class="takeaway">
        <div class="takeaway-label">TAKEAWAY</div>
        <div class="takeaway-text">${escapeSvgText(shortenText(structuredSpec.takeaway, 48))}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    if (structuredSpec.layout === 'linear-progression') {
      const badge = escapeSvgText(illustrationStyleBadge(item));
      const steps = structuredSpec.highlights.slice(0, 4);

      return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: linear-gradient(145deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame { width: 1200px; height: 675px; padding: 56px; }
    .shell {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background: radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 34%), rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: ${palette.accent};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title { margin-top: 10px; font-size: 56px; line-height: 1.04; font-weight: 800; max-width: 860px; }
    .subtitle { max-width: 760px; font-size: 24px; line-height: 1.42; color: rgba(255,255,255,0.84); }
    .flow {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      align-items: center;
      margin-top: 4px;
      flex: 1;
    }
    .step {
      min-height: 206px;
      border-radius: 28px;
      padding: 24px;
      background: linear-gradient(180deg, rgba(10,14,28,0.18), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
    }
    .step-index {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.18);
      color: ${palette.accent};
      font-size: 14px;
      font-weight: 700;
    }
    .step-kicker { margin-top: 16px; font-size: 15px; letter-spacing: 0.06em; color: ${palette.accent}; font-weight: 700; }
    .step-title { margin-top: 14px; font-size: 28px; line-height: 1.18; font-weight: 800; }
    .step-detail { margin-top: 12px; font-size: 18px; line-height: 1.45; color: rgba(255,255,255,0.88); }
    .arrow {
      position: relative;
      height: 8px;
      margin: 0 -8px;
      background: rgba(255,255,255,0.22);
      border-radius: 999px;
      align-self: center;
    }
    .arrow::after {
      content: "";
      position: absolute;
      right: -2px;
      top: -4px;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-left: 14px solid ${palette.accent};
    }
    .takeaway {
      border-radius: 24px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .takeaway-label { color: ${palette.accent}; font-size: 17px; font-weight: 800; letter-spacing: 0.08em; }
    .takeaway-text { font-size: 22px; line-height: 1.4; color: #fff; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="shell">
      <div class="badge">${badge}</div>
      <div class="title">${escapeSvgText(shortenText(structuredSpec.title, 18))}</div>
      <div class="subtitle">${escapeSvgText(shortenText(structuredSpec.subtitle, 34))}</div>
      <div class="flow">
        ${steps.map((step, index) => `
          <div class="step">
            <div class="step-index">0${index + 1}</div>
            <div class="step-kicker">STEP</div>
            <div class="step-title">${escapeSvgText(shortenText(step.label, 16))}</div>
            <div class="step-detail">${escapeSvgText(shortenText(step.detail, 24))}</div>
          </div>
        `).join('<div class="arrow"></div>')}
      </div>
      <div class="takeaway">
        <div class="takeaway-label">TAKEAWAY</div>
        <div class="takeaway-text">${escapeSvgText(shortenText(structuredSpec.takeaway, 48))}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    const badge = escapeSvgText(illustrationStyleBadge(item));
    const cards = structuredSpec.highlights.slice(0, 3);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: linear-gradient(145deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame {
      width: 1200px;
      height: 675px;
      padding: 56px;
    }
    .shell {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background:
        radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 34%),
        rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: ${palette.accent};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title {
      margin-top: 10px;
      font-size: 58px;
      line-height: 1.02;
      font-weight: 800;
      max-width: 860px;
    }
    .subtitle {
      max-width: 720px;
      font-size: 24px;
      line-height: 1.45;
      color: rgba(255,255,255,0.84);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-top: 8px;
    }
    .card {
      min-height: 190px;
      border-radius: 28px;
      padding: 24px;
      background: linear-gradient(180deg, rgba(10,14,28,0.18), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .card-index {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.18);
      color: ${palette.accent};
      font-size: 14px;
      font-weight: 700;
    }
    .card-kicker {
      margin-top: 16px;
      font-size: 15px;
      letter-spacing: 0.06em;
      color: ${palette.accent};
      font-weight: 700;
    }
    .card-title {
      margin-top: 14px;
      font-size: 30px;
      line-height: 1.12;
      font-weight: 800;
      color: #fff;
    }
    .card-detail {
      margin-top: 14px;
      font-size: 19px;
      line-height: 1.5;
      color: rgba(255,255,255,0.88);
    }
    .takeaway {
      margin-top: auto;
      border-radius: 24px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .takeaway-label {
      color: ${palette.accent};
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .takeaway-text {
      font-size: 22px;
      line-height: 1.4;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="shell">
      <div class="badge">${badge}</div>
      <div class="title">${escapeSvgText(shortenText(structuredSpec.title, 18))}</div>
      <div class="subtitle">${escapeSvgText(shortenText(structuredSpec.subtitle, 34))}</div>
      <div class="grid">
        ${cards.map((card, index) => `
          <div class="card">
            <div class="card-index">0${index + 1}</div>
            <div class="card-kicker">KEY POINT</div>
            <div class="card-title">${escapeSvgText(shortenText(card.label, 16))}</div>
            <div class="card-detail">${escapeSvgText(shortenText(card.detail, 34))}</div>
          </div>
        `).join('')}
      </div>
      <div class="takeaway">
        <div class="takeaway-label">TAKEAWAY</div>
        <div class="takeaway-text">${escapeSvgText(shortenText(structuredSpec.takeaway, 48))}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  if (structuredSpec && item.type === 'comparison') {
    const badge = escapeSvgText(illustrationStyleBadge(item));
    const comparison = structuredSpec.comparison || {
      left: { title: '重点 A', points: [] },
      right: { title: '重点 B', points: [] },
      conclusion: structuredSpec.takeaway,
    };

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: linear-gradient(145deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame { width: 1200px; height: 675px; padding: 56px; }
    .shell {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.10), transparent 36%),
        rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: ${palette.accent};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title {
      margin-top: 10px;
      font-size: 56px;
      line-height: 1.04;
      font-weight: 800;
      max-width: 860px;
    }
    .subtitle {
      max-width: 760px;
      font-size: 24px;
      line-height: 1.42;
      color: rgba(255,255,255,0.84);
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 22px;
      margin-top: 8px;
    }
    .column {
      min-height: 264px;
      border-radius: 30px;
      padding: 26px;
      background: linear-gradient(180deg, rgba(10,14,28,0.18), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .column-kicker {
      font-size: 16px;
      letter-spacing: 0.08em;
      color: ${palette.accent};
      font-weight: 700;
    }
    .column-title {
      margin-top: 14px;
      font-size: 34px;
      line-height: 1.1;
      font-weight: 800;
    }
    .list {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .list-item {
      display: grid;
      grid-template-columns: 14px 1fr;
      gap: 12px;
      align-items: start;
      font-size: 20px;
      line-height: 1.45;
      color: rgba(255,255,255,0.90);
    }
    .dot {
      width: 10px;
      height: 10px;
      margin-top: 10px;
      border-radius: 999px;
      background: ${palette.accent};
    }
    .takeaway {
      margin-top: auto;
      border-radius: 24px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .takeaway-label {
      color: ${palette.accent};
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .takeaway-text {
      font-size: 22px;
      line-height: 1.4;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="shell">
      <div class="badge">${badge}</div>
      <div class="title">${escapeSvgText(shortenText(structuredSpec.title, 18))}</div>
      <div class="subtitle">${escapeSvgText(shortenText(structuredSpec.subtitle, 34))}</div>
      <div class="columns">
        <div class="column">
          <div class="column-kicker">LEFT</div>
          <div class="column-title">${escapeSvgText(shortenText(comparison.left.title, 16))}</div>
          <div class="list">
            ${comparison.left.points.slice(0, 3).map((point) => `
              <div class="list-item">
                <span class="dot"></span>
                <span>${escapeSvgText(shortenText(point, 30))}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="column">
          <div class="column-kicker">RIGHT</div>
          <div class="column-title">${escapeSvgText(shortenText(comparison.right.title, 16))}</div>
          <div class="list">
            ${comparison.right.points.slice(0, 3).map((point) => `
              <div class="list-item">
                <span class="dot"></span>
                <span>${escapeSvgText(shortenText(point, 30))}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="takeaway">
        <div class="takeaway-label">TAKEAWAY</div>
        <div class="takeaway-text">${escapeSvgText(shortenText(comparison.conclusion, 48))}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  if (structuredSpec && item.type === 'flowchart') {
    const badge = escapeSvgText(illustrationStyleBadge(item));
    const steps = (structuredSpec.flow?.steps || []).slice(0, 4);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: linear-gradient(145deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame { width: 1200px; height: 675px; padding: 56px; }
    .shell {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background: radial-gradient(circle at top right, rgba(255,255,255,0.10), transparent 36%), rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: ${palette.accent};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title { margin-top: 10px; font-size: 56px; line-height: 1.04; font-weight: 800; max-width: 860px; }
    .subtitle { max-width: 760px; font-size: 24px; line-height: 1.42; color: rgba(255,255,255,0.84); }
    .flow {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      align-items: center;
      margin-top: 4px;
    }
    .step {
      min-height: 196px;
      border-radius: 28px;
      padding: 24px;
      background: linear-gradient(180deg, rgba(10,14,28,0.18), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
    }
    .step-index {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.18);
      color: ${palette.accent};
      font-size: 14px;
      font-weight: 700;
    }
    .step-kicker { margin-top: 16px; font-size: 15px; letter-spacing: 0.06em; color: ${palette.accent}; font-weight: 700; }
    .step-title { margin-top: 14px; font-size: 28px; line-height: 1.18; font-weight: 800; }
    .arrow {
      position: relative;
      height: 8px;
      margin: 0 -8px;
      background: rgba(255,255,255,0.22);
      border-radius: 999px;
      align-self: center;
    }
    .arrow::after {
      content: "";
      position: absolute;
      right: -2px;
      top: -4px;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-left: 14px solid ${palette.accent};
    }
    .takeaway {
      margin-top: auto;
      border-radius: 24px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .takeaway-label { color: ${palette.accent}; font-size: 17px; font-weight: 800; letter-spacing: 0.08em; }
    .takeaway-text { font-size: 22px; line-height: 1.4; color: #fff; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="shell">
      <div class="badge">${badge}</div>
      <div class="title">${escapeSvgText(shortenText(structuredSpec.title, 18))}</div>
      <div class="subtitle">${escapeSvgText(shortenText(structuredSpec.subtitle, 34))}</div>
      <div class="flow">
        ${steps.map((step, index) => `
          <div class="step">
            <div class="step-index">0${index + 1}</div>
            <div class="step-kicker">STEP</div>
            <div class="step-title">${escapeSvgText(shortenText(step, 18))}</div>
          </div>
        `).join('<div class="arrow"></div>')}
      </div>
      <div class="takeaway">
        <div class="takeaway-label">TAKEAWAY</div>
        <div class="takeaway-text">${escapeSvgText(shortenText(structuredSpec.takeaway, 48))}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  if (structuredSpec && item.type === 'framework') {
    const badge = escapeSvgText(illustrationStyleBadge(item));
    const framework = structuredSpec.framework || { core: structuredSpec.title, pillars: [] };

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: linear-gradient(145deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame { width: 1200px; height: 675px; padding: 56px; }
    .shell {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background: radial-gradient(circle at top left, rgba(255,255,255,0.10), transparent 36%), rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: ${palette.accent};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title { margin-top: 10px; font-size: 56px; line-height: 1.04; font-weight: 800; max-width: 860px; }
    .subtitle { max-width: 760px; font-size: 24px; line-height: 1.42; color: rgba(255,255,255,0.84); }
    .map { position: relative; flex: 1; min-height: 280px; }
    .core {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 212px;
      height: 212px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
      border: 1px solid rgba(255,255,255,0.18);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 24px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .core-kicker { color: ${palette.accent}; font-size: 16px; font-weight: 700; letter-spacing: 0.08em; }
    .core-title { margin-top: 14px; font-size: 30px; line-height: 1.12; font-weight: 800; }
    .pillar {
      position: absolute;
      width: 220px;
      min-height: 86px;
      border-radius: 24px;
      padding: 22px;
      background: linear-gradient(180deg, rgba(10,14,28,0.18), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.16);
      display: flex;
      align-items: center;
      font-size: 23px;
      line-height: 1.24;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .p1 { left: 42px; top: 36px; }
    .p2 { right: 42px; top: 24px; }
    .p3 { left: 42px; bottom: 28px; }
    .p4 { right: 42px; bottom: 18px; }
    .line {
      position: absolute;
      height: 4px;
      background: rgba(255,255,255,0.24);
      border-radius: 999px;
    }
    .l1 { left: 262px; top: 132px; width: 214px; }
    .l2 { right: 262px; top: 126px; width: 214px; }
    .l3 { left: 262px; bottom: 132px; width: 214px; }
    .l4 { right: 262px; bottom: 126px; width: 214px; }
    .takeaway {
      border-radius: 24px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .takeaway-label { color: ${palette.accent}; font-size: 17px; font-weight: 800; letter-spacing: 0.08em; }
    .takeaway-text { font-size: 22px; line-height: 1.4; color: #fff; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="shell">
      <div class="badge">${badge}</div>
      <div class="title">${escapeSvgText(shortenText(structuredSpec.title, 18))}</div>
      <div class="subtitle">${escapeSvgText(shortenText(structuredSpec.subtitle, 34))}</div>
      <div class="map">
        <div class="line l1"></div>
        <div class="line l2"></div>
        <div class="line l3"></div>
        <div class="line l4"></div>
        <div class="pillar p1">${escapeSvgText(shortenText(framework.pillars[0] || '关键支柱', 16))}</div>
        <div class="pillar p2">${escapeSvgText(shortenText(framework.pillars[1] || '关键支柱', 16))}</div>
        <div class="pillar p3">${escapeSvgText(shortenText(framework.pillars[2] || '关键支柱', 16))}</div>
        <div class="pillar p4">${escapeSvgText(shortenText(framework.pillars[3] || '关键支柱', 16))}</div>
        <div class="core">
          <div class="core-kicker">CORE</div>
          <div class="core-title">${escapeSvgText(shortenText(framework.core, 14))}</div>
        </div>
      </div>
      <div class="takeaway">
        <div class="takeaway-label">TAKEAWAY</div>
        <div class="takeaway-text">${escapeSvgText(shortenText(structuredSpec.takeaway, 48))}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  if (structuredSpec && item.type === 'timeline') {
    const badge = escapeSvgText(illustrationStyleBadge(item));
    const stages = structuredSpec.timeline.slice(0, 4);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      background: linear-gradient(145deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame { width: 1200px; height: 675px; padding: 56px; }
    .shell {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background: radial-gradient(circle at top center, rgba(255,255,255,0.10), transparent 36%), rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      height: 42px;
      padding: 0 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.22);
      color: ${palette.accent};
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title { margin-top: 10px; font-size: 56px; line-height: 1.04; font-weight: 800; max-width: 860px; }
    .subtitle { max-width: 760px; font-size: 24px; line-height: 1.42; color: rgba(255,255,255,0.84); }
    .timeline {
      position: relative;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 18px;
      margin-top: 12px;
      padding-top: 38px;
    }
    .timeline::before {
      content: "";
      position: absolute;
      left: 68px;
      right: 68px;
      top: 58px;
      height: 6px;
      background: rgba(255,255,255,0.22);
      border-radius: 999px;
    }
    .stage {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
    }
    .dot {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.16);
      border: 2px solid ${palette.accent};
      color: #fff;
      font-size: 18px;
      font-weight: 800;
      z-index: 1;
    }
    .label {
      min-width: 172px;
      border-radius: 20px;
      padding: 14px 18px;
      background: rgba(10,14,28,0.18);
      border: 1px solid rgba(255,255,255,0.16);
      font-size: 22px;
      line-height: 1.2;
      font-weight: 800;
    }
    .note {
      min-height: 96px;
      border-radius: 22px;
      padding: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.16);
      font-size: 18px;
      line-height: 1.45;
      color: rgba(255,255,255,0.88);
    }
    .takeaway {
      margin-top: auto;
      border-radius: 24px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 18px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .takeaway-label { color: ${palette.accent}; font-size: 17px; font-weight: 800; letter-spacing: 0.08em; }
    .takeaway-text { font-size: 22px; line-height: 1.4; color: #fff; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="shell">
      <div class="badge">${badge}</div>
      <div class="title">${escapeSvgText(shortenText(structuredSpec.title, 18))}</div>
      <div class="subtitle">${escapeSvgText(shortenText(structuredSpec.subtitle, 34))}</div>
      <div class="timeline">
        ${stages.map((stage, index) => `
          <div class="stage">
            <div class="dot">0${index + 1}</div>
            <div class="label">${escapeSvgText(shortenText(stage.label, 12))}</div>
            <div class="note">${escapeSvgText(shortenText(stage.note, 20))}</div>
          </div>
        `).join('')}
      </div>
      <div class="takeaway">
        <div class="takeaway-label">TAKEAWAY</div>
        <div class="takeaway-text">${escapeSvgText(shortenText(structuredSpec.takeaway, 48))}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  const points = context.points.length > 0 ? context.points : [item.purpose];
  const title = escapeSvgText(shortenText(item.alt, 28));
  const subtitle = escapeSvgText(shortenText(context.heading || item.anchorLabel, 30));
  const badge = escapeSvgText(illustrationStyleBadge(item));

  const centerMarkup = (() => {
    if (item.type === 'timeline') {
      return `
        <div class="timeline-line"></div>
        <div class="timeline-grid">
          ${points.slice(0, 4).map((point, index) => `
            <div class="timeline-item">
              <div class="timeline-dot">${index + 1}</div>
              <div class="timeline-text">${escapeSvgText(shortenText(point, 12))}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (item.type === 'comparison') {
      return `
        <div class="comparison-grid">
          <div class="comparison-card">
            <div class="eyebrow">LEFT</div>
            <div class="card-title">${escapeSvgText(shortenText(points[0] || item.anchorLabel, 18))}</div>
          </div>
          <div class="comparison-card">
            <div class="eyebrow">RIGHT</div>
            <div class="card-title">${escapeSvgText(shortenText(points[1] || item.purpose, 18))}</div>
          </div>
        </div>
        <div class="comparison-foot">${escapeSvgText(shortenText(points[2] || 'Reader takeaway', 42))}</div>
      `;
    }

    if (item.type === 'flowchart') {
      return `
        <div class="flow-grid">
          ${points.slice(0, 3).map((point, index) => `
            <div class="flow-card">
              <div class="eyebrow">STEP ${index + 1}</div>
              <div class="card-title">${escapeSvgText(shortenText(point, 14))}</div>
            </div>
          `).join('<div class="flow-arrow">→</div>')}
        </div>
      `;
    }

    if (item.type === 'framework') {
      return `
        <div class="framework-wrap">
          <div class="framework-core">
            <div class="eyebrow">CORE</div>
            <div class="card-title">${escapeSvgText(shortenText(item.anchorLabel, 12))}</div>
          </div>
          <div class="framework-side top-left">${escapeSvgText(shortenText(points[0] || item.purpose, 12))}</div>
          <div class="framework-side top-right">${escapeSvgText(shortenText(points[1] || item.anchorLabel, 12))}</div>
          <div class="framework-side bottom-right">${escapeSvgText(shortenText(points[2] || 'Key point', 12))}</div>
        </div>
      `;
    }

    return `
      <div class="summary-box">
        ${points.slice(0, 3).map((point) => `
          <div class="summary-row">
            <span class="summary-dot"></span>
            <span>${escapeSvgText(shortenText(point, 36))}</span>
          </div>
        `).join('')}
      </div>
    `;
  })();

  const sideMarkup = points.slice(0, 3).map((point) => `
    <div class="side-card">${escapeSvgText(shortenText(point, 24))}</div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
      background: linear-gradient(135deg, ${palette.start} 0%, ${palette.end} 100%);
      color: #fff;
    }
    .frame {
      width: 1200px;
      height: 675px;
      padding: 64px;
      position: relative;
    }
    .panel {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 28px;
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      height: 44px;
      padding: 0 22px;
      border-radius: 999px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.24);
      color: ${palette.accent};
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .title {
      margin-top: 72px;
      font-size: 56px;
      line-height: 1.08;
      font-weight: 700;
    }
    .subtitle {
      margin-top: 20px;
      font-size: 28px;
      color: rgba(255,255,255,0.82);
    }
    .divider {
      width: 268px;
      height: 4px;
      margin-top: 36px;
      border-radius: 999px;
      background: rgba(255,255,255,0.28);
    }
    .content {
      margin-top: 56px;
      min-height: 220px;
      position: relative;
    }
    .side {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 16px;
    }
    .side-card {
      min-height: 48px;
      padding: 12px 18px;
      border-radius: 18px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.18);
      display: flex;
      align-items: center;
      font-size: 18px;
      color: rgba(255,255,255,0.94);
    }
    .eyebrow {
      font-size: 16px;
      color: ${palette.accent};
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .card-title {
      margin-top: 14px;
      font-size: 24px;
      line-height: 1.25;
      color: #fff;
      font-weight: 600;
    }
    .summary-box {
      width: 596px;
      min-height: 144px;
      border-radius: 26px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 26px 30px;
    }
    .summary-row {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 20px;
      line-height: 1.4;
      margin-bottom: 14px;
    }
    .summary-row:last-child { margin-bottom: 0; }
    .summary-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: ${palette.accent};
      flex: 0 0 auto;
    }
    .flow-grid {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .flow-card {
      width: 168px;
      min-height: 116px;
      border-radius: 22px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 20px 22px;
    }
    .flow-arrow {
      font-size: 42px;
      color: rgba(255,255,255,0.48);
      font-weight: 700;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(2, 272px);
      gap: 44px;
    }
    .comparison-card {
      min-height: 168px;
      border-radius: 24px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 20px 28px;
    }
    .comparison-foot {
      margin-top: 18px;
      font-size: 18px;
      color: rgba(255,255,255,0.84);
    }
    .timeline-line {
      position: absolute;
      left: 66px;
      right: 66px;
      top: 66px;
      height: 6px;
      background: rgba(255,255,255,0.28);
      border-radius: 999px;
    }
    .timeline-grid {
      position: relative;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
      padding-top: 32px;
    }
    .timeline-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 18px;
    }
    .timeline-dot {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: rgba(255,255,255,0.18);
      border: 2px solid ${palette.accent};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
    }
    .timeline-text {
      font-size: 18px;
      color: #fff;
    }
    .framework-wrap {
      position: relative;
      width: 620px;
      height: 224px;
    }
    .framework-core {
      position: absolute;
      left: 230px;
      top: 56px;
      width: 176px;
      height: 176px;
      border-radius: 999px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.18);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 18px;
    }
    .framework-side {
      position: absolute;
      width: 168px;
      min-height: 76px;
      border-radius: 22px;
      background: rgba(255,255,255,0.10);
      border: 1px solid rgba(255,255,255,0.18);
      padding: 22px 18px;
      font-size: 22px;
      line-height: 1.2;
      display: flex;
      align-items: center;
    }
    .top-left { left: 0; top: 24px; }
    .top-right { right: 0; top: 0; }
    .bottom-right { right: 0; bottom: 8px; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="panel">
      <div>
        <div class="badge">${badge}</div>
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle}</div>
        <div class="divider"></div>
        <div class="content">${centerMarkup}</div>
      </div>
      <div class="side">${sideMarkup}</div>
    </div>
  </div>
</body>
</html>`;
}

export function illustrationStyleBadge(item: IllustrationPlanItem): string {
  return `${illustrationTypeDisplayName(item.type)} / ${item.style.toUpperCase()}`;
}

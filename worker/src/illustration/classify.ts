import type { IllustrationEngine, IllustrationType } from '../types';

export function detectIllustrationType(sectionText: string): IllustrationType {
  const lower = sectionText.toLowerCase();

  if (/(timeline|时间|历程|演变|发展|阶段)/i.test(sectionText)) return 'timeline';
  if (/(对比|区别|优缺点|比较|vs|versus)/i.test(sectionText)) return 'comparison';
  if (/(流程|步骤|step|操作|教程|指南|sop|checklist)/i.test(sectionText)) return 'flowchart';
  if (/(框架|模型|体系|原则|方法论|策略|结构)/i.test(sectionText)) return 'framework';
  if (/(数据|指标|结论|摘要|重点|概览|overview|summary)/i.test(sectionText)) return 'infographic';
  if (/(封面|导语|开场|主题|opening|hero)/i.test(sectionText)) return 'cover';
  if (lower.length > 0) return 'scene';

  return 'infographic';
}

export function engineForType(type: IllustrationType): IllustrationEngine {
  return type === 'scene' || type === 'cover' ? 'http_image' : 'html_infographic';
}

export function defaultStyleForType(type: IllustrationType, preferredStyle: string): string {
  if (preferredStyle && preferredStyle !== 'auto') return preferredStyle;

  switch (type) {
    case 'flowchart':
    case 'framework':
    case 'comparison':
      return 'blueprint';
    case 'timeline':
      return 'editorial';
    case 'cover':
      return 'warm';
    case 'scene':
      return 'editorial';
    case 'infographic':
    default:
      return 'minimal';
  }
}

export function buildAltText(sectionLabel: string, type: IllustrationType): string {
  switch (type) {
    case 'flowchart':
      return `${sectionLabel}流程示意图`;
    case 'comparison':
      return `${sectionLabel}对比图`;
    case 'framework':
      return `${sectionLabel}框架图`;
    case 'timeline':
      return `${sectionLabel}时间线图`;
    case 'cover':
      return `${sectionLabel}主题配图`;
    case 'scene':
      return `${sectionLabel}场景插图`;
    case 'infographic':
    default:
      return `${sectionLabel}信息图`;
  }
}

export function buildPurpose(type: IllustrationType): string {
  switch (type) {
    case 'flowchart':
      return '把步骤和流程转换成更直观的图示，降低阅读门槛。';
    case 'comparison':
      return '把差异点并列呈现，提升读者理解效率。';
    case 'framework':
      return '把抽象方法论整理成结构化框架。';
    case 'timeline':
      return '把时间顺序压缩成可快速扫读的时间线。';
    case 'cover':
      return '在核心主题位置提供一张概括性主图，提升停留和分享意愿。';
    case 'scene':
      return '增强阅读氛围，让纯文字叙述更容易进入场景。';
    case 'infographic':
    default:
      return '用信息图概括重点，减少长段落带来的疲劳感。';
  }
}

export function engineDisplayName(engine: IllustrationEngine): string {
  return engine === 'html_infographic' ? 'HTML INFOGRAPHIC' : 'HTTP IMAGE';
}

export function illustrationTypeDisplayName(type: IllustrationType): string {
  switch (type) {
    case 'flowchart':
      return 'FLOWCHART';
    case 'comparison':
      return 'COMPARISON';
    case 'framework':
      return 'FRAMEWORK';
    case 'timeline':
      return 'TIMELINE';
    case 'cover':
      return 'COVER';
    case 'scene':
      return 'SCENE';
    case 'infographic':
    default:
      return 'INFOGRAPHIC';
  }
}

export function illustrationPalette(type: IllustrationType): { start: string; end: string; accent: string } {
  switch (type) {
    case 'flowchart':
      return { start: '#0f766e', end: '#115e59', accent: '#99f6e4' };
    case 'comparison':
      return { start: '#7c3aed', end: '#4c1d95', accent: '#ddd6fe' };
    case 'framework':
      return { start: '#1d4ed8', end: '#1e3a8a', accent: '#bfdbfe' };
    case 'timeline':
      return { start: '#be185d', end: '#831843', accent: '#fbcfe8' };
    case 'cover':
      return { start: '#ea580c', end: '#9a3412', accent: '#fdba74' };
    case 'scene':
      return { start: '#2563eb', end: '#1d4ed8', accent: '#bfdbfe' };
    case 'infographic':
    default:
      return { start: '#111827', end: '#334155', accent: '#cbd5e1' };
  }
}

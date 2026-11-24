import MarkdownIt from 'markdown-it';

export interface XThreadPost {
  id: string;
  index: number;
  content: string;
  charCount: number;
}

export interface XThreadExport {
  title: string;
  hook: string;
  posts: XThreadPost[];
  combinedText: string;
}

export interface XArticleExport {
  title: string;
  subtitle: string;
  body: string;
  combinedText: string;
  bodyHtml: string;
  bodyRichHtml: string;
  combinedHtml: string;
  codeBlocks: XArticleCodeBlock[];
}

export interface XArticleCodeBlock {
  id: string;
  language: string;
  label: string;
  content: string;
}

type Section = {
  heading: string;
  content: string;
};

const articleMarkdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
});

articleMarkdown.renderer.rules.heading_open = (_tokens, idx, options, _env, self) => {
  const token = _tokens[idx];
  const level = Number(token.tag.slice(1));
  const styleMap: Record<number, string> = {
    1: 'margin:40px 0 16px;font-size:32px;line-height:1.2;font-weight:800;color:#0f172a;',
    2: 'margin:32px 0 14px;font-size:24px;line-height:1.28;font-weight:800;color:#0f172a;',
    3: 'margin:24px 0 12px;font-size:19px;line-height:1.34;font-weight:700;color:#0f172a;',
  };
  token.attrSet('style', styleMap[level] || styleMap[3]);
  return self.renderToken(_tokens, idx, options);
};

articleMarkdown.renderer.rules.paragraph_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('style', 'margin:0 0 18px;font-size:17px;line-height:1.85;color:#334155;');
  return self.renderToken(tokens, idx, options);
};

articleMarkdown.renderer.rules.bullet_list_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('style', 'margin:0 0 22px;padding-left:22px;color:#334155;');
  return self.renderToken(tokens, idx, options);
};

articleMarkdown.renderer.rules.ordered_list_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('style', 'margin:0 0 22px;padding-left:24px;color:#334155;');
  return self.renderToken(tokens, idx, options);
};

articleMarkdown.renderer.rules.list_item_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('style', 'margin:0 0 10px;line-height:1.8;font-size:16px;');
  return self.renderToken(tokens, idx, options);
};

articleMarkdown.renderer.rules.blockquote_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('style', 'margin:24px 0;padding:18px 20px;border-left:4px solid #38bdf8;background:linear-gradient(180deg,rgba(240,249,255,0.95),rgba(248,250,252,0.92));border-radius:0 18px 18px 0;');
  return self.renderToken(tokens, idx, options);
};

articleMarkdown.renderer.rules.hr = () => '<hr style="margin:28px 0;border:none;border-top:1px solid rgba(148,163,184,0.35);" />';

articleMarkdown.renderer.rules.code_inline = (tokens, idx) => {
  const content = articleMarkdown.utils.escapeHtml(tokens[idx].content);
  return `<code style="padding:2px 8px;border-radius:8px;background:#e2e8f0;color:#0f172a;font-size:0.92em;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">${content}</code>`;
};

articleMarkdown.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const language = token.info.trim();
  const content = articleMarkdown.utils.escapeHtml(token.content);
  const label = language ? language.toUpperCase() : 'CODE';
  return [
    '<div style="margin:26px 0;overflow:hidden;border:1px solid rgba(15,23,42,0.08);border-radius:22px;box-shadow:0 20px 45px rgba(15,23,42,0.08);">',
    `<div style="padding:10px 16px;background:#0f172a;color:#cbd5e1;font-size:12px;font-weight:700;letter-spacing:0.08em;">${label}</div>`,
    `<pre style="margin:0;padding:18px 20px;overflow:auto;background:#f8fafc;color:#0f172a;font-size:14px;line-height:1.7;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;"><code>${content}</code></pre>`,
    '</div>',
  ].join('');
};

articleMarkdown.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx];
  const src = token.attrGet('src') || '';
  const alt = articleMarkdown.utils.escapeHtml(token.content || token.attrGet('alt') || 'article image');
  return [
    '<figure style="margin:30px 0;">',
    `<img src="${src}" alt="${alt}" style="display:block;max-width:100%;height:auto;border-radius:22px;box-shadow:0 28px 60px rgba(15,23,42,0.16),0 6px 20px rgba(15,23,42,0.08);" />`,
    alt ? `<figcaption style="margin-top:10px;font-size:13px;line-height:1.6;color:#64748b;">${alt}</figcaption>` : '',
    '</figure>',
  ].join('');
};

articleMarkdown.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet('style', 'color:#0f766e;text-decoration:underline;text-decoration-color:rgba(15,118,110,0.35);text-underline-offset:3px;font-weight:600;');
  return self.renderToken(tokens, idx, options);
};

function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, (block) => {
      const inner = block.replace(/```/g, '').trim();
      return inner ? `\n${inner}\n` : '\n';
    })
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '• ')
    .replace(/[*_~`]/g, '')
    .replace(/\|/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function normalizeHeadingLabel(raw: string): string {
  const parts = raw.split('|').map((part) => stripMarkdown(part).trim()).filter(Boolean);
  return parts[1] || parts[0] || '本节';
}

function normalizeTitle(raw: string): string {
  const cleaned = normalizeHeadingLabel(raw)
    .replace(/^0?\d+\s*/, '')
    .replace(/[\\/]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned || '未命名内容';
}

function splitSections(markdown: string): Section[] {
  const lines = markdown.split(/\n/);
  const sections: Section[] = [];
  let currentHeading = '';
  let currentContent: string[] = [];

  const pushCurrent = () => {
    const content = stripMarkdown(currentContent.join('\n'));
    if (!content && !currentHeading) return;
    sections.push({
      heading: currentHeading || '正文',
      content,
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      if (currentHeading || currentContent.length > 0) {
        pushCurrent();
      }
      currentHeading = normalizeHeadingLabel(headingMatch[2]);
      currentContent = [];
      continue;
    }

    currentContent.push(line);
  }

  pushCurrent();
  return sections.filter((section) => section.content || section.heading);
}

function toSentences(value: string): string[] {
  return stripMarkdown(value)
    .split(/(?<=[。！？!?.])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function shorten(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function buildHook(title: string, sections: Section[]): string {
  const firstSection = sections.find((section) => section.content) || sections[0];
  const firstSentence = firstSection ? toSentences(firstSection.content)[0] : '';
  const normalizedSentence = firstSentence ? shorten(firstSentence, 92) : '';
  if (normalizedSentence && normalizedSentence !== title) {
    return `${title}\n\n${normalizedSentence}`;
  }
  return title;
}

function clampPostContent(value: string, maxChars: number): string[] {
  const sentences = toSentences(value);
  const posts: string[] = [];
  let current = '';

  const flush = () => {
    const normalized = current.trim();
    if (normalized) posts.push(normalized);
    current = '';
  };

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      flush();
    }

    if (sentence.length <= maxChars) {
      current = sentence;
      continue;
    }

    let remaining = sentence;
    while (remaining.length > maxChars) {
      posts.push(`${remaining.slice(0, maxChars - 1).trimEnd()}…`);
      remaining = remaining.slice(maxChars - 1).trimStart();
    }
    current = remaining;
  }

  flush();
  return posts;
}

function extractCodeBlocks(markdown: string): XArticleCodeBlock[] {
  const matches = Array.from(markdown.matchAll(/```([^\n`]*)\n([\s\S]*?)```/g));
  return matches
    .map((match, index) => {
      const language = (match[1] || '').trim();
      const content = (match[2] || '').replace(/\s+$/, '');
      if (!content.trim()) return null;

      return {
        id: `x-article-code-${index + 1}`,
        language: language || 'text',
        label: language ? language.toUpperCase() : 'TEXT',
        content,
      };
    })
    .filter((block): block is XArticleCodeBlock => Boolean(block));
}

export function generateXThreadExport(markdown: string): XThreadExport {
  const sections = splitSections(markdown);
  const title = normalizeTitle(sections[0]?.heading || '未命名内容');
  const hook = buildHook(title, sections);
  const maxChars = 245;
  const posts: XThreadPost[] = [];

  sections.forEach((section) => {
    const heading = normalizeTitle(section.heading);
    const content = section.content.trim();
    if (!content) return;

    const body = content.startsWith(heading)
      ? content
      : `${heading}\n\n${content}`;

    clampPostContent(body, maxChars).forEach((chunk) => {
      posts.push({
        id: `x-thread-${posts.length + 1}`,
        index: posts.length + 1,
        content: chunk,
        charCount: chunk.length,
      });
    });
  });

  if (posts.length === 0) {
    const fallback = stripMarkdown(markdown) || '暂无可导出的内容';
    posts.push({
      id: 'x-thread-1',
      index: 1,
      content: shorten(fallback, maxChars),
      charCount: shorten(fallback, maxChars).length,
    });
  }

  const numberedPosts = posts.map((post, index) => {
    const prefix = `${index + 1}/${posts.length}\n`;
    const nextContent = `${prefix}${post.content}`.trim();
    return {
      ...post,
      index: index + 1,
      content: nextContent,
      charCount: nextContent.length,
    };
  });

  return {
    title,
    hook,
    posts: numberedPosts,
    combinedText: numberedPosts.map((post) => post.content).join('\n\n---\n\n'),
  };
}

export function generateXArticleExport(markdown: string): XArticleExport {
  const sections = splitSections(markdown);
  const codeBlocks = extractCodeBlocks(markdown);
  const title = normalizeTitle(sections[0]?.heading || '未命名内容');
  const leadSource = sections.find((section) => section.content)?.content || '';
  const subtitle = shorten(toSentences(leadSource)[0] || stripMarkdown(leadSource) || title, 90);
  const bodyMarkdown = sections
    .map((section, index) => {
      const heading = normalizeTitle(section.heading);
      const content = section.content.trim();
      if (!content) return '';
      if (index === 0) return content;
      if (!heading || heading === '正文') return content;
      return `## ${heading}\n\n${content}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const body = bodyMarkdown.trim();
  const bodyHtml = articleMarkdown.render(body);
  const bodyRichHtml = `
    <div style="max-width:760px;margin:0 auto;padding:8px 0;font-family:'Georgia','Times New Roman',serif;">
      ${bodyHtml}
    </div>
  `.trim();
  const combinedText = [title, subtitle, body].filter(Boolean).join('\n\n');
  const combinedHtml = `
    <article style="max-width:760px;margin:0 auto;padding:12px 0;font-family:'Georgia','Times New Roman',serif;">
      <h1 style="margin:0 0 14px;font-size:38px;line-height:1.12;font-weight:800;color:#0f172a;">${title}</h1>
      <p style="margin:0 0 26px;font-size:18px;line-height:1.75;color:#475569;">${subtitle}</p>
      <div>${bodyHtml}</div>
    </article>
  `.trim();

  return {
    title,
    subtitle,
    body,
    combinedText,
    bodyHtml,
    bodyRichHtml,
    combinedHtml,
    codeBlocks,
  };
}

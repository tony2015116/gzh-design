import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CheatsheetModalProps {
  onClose: () => void;
}

const SYNTAX_DATA = [
  {
    category: '标题体系',
    items: [
      {
        name: '一级标题',
        desc: '适合文章开头，支持序号、主标题和副标题。',
        code: '# 01 | 欢迎使用公众号排版系统 | /// V2.0',
      },
      {
        name: '二级标题',
        desc: '适合小节分隔，可以把 STEP01 换成任意标签。',
        code: '## STEP01 | **基础排版支持**',
      },
      {
        name: '三级标题',
        desc: '章节内再切一层小节时使用；短文章通常用不到，长文（>1500 字）里出现 1-3 个即可。左侧竖条 + 可选标签。',
        code: '### 准备工作 | 环境检查清单',
      },
      {
        name: '四级标题',
        desc: '小节内的横切板块，装置换成"文字下划线"，和三级视觉上区分开。仅当一节真的有并列子板块时才用。',
        code: '#### 常见误区',
      },
      {
        name: '五级标题',
        desc: '要点级小标题，前缀是 accent 色 ◆。多数时候用无序列表就够，只有要点本身还带一段展开时才升为五级。',
        code: '##### 关键指标',
      },
      {
        name: '六级标题',
        desc: '注释/补充说明的备注型，灰字 + — 前缀，不进阅读主线。绝大多数文章都用不到。',
        code: '###### 数据来源：内部埋点，2026 Q1',
      },
    ],
  },
  {
    category: '文字效果',
    items: [
      {
        name: '强调加粗',
        desc: '会根据当前主题自动渲染成更醒目的重点样式。',
        code: '**加粗突出文字**',
      },
      {
        name: '斜体',
        desc: '适合语气提示、书名和轻量补充信息。',
        code: '*这是一段斜体文字*',
      },
      {
        name: '删除线',
        desc: '适合展示被替换的方案、旧价格或修订内容。',
        code: '原价 ~~199 元~~，现价 99 元。',
      },
      {
        name: '高亮链接',
        desc: '会渲染成更适合公众号的强调链接样式。',
        code: '[点击查看资料](https://mp.weixin.qq.com)',
      },
      {
        name: '行内代码',
        desc: '适合展示关键词、参数名和命令片段。',
        code: '这里有一个 `核心概念` 需要单独强调。',
      },
      {
        name: '段内换行',
        desc: '连续两行文字会保留换行，适合短句、署名和诗歌。',
        code: '第一行文字\n第二行文字',
      },
      {
        name: '转义字符',
        desc: '在语法符号前加反斜杠，可以按普通文字显示。',
        code: '\\*这里不会变成斜体\\*',
      },
    ],
  },
  {
    category: '列表与内容块',
    items: [
      {
        name: '无序列表',
        desc: '适合并列观点、功能清单和要点总结。',
        code: '- 第一项\n- 第二项\n- 第三项',
      },
      {
        name: '有序列表',
        desc: '适合步骤、排名和有先后关系的流程。',
        code: '1. 准备内容\n2. 选择方案\n3. 复制到公众号',
      },
      {
        name: '引用',
        desc: '适合展示结论、观点和引导语。',
        code: '> 这里是一段引用内容，可以拿来展示观点或总结。',
      },
      {
        name: '分割线',
        desc: '用于切换章节或拉开内容节奏。',
        code: '---',
      },
      {
        name: '表格',
        desc: '适合展示对比项、价格或步骤摘要。',
        code: '| 项目 | 价格 | 备注 |\n| :--- | :--- | :--- |\n| 苹果 | $10 | 新鲜 |\n| 香蕉 | $5 | 热门 |',
      },
      {
        name: '代码块',
        desc: '会渲染成适合阅读的代码展示卡片。',
        code: '```javascript\nconsole.log("Hello, WeChat!");\n```',
      },
    ],
  },
  {
    category: '图片与图组',
    items: [
      {
        name: '单张图片',
        desc: '单独一行插入图片，会使用当前图片样式渲染。',
        code: '![图片说明](https://example.com/image.jpg)',
      },
      {
        name: '横排图组',
        desc: '同一行连续插入多张图片，会自动渲染成横向拼图。',
        code: '![插图1](https://img1.com) ![插图2](https://img2.com)',
      },
      {
        name: '超长图滚动容器',
        desc: '预览时在固定高度内上下滑动，复制到公众号默认展开完整长图。使用 copy="scroll" 可显式保留滚动。',
        code: '<LongImageCard title="完整长图" height="360" hint="上下滑动查看长图">\n![长图说明](https://example.com/long-image.jpg)\n</LongImageCard>',
      },
    ],
  },
  {
    category: '高级排版组件',
    items: [
      {
        name: '信息卡片',
        desc: '适合展示提醒、背景信息和单段重点内容。',
        code: '<InfoCard title="关键提示">\n卡片正文支持 **加粗**、*斜体* 和 `行内代码`。\n</InfoCard>',
      },
      {
        name: '总结卡片',
        desc: '适合章节结尾和全文总结，可自动识别列表项。',
        code: '<SummaryCard title="本节总结">\n这是一段总结说明。\n- 结论一\n- 结论二\n- 结论三\n</SummaryCard>',
      },
      {
        name: '长文滑动容器',
        desc: '限制展示高度，适合日志、代码、数据和资料摘录。右侧提示词可用 hint 自定义，设置为空可隐藏。',
        code: '<ScrollCard title="接口返回" height="220" hint="滑动查看">\n这里放很长的内容，预览时可在容器内部滑动查看。\n</ScrollCard>',
      },
    ],
  },
  {
    category: '整篇结构组件',
    items: [
      {
        name: '开篇封面',
        desc: '放在文章最前面。kicker 是栏目标签，date 是日期，subtitle 是副标题，正文写一两句导语；属性都可省略。',
        code: '<CoverCard kicker="AI 观察" date="2026.11.05" title="主标题写这里" subtitle="一句话副标题">\n导语：这篇文章想讲清楚的一件事。\n</CoverCard>',
      },
      {
        name: '本文导读',
        desc: '列出本文看点。不写条目时自动取全文二级标题（最多 6 条）。',
        code: '<TocCard title="本文导读">\n- 看点一\n- 看点二\n- 看点三\n</TocCard>',
      },
      {
        name: '文末签名',
        desc: '放在文章末尾。avatar 填头像图片地址，正文写一句简介；cta 自定义底部引导语，写 cta="" 可隐藏。',
        code: '<AuthorCard name="你的署名" avatar="https://example.com/avatar.jpg">\n一句话介绍你自己\n</AuthorCard>',
      },
    ],
  },
];

export const CheatsheetModal: React.FC<CheatsheetModalProps> = ({ onClose }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setCopyError(null);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setCopyError('复制失败，请检查浏览器剪贴板权限。');
      setTimeout(() => setCopyError(null), 2600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_28%),rgba(15,23,42,0.34)] p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[0_34px_90px_rgba(15,23,42,0.20)] animate-in zoom-in-95 duration-200">
        <div className="relative flex-none border-b border-slate-200/80 px-6 py-5">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.10),rgba(14,165,233,0.06),transparent)]" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Markdown Guide
              </div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">排版语法速查表</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                完整收录当前支持的标题、文字、列表、内容块、图片和高级组件。
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-white/80 p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
              title="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.78),rgba(255,255,255,0.62))] px-6 py-6">
          {copyError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {copyError}
            </div>
          )}

          <div className="space-y-8">
            {SYNTAX_DATA.map((section) => (
              <section key={section.category}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent" />
                  <h3 className="text-sm font-semibold tracking-[0.18em] text-slate-700">{section.category}</h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-sky-200 to-transparent" />
                </div>

                <div className="space-y-4">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-emerald-700">{item.name}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
                        </div>

                        <button
                          onClick={() => handleCopy(item.code)}
                          className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          {copiedCode === item.code ? (
                            <>
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                              复制语法
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-4 overflow-x-auto rounded-2xl bg-[#162033] p-4 shadow-inner">
                        <code className="whitespace-pre text-xs leading-6 text-slate-100">{item.code}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="flex-none border-t border-slate-200/70 bg-white/90 px-6 py-4">
          <p className="text-center text-sm text-slate-500">
            复制后直接粘贴到左侧编辑器即可。所有语法都支持实时预览，不需要额外保存。
          </p>
        </div>
      </div>
    </div>
  );
};

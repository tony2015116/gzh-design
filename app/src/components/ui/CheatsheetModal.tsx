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
        name: '高亮链接',
        desc: '会渲染成更适合公众号的强调链接样式。',
        code: '[点击查看资料](https://mp.weixin.qq.com)',
      },
      {
        name: '行内代码',
        desc: '适合展示关键词、参数名和命令片段。',
        code: '这里有一个 `核心概念` 需要单独强调。',
      },
    ],
  },
  {
    category: '组件与块',
    items: [
      {
        name: '引用',
        desc: '适合展示结论、观点和引导语。',
        code: '> 这里是一段引用内容，可以拿来展示观点或总结。',
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
      {
        name: '横排图组',
        desc: '同一行连续插入多张图片，会自动渲染成横向拼图。',
        code: '![插图1](https://img1.com) ![插图2](https://img2.com)',
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
                挑一段语法直接复制到编辑器里，就能快速验证当前主题和版式效果。
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

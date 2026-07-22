import { Copy, FileText, MessageSquareQuote, Sparkles, X } from 'lucide-react';

import type { XArticleExport, XThreadExport } from '../../services/xExportService';

interface PlatformExportPanelProps {
  threadExport: XThreadExport | null;
  articleExport: XArticleExport | null;
  activePlatform: 'xThread' | 'xArticle';
  onSwitch: (platform: 'xThread' | 'xArticle') => void;
  onClose: () => void;
  onCopyThreadAll: () => void;
  onCopyThreadPost: (content: string, index: number) => void;
  onCopyArticleTitle: () => void;
  onCopyArticleBody: () => void;
  onCopyArticleAll: () => void;
  onCopyArticleCodeBlock: (code: string, language: string, index: number) => void;
}

export function PlatformExportPanel({
  threadExport,
  articleExport,
  activePlatform,
  onSwitch,
  onClose,
  onCopyThreadAll,
  onCopyThreadPost,
  onCopyArticleTitle,
  onCopyArticleBody,
  onCopyArticleAll,
  onCopyArticleCodeBlock,
}: PlatformExportPanelProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(7,10,18,0.42)] p-4 backdrop-blur-md">
      <div className="relative flex h-[min(88vh,860px)] w-[min(1040px,100%)] flex-col overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,rgba(8,12,22,0.98),rgba(17,24,39,0.95))] text-white shadow-[0_40px_120px_rgba(2,8,23,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_26%)]" />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 px-7 py-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-Platform Export
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">多平台复制中心</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              源 Markdown 不会被覆盖。这里的 X 输出只是从当前正文派生出来的可复制版本。
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            title="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex items-center gap-3 border-b border-white/10 px-7 py-4">
          <button
            onClick={() => onSwitch('xThread')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activePlatform === 'xThread'
                ? 'bg-sky-400 text-slate-950 shadow-[0_10px_30px_rgba(56,189,248,0.35)]'
                : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            <MessageSquareQuote className="h-4 w-4" />
            X Thread
          </button>
          <button
            onClick={() => onSwitch('xArticle')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activePlatform === 'xArticle'
                ? 'bg-emerald-300 text-slate-950 shadow-[0_10px_30px_rgba(110,231,183,0.28)]'
                : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            <FileText className="h-4 w-4" />
            X Article
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-auto px-7 py-6">
          {activePlatform === 'xThread' && threadExport && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 rounded-[26px] border border-sky-300/20 bg-sky-300/10 p-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Thread Overview</div>
                  <div className="mt-2 text-2xl font-semibold">{threadExport.title}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-200">
                    共 {threadExport.posts.length} 条，首条 hook 已压缩到适合 X 的节奏。
                  </div>
                </div>
                <button
                  onClick={onCopyThreadAll}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  <Copy className="h-4 w-4" />
                  复制全部 Thread
                </button>
              </div>

              <div className="grid gap-4">
                {threadExport.posts.map((post) => (
                  <div key={post.id} className="rounded-[26px] border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                        Post {post.index}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-400">{post.charCount} chars</span>
                        <button
                          onClick={() => onCopyThreadPost(post.content, post.index)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          复制这条
                        </button>
                      </div>
                    </div>
                    <pre className="mt-4 whitespace-pre-wrap break-words font-['Georgia'] text-[15px] leading-7 text-slate-100">
                      {post.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePlatform === 'xArticle' && articleExport && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onCopyArticleTitle}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                  复制标题
                </button>
                <button
                  onClick={onCopyArticleBody}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                  复制正文
                </button>
                <button
                  onClick={onCopyArticleAll}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-200"
                >
                  <Copy className="h-4 w-4" />
                  复制全文
                </button>
              </div>

              <div className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm leading-6 text-emerald-50/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                X Article 鍓创鏉垮皢鍚屾椂鍐欏叆瀵岃枃鏈拰绾枃鏈唴瀹广€傚湪 X 缂栬緫鍣ㄧ殑鏈€缁堝睍鐜板彇鍐充簬 X 鐨勭矘璐村鐞嗚鍒欙紝浣嗘爣棰樸€佸垪琛ㄣ€佸紩鐢ㄣ€佷唬鐮佸拰鍥剧墖鏍峰紡浼氬敖閲忎繚鐣欍€?
              </div>

              {articleExport.codeBlocks.length > 0 && (
                <section className="rounded-[28px] border border-violet-300/20 bg-violet-300/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">Code Blocks</div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-50/90">
                        X Article 支持插入代码。如果全文粘贴后代码样式不完整，建议在 X 编辑器里使用“插入代码”，再粘贴下面单独复制的代码内容。
                      </p>
                    </div>
                    <div className="rounded-full border border-violet-200/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-100">
                      {articleExport.codeBlocks.length} blocks
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {articleExport.codeBlocks.map((block, index) => (
                      <div key={block.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(15,23,42,0.46)] shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[rgba(15,23,42,0.82)] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full border border-violet-200/20 bg-violet-300/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-100">
                              {block.label}
                            </div>
                            <span className="text-xs font-medium text-slate-400">Code {index + 1}</span>
                          </div>
                          <button
                            onClick={() => onCopyArticleCodeBlock(block.content, block.language, index + 1)}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            复制代码
                          </button>
                        </div>
                        <pre className="overflow-auto px-4 py-4 font-mono text-[13px] leading-6 text-slate-100">
                          <code>{block.content}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <article className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] shadow-[0_32px_90px_rgba(15,23,42,0.18)]">
                <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] px-8 py-8">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">X Article Draft</div>
                  <h3 className="mt-4 max-w-3xl font-['Georgia'] text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-slate-950">
                    {articleExport.title}
                  </h3>
                  <p className="mt-4 max-w-3xl font-['Georgia'] text-[18px] leading-8 text-slate-600">
                    {articleExport.subtitle}
                  </p>
                </div>

                <div className="bg-[linear-gradient(180deg,rgba(248,250,252,0.86),rgba(255,255,255,1))] px-8 py-8">
                  <div
                    className="mx-auto max-w-[760px]"
                    dangerouslySetInnerHTML={{ __html: articleExport.bodyRichHtml }}
                  />
                </div>
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

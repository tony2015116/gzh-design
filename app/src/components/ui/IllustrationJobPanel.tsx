import { CheckCircle2, Sparkles, X } from 'lucide-react';

import type { IllustrationJob } from '../../services/illustrationService';

interface IllustrationJobPanelProps {
  job: IllustrationJob;
  onClose: () => void;
}

/** 最近一次配图结果。配图生成后已直接写入正文，这里只做查看，不再提供二次“应用”（那会用旧正文覆盖之后的编辑）。 */
export function IllustrationJobPanel({ job, onClose }: IllustrationJobPanelProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40 w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_-28px_rgba(15,23,42,0.34)]">
      <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_42%),linear-gradient(135deg,#f8fffc,#ffffff_54%,#f6f8fb)] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              最近一次配图
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · 本机生成 PNG
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
            title="关闭面板"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          已插入 {job.insertedCount} 张配图，可在「AI 工具」中撤销。
        </div>
      </div>

      <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-4">
        {job.items.map((item) => (
          <div key={`${job.id}-${item.id}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
            <div className="aspect-[16/9] overflow-hidden bg-slate-100">
              <img src={item.imageUrl} alt={item.alt} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  {item.anchorLabel}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  {item.type}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900">{item.alt}</div>
              <div className="text-sm leading-6 text-slate-600">{item.purpose}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

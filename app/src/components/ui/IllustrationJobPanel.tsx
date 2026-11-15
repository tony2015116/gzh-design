import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw, Sparkles, X } from 'lucide-react';

import type { IllustrationJob } from '../../services/illustrationService';

interface IllustrationJobPanelProps {
  job: IllustrationJob;
  onRefresh?: () => void;
  onApply?: () => void;
  onClose: () => void;
  isApplying?: boolean;
}

function sourceLabel(source: IllustrationJob['source']): string {
  switch (source) {
    case 'generated':
      return '真实生成';
    case 'hybrid':
      return '混合生成';
    case 'oss_placeholder':
      return '浏览器生成';
    case 'pending':
      return '后台处理中';
    case 'placeholder':
    default:
      return '信息图回退';
  }
}

function statusLabel(status: IllustrationJob['status']): string {
  switch (status) {
    case 'queued':
      return '排队中';
    case 'running':
      return '生成中';
    case 'waiting':
      return '等待中';
    case 'completed':
      return '已完成';
    case 'failed':
    default:
      return '失败';
  }
}

function statusTone(status: IllustrationJob['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

function engineLabel(imageUrl: string): string {
  return imageUrl.startsWith('data:image/png')
    ? '本地 PNG'
    : imageUrl.endsWith('.png')
      ? 'PNG'
      : 'SVG';
}

export function IllustrationJobPanel({
  job,
  onRefresh,
  onApply,
  onClose,
  isApplying = false,
}: IllustrationJobPanelProps) {
  const summaryText = typeof job.summary?.summary === 'string' ? job.summary.summary : '';
  const canApply = job.status === 'completed' && Boolean(job.resultMarkdown) && Boolean(onApply);
  const isPending = job.status === 'queued' || job.status === 'running' || job.status === 'waiting';

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_-28px_rgba(15,23,42,0.34)]">
      <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_42%),linear-gradient(135deg,#f8fffc,#ffffff_54%,#f6f8fb)] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              最近一次配图任务
            </div>
            <div className="mt-1 text-xs text-slate-500">
              任务 {job.id.slice(0, 8)} · {sourceLabel(job.source)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
                title="刷新任务"
              >
                <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
              title="关闭面板"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(job.status)}`}>
            {statusLabel(job.status)}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            已插入 {job.insertedCount} 张
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {summaryText && (
          <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600">
            {summaryText}
          </div>
        )}
      </div>

      {isPending && (
        <div className="border-b border-slate-100 bg-amber-50/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <LoaderCircle className="mt-0.5 h-4 w-4 animate-spin text-amber-600" />
            <div className="text-sm leading-6 text-amber-900">
              后台正在异步生成配图。你可以继续编辑正文，等任务完成后再决定是否应用结果。
            </div>
          </div>
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-rose-600" />
            <div className="text-sm leading-6 text-rose-800">{job.error}</div>
          </div>
        </div>
      )}

      <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-4">
        {job.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            {isPending ? (
              <>
                <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                <div className="mt-3 text-sm font-semibold text-slate-900">任务已提交</div>
                <div className="mt-1 text-sm leading-6 text-slate-500">
                  当前还没有可预览的图片，等待后台渲染完成后这里会显示结果。
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-5 w-5 text-slate-400" />
                <div className="mt-3 text-sm font-semibold text-slate-900">还没有生成结果</div>
                <div className="mt-1 text-sm leading-6 text-slate-500">
                  可以手动刷新一次任务状态，确认后台是否已经写入结果。
                </div>
              </>
            )}
          </div>
        ) : (
          job.items.map((item) => (
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
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                    {engineLabel(item.imageUrl)}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{item.alt}</div>
                <div className="text-sm leading-6 text-slate-600">{item.purpose}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {canApply && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            onClick={onApply}
            disabled={isApplying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isApplying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isApplying ? '应用中...' : '将结果应用到正文'}
          </button>
        </div>
      )}
    </div>
  );
}

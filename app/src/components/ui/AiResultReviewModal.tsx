import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Check, GitCompare, Eye, Wand2, X } from 'lucide-react';
import { diffLines } from '../../ai/aiOutputCheck';
import type { AiOutputAnalysis, DiffLine } from '../../ai/aiOutputCheck';

interface AiResultReviewModalProps {
  original: string;
  analysis: AiOutputAnalysis;
  /** 排版期间用户又改过正文时为 true：采用结果会覆盖这些修改 */
  editedDuringRequest: boolean;
  renderPreview: (markdown: string) => ReactNode;
  onAccept: () => void;
  onDiscard: () => void;
}

type DiffRow = DiffLine | { kind: 'collapsed'; count: number };

const CONTEXT_LINES = 2;

/** 把连续的未改动行折叠起来，只在改动附近保留几行上下文 */
function collapseUnchanged(lines: DiffLine[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let index = 0;
  while (index < lines.length) {
    if (lines[index].kind !== 'same') {
      rows.push(lines[index++]);
      continue;
    }
    let end = index;
    while (end < lines.length && lines[end].kind === 'same') end++;
    const run = lines.slice(index, end);
    const keepHead = index === 0 ? 0 : CONTEXT_LINES;
    const keepTail = end === lines.length ? 0 : CONTEXT_LINES;
    if (run.length > keepHead + keepTail + 1) {
      rows.push(...run.slice(0, keepHead));
      rows.push({ kind: 'collapsed', count: run.length - keepHead - keepTail });
      rows.push(...run.slice(run.length - keepTail));
    } else {
      rows.push(...run);
    }
    index = end;
  }
  return rows;
}

const rowStyle: Record<DiffLine['kind'], string> = {
  same: 'text-slate-600',
  added: 'bg-emerald-50 text-emerald-900',
  removed: 'bg-rose-50 text-rose-900 line-through decoration-rose-300',
};

const rowMark: Record<DiffLine['kind'], string> = { same: ' ', added: '+', removed: '-' };

export function AiResultReviewModal({
  original,
  analysis,
  editedDuringRequest,
  renderPreview,
  onAccept,
  onDiscard,
}: AiResultReviewModalProps) {
  const [tab, setTab] = useState<'diff' | 'preview'>('diff');
  const diff = useMemo(() => diffLines(original, analysis.cleaned), [original, analysis.cleaned]);
  const rows = useMemo(() => (diff ? collapseUnchanged(diff) : null), [diff]);
  const added = diff?.filter((line) => line.kind === 'added').length ?? 0;
  const removed = diff?.filter((line) => line.kind === 'removed').length ?? 0;
  const hasDanger = analysis.warnings.some((warning) => warning.level === 'danger');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_32%),rgba(15,23,42,0.36)] p-4 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[0_34px_90px_rgba(15,23,42,0.20)]">
        <div className="relative border-b border-slate-200/80 px-6 py-5">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,158,11,0.10),rgba(14,165,233,0.06),transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">确认 AI 排版结果</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  正文 {analysis.originalChars} → {analysis.outputChars} 字
                  {diff && <>，新增 {added} 行，删除或改动 {removed} 行</>}
                  。采用后仍可在「AI 工具」菜单中撤销。
                </p>
              </div>
            </div>
            <button
              onClick={onDiscard}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-700"
              title="放弃结果"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(analysis.warnings.length > 0 || editedDuringRequest) && (
          <div className="space-y-2 border-b border-slate-200/80 px-6 py-3">
            {editedDuringRequest && (
              <WarningRow level="warning" message="AI 排版期间你修改过正文，采用结果会丢失这些修改。" />
            )}
            {analysis.warnings.map((warning) => (
              <WarningRow key={warning.message} level={warning.level} message={warning.message} />
            ))}
          </div>
        )}

        <div className="flex gap-2 px-6 pt-4">
          <TabButton active={tab === 'diff'} onClick={() => setTab('diff')} icon={<GitCompare className="h-4 w-4" />} label="改动对比" />
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')} icon={<Eye className="h-4 w-4" />} label="排版效果" />
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          {tab === 'diff' ? (
            rows ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white font-mono text-[13px] leading-6">
                {rows.map((row, index) => (
                  row.kind === 'collapsed' ? (
                    <div key={index} className="bg-slate-50 px-4 py-1 text-xs text-slate-400">
                      ⋯ {row.count} 行未改动 ⋯
                    </div>
                  ) : (
                    <div key={index} className={`flex whitespace-pre-wrap break-all px-4 ${rowStyle[row.kind]}`}>
                      <span className="mr-3 w-3 shrink-0 select-none text-slate-400">{rowMark[row.kind]}</span>
                      <span className="min-w-0 flex-1">{row.text || ' '}</span>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                文章过长，无法逐行对比，请切换到「排版效果」查看结果。
              </div>
            )
          ) : (
            <div className="flex justify-center rounded-2xl bg-slate-100 p-4">
              {renderPreview(analysis.cleaned)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
          <div className="text-sm text-slate-500">
            {hasDanger ? '检测到明显问题，建议放弃后分段排版。' : '确认无误后再采用，原文会保存一份用于撤销。'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDiscard}
              className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
            >
              放弃
            </button>
            <button
              onClick={onAccept}
              disabled={!analysis.cleaned.trim()}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                hasDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Check className="h-4 w-4" />
              {hasDanger ? '仍然采用' : '采用结果'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WarningRow({ level, message }: { level: 'danger' | 'warning'; message: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-2xl px-3 py-2 text-sm leading-6 ${
      level === 'danger' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'
    }`}>
      <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

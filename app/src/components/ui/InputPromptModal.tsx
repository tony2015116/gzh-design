import { Loader2, PencilLine, X } from 'lucide-react';

interface InputPromptModalProps {
  title: string;
  description: string;
  value: string;
  placeholder?: string;
  confirmLabel: string;
  isSubmitting?: boolean;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function InputPromptModal({
  title,
  description,
  value,
  placeholder,
  confirmLabel,
  isSubmitting = false,
  onChange,
  onConfirm,
  onClose,
}: InputPromptModalProps) {
  const disabled = isSubmitting || !value.trim();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_32%),rgba(15,23,42,0.36)] p-4 backdrop-blur-md">
      <div data-ui-surface className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] shadow-[0_34px_90px_rgba(15,23,42,0.20)]">
        <div className="relative border-b border-slate-200/80 px-6 py-5">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(16,185,129,0.10),rgba(14,165,233,0.06),transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                <PencilLine className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-700"
              title="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              预设名称
            </label>
            <input
              autoFocus
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !disabled) {
                  event.preventDefault();
                  onConfirm();
                }
              }}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-100 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
          <div className="text-sm text-slate-500">
            名称会作为你的样式组合入口显示在预设菜单中。
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

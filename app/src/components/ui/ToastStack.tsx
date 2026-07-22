import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastStackProps {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}

function toneMeta(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return {
        icon: CheckCircle2,
        frame: 'border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(240,253,250,0.92))] text-emerald-950',
        iconWrap: 'bg-emerald-500 text-white shadow-emerald-500/30',
        accent: 'from-emerald-500/12 to-teal-400/10',
      };
    case 'error':
      return {
        icon: AlertCircle,
        frame: 'border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.98),rgba(255,247,237,0.94))] text-rose-950',
        iconWrap: 'bg-rose-500 text-white shadow-rose-500/30',
        accent: 'from-rose-500/12 to-orange-400/10',
      };
    case 'info':
    default:
      return {
        icon: Info,
        frame: 'border-sky-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(236,253,250,0.92))] text-slate-900',
        iconWrap: 'bg-sky-600 text-white shadow-sky-500/30',
        accent: 'from-sky-500/12 to-cyan-400/10',
      };
  }
}

export function ToastStack({ items, onDismiss }: ToastStackProps) {
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[80] flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-3">
      {items.map((item) => {
        const meta = toneMeta(item.tone);
        const Icon = meta.icon;

        return (
          <div
            key={item.id}
            className={`pointer-events-auto relative overflow-hidden rounded-[28px] border p-4 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl ${meta.frame}`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.accent}`} />
            <div className="relative flex items-start gap-3">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-lg ${meta.iconWrap}`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold tracking-[0.01em]">{item.title}</div>
                {item.message && (
                  <div className="mt-1 text-sm leading-6 text-slate-600">{item.message}</div>
                )}
              </div>

              <button
                onClick={() => onDismiss(item.id)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-700"
                title="关闭通知"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

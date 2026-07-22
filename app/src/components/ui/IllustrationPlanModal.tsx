import { X } from 'lucide-react';

import type { IllustrationPlan } from '../../services/illustrationService';

interface IllustrationPlanModalProps {
  plan: IllustrationPlan;
  selectedIds: string[];
  isSubmitting: boolean;
  onToggle: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

function engineLabel(engine: string): string {
  return engine === 'html_infographic' ? 'HTML 信息图' : 'HTTP 生图';
}

function typeLabel(type: string): string {
  switch (type) {
    case 'flowchart':
      return '流程图';
    case 'comparison':
      return '对比图';
    case 'framework':
      return '框架图';
    case 'timeline':
      return '时间线';
    case 'cover':
      return '主题图';
    case 'scene':
      return '场景图';
    case 'infographic':
    default:
      return '信息图';
  }
}

export function IllustrationPlanModal({
  plan,
  selectedIds,
  isSubmitting,
  onToggle,
  onConfirm,
  onClose,
}: IllustrationPlanModalProps) {
  const selectedCount = plan.items.filter((item) => selectedIds.includes(item.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">智能配图建议</h2>
            <p className="mt-1 text-sm text-gray-500">
              确认后会直接合入文章。信息图会走结构化信息图，场景图若未配置生图引擎或生成失败，会自动回退为信息图形式。
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">建议数量</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{plan.recommendedCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">现有图片</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{plan.existingImageCount}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">密度</div>
            <div className="mt-1 text-xl font-semibold capitalize text-gray-900">{plan.density}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">已勾选</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{selectedCount}</div>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6 py-4">
          <div className="text-sm leading-6 text-gray-700">{plan.summary}</div>
          <div className="mt-2 text-xs text-gray-400">分析来源：{plan.source}</div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/40 px-6 py-5">
          {plan.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
              当前没有建议插图的位置。
            </div>
          ) : (
            plan.items.map((item) => {
              const selected = selectedIds.includes(item.id);

              return (
                <label
                  key={item.id}
                  className={`block rounded-2xl border bg-white p-5 transition-all ${
                    selected ? 'border-emerald-300 shadow-sm' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggle(item.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          优先级 {item.priority}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {typeLabel(item.type)}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {engineLabel(item.engine)}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          风格 {item.style}
                        </span>
                      </div>

                      <div className="mt-3 text-base font-semibold text-gray-900">{item.anchorLabel}</div>
                      <div className="mt-1 text-sm text-gray-500">
                        锚点：{item.anchor.heading || item.anchorLabel}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400">为什么要配图</div>
                          <div className="mt-1 text-sm leading-6 text-gray-700">{item.reason}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-gray-400">配图用途</div>
                          <div className="mt-1 text-sm leading-6 text-gray-700">{item.purpose}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-wide text-gray-400">建议 alt 文案</div>
                        <div className="mt-1 text-sm leading-6 text-gray-700">{item.alt}</div>
                      </div>
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
          <div className="text-sm text-gray-500">
            当前版本已经支持结构化信息图；如 Worker 配置了图像模型，场景图会尝试真实生成。
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              稍后处理
            </button>
            <button
              onClick={onConfirm}
              disabled={selectedCount === 0 || isSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '生成并应用中...' : `生成并应用 ${selectedCount} 张配图`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ListChecks, RotateCcw, Wand2, X } from 'lucide-react';

import {
  DEFAULT_FORMAT_PREFERENCES,
  FORMAT_CUSTOM_NOTE_MAX_LENGTH,
  FORMAT_PREFERENCE_KEYS,
  isDefaultFormatPreferences,
  type FormatPreferenceKey,
  type FormatPreferenceLevel,
  type FormatPreferences,
} from '../../ai/formatPreferences';
import { parseFormatRequest } from '../../ai/formatRequestParser';

interface FormatPreferenceModalProps {
  value: FormatPreferences;
  onChange: (value: FormatPreferences) => void;
  customNote: string;
  onCustomNoteChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const PREFERENCE_META: Record<FormatPreferenceKey, {
  label: string;
  hint: string;
  options: Record<FormatPreferenceLevel, string>;
}> = {
  divider: {
    label: '分割线',
    hint: '大段落、话题切换处的 ---',
    options: { default: '默认', more: '多加', less: '不加' },
  },
  emphasis: {
    label: '加粗高亮',
    hint: '重点句、关键词、数据',
    options: { default: '默认', more: '多一点', less: '克制' },
  },
  headings: {
    label: '小标题',
    hint: '章节内是否再细分层级',
    options: { default: '默认', more: '分得细', less: '沿用原文' },
  },
  quotes: {
    label: '金句引用',
    hint: '用 > 引用突出观点句',
    options: { default: '默认', more: '多一点', less: '不加' },
  },
  cards: {
    label: '总结 / 信息卡片',
    hint: 'SummaryCard、InfoCard',
    options: { default: '默认', more: '多一点', less: '不加' },
  },
};

const LEVEL_ORDER: FormatPreferenceLevel[] = ['default', 'more', 'less'];

export function FormatPreferenceModal({
  value,
  onChange,
  customNote,
  onCustomNoteChange,
  onConfirm,
  onClose,
}: FormatPreferenceModalProps) {
  const isDefault = isDefaultFormatPreferences(value) && !customNote.trim();
  const [parseFeedback, setParseFeedback] = useState('');

  const handleOrganize = () => {
    const { preferences, rest } = parseFormatRequest(customNote);
    const recognized = (Object.keys(preferences) as FormatPreferenceKey[]).map((key) => {
      const meta = PREFERENCE_META[key];
      return `${meta.label}→${meta.options[preferences[key]!]}`;
    });
    onChange({ ...value, ...preferences });
    onCustomNoteChange(rest);
    setParseFeedback(
      recognized.length > 0
        ? `已整理到选项：${recognized.join('、')}${rest ? '；其余内容作为补充要求交给 AI。' : '。'}`
        : '没有识别出对应选项，这段话会作为补充要求交给 AI。',
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_32%),rgba(15,23,42,0.36)] p-4 backdrop-blur-md">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] shadow-[0_34px_90px_rgba(15,23,42,0.20)]">
        <div className="relative border-b border-slate-200/80 px-6 py-5">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(245,158,11,0.10),rgba(251,191,36,0.06),transparent)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI 排版偏好</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  按你的习惯调整排版力度，不改动的项保持默认。选择会被记住。
                </p>
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

        <div className="space-y-3 px-6 py-5">
          {FORMAT_PREFERENCE_KEYS.map((key) => {
            const meta = PREFERENCE_META[key];
            return (
              <div key={key} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">{meta.label}</div>
                  <div className="text-xs text-slate-400">{meta.hint}</div>
                </div>
                <div className="flex shrink-0 rounded-2xl bg-slate-100 p-1">
                  {LEVEL_ORDER.map((level) => {
                    const active = value[key] === level;
                    return (
                      <button
                        key={level}
                        onClick={() => onChange({ ...value, [key]: level })}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? 'bg-white text-amber-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {meta.options[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="border-t border-slate-200/80 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">其他要求（可选）</div>
                <div className="text-xs text-slate-400">用一句话描述，比如"分割线多一点，不要卡片，标题用 emoji 开头"</div>
              </div>
              <button
                onClick={handleOrganize}
                disabled={!customNote.trim()}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                title="把能识别的要求整理到上面的选项里"
              >
                <ListChecks className="h-3.5 w-3.5" />
                整理成选项
              </button>
            </div>
            <textarea
              value={customNote}
              maxLength={FORMAT_CUSTOM_NOTE_MAX_LENGTH}
              rows={2}
              onChange={(event) => {
                onCustomNoteChange(event.target.value);
                setParseFeedback('');
              }}
              placeholder="不填就按上面的选项排版"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-100 outline-none transition-all focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
            />
            <div className="mt-1 flex justify-between gap-3 text-xs">
              <span className="text-amber-700">{parseFeedback}</span>
              <span className="shrink-0 text-slate-400">{customNote.length}/{FORMAT_CUSTOM_NOTE_MAX_LENGTH}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/80 px-6 py-4">
          <button
            onClick={() => {
              onChange(DEFAULT_FORMAT_PREFERENCES);
              onCustomNoteChange('');
              setParseFeedback('');
            }}
            disabled={isDefault}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            恢复默认
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              <Wand2 className="h-4 w-4" />
              开始排版
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

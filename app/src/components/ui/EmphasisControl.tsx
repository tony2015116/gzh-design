import { Check, RotateCcw } from 'lucide-react';
import type { CSSProperties } from 'react';

import {
  EMPHASIS_COLORS,
  EMPHASIS_STYLES,
  type EmphasisConfig,
  type EmphasisStyleId,
} from '../../core/emphasis';

interface EmphasisSettingsProps {
  value: EmphasisConfig;
  themeColor: string;
  onChange: (value: EmphasisConfig) => void;
}

function createPreviewStyle(styleId: EmphasisStyleId, color: string): CSSProperties {
  const base: CSSProperties = {
    color: '#1F2937',
    fontWeight: 750,
    lineHeight: 1.5,
  };

  if (styleId === 'gradient') {
    return {
      ...base,
      backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color}00 100%)`,
      padding: '0 4px',
    };
  }

  if (styleId === 'soft-fill') {
    return { ...base, backgroundColor: color, padding: '0 4px' };
  }

  if (styleId === 'light-band') {
    return {
      ...base,
      backgroundImage: `linear-gradient(180deg, transparent 52%, ${color} 52%)`,
      padding: '0 2px',
    };
  }

  if (styleId === 'underline') {
    return { ...base, borderBottom: `3px solid ${color}`, paddingBottom: 1 };
  }

  if (styleId === 'plain-bold') {
    return { ...base, fontWeight: 850 };
  }

  return {
    ...base,
    backgroundImage: `linear-gradient(180deg, transparent 58%, ${color} 58%)`,
    padding: '0 2px',
  };
}

export function EmphasisSettings({ value, themeColor, onChange }: EmphasisSettingsProps) {
  const selectedColor = EMPHASIS_COLORS.find(
    (option) => option.value.toUpperCase() === value.color.toUpperCase(),
  );
  const usesColor = value.styleId !== 'plain-bold' && value.styleId !== 'follow-layout';

  const handleStyleChange = (styleId: EmphasisStyleId) => {
    onChange({ ...value, styleId });
  };

  const handleColorChange = (color: string) => {
    onChange({ ...value, color: color.toUpperCase() });
  };

  return (
    <div>
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-800">加粗内容效果</div>
        <div className="mt-1 text-[11px] leading-4 text-gray-400">选择正文中加粗文字的视觉表达</div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {EMPHASIS_STYLES.map((style) => {
          const selected = style.id === value.styleId;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => handleStyleChange(style.id)}
              className={`relative rounded-xl border px-3 py-2.5 text-left transition-all ${
                selected
                  ? 'border-emerald-400 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-100'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
              aria-pressed={selected}
              title={style.description}
            >
              <span className="mb-2 block text-[11px] font-semibold text-gray-700">{style.name}</span>
              <span className="block text-[12px]" style={createPreviewStyle(style.id, value.color)}>
                重点内容
              </span>
              {selected && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="my-4 border-t border-gray-100" />

      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-800">强调颜色</div>
          <div className="mt-1 text-[11px] leading-4 text-gray-400">
            {usesColor ? '颜色会实时应用到上方效果' : '当前样式不使用自定义颜色'}
          </div>
        </div>
        <code className="rounded-md bg-gray-50 px-2 py-1 text-[10px] text-gray-500">
          {selectedColor?.name || value.color}
        </code>
      </div>

      <div className={`grid grid-cols-3 gap-2 transition-opacity ${usesColor ? '' : 'pointer-events-none opacity-35'}`}>
        {EMPHASIS_COLORS.map((option) => {
          const selected = option.value.toUpperCase() === value.color.toUpperCase();
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleColorChange(option.value)}
              disabled={!usesColor}
              className={`relative rounded-lg border p-2 text-left transition-colors ${
                selected
                  ? 'border-emerald-400 bg-emerald-50/60'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              title={`${option.name} ${option.value}`}
              aria-pressed={selected}
            >
              <span
                className="mb-1.5 block h-6 rounded-md border border-black/5"
                style={{ background: `linear-gradient(120deg, ${option.value} 0%, #FFFFFF 100%)` }}
              />
              <span className="block text-[10px] font-medium text-gray-600">{option.name}</span>
              {selected && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={`mt-3 flex items-center justify-between border-t border-gray-100 pt-3 transition-opacity ${usesColor ? '' : 'pointer-events-none opacity-35'}`}>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
          <input
            type="color"
            value={value.color}
            onChange={(event) => handleColorChange(event.target.value)}
            disabled={!usesColor}
            className="h-7 w-9 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
          />
          自定义颜色
        </label>
        <button
          type="button"
          onClick={() => handleColorChange(themeColor)}
          disabled={!usesColor}
          className="flex items-center gap-1 text-[11px] font-medium text-gray-400 transition-colors hover:text-emerald-600"
        >
          <RotateCcw className="h-3 w-3" />
          恢复主题色
        </button>
      </div>
    </div>
  );
}

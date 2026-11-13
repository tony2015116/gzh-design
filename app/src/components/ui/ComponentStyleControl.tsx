import { PanelsTopLeft, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  BORDER_STYLE_OPTIONS,
  CARD_STYLE_OPTIONS,
  CODE_STYLE_OPTIONS,
  DEFAULT_COMPONENT_STYLE_CONFIG,
  QUOTE_STYLE_OPTIONS,
  RADIUS_STYLE_OPTIONS,
  SHADOW_STYLE_OPTIONS,
  getCardStyleOverrides,
  type BorderStyleId,
  type CardStyleId,
  type CodeStyleId,
  type ComponentStyleConfig,
  type QuoteStyleId,
  type RadiusStyleId,
  type ShadowStyleId,
} from '../../core/componentStyle';

interface ComponentStyleControlProps {
  value: ComponentStyleConfig;
  themeColor: string;
  onChange: (value: ComponentStyleConfig) => void;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ id: T; name: string }>;
  onChange: (value: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );
}

export function ComponentStyleControl({ value, themeColor, onChange }: ComponentStyleControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const update = <K extends keyof ComponentStyleConfig>(key: K, nextValue: ComponentStyleConfig[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const previewStyle = getCardStyleOverrides(value, themeColor);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
        aria-label="调整组件外观"
        aria-expanded={open}
      >
        <PanelsTopLeft className="h-3.5 w-3.5" />
        组件
      </button>

      {open && (
        <div className="wb-control-popover absolute right-0 top-9 z-50 w-[360px] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl shadow-gray-900/15">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                组件外观
              </div>
              <div className="mt-1 text-[11px] leading-4 text-gray-400">统一管理引用、卡片、代码与图片边框</div>
            </div>
            <button
              type="button"
              onClick={() => onChange(DEFAULT_COMPONENT_STYLE_CONFIG)}
              className="flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-gray-400 transition-colors hover:text-emerald-600"
            >
              <RotateCcw className="h-3 w-3" />
              恢复版式默认
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-gray-100 pb-4">
            <SelectField<QuoteStyleId>
              label="引用样式"
              value={value.quoteStyle}
              options={QUOTE_STYLE_OPTIONS}
              onChange={(nextValue) => update('quoteStyle', nextValue)}
            />
            <SelectField<CardStyleId>
              label="提示卡片"
              value={value.cardStyle}
              options={CARD_STYLE_OPTIONS}
              onChange={(nextValue) => update('cardStyle', nextValue)}
            />
            <SelectField<CodeStyleId>
              label="代码块"
              value={value.codeStyle}
              options={CODE_STYLE_OPTIONS}
              onChange={(nextValue) => update('codeStyle', nextValue)}
            />
            <SelectField<RadiusStyleId>
              label="组件圆角"
              value={value.componentRadius}
              options={RADIUS_STYLE_OPTIONS}
              onChange={(nextValue) => update('componentRadius', nextValue)}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <SelectField<RadiusStyleId>
              label="图片圆角"
              value={value.imageRadius}
              options={RADIUS_STYLE_OPTIONS}
              onChange={(nextValue) => update('imageRadius', nextValue)}
            />
            <SelectField<BorderStyleId>
              label="统一边框"
              value={value.borderStyle}
              options={BORDER_STYLE_OPTIONS}
              onChange={(nextValue) => update('borderStyle', nextValue)}
            />
            <SelectField<ShadowStyleId>
              label="统一阴影"
              value={value.shadowStyle}
              options={SHADOW_STYLE_OPTIONS}
              onChange={(nextValue) => update('shadowStyle', nextValue)}
            />

            <div>
              <span className="mb-1.5 block text-xs font-medium text-gray-600">实时缩略效果</span>
              <div
                className="flex h-[34px] items-center gap-2 bg-white px-2 text-[10px] text-gray-500"
                style={previewStyle}
              >
                <span className="h-4 w-1 rounded-full" style={{ background: themeColor }} />
                <span>内容组件</span>
                <code className="ml-auto rounded bg-gray-100 px-1 py-0.5">01</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

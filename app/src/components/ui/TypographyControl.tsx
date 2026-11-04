import { Highlighter, RotateCcw, SlidersHorizontal, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { EmphasisConfig } from '../../core/emphasis';
import {
  FONT_FAMILIES,
  createTypographyConfigForLayout,
  type FontFamilyId,
  type HeadingWeight,
  type TypographyConfig,
} from '../../core/typography';
import { EmphasisSettings } from './EmphasisControl';

interface TypographyControlProps {
  value: TypographyConfig;
  emphasisValue: EmphasisConfig;
  themeColor: string;
  layoutId: string;
  onChange: (value: TypographyConfig) => void;
  onEmphasisChange: (value: EmphasisConfig) => void;
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}

function RangeField({ label, value, min, max, step, suffix, onChange }: RangeFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
        <span>{label}</span>
        <output className="rounded bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
          {value}{suffix}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer accent-emerald-600"
      />
    </label>
  );
}

export function TypographyControl({
  value,
  emphasisValue,
  themeColor,
  layoutId,
  onChange,
  onEmphasisChange,
}: TypographyControlProps) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<'typography' | 'emphasis'>('typography');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const update = <K extends keyof TypographyConfig>(key: K, nextValue: TypographyConfig[K]) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
        aria-label="调整正文排版"
        aria-expanded={open}
      >
        <span className="relative">
          <Type className="h-3.5 w-3.5" />
          <span
            className="absolute -bottom-1 -right-1 h-1.5 w-1.5 rounded-full border border-white"
            style={{ backgroundColor: emphasisValue.color }}
          />
        </span>
        排版
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 max-h-[calc(100vh-7rem)] w-[380px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl shadow-gray-900/15">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                文字排版
              </div>
              <div className="mt-1 text-[11px] leading-4 text-gray-400">统一管理阅读节奏与加粗强调</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (section === 'typography') {
                  onChange(createTypographyConfigForLayout(layoutId));
                  return;
                }
                onEmphasisChange({ styleId: 'follow-layout', color: themeColor.toUpperCase() });
              }}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-400 transition-colors hover:text-emerald-600"
            >
              <RotateCcw className="h-3 w-3" />
              恢复版式默认
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setSection('typography')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                section === 'typography'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              字体与间距
            </button>
            <button
              type="button"
              onClick={() => setSection('emphasis')}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                section === 'emphasis'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Highlighter className="h-3.5 w-3.5" />
              文字强调
              <span className="h-2 w-2 rounded-full border border-black/5" style={{ backgroundColor: emphasisValue.color }} />
            </button>
          </div>

          {section === 'typography' ? (
            <>
              <div className="grid grid-cols-2 gap-3 border-b border-gray-100 pb-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-600">正文字体</span>
                  <select
                    value={value.fontFamilyId}
                    onChange={(event) => update('fontFamilyId', event.target.value as FontFamilyId)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font.id} value={font.id}>{font.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-gray-600">标题字重</span>
                  <select
                    value={value.headingWeight}
                    onChange={(event) => {
                      const nextValue = event.target.value === 'follow-layout'
                        ? 'follow-layout'
                        : Number(event.target.value) as HeadingWeight;
                      update('headingWeight', nextValue);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                  >
                    <option value="follow-layout">跟随版式</option>
                    {[500, 600, 700, 800, 900].map((weight) => (
                      <option key={weight} value={weight}>{weight}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <RangeField
                  label="正文字号"
                  value={value.bodySize}
                  min={13}
                  max={18}
                  step={1}
                  suffix="px"
                  onChange={(nextValue) => update('bodySize', nextValue)}
                />
                <RangeField
                  label="正文行距"
                  value={value.lineHeight}
                  min={1.6}
                  max={2.3}
                  step={0.1}
                  suffix=""
                  onChange={(nextValue) => update('lineHeight', Number(nextValue.toFixed(1)))}
                />
                <RangeField
                  label="段落间距"
                  value={value.paragraphSpacing}
                  min={8}
                  max={28}
                  step={2}
                  suffix="px"
                  onChange={(nextValue) => update('paragraphSpacing', nextValue)}
                />
                <RangeField
                  label="页面左右边距"
                  value={value.contentPaddingX}
                  min={12}
                  max={32}
                  step={2}
                  suffix="px"
                  onChange={(nextValue) => update('contentPaddingX', nextValue)}
                />
              </div>
            </>
          ) : (
            <EmphasisSettings
              value={emphasisValue}
              themeColor={themeColor}
              onChange={onEmphasisChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

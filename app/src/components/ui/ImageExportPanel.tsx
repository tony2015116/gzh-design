import { Download, Image as ImageIcon, Layers, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generateLongImage, generateSlicedImages } from '../../services/imageExportService';

interface ImageExportPanelProps {
  elementId: string;
  onClose: () => void;
}

const RATIO_OPTIONS = [
  { label: '3:4 (小红书最佳)', value: 4 / 3 },
  { label: '1:1 (正方形)', value: 1 },
  { label: '4:3 (宽图)', value: 3 / 4 },
  { label: '16:9 (超宽图)', value: 9 / 16 },
];

export function ImageExportPanel({ elementId, onClose }: ImageExportPanelProps) {
  const [activeMode, setActiveMode] = useState<'long' | 'slice'>('long');
  const [sliceRatio, setSliceRatio] = useState<number>(4 / 3);
  const [images, setImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generate();
  }, [activeMode, sliceRatio]);

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Small timeout to allow UI to update (show spinner)
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      if (activeMode === 'long') {
        const img = await generateLongImage(elementId);
        setImages([img]);
      } else {
        const imgs = await generateSlicedImages(elementId, sliceRatio);
        setImages(imgs);
      }
    } catch (e: any) {
      setError(e.message || '生成图片失败');
      setImages([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    images.forEach((img, index) => {
      setTimeout(() => {
        downloadImage(img, `export_${activeMode}_${Date.now()}_${index + 1}.png`);
      }, index * 300);
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(7,10,18,0.42)] p-4 backdrop-blur-md">
      <div className="relative flex h-[min(88vh,860px)] w-[min(1040px,100%)] flex-col overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,rgba(8,12,22,0.98),rgba(17,24,39,0.95))] text-white shadow-[0_40px_120px_rgba(2,8,23,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.12),transparent_26%)]" />

        <div className="relative flex items-start justify-between gap-4 border-b border-white/10 px-7 py-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-200">
              <Sparkles className="h-3.5 w-3.5" />
              Image Export
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">图片导出中心</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              一键生成高清长图或按照平台比例切片，完美适配小红书等图文平台。
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            title="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-7 py-4">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveMode('long')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeMode === 'long'
                  ? 'bg-pink-400 text-slate-950 shadow-[0_10px_30px_rgba(244,114,182,0.35)]'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              完整长图
            </button>
            <button
              onClick={() => setActiveMode('slice')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeMode === 'slice'
                  ? 'bg-rose-400 text-slate-950 shadow-[0_10px_30px_rgba(251,113,133,0.35)]'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              <Layers className="h-4 w-4" />
              切片多图
            </button>
          </div>
          
          {activeMode === 'slice' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">切图比例:</span>
              <select
                value={sliceRatio}
                onChange={(e) => setSliceRatio(Number(e.target.value))}
                className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition-colors hover:bg-white/10 focus:border-rose-400/50"
              >
                {RATIO_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-auto px-7 py-6">
          {error && (
            <div className="mb-4 rounded-[26px] border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
              {error}
            </div>
          )}

          {isGenerating ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
                <span className="text-sm font-medium text-slate-300">正在生成图片，请稍候...</span>
              </div>
            </div>
          ) : (
            images.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-[26px] border border-pink-300/20 bg-pink-300/10 p-5">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-200">
                      {activeMode === 'long' ? 'Long Image Ready' : 'Sliced Images Ready'}
                    </div>
                    <div className="mt-2 text-xl font-semibold">
                      已生成 {images.length} 张图片
                    </div>
                  </div>
                  <button
                    onClick={downloadAll}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" />
                    {images.length > 1 ? '下载全部图片' : '下载图片'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((img, index) => (
                    <div key={index} className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-lg">
                      <div className="flex h-[320px] items-center justify-center bg-[rgba(15,23,42,0.46)] p-2">
                        <img 
                          src={img} 
                          alt={`Generated export ${index + 1}`} 
                          className="max-h-full max-w-full object-contain drop-shadow-md"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-black/60 p-4 backdrop-blur-md transition-transform duration-300 group-hover:translate-y-0">
                        <span className="text-xs font-semibold text-white">图 {index + 1}</span>
                        <button
                          onClick={() => downloadImage(img, `export_${activeMode}_${Date.now()}_${index + 1}.png`)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/30"
                        >
                          <Download className="h-3.5 w-3.5" />
                          单张下载
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

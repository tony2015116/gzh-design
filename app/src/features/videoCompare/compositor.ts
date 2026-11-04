import { calculateVideoGrid } from './layout';
import type { VideoExportConfig } from './types';

const LABEL_COLORS = ['#d6ff5d', '#8fb5ff', '#ffb56f', '#e8a6ff'];

const canvasToPng = (canvas: HTMLCanvasElement) => new Promise<Uint8Array>((resolve, reject) => {
  canvas.toBlob(async (blob) => {
    if (!blob) {
      reject(new Error('无法生成视频标注图层'));
      return;
    }
    resolve(new Uint8Array(await blob.arrayBuffer()));
  }, 'image/png');
});

export async function createOverlayPng(config: VideoExportConfig): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('浏览器无法创建视频合成画布');

  const grid = calculateVideoGrid(config.tracks.length, config.layout, config.width, config.height);
  const scale = Math.max(.58, Math.min(1.2, config.width / 1920));

  grid.cells.forEach((cell, index) => {
    const track = config.tracks[index];
    if (!track) return;

    const indexSize = Math.max(14, Math.round(19 * scale));
    context.font = `700 ${indexSize}px Consolas, monospace`;
    context.textAlign = 'right';
    context.textBaseline = 'top';
    context.fillStyle = 'rgba(245, 250, 241, .72)';
    context.fillText(String(index + 1).padStart(2, '0'), cell.x + cell.width - 22 * scale, cell.y + 20 * scale);

    const label = track.label.trim();
    if (!label) return;
    const fontSize = Math.max(16, Math.round(25 * scale));
    const horizontalPadding = Math.round(15 * scale);
    const verticalPadding = Math.round(10 * scale);
    context.font = `900 ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    const maxTextWidth = Math.max(50, cell.width - 80 * scale);
    let visibleLabel = label;
    while (visibleLabel.length > 1 && context.measureText(visibleLabel).width > maxTextWidth) {
      visibleLabel = `${visibleLabel.slice(0, -2)}…`;
    }
    const textWidth = context.measureText(visibleLabel).width;
    context.fillStyle = LABEL_COLORS[index % LABEL_COLORS.length] ?? LABEL_COLORS[0];
    context.fillRect(
      cell.x + 20 * scale,
      cell.y + 20 * scale,
      textWidth + horizontalPadding * 2,
      fontSize + verticalPadding * 2,
    );
    context.fillStyle = '#101713';
    context.fillText(visibleLabel, cell.x + 20 * scale + horizontalPadding, cell.y + 20 * scale + verticalPadding);
  });

  return canvasToPng(canvas);
}

const formatSeconds = (value: number) => Math.max(0, value).toFixed(3);

export function buildFfmpegArguments(config: VideoExportConfig, durationSeconds: number, inputNames: string[]): string[] {
  const overlayInputIndex = inputNames.length;
  const audioInputIndex = config.audioMode === 'selected-track'
    ? config.tracks.findIndex((track) => track.id === config.audioTrackId)
    : -1;
  const grid = calculateVideoGrid(config.tracks.length, config.layout, config.width, config.height);
  const args: string[] = [];

  inputNames.forEach((name) => args.push('-i', name));
  args.push('-loop', '1', '-framerate', String(config.fps), '-i', 'overlay.png');

  const filters = config.tracks.map((_, index) => {
    const cell = grid.cells[index];
    if (!cell) throw new Error('视频布局计算失败');
    const start = index === 0 ? 0 : Math.max(0, config.offsetSeconds);
    const initialPad = index === 0 ? 0 : Math.max(0, -config.offsetSeconds);
    const timeFilter = initialPad > 0
      ? `trim=start=0,setpts=PTS-STARTPTS,tpad=start_mode=clone:start_duration=${formatSeconds(initialPad)},trim=duration=${formatSeconds(durationSeconds)},setpts=PTS-STARTPTS`
      : `trim=start=${formatSeconds(start)}:duration=${formatSeconds(durationSeconds)},setpts=PTS-STARTPTS`;
    return `[${index}:v]${timeFilter},fps=${config.fps},scale=${cell.width}:${cell.height}:force_original_aspect_ratio=decrease,pad=${cell.width}:${cell.height}:(ow-iw)/2:(oh-ih)/2:color=0x0b100f,setsar=1[v${index}]`;
  });

  const layoutExpression = grid.cells.map((cell) => `${cell.x}_${cell.y}`).join('|');
  const inputs = config.tracks.map((_, index) => `[v${index}]`).join('');
  filters.push(`${inputs}xstack=inputs=${config.tracks.length}:layout=${layoutExpression}:fill=0x050908[stack]`);
  filters.push(`[stack][${overlayInputIndex}:v]overlay=0:0:shortest=1:format=auto[vout]`);

  if (audioInputIndex >= 0) {
    const audioStart = audioInputIndex === 0 ? 0 : Math.max(0, config.offsetSeconds);
    const audioDelay = audioInputIndex === 0 ? 0 : Math.max(0, -config.offsetSeconds);
    const audioTimeFilter = audioDelay > 0
      ? `adelay=${Math.round(audioDelay * 1000)}:all=1,atrim=duration=${formatSeconds(durationSeconds)},asetpts=PTS-STARTPTS`
      : `atrim=start=${formatSeconds(audioStart)}:duration=${formatSeconds(durationSeconds)},asetpts=PTS-STARTPTS`;
    filters.push(`[${audioInputIndex}:a]${audioTimeFilter},aresample=async=1:first_pts=0[aout]`);
  }

  args.push(
    '-filter_complex', filters.join(';'),
    '-map', '[vout]',
  );

  if (audioInputIndex >= 0) {
    args.push('-map', '[aout]');
  } else {
    args.push('-an');
  }

  args.push(
    '-t', formatSeconds(durationSeconds),
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
  );
  if (audioInputIndex >= 0) {
    args.push('-c:a', 'aac', '-b:a', '160k');
  }
  args.push('-movflags', '+faststart', 'video-compare.mp4');

  return args;
}

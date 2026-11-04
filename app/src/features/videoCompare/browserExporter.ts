import type { FFmpeg as FFmpegType } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { buildFfmpegArguments, createOverlayPng } from './compositor';
import type { BrowserVideoExportRequest, VideoExportProgress, VideoExportResult } from './types';

let activeFfmpeg: FFmpegType | null = null;

const extensionForFile = (file: File) => {
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]{2,5})$/)?.[1];
  if (extension && ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'].includes(extension)) return extension;
  if (file.type.includes('webm')) return 'webm';
  if (file.type.includes('quicktime')) return 'mov';
  return 'mp4';
};

const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) throw new DOMException('导出已取消', 'AbortError');
};

export async function exportVideoInBrowser(
  request: BrowserVideoExportRequest,
  onProgress: (progress: VideoExportProgress) => void,
  signal: AbortSignal,
): Promise<VideoExportResult> {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile } = await import('@ffmpeg/util');
  throwIfAborted(signal);

  const ffmpeg = new FFmpeg();
  activeFfmpeg = ffmpeg;
  const inputNames = request.inputs.map((input, index) => `input-${index}.${extensionForFile(input.file)}`);
  const createdFiles = [...inputNames, 'overlay.png', 'video-compare.mp4'];

  const progressListener = ({ progress }: { progress: number }) => {
    const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
    onProgress({
      stage: 'encoding',
      percent: 25 + Math.round(safeProgress * 68),
      message: `正在合成 ${request.config.tracks.length} 路画面`,
    });
  };

  try {
    onProgress({ stage: 'loading', percent: 4, message: '正在载入本地编码器' });
    await ffmpeg.load({ coreURL, wasmURL }, { signal });
    throwIfAborted(signal);

    const overlay = await createOverlayPng(request.config);
    await ffmpeg.writeFile('overlay.png', overlay, { signal });

    for (let index = 0; index < request.inputs.length; index += 1) {
      const input = request.inputs[index];
      const inputName = inputNames[index];
      if (!input || !inputName) continue;
      throwIfAborted(signal);
      onProgress({
        stage: 'preparing',
        percent: 8 + Math.round(((index + 1) / request.inputs.length) * 15),
        message: `正在读取第 ${index + 1} 路素材`,
      });
      await ffmpeg.writeFile(inputName, await fetchFile(input.file), { signal });
    }

    if (request.config.audioMode === 'selected-track') {
      const audioInputIndex = request.config.tracks.findIndex((track) => track.id === request.config.audioTrackId);
      const audioInputName = inputNames[audioInputIndex];
      if (audioInputIndex < 0 || !audioInputName) throw new Error('选择的导出音轨已经失效，请重新选择');
      const audioCheckExitCode = await ffmpeg.exec([
        '-i', audioInputName,
        '-map', '0:a:0',
        '-t', '0.01',
        '-f', 'null',
        '-',
      ], undefined, { signal });
      if (audioCheckExitCode !== 0) {
        const trackNumber = audioInputIndex + 1;
        throw new Error(`第 ${trackNumber} 路视频没有可用音轨，请选择其他音轨或静音导出`);
      }
    }

    throwIfAborted(signal);
    ffmpeg.on('progress', progressListener);
    onProgress({ stage: 'encoding', percent: 24, message: '正在启动 H.264 编码' });
    const exitCode = await ffmpeg.exec(
      buildFfmpegArguments(request.config, request.durationSeconds, inputNames),
      undefined,
      { signal },
    );
    if (exitCode !== 0) throw new Error(`编码器退出，状态码 ${exitCode}`);

    throwIfAborted(signal);
    onProgress({ stage: 'finalizing', percent: 96, message: '正在封装 MP4 文件' });
    const result = await ffmpeg.readFile('video-compare.mp4', undefined, { signal });
    if (typeof result === 'string') throw new Error('编码结果格式异常');
    const bytes = new Uint8Array(result);
    const fileName = `video-compare-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}.mp4`;
    onProgress({ stage: 'completed', percent: 100, message: 'MP4 已生成' });
    return {
      blob: new Blob([bytes], { type: 'video/mp4' }),
      fileName,
      audioIncluded: request.config.audioMode === 'selected-track',
    };
  } catch (error) {
    if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new DOMException('导出已取消', 'AbortError');
    }
    throw error;
  } finally {
    ffmpeg.off('progress', progressListener);
    for (const fileName of createdFiles) {
      try {
        if (ffmpeg.loaded) await ffmpeg.deleteFile(fileName);
      } catch {
        // 文件可能尚未写入，继续释放编码器。
      }
    }
    ffmpeg.terminate();
    if (activeFfmpeg === ffmpeg) activeFfmpeg = null;
  }
}

export function cancelBrowserVideoExport(): void {
  activeFfmpeg?.terminate();
  activeFfmpeg = null;
}

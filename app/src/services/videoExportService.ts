import { cancelBrowserVideoExport, exportVideoInBrowser } from '../features/videoCompare/browserExporter';
import type {
  BrowserVideoExportRequest,
  VideoExportProgress,
  VideoExportResult,
} from '../features/videoCompare/types';

export interface VideoExportTask {
  promise: Promise<VideoExportResult>;
  cancel: () => void;
}

export function startVideoExport(
  request: BrowserVideoExportRequest,
  onProgress: (progress: VideoExportProgress) => void,
): VideoExportTask {
  const controller = new AbortController();
  return {
    promise: exportVideoInBrowser(request, onProgress, controller.signal),
    cancel: () => {
      controller.abort();
      cancelBrowserVideoExport();
    },
  };
}

export function downloadVideoExport(result: VideoExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

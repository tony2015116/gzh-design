export type LayoutMode = 'side-by-side' | 'stacked';

export type AudioMode = 'mute' | 'selected-track';

export type DurationMode = 'shortest';

export interface VideoSource {
  url: string;
  name: string;
  file?: File;
  isObjectUrl?: boolean;
}

export interface VideoDimensions {
  width: number;
  height: number;
}

export interface VideoTrack {
  id: string;
  source: VideoSource;
  label: string;
}

export interface VideoExportTrackConfig {
  id: string;
  assetKey: string;
  label: string;
}

export interface VideoExportConfig {
  tracks: VideoExportTrackConfig[];
  layout: LayoutMode;
  width: number;
  height: number;
  fps: number;
  offsetSeconds: number;
  durationMode: DurationMode;
  audioMode: AudioMode;
  audioTrackId: string | null;
}

export interface BrowserVideoExportInput {
  id: string;
  file: File;
  duration: number;
}

export interface BrowserVideoExportRequest {
  config: VideoExportConfig;
  inputs: BrowserVideoExportInput[];
  durationSeconds: number;
}

export type VideoExportStage = 'preparing' | 'loading' | 'encoding' | 'finalizing' | 'completed';

export interface VideoExportProgress {
  stage: VideoExportStage;
  percent: number;
  message: string;
}

export interface VideoExportResult {
  blob: Blob;
  fileName: string;
  audioIncluded: boolean;
}

export interface OutputPreset {
  id: 'landscape' | 'portrait' | 'square';
  label: string;
  description: string;
  width: number;
  height: number;
}

export const OUTPUT_PRESETS: OutputPreset[] = [
  { id: 'landscape', label: '横向高清', description: '1920 × 1080', width: 1920, height: 1080 },
  { id: 'portrait', label: '竖向高清', description: '1080 × 1920', width: 1080, height: 1920 },
  { id: 'square', label: '方形画布', description: '1080 × 1080', width: 1080, height: 1080 },
];

export const MAX_EXPORT_DURATION_SECONDS = 60;
export const MAX_EXPORT_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_EXPORT_TOTAL_BYTES = 300 * 1024 * 1024;

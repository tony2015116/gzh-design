import type { LayoutMode } from './types';

export interface VideoCell {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoGridLayout {
  columns: number;
  rows: number;
  gap: number;
  cells: VideoCell[];
}

const evenFloor = (value: number) => Math.max(2, Math.floor(value / 2) * 2);

export function getGridShape(trackCount: number, layout: LayoutMode): { columns: number; rows: number } {
  const count = Math.min(6, Math.max(1, Math.floor(trackCount)));
  if (layout === 'stacked') return { columns: 1, rows: count };
  if (count <= 3) return { columns: count, rows: 1 };
  return { columns: 3, rows: 2 };
}

export function calculateVideoGrid(
  trackCount: number,
  layout: LayoutMode,
  width: number,
  height: number,
  requestedGap = 4,
): VideoGridLayout {
  const { columns, rows } = getGridShape(trackCount, layout);
  const gap = Math.max(0, Math.floor(requestedGap));
  const cellWidth = evenFloor((width - gap * (columns - 1)) / columns);
  const cellHeight = evenFloor((height - gap * (rows - 1)) / rows);
  const cells = Array.from({ length: Math.min(trackCount, 6) }, (_, index) => ({
    index,
    x: (index % columns) * (cellWidth + gap),
    y: Math.floor(index / columns) * (cellHeight + gap),
    width: cellWidth,
    height: cellHeight,
  }));

  return { columns, rows, gap, cells };
}

export function getShortestExportDuration(durations: number[], offsetSeconds: number): number {
  if (!durations.length || durations.some((duration) => !Number.isFinite(duration) || duration <= 0)) return 0;
  return durations.reduce((shortest, duration, index) => {
    const available = index === 0 ? duration : duration - offsetSeconds;
    return Math.min(shortest, Math.max(0, available));
  }, Number.POSITIVE_INFINITY);
}

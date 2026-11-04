import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, ArrowLeft, Check, Columns2, Download, Film, Gauge, Link2, LoaderCircle, Pause, Play, Plus, RotateCcw, Rows2, Sparkles, Upload, Volume2, VolumeX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getShortestExportDuration } from '../features/videoCompare/layout';
import {
  MAX_EXPORT_DURATION_SECONDS,
  MAX_EXPORT_FILE_BYTES,
  MAX_EXPORT_TOTAL_BYTES,
  OUTPUT_PRESETS,
  type LayoutMode,
  type VideoDimensions,
  type VideoExportProgress,
  type VideoExportResult,
  type VideoSource,
  type VideoTrack,
} from '../features/videoCompare/types';
import { downloadVideoExport, startVideoExport, type VideoExportTask } from '../services/videoExportService';
import './VideoCompareView.css';

const DEMO_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const MAX_TRACKS = 6;

const initialTracks: VideoTrack[] = [
  {
    id: 'track-1',
    source: { url: DEMO_VIDEO_URL, name: '参考视频生成 · 示例素材' },
    label: '参考视频生成',
  },
  {
    id: 'track-2',
    source: { url: DEMO_VIDEO_URL, name: '原视频 · 示例素材' },
    label: '原视频',
  },
];

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return '00:00';
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const clampTime = (value: number, duration: number) => {
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, value);
  return Math.min(duration, Math.max(0, value));
};

function VideoCompareView() {
  const navigate = useNavigate();
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const tracksRef = useRef<VideoTrack[]>(initialTracks);
  const exportTaskRef = useRef<VideoExportTask | null>(null);
  const nextTrackNumberRef = useRef(3);
  const [tracks, setTracks] = useState<VideoTrack[]>(initialTracks);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [dimensions, setDimensions] = useState<Record<string, VideoDimensions>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewAudioTrackId, setPreviewAudioTrackId] = useState<string | null>('track-1');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [offset, setOffset] = useState(0);
  const [layout, setLayout] = useState<LayoutMode>('side-by-side');
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({});
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [outputPresetId, setOutputPresetId] = useState('landscape');
  const [exportFps, setExportFps] = useState(30);
  const [exportAudioTrackId, setExportAudioTrackId] = useState<string | null>('track-1');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<VideoExportProgress | null>(null);
  const [exportError, setExportError] = useState('');
  const [exportResult, setExportResult] = useState<VideoExportResult | null>(null);

  const durationValues = Object.values(durations).filter((value) => value > 0);
  const duration = durationValues.length ? Math.min(...durationValues) : 0;
  const exportDuration = getShortestExportDuration(
    tracks.map((track) => durations[track.id] ?? 0),
    offset,
  );
  const selectedPreset = OUTPUT_PRESETS.find((preset) => preset.id === outputPresetId) ?? OUTPUT_PRESETS[0];
  const localFiles = tracks.map((track) => track.source.file).filter((file): file is File => Boolean(file));
  const allTracksAreLocal = localFiles.length === tracks.length;
  const totalFileBytes = localFiles.reduce((total, file) => total + file.size, 0);
  const filesWithinLimit = localFiles.every((file) => file.size <= MAX_EXPORT_FILE_BYTES)
    && totalFileBytes <= MAX_EXPORT_TOTAL_BYTES;
  const durationWithinLimit = exportDuration > 0 && exportDuration <= MAX_EXPORT_DURATION_SECONDS;
  const canStartExport = allTracksAreLocal && filesWithinLimit && durationWithinLimit && !Object.values(loadErrors).some(Boolean);
  const knownRatios = Object.values(dimensions)
    .filter((size) => size.width > 0 && size.height > 0)
    .map((size) => size.width / size.height);
  const stageRatio = Math.min(1.78, Math.max(.75, Math.max(...knownRatios, 1.6)));
  const syncPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const sourceSignature = tracks.map((track) => `${track.id}:${track.source.url}`).join('|');

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    const fallbackTrackId = tracks[0]?.id ?? null;
    if (previewAudioTrackId && !tracks.some((track) => track.id === previewAudioTrackId)) {
      setPreviewAudioTrackId(fallbackTrackId);
    }
    if (exportAudioTrackId && !tracks.some((track) => track.id === exportAudioTrackId)) {
      setExportAudioTrackId(fallbackTrackId);
    }
  }, [exportAudioTrackId, previewAudioTrackId, tracks]);

  useEffect(() => {
    return () => {
      exportTaskRef.current?.cancel();
      tracksRef.current.forEach((track) => {
        if (track.source.isObjectUrl) URL.revokeObjectURL(track.source.url);
      });
    };
  }, []);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    const retainedDurations: Record<string, number> = {};
    const retainedDimensions: Record<string, VideoDimensions> = {};
    tracksRef.current.forEach((track) => {
      const video = videoRefs.current[track.id];
      if (!video) return;
      if (Number.isFinite(video.duration) && video.duration > 0) retainedDurations[track.id] = video.duration;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        retainedDimensions[track.id] = { width: video.videoWidth, height: video.videoHeight };
      }
    });
    setDurations(retainedDurations);
    setDimensions(retainedDimensions);
    setLoadErrors({});
    Object.values(videoRefs.current).forEach((video) => {
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });
  }, [sourceSignature]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([trackId, video]) => {
      if (!video) return;
      video.playbackRate = playbackRate;
      video.muted = trackId !== previewAudioTrackId;
    });
  }, [playbackRate, previewAudioTrackId]);

  useEffect(() => {
    const driver = videoRefs.current[tracks[0]?.id];
    if (!driver || !Number.isFinite(offset)) return;
    tracks.slice(1).forEach((track) => {
      const video = videoRefs.current[track.id];
      if (video) video.currentTime = clampTime(driver.currentTime + offset, video.duration);
    });
  }, [offset, tracks]);

  const updateDuration = (trackId: string, event: React.SyntheticEvent<HTMLVideoElement>) => {
    const nextDuration = event.currentTarget.duration;
    const { videoWidth, videoHeight } = event.currentTarget;
    if (Number.isFinite(nextDuration)) {
      setDurations((current) => ({ ...current, [trackId]: nextDuration }));
    }
    if (videoWidth > 0 && videoHeight > 0) {
      setDimensions((current) => ({
        ...current,
        [trackId]: { width: videoWidth, height: videoHeight },
      }));
    }
  };

  const handleTimeUpdate = (trackId: string, event: React.SyntheticEvent<HTMLVideoElement>) => {
    const driver = videoRefs.current[tracks[0]?.id];
    if (!driver || event.currentTarget !== driver || trackId !== tracks[0]?.id) return;
    const nextTime = driver.currentTime;
    setCurrentTime(nextTime);
    tracks.slice(1).forEach((track) => {
      const video = videoRefs.current[track.id];
      if (!video) return;
      const targetTime = clampTime(nextTime + offset, video.duration);
      if (Math.abs(video.currentTime - targetTime) > 0.08) video.currentTime = targetTime;
    });
  };

  const togglePlayback = async () => {
    const currentVideos = tracks.map((track) => videoRefs.current[track.id]).filter(Boolean) as HTMLVideoElement[];
    if (isPlaying) {
      currentVideos.forEach((video) => video.pause());
      setIsPlaying(false);
      return;
    }

    await Promise.all(currentVideos.map((video) => video.play().catch(() => undefined)));
    setIsPlaying(true);
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.target.value);
    const driver = videoRefs.current[tracks[0]?.id];
    setCurrentTime(nextTime);
    if (driver) driver.currentTime = clampTime(nextTime, driver.duration);
    tracks.slice(1).forEach((track) => {
      const video = videoRefs.current[track.id];
      if (video) video.currentTime = clampTime(nextTime + offset, video.duration);
    });
  };

  const handleReset = () => {
    const driver = videoRefs.current[tracks[0]?.id];
    if (driver) { driver.pause(); driver.currentTime = 0; }
    tracks.slice(1).forEach((track) => {
      const video = videoRefs.current[track.id];
      if (video) { video.pause(); video.currentTime = clampTime(offset, video.duration); }
    });
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleFileChange = (trackId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextSource: VideoSource = {
      url: URL.createObjectURL(file),
      name: file.name,
      file,
      isObjectUrl: true,
    };
    const previousTrack = tracksRef.current.find((track) => track.id === trackId);
    if (previousTrack?.source.isObjectUrl) URL.revokeObjectURL(previousTrack.source.url);
    setTracks((current) => current.map((track) => track.id === trackId ? { ...track, source: nextSource } : track));
    event.target.value = '';
  };

  const handleLabelChange = (trackId: string, event: ChangeEvent<HTMLInputElement>) => {
    setTracks((current) => current.map((track) => track.id === trackId ? { ...track, label: event.target.value } : track));
  };

  const handleVideoError = (trackId: string) => {
    setLoadErrors((current) => ({ ...current, [trackId]: true }));
  };

  const handleAddTrack = () => {
    if (tracks.length >= MAX_TRACKS) return;
    const trackNumber = nextTrackNumberRef.current;
    nextTrackNumberRef.current += 1;
    setTracks((current) => [...current, {
      id: `track-${trackNumber}`,
      source: { url: DEMO_VIDEO_URL, name: `对比视频 ${String(trackNumber).padStart(2, '0')} · 示例素材` },
      label: `对比视频 ${trackNumber}`,
    }]);
  };

  const handleRemoveTrack = (trackId: string) => {
    if (tracks.length <= 2) return;
    const removedTrack = tracks.find((track) => track.id === trackId);
    if (removedTrack?.source.isObjectUrl) URL.revokeObjectURL(removedTrack.source.url);
    delete videoRefs.current[trackId];
    setTracks((current) => current.filter((track) => track.id !== trackId));
  };

  const getExportReadinessMessage = () => {
    if (!allTracksAreLocal) return '请先为每一路换入本地视频，示例素材不参与导出。';
    if (localFiles.some((file) => file.size > MAX_EXPORT_FILE_BYTES)) return '单个视频不能超过 100 MB。';
    if (totalFileBytes > MAX_EXPORT_TOTAL_BYTES) return '全部视频的总大小不能超过 300 MB。';
    if (exportDuration <= 0) return '正在读取视频时长，请稍后再试。';
    if (exportDuration > MAX_EXPORT_DURATION_SECONDS) return '浏览器导出最长支持 60 秒，请先裁剪素材。';
    if (Object.values(loadErrors).some(Boolean)) return '有素材无法读取，请重新选择本地视频。';
    return '';
  };

  const handleOpenExportPanel = () => {
    Object.values(videoRefs.current).forEach((video) => video?.pause());
    setIsPlaying(false);
    setExportError('');
    setExportResult(null);
    setExportProgress(null);
    setIsExportPanelOpen(true);
  };

  const handleStartExport = async () => {
    if (!selectedPreset || !canStartExport) {
      setExportError(getExportReadinessMessage());
      return;
    }

    const inputs = tracks.flatMap((track) => {
      const file = track.source.file;
      const trackDuration = durations[track.id];
      return file && trackDuration ? [{ id: track.id, file, duration: trackDuration }] : [];
    });
    if (inputs.length !== tracks.length) {
      setExportError('本地素材尚未准备完成，请稍后重试。');
      return;
    }

    setExportError('');
    setExportResult(null);
    setIsExporting(true);
    setExportProgress({ stage: 'preparing', percent: 1, message: '正在准备导出任务' });
    const task = startVideoExport({
      config: {
        tracks: tracks.map((track, index) => ({
          id: track.id,
          assetKey: `local:${index + 1}:${track.source.name}`,
          label: track.label,
        })),
        layout,
        width: selectedPreset.width,
        height: selectedPreset.height,
        fps: exportFps,
        offsetSeconds: offset,
        durationMode: 'shortest',
        audioMode: exportAudioTrackId ? 'selected-track' : 'mute',
        audioTrackId: exportAudioTrackId,
      },
      inputs,
      durationSeconds: exportDuration,
    }, setExportProgress);
    exportTaskRef.current = task;

    try {
      const result = await task.promise;
      setExportResult(result);
      downloadVideoExport(result);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setExportError('导出已取消，临时文件已经释放。');
      } else {
        const message = error instanceof Error ? error.message : String(error);
        setExportError(`MP4 导出失败：${message}`);
      }
      setExportProgress(null);
    } finally {
      exportTaskRef.current = null;
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    exportTaskRef.current?.cancel();
  };

  return (
    <div className="video-compare-page">
      <div className="video-compare-orbit video-compare-orbit-one" />
      <div className="video-compare-orbit video-compare-orbit-two" />

      <header className="video-compare-header">
        <button className="video-compare-back" onClick={() => navigate('/')} type="button" aria-label="回到排版工作台">
          <ArrowLeft size={16} />
          <span>回到排版工作台</span>
        </button>
        <div className="video-compare-brand">
          <span className="video-compare-brand-mark">02</span>
          <span>VIDEO COMPARE LAB</span>
        </div>
        <div className="video-compare-header-note">
          <span className="video-compare-live-dot" />
          双轨同步预览
        </div>
      </header>

      <main className="video-compare-main">
        <section className="video-compare-intro">
          <div className="video-compare-kicker"><Sparkles size={14} /> REAL-TIME REVIEW</div>
          <h1>把差异放进<br /><em>同一条时间线。</em></h1>
          <p>多路视频同步播放，用一条进度线观察生成结果与原始素材的节奏、构图和动作变化。</p>
          <div className="video-compare-stats">
            <div><strong>{String(tracks.length).padStart(2, '0')}</strong><span>同步轨道</span></div>
            <div><strong>01</strong><span>共享时间线</span></div>
            <div><strong>{playbackRate.toFixed(1)}×</strong><span>当前速度</span></div>
          </div>
        </section>

        <section className="video-compare-console" aria-label="实时视频对比播放台">
          <div className="video-compare-console-topline">
            <div>
              <span className="video-compare-micro-label">LIVE COMPARISON / {String(tracks.length).padStart(2, '0')}</span>
              <h2>实时对照台</h2>
            </div>
            <div className="video-compare-console-actions">
              <button className="video-compare-export-trigger" onClick={handleOpenExportPanel} type="button">
                <Download size={14} />
                导出 MP4
              </button>
              <div className="video-compare-layout-switch" aria-label="视频排布方式">
                <span>排布</span>
                <button
                  className={layout === 'side-by-side' ? 'is-active' : ''}
                  onClick={() => setLayout('side-by-side')}
                  type="button"
                  aria-pressed={layout === 'side-by-side'}
                  disabled={isExporting}
                >
                  <Columns2 size={13} />
                  左右
                </button>
                <button
                  className={layout === 'stacked' ? 'is-active' : ''}
                  onClick={() => setLayout('stacked')}
                  type="button"
                  aria-pressed={layout === 'stacked'}
                  disabled={isExporting}
                >
                  <Rows2 size={13} />
                  上下
                </button>
              </div>
              <div className="video-compare-sync-status">
                <Link2 size={14} />
                <span>SYNC LOCKED</span>
              </div>
            </div>
          </div>

          <div className="video-compare-stage" style={{ '--compare-stage-ratio': stageRatio } as React.CSSProperties}>
            <div className={`video-compare-video-grid is-${layout} is-count-${Math.min(tracks.length, 6)}`}>
              {tracks.map((track, index) => {
                const trackDimensions = dimensions[track.id];
                const trackHasError = loadErrors[track.id];
                return (
                  <div className={`video-compare-pane ${trackHasError ? 'is-error' : ''}`} key={track.id}>
                    {track.label.trim() && (
                      <div className={`video-compare-stage-label video-compare-stage-label-tone-${index % 4}`}>{track.label}</div>
                    )}
                    <span className="video-compare-pane-index">{String(index + 1).padStart(2, '0')}</span>
                    <video
                      key={track.source.url}
                      ref={(element) => { videoRefs.current[track.id] = element; }}
                      src={track.source.url}
                      muted={track.id !== previewAudioTrackId}
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(event) => updateDuration(track.id, event)}
                      onTimeUpdate={(event) => handleTimeUpdate(track.id, event)}
                      onPlay={() => { if (track.id === tracks[0]?.id) setIsPlaying(true); }}
                      onPause={() => { if (track.id === tracks[0]?.id) setIsPlaying(false); }}
                      onError={() => handleVideoError(track.id)}
                    />
                    {trackHasError && (
                      <div className="video-compare-video-fallback">
                        <span>示例素材暂时无法载入</span>
                        <small>请从下方导入本地视频</small>
                      </div>
                    )}
                    <div className="video-compare-pane-foot">
                      <span className={`video-compare-file-dot video-compare-file-dot-tone-${index % 4}`} />
                      <span title={track.source.name}>{track.source.name}</span>
                      {trackDimensions?.width > 0 && (
                        <small>{trackDimensions.width} × {trackDimensions.height}</small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {tracks.length === 2 && layout === 'side-by-side' && (
              <div className="video-compare-seam"><span>VS</span></div>
            )}

            <button
              className={`video-compare-center-play ${isPlaying ? 'is-playing' : ''}`}
              onClick={() => void togglePlayback()}
              type="button"
              aria-label={isPlaying ? '暂停同步播放' : '开始同步播放'}
            >
              {isPlaying ? <Pause size={25} fill="currentColor" /> : <Play size={27} fill="currentColor" />}
            </button>
            <div className="video-compare-current-time">{formatTime(currentTime)}</div>
          </div>

          <div className="video-compare-timeline-wrap">
            <div className="video-compare-timecodes"><span>00:00</span><span>{formatTime(duration)}</span></div>
            <div className="video-compare-range-shell" style={{ '--progress': `${syncPercent}%` } as React.CSSProperties}>
              <input
                className="video-compare-range"
                type="range"
                min="0"
                max={duration || 1}
                step="0.01"
                value={Math.min(currentTime, duration || 1)}
                onChange={handleSeek}
                aria-label="同步播放进度"
              />
            </div>
          </div>

          <div className="video-compare-controls">
            <div className="video-compare-control-cluster">
              <button className="video-compare-control-button" onClick={handleReset} type="button" title="回到开头" disabled={isExporting}>
                <RotateCcw size={15} />
              </button>
              <button
                className="video-compare-control-button"
                onClick={() => setPreviewAudioTrackId((current) => current ? null : (tracks[0]?.id ?? null))}
                type="button"
                title={previewAudioTrackId ? '静音' : '打开第一路声音'}
                disabled={isExporting}
              >
                {previewAudioTrackId ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </div>
            <div className="video-compare-control-divider" />
            <label className="video-compare-select-control">
              <Volume2 size={14} />
              <span>试听音轨</span>
              <select
                value={previewAudioTrackId ?? 'mute'}
                onChange={(event) => setPreviewAudioTrackId(event.target.value === 'mute' ? null : event.target.value)}
                disabled={isExporting}
              >
                <option value="mute">静音</option>
                {tracks.map((track, index) => (
                  <option value={track.id} key={track.id}>第 {index + 1} 路</option>
                ))}
              </select>
            </label>
            <label className="video-compare-select-control">
              <Gauge size={14} />
              <span>速度</span>
              <select value={playbackRate} onChange={(event) => setPlaybackRate(Number(event.target.value))} disabled={isExporting}>
                <option value="0.5">0.5×</option>
                <option value="0.75">0.75×</option>
                <option value="1">1.0×</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
              </select>
            </label>
            <label className="video-compare-offset-control">
              <span>偏移</span>
              <input type="number" step="0.1" value={offset} onChange={(event) => setOffset(Number(event.target.value) || 0)} disabled={isExporting} />
              <span>s</span>
            </label>
            <div className="video-compare-control-spacer" />
            <span className="video-compare-control-caption">点击中央按钮同步播放</span>
          </div>
        </section>

        <section className="video-compare-imports">
          <div className="video-compare-import-heading">
            <div><span className="video-compare-micro-label">SOURCE MATERIALS</span><h2>换入你的对比素材</h2></div>
            <p>支持 MP4、WebM 和 MOV。可添加最多六路视频并锁定同一时间线。</p>
          </div>
          <div className="video-compare-upload-grid">
            {tracks.map((track, index) => (
              <div className="video-compare-upload-card" key={track.id}>
                <label className="video-compare-upload-card-main">
                  <input type="file" accept="video/*" onChange={(event) => handleFileChange(track.id, event)} disabled={isExporting} />
                  <span className={`video-compare-upload-icon video-compare-upload-icon-tone-${index % 4}`}><Upload size={17} /></span>
                  <span className="video-compare-upload-copy">
                    <strong>替换 0{index + 1} 号视频</strong>
                    <small>{track.source.name}</small>
                  </span>
                  <span className="video-compare-upload-arrow">＋</span>
                </label>
                {tracks.length > 2 && (
                  <button
                    className="video-compare-remove-track"
                    onClick={() => handleRemoveTrack(track.id)}
                    type="button"
                    aria-label={`移除第 ${index + 1} 路视频`}
                    title="移除这一路视频"
                    disabled={isExporting}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            className="video-compare-add-track"
            onClick={handleAddTrack}
            type="button"
            disabled={tracks.length >= MAX_TRACKS || isExporting}
          >
            <Plus size={15} />
            <span>{tracks.length >= MAX_TRACKS ? '已达到六路上限' : '增加一路对比视频'}</span>
            <small>{tracks.length} / {MAX_TRACKS}</small>
          </button>
          <div className="video-compare-label-heading">
            <span className="video-compare-micro-label">OVERLAY LABELS</span>
            <span>画面顶部标注会跟随输入实时更新，清空后可隐藏</span>
          </div>
          <div className="video-compare-label-grid">
            {tracks.map((track, index) => (
              <label className="video-compare-label-control" key={track.id}>
                <span>0{index + 1} 号标注</span>
                <input
                  type="text"
                  value={track.label}
                  maxLength={18}
                  placeholder={`例如：视频 ${index + 1}`}
                  onChange={(event) => handleLabelChange(track.id, event)}
                  aria-label={`配置第 ${index + 1} 路视频标注`}
                  disabled={isExporting}
                />
              </label>
            ))}
          </div>
        </section>
      </main>

      {isExportPanelOpen && (
        <div className="video-export-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isExporting) setIsExportPanelOpen(false);
        }}>
          <section className="video-export-dialog" role="dialog" aria-modal="true" aria-labelledby="video-export-title">
            <div className="video-export-dialog-header">
              <div className="video-export-dialog-mark"><Film size={19} /></div>
              <div>
                <span className="video-compare-micro-label">LOCAL MP4 EXPORT</span>
                <h2 id="video-export-title">生成对比视频</h2>
              </div>
              <button
                className="video-export-close"
                type="button"
                onClick={() => setIsExportPanelOpen(false)}
                disabled={isExporting}
                aria-label="关闭导出面板"
              >
                <X size={17} />
              </button>
            </div>

            {!isExporting && !exportResult && (
              <>
                <div className="video-export-summary">
                  <div><span>视频</span><strong>{tracks.length} 路</strong></div>
                  <div><span>布局</span><strong>{layout === 'side-by-side' ? '左右网格' : '上下堆叠'}</strong></div>
                  <div><span>时长</span><strong>{formatTime(exportDuration)}</strong></div>
                  <div><span>偏移</span><strong>{offset.toFixed(1)} 秒</strong></div>
                </div>

                <div className="video-export-fieldset">
                  <span className="video-export-field-label">输出尺寸</span>
                  <div className="video-export-preset-grid">
                    {OUTPUT_PRESETS.map((preset) => (
                      <button
                        className={outputPresetId === preset.id ? 'is-selected' : ''}
                        key={preset.id}
                        type="button"
                        onClick={() => setOutputPresetId(preset.id)}
                      >
                        <span className={`video-export-ratio-icon is-${preset.id}`} />
                        <span><strong>{preset.label}</strong><small>{preset.description}</small></span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="video-export-options">
                  <label>
                    <span>帧率</span>
                    <select value={exportFps} onChange={(event) => setExportFps(Number(event.target.value))}>
                      <option value="24">24 FPS</option>
                      <option value="30">30 FPS</option>
                    </select>
                  </label>
                  <label>
                    <span>声音</span>
                    <select
                      value={exportAudioTrackId ?? 'mute'}
                      onChange={(event) => setExportAudioTrackId(event.target.value === 'mute' ? null : event.target.value)}
                    >
                      <option value="mute">静音导出</option>
                      {tracks.map((track, index) => (
                        <option value={track.id} key={track.id}>保留第 {index + 1} 路音轨</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className={`video-export-readiness ${canStartExport ? 'is-ready' : 'is-warning'}`}>
                  {canStartExport ? <Check size={16} /> : <AlertTriangle size={16} />}
                  <span>{canStartExport ? '素材已就绪。编码将在当前浏览器中完成。' : getExportReadinessMessage()}</span>
                </div>
                <p className="video-export-limit-note">适合 60 秒以内的本地短视频。单文件上限 100 MB，总大小上限 300 MB。页面需要保持开启。</p>
              </>
            )}

            {isExporting && exportProgress && (
              <div className="video-export-progress-panel" aria-live="polite">
                <LoaderCircle className="video-export-spinner" size={30} />
                <strong>{exportProgress.message}</strong>
                <span>{exportProgress.percent}%</span>
                <div className="video-export-progress-track"><i style={{ width: `${exportProgress.percent}%` }} /></div>
                <p>首次使用需要载入约 32 MB 的本地编码核心，请保持页面开启。</p>
              </div>
            )}

            {exportResult && !isExporting && (
              <div className="video-export-complete-panel">
                <span className="video-export-complete-icon"><Check size={24} /></span>
                <h3>MP4 已生成并开始下载</h3>
                <p>{selectedPreset?.width} × {selectedPreset?.height} · {exportFps} FPS · {formatTime(exportDuration)}</p>
              </div>
            )}

            {exportError && <div className="video-export-error" role="alert"><AlertTriangle size={15} />{exportError}</div>}

            <div className="video-export-dialog-actions">
              {isExporting ? (
                <button className="video-export-secondary" type="button" onClick={handleCancelExport}>取消导出</button>
              ) : (
                <button className="video-export-secondary" type="button" onClick={() => setIsExportPanelOpen(false)}>关闭</button>
              )}
              {exportResult && !isExporting ? (
                <button className="video-export-primary" type="button" onClick={() => downloadVideoExport(exportResult)}>
                  <Download size={15} />再次下载
                </button>
              ) : (
                <button className="video-export-primary" type="button" onClick={() => void handleStartExport()} disabled={!canStartExport || isExporting}>
                  {isExporting ? <LoaderCircle className="video-export-spinner" size={15} /> : <Film size={15} />}
                  {isExporting ? '正在编码' : '开始导出 MP4'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default VideoCompareView;

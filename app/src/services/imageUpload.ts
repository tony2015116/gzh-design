/** Generic CDN endpoint config (legacy) */
export interface CdnConfig {
  uploadUrl: string;
  fieldName: string;
  headers: string;        // JSON string
  responsePath: string;   // dot-separated path, e.g. "data.url"
}

/* ============================================================
 * Persistence helpers
 * ============================================================ */

export type UploadMode = 'custom' | 'base64';

const UPLOAD_MODE_KEY = 'upload_mode';
const CDN_CONFIG_KEY = 'cdn_upload_config';

export function loadUploadMode(): UploadMode {
  return localStorage.getItem(UPLOAD_MODE_KEY) === 'custom' ? 'custom' : 'base64';
}

export function saveUploadMode(mode: UploadMode): void {
  localStorage.setItem(UPLOAD_MODE_KEY, mode);
}

// --- CDN Config (legacy) ---
export function loadCdnConfig(): CdnConfig | null {
  const raw = localStorage.getItem(CDN_CONFIG_KEY);
  if (!raw) return null;
  try {
    const cfg = JSON.parse(raw) as CdnConfig;
    if (!cfg.uploadUrl?.trim()) return null;
    return cfg;
  } catch {
    return null;
  }
}
export function saveCdnConfig(config: CdnConfig): void {
  localStorage.setItem(CDN_CONFIG_KEY, JSON.stringify(config));
}

/* ============================================================
 * Image Compression (front-end, keeps base64 drafts and uploads small)
 * ============================================================ */

/**
 * Compress an image File to a JPEG Blob.
 * - maxWidth: 缩放到这个最大宽度 (default 1000px, 公众号正文实际宽度 677px)
 * - quality:  JPEG 质量 0-1 (default 0.80, 偏重体积节省)
 */
export function compressImageToBlob(
  file: File,
  maxWidth = 1000,
  quality = 0.80,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('无法读取图片文件'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('无法解析图片'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context 创建失败'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('图片压缩失败'));
          },
          'image/jpeg',
          quality,
        );
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
 * Upload functions
 * ============================================================ */

/**
 * Upload a Blob to a generic CDN endpoint.
 */
export async function uploadImageToCdn(blob: Blob, config: CdnConfig): Promise<string> {
  const formData = new FormData();
  const fieldName = config.fieldName?.trim() || 'file';
  formData.append(fieldName, blob, `image-${Date.now()}.jpg`);

  let extraHeaders: Record<string, string> = {};
  if (config.headers?.trim()) {
    try {
      extraHeaders = JSON.parse(config.headers);
    } catch {
      throw new Error('请求头 JSON 格式错误，请检查 CDN 设置');
    }
  }

  const response = await fetch(config.uploadUrl, {
    method: 'POST',
    headers: extraHeaders,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`上传失败: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const responsePath = config.responsePath?.trim() || 'url';
  const imageUrl = extractByPath(json, responsePath);

  if (!imageUrl) {
    throw new Error(`无法从响应中提取图片 URL (路径: ${responsePath})，返回数据: ${JSON.stringify(json).substring(0, 200)}`);
  }

  return imageUrl;
}

/* ============================================================
 * Internal helpers
 * ============================================================ */

function extractByPath(obj: unknown, path: string): string | null {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : null;
}

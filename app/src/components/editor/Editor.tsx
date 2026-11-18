import React, { useMemo, useRef } from 'react';
import { loadUploadMode, loadCdnConfig, compressImageToBlob, uploadImageToCdn } from '../../services/imageUpload';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  editorRef?: React.Ref<HTMLTextAreaElement>;
  onScroll?: React.UIEventHandler<HTMLTextAreaElement>;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, editorRef, onScroll }) => {
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineNumbers = useMemo(() => {
    const count = value.split('\n').length;
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [value]);

  const handleScroll: React.UIEventHandler<HTMLTextAreaElement> = (event) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    }
    onScroll?.(event);
  };

  /** Insert text at cursor position and return new cursor offset */
  const insertAtCursor = (textarea: HTMLTextAreaElement, text: string, start: number, end: number) => {
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newValue = before + text + after;
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      const pos = start + text.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
    return before + text + after;
  };

  /** Replace a placeholder string in the current textarea value */
  const replacePlaceholder = (placeholder: string, replacement: string) => {
    // Read the latest value from the underlying textarea DOM element
    const ta = typeof editorRef === 'object' && editorRef?.current ? editorRef.current : null;
    const currentValue = ta ? ta.value : value;
    const newValue = currentValue.replace(placeholder, replacement);
    onChange(newValue);
  };

  /** Base64 fallback: compress and embed inline */
  const handleBase64Fallback = (file: File, textarea: HTMLTextAreaElement, start: number, end: number) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1000;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const id = Math.random().toString(36).substring(2, 8);
          const refName = `image-${id}`;
          const insertText = `![截图][${refName}]\n`;
          const currentRealValue = textarea.value;
          const newValue = currentRealValue.substring(0, start) +
            insertText +
            currentRealValue.substring(end) +
            `\n\n[${refName}]: ${dataUrl}\n`;
          onChange(newValue);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + insertText.length, start + insertText.length);
          }, 0);
        }
      };
      if (event.target?.result) img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  /** Upload via custom CDN with placeholder + fallback */
  const handleCdnUpload = (
    file: File,
    textarea: HTMLTextAreaElement,
    start: number,
    end: number,
    uploadFn: (blob: Blob) => Promise<string>,
  ) => {
    const placeholderId = Math.random().toString(36).substring(2, 8);
    const placeholder = `![上传中...](uploading-${placeholderId})`;
    insertAtCursor(textarea, placeholder + '\n', start, end);

    (async () => {
      try {
        const blob = await compressImageToBlob(file);
        const remoteUrl = await uploadFn(blob);
        replacePlaceholder(placeholder, `![图片](${remoteUrl})`);
      } catch (err: any) {
        console.warn('Upload failed, falling back to base64:', err);
        replacePlaceholder(placeholder + '\n', '');
        handleBase64Fallback(file, textarea, start, end);
      }
    })();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let imageItem: DataTransferItem | null = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image/') === 0) {
        imageItem = items[i];
        break;
      }
    }
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const mode = loadUploadMode();

    if (mode === 'custom') {
      const cdnConfig = loadCdnConfig();
      if (cdnConfig) {
        handleCdnUpload(file, textarea, start, end, (blob) => uploadImageToCdn(blob, cdnConfig));
      } else {
        handleBase64Fallback(file, textarea, start, end);
      }
    } else {
      handleBase64Fallback(file, textarea, start, end);
    }
  };

  return (
    <div className="flex h-[calc(100%-2.5rem)] w-full">
      <div
        ref={gutterRef}
        aria-hidden
        className="w-12 flex-none select-none overflow-hidden border-r border-gray-100 bg-gray-50 py-6 pl-2 pr-3 text-right font-mono text-sm leading-6 text-gray-400"
      >
        {lineNumbers.map((line) => (
          <div key={line} className="h-6">
            {line}
          </div>
        ))}
      </div>
      <textarea
        aria-label="Markdown 正文"
        ref={editorRef}
        onScroll={handleScroll}
        onPaste={handlePaste}
        className="h-full w-full resize-none p-6 font-mono text-sm leading-6 text-gray-800 !border-0 focus:outline-none focus:ring-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在此输入 Markdown..."
        spellCheck={false}
      />
    </div>
  );
};

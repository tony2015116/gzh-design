export type ClipboardWriteResult = 'html' | 'text' | 'failed';

/** 写入富文本剪贴板；不支持时退回纯文本，并如实返回实际写入的格式 */
export async function writeRichTextToClipboard(html: string, plain: string): Promise<ClipboardWriteResult> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      })]);
      return 'html';
    } catch { /* 退回纯文本 */ }
  }
  try {
    await navigator.clipboard.writeText(plain);
    return 'text';
  } catch {
    return 'failed';
  }
}

/** 从任意 throw 出来的值里取出可展示的错误信息（html-to-image 等库会 reject 非 Error 值） */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

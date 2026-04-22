/**
 * 时间格式化工具 - 统一处理 UTC 时间到本地时间(UTC+8) 的转换
 */

/**
 * 将 UTC ISO 字符串转换为本地时间格式化字符串
 * @param utcString UTC 时间字符串 (ISO 格式)
 * @param format 格式类型: 'datetime' | 'date' | 'time' | 'full'
 */
export function formatDateTime(utcString: string | null | undefined, format: 'datetime' | 'date' | 'time' | 'full' = 'datetime'): string {
  if (!utcString) return '-';

  const date = new Date(utcString);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'full':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

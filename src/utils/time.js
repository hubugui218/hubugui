/**
 * 安全解析日期字符串 — 避免 UTC 偏移导致时间显示为 8:00
 * 规则：
 *   "2026-06-30"（纯日期）→ 本地时间 00:00
 *   "2026-06-30T14:30:00"（无时区）→ 本地时间
 *   "2026-06-30T14:30:00+08:00"（带时区）→ 按偏移解析
 *   其他 → new Date(str) 兜底
 */
export function parseLocal(str) {
  if (typeof str !== 'string') return new Date(str);
  // date-only: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // date-time without timezone: YYYY-MM-DDTHH:MM:SS
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    const [datePart, timePart] = str.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min, s] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, h, min, s);
  }
  return new Date(str);
}

// 时间格式化工具

/**
 * 将秒数格式化为 MM:SS 显示
 */
export function formatDuration(seconds) {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * 将秒数格式化为可读的时间描述
 */
export function formatDurationLong(seconds) {
  if (seconds < 60) return `${seconds} 秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins} 分钟`;
  return `${mins} 分 ${secs} 秒`;
}

/**
 * 格式化日期时间为可读字符串
 * 对纯日期字符串只显示日期不显示时间
 */
export function formatDateTime(date) {
  const d = parseLocal(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  // 纯日期字符串 → 不显示时分
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${year}-${month}-${day}`;
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期为简短字符串
 */
export function formatDateShort(date) {
  const d = parseLocal(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(date1, date2) {
  const d1 = parseLocal(date1);
  const d2 = parseLocal(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * 从 Date 对象或日期字符串生成统一日期 Key (YYYY-MM-DD)
 */
export function makeDateKey(date) {
  const d = typeof date === 'string' ? parseLocal(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 获取相对时间描述
 */
export function getRelativeDate(date) {
  const now = new Date();
  const d = parseLocal(date);

  if (isSameDay(d, now)) return '今天';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) return '昨天';

  return formatDateShort(date);
}

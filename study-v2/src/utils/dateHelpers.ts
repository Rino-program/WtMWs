/**
 * 日付関連のユーティリティ関数
 */

/**
 * 今日の0時を取得
 */
export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 今日の23時59分59秒を取得
 */
export function endOfToday(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * 指定した日数前の日付を取得
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * 週の初め（月曜日）を取得
 */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の初めとする
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 週の終わり（日曜日）を取得
 */
export function endOfWeek(date: Date = new Date()): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * ミリ秒を分に変換（四捨五入）
 */
export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

/**
 * 分をミリ秒に変換
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60000;
}

/**
 * ミリ秒を時:分:秒の形式に変換
 */
export function formatTime(ms: number, showSeconds = true): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return showSeconds
      ? `${hours}:${padZero(minutes)}:${padZero(seconds)}`
      : `${hours}:${padZero(minutes)}`;
  }

  return showSeconds ? `${minutes}:${padZero(seconds)}` : `${minutes}分`;
}

/**
 * 数値を2桁にゼロパディング
 */
export function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * 日付を YYYY-MM-DD 形式に変換
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * 日付を YYYY年MM月DD日 形式に変換
 */
export function formatDateJa(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 相対時間を取得（例: 2日前、1時間前）
 */
export function relativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (minutes > 0) return `${minutes}分前`;
  return 'たった今';
}

/**
 * 2つの日付が同じ日かチェック
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 日付が範囲内かチェック
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

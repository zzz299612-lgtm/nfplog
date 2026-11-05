const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function ymdFromParts(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayYmd(now = new Date()): string {
  return ymdFromParts(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseYmd(value: string): Date {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return new Date(year, month - 1, day);
}

export function sameMonth(value: string, year: number, month0: number): boolean {
  const date = parseYmd(value);
  return date.getFullYear() === year && date.getMonth() === month0;
}

export function monthGrid(year: number, month0: number): string[] {
  const first = new Date(year, month0, 1);
  const start = new Date(year, month0, 1 - first.getDay());
  const days: string[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    days.push(ymdFromParts(date.getFullYear(), date.getMonth(), date.getDate()));
  }
  return days;
}

export function shiftMonth(
  year: number,
  month0: number,
  delta: number,
): { year: number; month0: number } {
  const date = new Date(year, month0 + delta, 1);
  return { year: date.getFullYear(), month0: date.getMonth() };
}

export function weekdayShort(value: string): string {
  return WEEKDAYS[parseYmd(value).getDay()] ?? "";
}

export function weekdayLong(value: string): string {
  return `${weekdayShort(value)}요일`;
}

export function dayNumber(value: string): number {
  return parseYmd(value).getDate();
}

export function monthTitle(year: number, month0: number): string {
  return `${year}년 ${month0 + 1}월`;
}

export function dayTitle(value: string): string {
  const date = parseYmd(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdayLong(value)}`;
}

export const WEEKDAY_LABELS = WEEKDAYS;

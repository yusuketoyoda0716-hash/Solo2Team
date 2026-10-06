import type { DateOnlyString } from '@/types/kanban'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** "YYYY-MM-DD" の形で、実在する日付か（2026-02-30 などは false） */
export function isDateOnly(value: string): value is DateOnlyString {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/** 端末のタイムゾーンでの今日の日付 */
export function todayDateOnly(now: Date = new Date()): DateOnlyString {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// "YYYY-MM-DD" は文字列のまま比べても日付の前後と一致する。

/** 期限日が今日より前か */
export function isOverdue(
  dueDate: DateOnlyString | null,
  today: DateOnlyString,
): boolean {
  return dueDate !== null && dueDate < today
}

/** 開始日が期限日より後になっていないか（どちらかが未設定なら問題なし） */
export function isValidDateRange(
  startDate: DateOnlyString | null,
  dueDate: DateOnlyString | null,
): boolean {
  return startDate === null || dueDate === null || startDate <= dueDate
}

/** カード用の短い表示。今年なら "10/20"、それ以外は "2027/1/5" */
export function formatShortDate(
  date: DateOnlyString,
  today: DateOnlyString,
): string {
  const [year, month, day] = date.split('-').map(Number)
  const sameYear = date.slice(0, 4) === today.slice(0, 4)
  return sameYear ? `${month}/${day}` : `${year}/${month}/${day}`
}

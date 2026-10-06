import { formatShortDate, isOverdue, todayDateOnly } from '@/lib/date.ts'
import type { Task } from '@/types/kanban'
import styles from './TaskDates.module.css'

type Props = {
  task: Task
}

/** カードに出す開始日・期限日。期限切れは赤字と「期限切れ」の文字で示す */
export function TaskDates({ task }: Props) {
  const { startDate, dueDate } = task
  if (startDate === null && dueDate === null) return null

  const today = todayDateOnly()
  const overdue = isOverdue(dueDate, today)
  const start = startDate && formatShortDate(startDate, today)
  const due = dueDate && formatShortDate(dueDate, today)

  let text: string
  if (start && due) text = `${start} → ${due}`
  else if (due) text = `期限 ${due}`
  else text = `開始 ${start}`

  return (
    <p className={overdue ? `${styles.dates} ${styles.overdue}` : styles.dates}>
      <span>{text}</span>
      {overdue && <span className={styles.badge}>期限切れ</span>}
    </p>
  )
}

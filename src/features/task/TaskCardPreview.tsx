import type { Task } from '@/types/kanban'
import styles from './TaskCard.module.css'
import { TaskDates } from './TaskDates.tsx'

type Props = {
  task: Task
}

/** ドラッグ中にポインターについてくるカードの見た目（操作ボタンなし） */
export function TaskCardPreview({ task }: Props) {
  return (
    <div className={`${styles.card} ${styles.overlay}`}>
      <p className={styles.title}>{task.title}</p>
      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}
      <TaskDates task={task} />
    </div>
  )
}

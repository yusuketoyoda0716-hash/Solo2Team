import { useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectTaskLabels } from '@/lib/kanban/selectors.ts'
import type { Task } from '@/types/kanban'
import { LabelChip } from './LabelChip.tsx'
import styles from './TaskLabels.module.css'

type Props = {
  task: Task
}

/** カードに出す、タスクに付いているラベルの一覧 */
export function TaskLabels({ task }: Props) {
  const state = useKanbanState()
  const labels = selectTaskLabels(state, task)
  if (labels.length === 0) return null

  return (
    <ul className={styles.labels} aria-label="ラベル">
      {labels.map((label) => (
        <li key={label.id}>
          <LabelChip label={label} />
        </li>
      ))}
    </ul>
  )
}

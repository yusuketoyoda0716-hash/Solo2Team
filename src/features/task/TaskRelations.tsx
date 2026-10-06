import { useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectChildProgress } from '@/lib/kanban/selectors.ts'
import type { Task } from '@/types/kanban'
import styles from './TaskRelations.module.css'

type Props = {
  task: Task
}

/** 子課題なら親の名前、親課題なら子課題の進み具合を出す */
export function TaskRelations({ task }: Props) {
  const state = useKanbanState()

  if (task.parentId !== null) {
    const parent = state.tasks[task.parentId]
    if (!parent) return null
    return <p className={styles.parent}>親: {parent.title}</p>
  }

  const { done, total } = selectChildProgress(state, task.id)
  if (total === 0) return null
  return (
    <div className={styles.progress}>
      <span>
        子課題 {done}/{total} 完了
      </span>
      <progress
        className={styles.bar}
        value={done}
        max={total}
        aria-label={`タスク「${task.title}」の子課題の進み具合`}
      />
    </div>
  )
}

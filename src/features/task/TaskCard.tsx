import { useState } from 'react'
import { deleteTask, updateTask } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch } from '@/lib/kanban/hooks.ts'
import type { Task } from '@/types/kanban'
import styles from './TaskCard.module.css'
import { TaskEditForm } from './TaskEditForm.tsx'

type Props = {
  task: Task
}

/** 列の中の1タスク。その場で編集に切り替えられる */
export function TaskCard({ task }: Props) {
  const dispatch = useKanbanDispatch()
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <li className={styles.card}>
        <TaskEditForm
          task={task}
          onSave={(title, description) => {
            dispatch(updateTask(task.id, title, description))
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    )
  }

  const handleDelete = () => {
    const ok = window.confirm(`タスク「${task.title}」を削除しますか？`)
    if (ok) dispatch(deleteTask(task.id))
  }

  return (
    <li className={styles.card}>
      <p className={styles.title}>{task.title}</p>
      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          aria-label={`タスク「${task.title}」を編集`}
          onClick={() => setIsEditing(true)}
        >
          編集
        </button>
        <button
          type="button"
          aria-label={`タスク「${task.title}」を削除`}
          onClick={handleDelete}
        >
          削除
        </button>
      </div>
    </li>
  )
}

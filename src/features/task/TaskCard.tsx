import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { deleteTask, updateTask } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch } from '@/lib/kanban/hooks.ts'
import type { Task } from '@/types/kanban'
import styles from './TaskCard.module.css'
import { TaskDates } from './TaskDates.tsx'
import { TaskEditForm } from './TaskEditForm.tsx'

type Props = {
  task: Task
}

/**
 * 列の中の1タスク。その場で編集に切り替えられる。
 * マウスではカードのどこからでもドラッグでき、キーボードでは「移動」ボタンから動かす。
 */
export function TaskCard({ task }: Props) {
  const dispatch = useKanbanDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isEditing })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  if (isEditing) {
    return (
      <li ref={setNodeRef} style={style} className={styles.card}>
        <TaskEditForm
          task={task}
          onSave={(changes) => {
            dispatch(updateTask(task.id, changes))
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
    <li
      ref={setNodeRef}
      style={style}
      className={
        isDragging ? `${styles.card} ${styles.placeholder}` : styles.card
      }
      {...listeners}
    >
      <p className={styles.title}>{task.title}</p>
      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}
      <TaskDates task={task} />
      <div className={styles.actions}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={styles.handle}
          {...attributes}
          aria-label={`タスク「${task.title}」を移動`}
        >
          移動
        </button>
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

import { useState } from 'react'
import type { Task } from '@/types/kanban'
import styles from './TaskEditForm.module.css'

type Props = {
  task: Task
  /** タイトルは前後の空白を取り除いて渡す（空のときは呼ばれない） */
  onSave: (title: string, description: string) => void
  onCancel: () => void
}

/** タスクのタイトルと説明を編集するフォーム */
export function TaskEditForm({ task, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const trimmedTitle = title.trim()

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        if (!trimmedTitle) return
        onSave(trimmedTitle, description.trim())
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
      }}
    >
      <input
        aria-label="タスクのタイトル"
        value={title}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        aria-label="タスクの説明"
        value={description}
        rows={3}
        placeholder="説明（任意）"
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className={styles.actions}>
        <button type="submit" disabled={!trimmedTitle}>
          保存
        </button>
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  )
}

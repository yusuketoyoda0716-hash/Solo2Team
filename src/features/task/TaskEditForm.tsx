import { useId, useState } from 'react'
import { LabelChip } from '@/features/label/LabelChip.tsx'
import { isValidDateRange } from '@/lib/date.ts'
import type { TaskChanges } from '@/lib/kanban/actions.ts'
import { useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectLabels } from '@/lib/kanban/selectors.ts'
import type { LabelId, Task } from '@/types/kanban'
import styles from './TaskEditForm.module.css'

type Props = {
  task: Task
  /** タイトルと説明は前後の空白を取り除いて渡す（タイトルが空のときは呼ばれない） */
  onSave: (changes: TaskChanges) => void
  onCancel: () => void
}

/** タスクのタイトル・説明・開始日・期限日・ラベルを編集するフォーム */
export function TaskEditForm({ task, onSave, onCancel }: Props) {
  const labels = selectLabels(useKanbanState())
  const [labelIds, setLabelIds] = useState<LabelId[]>(task.labelIds)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  // <input type="date"> は未入力を空文字で扱うので、フォームの中では文字列で持つ
  const [startDate, setStartDate] = useState(task.startDate ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate ?? '')
  const startId = useId()
  const dueId = useId()
  const errorId = useId()

  const trimmedTitle = title.trim()
  const rangeIsValid = isValidDateRange(startDate || null, dueDate || null)
  const canSave = trimmedTitle !== '' && rangeIsValid

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSave) return
        onSave({
          title: trimmedTitle,
          description: description.trim(),
          startDate: startDate || null,
          dueDate: dueDate || null,
          labelIds,
        })
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
      <div className={styles.dates}>
        <label htmlFor={startId}>開始日</label>
        <input
          id={startId}
          type="date"
          value={startDate}
          max={dueDate || undefined}
          aria-invalid={!rangeIsValid}
          aria-describedby={rangeIsValid ? undefined : errorId}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label htmlFor={dueId}>期限日</label>
        <input
          id={dueId}
          type="date"
          value={dueDate}
          min={startDate || undefined}
          aria-invalid={!rangeIsValid}
          aria-describedby={rangeIsValid ? undefined : errorId}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <fieldset className={styles.labels}>
        <legend>ラベル</legend>
        {labels.length === 0 ? (
          <p className={styles.hint}>サイドバーの「ラベル」から作れます</p>
        ) : (
          labels.map((label) => (
            <label key={label.id} className={styles.labelOption}>
              <input
                type="checkbox"
                checked={labelIds.includes(label.id)}
                onChange={(e) =>
                  setLabelIds((ids) =>
                    e.target.checked
                      ? [...ids, label.id]
                      : ids.filter((id) => id !== label.id),
                  )
                }
              />
              <LabelChip label={label} />
            </label>
          ))
        )}
      </fieldset>
      {!rangeIsValid && (
        <p id={errorId} className={styles.error} role="alert">
          開始日は期限日より前にしてください
        </p>
      )}
      <div className={styles.actions}>
        <button type="submit" disabled={!canSave}>
          保存
        </button>
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </form>
  )
}

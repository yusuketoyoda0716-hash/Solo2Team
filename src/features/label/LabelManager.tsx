import { useState } from 'react'
import { addLabel, deleteLabel, updateLabel } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch, useKanbanState } from '@/lib/kanban/hooks.ts'
import {
  countTasksWithLabel,
  isLabelNameTaken,
  selectLabels,
} from '@/lib/kanban/selectors.ts'
import type { Label } from '@/types/kanban'
import { LabelChip } from './LabelChip.tsx'
import { LabelForm } from './LabelForm.tsx'
import styles from './LabelManager.module.css'

/** サイドバーのラベル管理（ワークスペース全体で共有） */
export function LabelManager() {
  const state = useKanbanState()
  const dispatch = useKanbanDispatch()
  const labels = selectLabels(state)

  return (
    <section className={styles.labelManager} aria-labelledby="labels-heading">
      <h2 id="labels-heading" className={styles.heading}>
        ラベル
      </h2>
      {labels.length === 0 ? (
        <p className={styles.empty}>ラベルはまだありません</p>
      ) : (
        <ul className={styles.list}>
          {labels.map((label) => (
            <LabelItem key={label.id} label={label} />
          ))}
        </ul>
      )}
      <LabelForm
        nameLabel="新しいラベル名"
        submitLabel="ラベルを追加"
        isNameTaken={(name) => isLabelNameTaken(state, name)}
        onSubmit={(name, color) => dispatch(addLabel(name, color))}
      />
    </section>
  )
}

function LabelItem({ label }: { label: Label }) {
  const state = useKanbanState()
  const dispatch = useKanbanDispatch()
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <li className={styles.item}>
        <LabelForm
          nameLabel="ラベル名"
          submitLabel="保存"
          initialName={label.name}
          initialColor={label.color}
          autoFocus
          isNameTaken={(name) => isLabelNameTaken(state, name, label.id)}
          onSubmit={(name, color) => {
            dispatch(updateLabel(label.id, name, color))
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    )
  }

  const handleDelete = () => {
    const count = countTasksWithLabel(state, label.id)
    const message =
      count > 0
        ? `ラベル「${label.name}」を削除しますか？\n付いている ${count} 件のタスクから外れます。`
        : `ラベル「${label.name}」を削除しますか？`
    if (window.confirm(message)) dispatch(deleteLabel(label.id))
  }

  return (
    <li className={styles.item}>
      <span className={styles.chip}>
        <LabelChip label={label} />
      </span>
      <button
        type="button"
        aria-label={`ラベル「${label.name}」を編集`}
        onClick={() => setIsEditing(true)}
      >
        編集
      </button>
      <button
        type="button"
        aria-label={`ラベル「${label.name}」を削除`}
        onClick={handleDelete}
      >
        削除
      </button>
    </li>
  )
}

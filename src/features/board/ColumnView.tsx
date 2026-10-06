import { useState } from 'react'
import { TextInputForm } from '@/components/TextInputForm.tsx'
import { deleteColumn, renameColumn } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch } from '@/lib/kanban/hooks.ts'
import type { Column } from '@/types/kanban'
import styles from './ColumnView.module.css'

type Props = {
  column: Column
}

/** ボード内の1列 */
export function ColumnView({ column }: Props) {
  const dispatch = useKanbanDispatch()
  const [isEditing, setIsEditing] = useState(false)

  const handleDelete = () => {
    const ok = window.confirm(
      `列「${column.name}」を削除しますか？\n中のタスクもすべて削除されます。`,
    )
    if (ok) dispatch(deleteColumn(column.id))
  }

  return (
    <section className={styles.column} aria-label={`列「${column.name}」`}>
      <header className={styles.header}>
        {isEditing ? (
          <TextInputForm
            label="列名"
            submitLabel="保存"
            initialValue={column.name}
            autoFocus
            onSubmit={(name) => {
              dispatch(renameColumn(column.id, name))
              setIsEditing(false)
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <h3 className={styles.name}>{column.name}</h3>
            <button
              type="button"
              aria-label={`列「${column.name}」の名前を変更`}
              onClick={() => setIsEditing(true)}
            >
              名前変更
            </button>
            <button
              type="button"
              aria-label={`列「${column.name}」を削除`}
              onClick={handleDelete}
            >
              削除
            </button>
          </>
        )}
      </header>
      <p className={styles.empty}>タスクはまだありません</p>
    </section>
  )
}

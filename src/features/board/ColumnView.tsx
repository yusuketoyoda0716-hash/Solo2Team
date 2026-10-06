import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { TextInputForm } from '@/components/TextInputForm.tsx'
import { TaskCard } from '@/features/task/TaskCard.tsx'
import { addTask, deleteColumn, renameColumn } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch } from '@/lib/kanban/hooks.ts'
import type { Column, Task } from '@/types/kanban'
import styles from './ColumnView.module.css'

type Props = {
  column: Column
  /** 表示する順に並んだタスク（ドラッグ中はプレビューの並び） */
  tasks: Task[]
}

/** ボード内の1列 */
export function ColumnView({ column, tasks }: Props) {
  const dispatch = useKanbanDispatch()
  const [isEditing, setIsEditing] = useState(false)
  // タスクが1つもない列にも置けるよう、タスクの置き場全体を受け皿にする
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

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
      <div
        ref={setNodeRef}
        className={
          isOver ? `${styles.dropArea} ${styles.over}` : styles.dropArea
        }
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <p className={styles.empty}>タスクはまだありません</p>
          ) : (
            <ul className={styles.tasks}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </ul>
          )}
        </SortableContext>
      </div>
      <TextInputForm
        label={`列「${column.name}」に追加するタスク`}
        placeholder="新しいタスク"
        submitLabel="追加"
        onSubmit={(title) => dispatch(addTask(column.id, title))}
      />
    </section>
  )
}

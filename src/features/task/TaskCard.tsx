import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, useState } from 'react'
import { TextInputForm } from '@/components/TextInputForm.tsx'
import { TaskLabels } from '@/features/label/TaskLabels.tsx'
import { addTask, deleteTask, updateTask } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch, useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectChildren } from '@/lib/kanban/selectors.ts'
import type { Task } from '@/types/kanban'
import styles from './TaskCard.module.css'
import { TaskDates } from './TaskDates.tsx'
import { TaskEditForm } from './TaskEditForm.tsx'
import { TaskRelations } from './TaskRelations.tsx'

type Props = {
  task: Task
  /** 課題一覧から開かれたときに変わる番号。変わるたびにカードへ移動して目立たせる */
  highlightSeq?: number
}

/**
 * 列の中の1タスク。その場で編集に切り替えられる。
 * マウスではカードのどこからでもドラッグでき、キーボードでは「移動」ボタンから動かす。
 */
export function TaskCard({ task, highlightSeq }: Props) {
  const state = useKanbanState()
  const dispatch = useKanbanDispatch()
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isEditing })

  const cardRef = useRef<HTMLLIElement | null>(null)
  const handleRef = useRef<HTMLButtonElement | null>(null)
  const setCardRef = (node: HTMLLIElement | null) => {
    setNodeRef(node)
    cardRef.current = node
  }
  const setHandleRef = (node: HTMLButtonElement | null) => {
    setActivatorNodeRef(node)
    handleRef.current = node
  }

  // 課題一覧から開かれたら、カードを画面に入れてフォーカスし、少しの間光らせる
  useEffect(() => {
    if (highlightSeq === undefined) return
    const card = cardRef.current
    if (!card) return
    card.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    handleRef.current?.focus({ preventScroll: true })
    card.animate(
      [
        { boxShadow: '0 0 0 3px var(--color-highlight)' },
        { boxShadow: '0 0 0 3px transparent' },
      ],
      { duration: 1600, easing: 'ease-out' },
    )
  }, [highlightSeq])

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  if (isEditing) {
    return (
      <li ref={setCardRef} style={style} className={styles.card}>
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
    const childCount = selectChildren(state, task.id).length
    const message =
      childCount > 0
        ? `タスク「${task.title}」を削除しますか？\n子課題 ${childCount} 件も削除されます。`
        : `タスク「${task.title}」を削除しますか？`
    if (window.confirm(message)) dispatch(deleteTask(task.id))
  }

  // 親になれるのは、親を持たないタスクだけ（階層は1段まで）
  const canHaveChildren = task.parentId === null

  return (
    <li
      ref={setCardRef}
      style={style}
      className={
        isDragging ? `${styles.card} ${styles.placeholder}` : styles.card
      }
      {...listeners}
    >
      <p className={styles.title}>{task.title}</p>
      <TaskRelations task={task} />
      {task.description && (
        <p className={styles.description}>{task.description}</p>
      )}
      <TaskLabels task={task} />
      <TaskDates task={task} />
      {isAddingChild && (
        // 入力中にカードのドラッグが始まらないようにする
        <div onPointerDown={(e) => e.stopPropagation()}>
          <TextInputForm
            label={`タスク「${task.title}」の子課題`}
            placeholder="子課題のタイトル"
            submitLabel="追加"
            autoFocus
            onSubmit={(title) =>
              dispatch(addTask(task.columnId, title, { parentId: task.id }))
            }
            onCancel={() => setIsAddingChild(false)}
          />
        </div>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          ref={setHandleRef}
          className={styles.handle}
          {...attributes}
          aria-label={`タスク「${task.title}」を移動`}
        >
          移動
        </button>
        {canHaveChildren && !isAddingChild && (
          <button
            type="button"
            aria-label={`タスク「${task.title}」に子課題を追加`}
            onClick={() => setIsAddingChild(true)}
          >
            子課題
          </button>
        )}
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

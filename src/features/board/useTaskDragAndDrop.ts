import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import { moveTask } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch, useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectTasks } from '@/lib/kanban/selectors.ts'
import type { Column, ColumnId, TaskId } from '@/types/kanban'

/** 列ごとのタスク ID の並び */
export type TaskIdsByColumn = Record<ColumnId, TaskId[]>

/** id が列そのものならその列、タスクならそのタスクがいる列を返す */
function findColumn(
  idsByColumn: TaskIdsByColumn,
  id: UniqueIdentifier,
): ColumnId | null {
  const key = String(id)
  if (key in idsByColumn) return key
  return (
    Object.keys(idsByColumn).find((columnId) =>
      idsByColumn[columnId].includes(key),
    ) ?? null
  )
}

/**
 * ボード内のタスクのドラッグ＆ドロップ。
 * ドラッグ中の並びは画面側のプレビューとして持ち、置いたときだけ reducer に伝える
 * （ドラッグ中に何度も保存が走らないようにするため）。
 */
export function useTaskDragAndDrop(columns: Column[]) {
  const state = useKanbanState()
  const dispatch = useKanbanDispatch()
  const [preview, setPreview] = useState<TaskIdsByColumn | null>(null)
  const [activeId, setActiveId] = useState<TaskId | null>(null)

  const committed: TaskIdsByColumn = Object.fromEntries(
    columns.map((c) => [c.id, selectTasks(state, c.id).map((t) => t.id)]),
  )
  const taskIdsByColumn = preview ?? committed

  const sensors = useSensors(
    // 5px 動かすまではドラッグを始めず、カード内のボタンのクリックを通す
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const reset = () => {
    setPreview(null)
    setActiveId(null)
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    setPreview(committed)
  }

  // 別の列の上に来たら、プレビューの中でその列へ移す（同じ列の中は sortable が見た目を動かす）
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setPreview((prev) => {
      const current = prev ?? committed
      const from = findColumn(current, active.id)
      const to = findColumn(current, over.id)
      if (!from || !to || from === to) return prev

      const movingId = String(active.id)
      const toIds = current[to].filter((id) => id !== movingId)
      const overIndex = toIds.indexOf(String(over.id))
      toIds.splice(overIndex >= 0 ? overIndex : toIds.length, 0, movingId)
      return {
        ...current,
        [from]: current[from].filter((id) => id !== movingId),
        [to]: toIds,
      }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const current = preview ?? committed
    const movingId = String(active.id)
    const columnId = over ? findColumn(current, active.id) : null
    reset()
    if (!over || !columnId) return

    const ids = current[columnId]
    const overIndex = ids.indexOf(String(over.id))
    const toIndex = overIndex >= 0 ? overIndex : ids.indexOf(movingId)

    // 元の場所に戻しただけなら何もしない
    const originalColumn = findColumn(committed, active.id)
    const originalIndex = originalColumn
      ? committed[originalColumn].indexOf(movingId)
      : -1
    if (originalColumn === columnId && originalIndex === toIndex) return

    dispatch(moveTask(movingId, columnId, toIndex))
  }

  const taskTitle = (id: UniqueIdentifier) =>
    state.tasks[String(id)]?.title ?? ''
  const placeName = (id: UniqueIdentifier) => {
    const columnId = findColumn(preview ?? committed, id)
    return columnId ? (state.columns[columnId]?.name ?? '') : ''
  }

  const accessibility: {
    announcements: Announcements
    screenReaderInstructions: ScreenReaderInstructions
  } = {
    screenReaderInstructions: {
      draggable:
        'スペースキーでタスクを持ち上げ、矢印キーで動かし、もう一度スペースキーで置きます。Esc キーで取り消します。',
    },
    announcements: {
      onDragStart: ({ active }) =>
        `タスク「${taskTitle(active.id)}」を持ち上げました。`,
      onDragOver: ({ active, over }) => {
        if (!over) {
          return `タスク「${taskTitle(active.id)}」は置ける場所の外にあります。`
        }
        // 持ち上げた直後（まだ自分の位置の上）は読み上げず、「持ち上げました」を残す
        if (over.id === active.id) return undefined
        return `タスク「${taskTitle(active.id)}」を列「${placeName(over.id)}」の上に動かしました。`
      },
      onDragEnd: ({ active, over }) =>
        over
          ? `タスク「${taskTitle(active.id)}」を列「${placeName(over.id)}」に置きました。`
          : `タスク「${taskTitle(active.id)}」の移動を取り消しました。`,
      onDragCancel: ({ active }) =>
        `タスク「${taskTitle(active.id)}」の移動を取り消しました。`,
    },
  }

  return {
    sensors,
    taskIdsByColumn,
    activeTask: activeId ? (state.tasks[activeId] ?? null) : null,
    accessibility,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: reset },
  }
}

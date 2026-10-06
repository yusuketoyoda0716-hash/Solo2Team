import type { KanbanState } from '@/lib/kanban/state.ts'
import { isTaskDone, selectTaskLabels } from '@/lib/kanban/selectors.ts'
import type { Board, Column, Label, Task } from '@/types/kanban'

/** 課題一覧の1行に出す情報 */
export type TaskRow = {
  task: Task
  board: Board
  column: Column
  done: boolean
  parent: Task | null
  labels: Label[]
}

export type SortKey =
  'title' | 'board' | 'status' | 'startDate' | 'dueDate' | 'updatedAt'

export type SortOrder = {
  key: SortKey
  direction: 'asc' | 'desc'
}

/** Backlog と同じく、最近更新したものから並べる */
export const DEFAULT_SORT: SortOrder = { key: 'updatedAt', direction: 'desc' }

/** 全ボードのタスクを、一覧の行にする */
export function selectTaskRows(state: KanbanState): TaskRow[] {
  return Object.values(state.tasks).flatMap((task) => {
    const column = state.columns[task.columnId]
    const board = column ? state.boards[column.boardId] : undefined
    if (!column || !board) return []
    return [
      {
        task,
        board,
        column,
        done: isTaskDone(state, task),
        parent: task.parentId ? (state.tasks[task.parentId] ?? null) : null,
        labels: selectTaskLabels(state, task),
      },
    ]
  })
}

const compareText = (a: string, b: string) => a.localeCompare(b, 'ja')

/** 項目ごとの比べ方（昇順）。日付が未設定の行は別に扱う */
const comparators: Record<SortKey, (a: TaskRow, b: TaskRow) => number> = {
  title: (a, b) => compareText(a.task.title, b.task.title),
  board: (a, b) => a.board.position - b.board.position,
  // 状態はボードの並び → 列の並び（左の列ほど先）
  status: (a, b) =>
    a.board.position - b.board.position ||
    a.column.position - b.column.position,
  startDate: (a, b) =>
    compareText(a.task.startDate ?? '', b.task.startDate ?? ''),
  dueDate: (a, b) => compareText(a.task.dueDate ?? '', b.task.dueDate ?? ''),
  updatedAt: (a, b) => compareText(a.task.updatedAt, b.task.updatedAt),
}

/** 日付で並べるとき、未設定の行は昇順・降順どちらでも最後にする */
function isMissing(row: TaskRow, key: SortKey): boolean {
  if (key === 'startDate') return row.task.startDate === null
  if (key === 'dueDate') return row.task.dueDate === null
  return false
}

export function sortTaskRows(rows: TaskRow[], order: SortOrder): TaskRow[] {
  const sign = order.direction === 'asc' ? 1 : -1
  const compare = comparators[order.key]
  return [...rows].sort((a, b) => {
    const missingA = isMissing(a, order.key)
    const missingB = isMissing(b, order.key)
    if (missingA !== missingB) return missingA ? 1 : -1
    // 同じ値なら件名順、それも同じなら ID 順にして、並びを毎回同じにする
    return (
      sign * compare(a, b) ||
      compareText(a.task.title, b.task.title) ||
      compareText(a.task.id, b.task.id)
    )
  })
}

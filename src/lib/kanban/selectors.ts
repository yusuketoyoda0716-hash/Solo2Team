import type {
  Board,
  BoardId,
  Column,
  ColumnId,
  Label,
  LabelId,
  Task,
} from '@/types/kanban'
import type { KanbanState } from './state.ts'

const byPosition = (a: { position: number }, b: { position: number }) =>
  a.position - b.position

export const selectBoards = (state: KanbanState): Board[] =>
  Object.values(state.boards).sort(byPosition)

export const selectColumns = (state: KanbanState, boardId: BoardId): Column[] =>
  Object.values(state.columns)
    .filter((c) => c.boardId === boardId)
    .sort(byPosition)

export const selectTasks = (state: KanbanState, columnId: ColumnId): Task[] =>
  Object.values(state.tasks)
    .filter((t) => t.columnId === columnId)
    .sort(byPosition)

/** ラベルは名前順に並べる */
export const selectLabels = (state: KanbanState): Label[] =>
  Object.values(state.labels).sort((a, b) => a.name.localeCompare(b.name, 'ja'))

/** タスクに付いているラベル（ラベル一覧と同じ順） */
export const selectTaskLabels = (state: KanbanState, task: Task): Label[] =>
  selectLabels(state).filter((l) => task.labelIds.includes(l.id))

/** 同じ名前のラベルがすでにあるか（大文字小文字・前後の空白は区別しない） */
export const isLabelNameTaken = (
  state: KanbanState,
  name: string,
  exceptId?: LabelId,
): boolean => {
  const key = name.trim().toLowerCase()
  return Object.values(state.labels).some(
    (l) => l.id !== exceptId && l.name.trim().toLowerCase() === key,
  )
}

/** そのラベルが付いているタスクの数 */
export const countTasksWithLabel = (
  state: KanbanState,
  labelId: LabelId,
): number =>
  Object.values(state.tasks).filter((t) => t.labelIds.includes(labelId)).length

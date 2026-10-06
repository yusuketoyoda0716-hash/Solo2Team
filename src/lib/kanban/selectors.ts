import type { Board, BoardId, Column, ColumnId, Task } from '@/types/kanban'
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

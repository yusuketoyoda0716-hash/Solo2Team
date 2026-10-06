import type { Board, Column, Task } from '@/types/kanban'
import type { KanbanAction } from './actions.ts'
import type { KanbanState } from './state.ts'

/** 兄弟の中で一番後ろの position（空なら 0） */
function nextPosition(siblings: { position: number }[]): number {
  if (siblings.length === 0) return 0
  return Math.max(...siblings.map((s) => s.position)) + 1
}

function omitWhere<T>(
  record: Record<string, T>,
  shouldOmit: (value: T) => boolean,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => !shouldOmit(value)),
  )
}

// 存在しない ID への操作は何もせず、元の state をそのまま返す。
export function kanbanReducer(
  state: KanbanState,
  action: KanbanAction,
): KanbanState {
  switch (action.type) {
    case 'board/added': {
      const board: Board = {
        id: action.id,
        workspaceId: state.workspace.id,
        name: action.name,
        position: nextPosition(Object.values(state.boards)),
        createdAt: action.now,
        updatedAt: action.now,
      }
      return { ...state, boards: { ...state.boards, [board.id]: board } }
    }
    case 'board/renamed': {
      const board = state.boards[action.id]
      if (!board) return state
      return {
        ...state,
        boards: {
          ...state.boards,
          [board.id]: { ...board, name: action.name, updatedAt: action.now },
        },
      }
    }
    case 'board/deleted': {
      if (!state.boards[action.id]) return state
      const columnIds = new Set(
        Object.values(state.columns)
          .filter((c) => c.boardId === action.id)
          .map((c) => c.id),
      )
      return {
        ...state,
        boards: omitWhere(state.boards, (b) => b.id === action.id),
        columns: omitWhere(state.columns, (c) => columnIds.has(c.id)),
        tasks: omitWhere(state.tasks, (t) => columnIds.has(t.columnId)),
      }
    }

    case 'column/added': {
      if (!state.boards[action.boardId]) return state
      const column: Column = {
        id: action.id,
        boardId: action.boardId,
        name: action.name,
        position: nextPosition(
          Object.values(state.columns).filter(
            (c) => c.boardId === action.boardId,
          ),
        ),
        createdAt: action.now,
        updatedAt: action.now,
      }
      return { ...state, columns: { ...state.columns, [column.id]: column } }
    }
    case 'column/renamed': {
      const column = state.columns[action.id]
      if (!column) return state
      return {
        ...state,
        columns: {
          ...state.columns,
          [column.id]: { ...column, name: action.name, updatedAt: action.now },
        },
      }
    }
    case 'column/deleted': {
      if (!state.columns[action.id]) return state
      return {
        ...state,
        columns: omitWhere(state.columns, (c) => c.id === action.id),
        tasks: omitWhere(state.tasks, (t) => t.columnId === action.id),
      }
    }

    case 'task/added': {
      if (!state.columns[action.columnId]) return state
      const task: Task = {
        id: action.id,
        columnId: action.columnId,
        title: action.title,
        description: action.description,
        position: nextPosition(
          Object.values(state.tasks).filter(
            (t) => t.columnId === action.columnId,
          ),
        ),
        createdAt: action.now,
        updatedAt: action.now,
      }
      return { ...state, tasks: { ...state.tasks, [task.id]: task } }
    }
    case 'task/updated': {
      const task = state.tasks[action.id]
      if (!task) return state
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [task.id]: {
            ...task,
            title: action.title,
            description: action.description,
            updatedAt: action.now,
          },
        },
      }
    }
    case 'task/deleted': {
      if (!state.tasks[action.id]) return state
      return {
        ...state,
        tasks: omitWhere(state.tasks, (t) => t.id === action.id),
      }
    }
  }
}

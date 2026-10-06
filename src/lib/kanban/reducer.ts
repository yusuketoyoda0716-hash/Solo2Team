import type { Board, Column, Label, Task, TaskId } from '@/types/kanban'
import type { KanbanAction } from './actions.ts'
import { canBeParent, isLabelNameTaken, selectTasks } from './selectors.ts'
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

/** 指定したタスクと、その子課題の ID */
function withChildren(state: KanbanState, ids: TaskId[]): Set<TaskId> {
  const set = new Set(ids)
  for (const t of Object.values(state.tasks)) {
    if (t.parentId !== null && set.has(t.parentId)) set.add(t.id)
  }
  return set
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
        doneColumnId: null,
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
    case 'board/doneColumnSet': {
      const board = state.boards[action.id]
      if (!board) return state
      // 完了列にできるのは、そのボードの列だけ
      if (
        action.columnId !== null &&
        state.columns[action.columnId]?.boardId !== board.id
      ) {
        return state
      }
      return {
        ...state,
        boards: {
          ...state.boards,
          [board.id]: {
            ...board,
            doneColumnId: action.columnId,
            updatedAt: action.now,
          },
        },
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
      const column = state.columns[action.id]
      if (!column) return state
      // 完了列を消したら、ボードの完了列の設定も外す
      const board = state.boards[column.boardId]
      const boards =
        board?.doneColumnId === column.id
          ? { ...state.boards, [board.id]: { ...board, doneColumnId: null } }
          : state.boards
      // 列のタスクと、その子課題（別の列にあっても）を消す
      const removed = withChildren(
        state,
        Object.values(state.tasks)
          .filter((t) => t.columnId === action.id)
          .map((t) => t.id),
      )
      return {
        ...state,
        boards,
        columns: omitWhere(state.columns, (c) => c.id === action.id),
        tasks: omitWhere(state.tasks, (t) => removed.has(t.id)),
      }
    }

    case 'task/added': {
      if (!state.columns[action.columnId]) return state
      if (
        action.parentId !== null &&
        !canBeParent(state, action.parentId, {
          id: null,
          columnId: action.columnId,
        })
      ) {
        return state
      }
      const task: Task = {
        id: action.id,
        columnId: action.columnId,
        title: action.title,
        description: action.description,
        startDate: null,
        dueDate: null,
        labelIds: [],
        parentId: action.parentId,
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
      // 存在するラベルだけを、重複なしで付ける
      const labelIds = [...new Set(action.changes.labelIds)].filter(
        (id) => state.labels[id],
      )
      // 親にできないタスクが指定されたら、親は変えない
      const { parentId: requestedParent } = action.changes
      const parentId =
        requestedParent === null ||
        requestedParent === task.parentId ||
        canBeParent(state, requestedParent, task)
          ? requestedParent
          : task.parentId
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [task.id]: {
            ...task,
            ...action.changes,
            labelIds,
            parentId,
            updatedAt: action.now,
          },
        },
      }
    }
    case 'task/deleted': {
      if (!state.tasks[action.id]) return state
      // 親課題を消したら、子課題もまとめて消す
      const removed = withChildren(state, [action.id])
      return {
        ...state,
        tasks: omitWhere(state.tasks, (t) => removed.has(t.id)),
      }
    }
    case 'task/moved': {
      const task = state.tasks[action.id]
      if (!task || !state.columns[action.toColumnId]) return state

      // 移動先の列の並び（自分を除く）に差し込む
      const destination = selectTasks(state, action.toColumnId).filter(
        (t) => t.id !== task.id,
      )
      const index = Math.min(Math.max(0, action.toIndex), destination.length)
      destination.splice(index, 0, task)

      // 影響する列の position を 0 から振り直す
      const tasks = { ...state.tasks }
      const renumber = (list: Task[]) =>
        list.forEach((t, position) => {
          if (tasks[t.id].position !== position) {
            tasks[t.id] = { ...tasks[t.id], position }
          }
        })
      if (task.columnId !== action.toColumnId) {
        renumber(
          selectTasks(state, task.columnId).filter((t) => t.id !== task.id),
        )
      }
      renumber(destination)
      tasks[task.id] = {
        ...tasks[task.id],
        columnId: action.toColumnId,
        updatedAt: action.now,
      }
      return { ...state, tasks }
    }

    // ラベル名はワークスペース内で重複させない（重複する操作は無視する）
    case 'label/added': {
      if (isLabelNameTaken(state, action.name)) return state
      const label: Label = {
        id: action.id,
        workspaceId: state.workspace.id,
        name: action.name,
        color: action.color,
        createdAt: action.now,
        updatedAt: action.now,
      }
      return { ...state, labels: { ...state.labels, [label.id]: label } }
    }
    case 'label/updated': {
      const label = state.labels[action.id]
      if (!label || isLabelNameTaken(state, action.name, label.id)) return state
      return {
        ...state,
        labels: {
          ...state.labels,
          [label.id]: {
            ...label,
            name: action.name,
            color: action.color,
            updatedAt: action.now,
          },
        },
      }
    }
    case 'label/deleted': {
      if (!state.labels[action.id]) return state
      // ラベルを外したタスクだけ作り直す（タスク自体の更新日時は変えない）
      const tasks = Object.fromEntries(
        Object.entries(state.tasks).map(([id, t]) => [
          id,
          t.labelIds.includes(action.id)
            ? { ...t, labelIds: t.labelIds.filter((l) => l !== action.id) }
            : t,
        ]),
      )
      return {
        ...state,
        labels: omitWhere(state.labels, (l) => l.id === action.id),
        tasks,
      }
    }
  }
}

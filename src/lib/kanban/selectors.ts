import type {
  Board,
  BoardId,
  Column,
  ColumnId,
  Label,
  LabelId,
  Task,
  TaskId,
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

/** タスクがボードの完了列にあるか */
export const isTaskDone = (state: KanbanState, task: Task): boolean => {
  const column = state.columns[task.columnId]
  if (!column) return false
  return state.boards[column.boardId]?.doneColumnId === column.id
}

/** タスクがあるボード */
export const boardIdOfTask = (state: KanbanState, task: Task): BoardId | null =>
  state.columns[task.columnId]?.boardId ?? null

/** 子課題（作った順） */
export const selectChildren = (state: KanbanState, parentId: TaskId): Task[] =>
  Object.values(state.tasks)
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

/** 子課題の進み具合（完了列にある子課題を完了とみなす） */
export const selectChildProgress = (
  state: KanbanState,
  parentId: TaskId,
): { done: number; total: number } => {
  const children = selectChildren(state, parentId)
  return {
    done: children.filter((c) => isTaskDone(state, c)).length,
    total: children.length,
  }
}

/**
 * parentId のタスクを、child の親にできるか。
 * 親は同じボードの、親を持たないタスクだけ（階層は1段まで）。
 * 子課題を持つタスクは、ほかのタスクの子にはなれない。
 */
export const canBeParent = (
  state: KanbanState,
  parentId: TaskId,
  child: { id: TaskId | null; columnId: ColumnId },
): boolean => {
  const parent = state.tasks[parentId]
  if (!parent || parent.id === child.id || parent.parentId !== null) {
    return false
  }
  const childBoard = state.columns[child.columnId]?.boardId
  if (!childBoard || boardIdOfTask(state, parent) !== childBoard) return false
  if (child.id !== null && selectChildren(state, child.id).length > 0) {
    return false
  }
  return true
}

/** 編集フォームの「親課題」に出す候補 */
export const selectParentCandidates = (
  state: KanbanState,
  task: Task,
): Task[] =>
  Object.values(state.tasks)
    .filter((t) => canBeParent(state, t.id, task))
    .sort((a, b) => a.title.localeCompare(b.title, 'ja'))

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

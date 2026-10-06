import type { BoardId, ColumnId, IsoDateString, TaskId } from '@/types/kanban'

export type KanbanAction =
  | { type: 'board/added'; id: BoardId; name: string; now: IsoDateString }
  | { type: 'board/renamed'; id: BoardId; name: string; now: IsoDateString }
  | { type: 'board/deleted'; id: BoardId }
  | {
      type: 'column/added'
      id: ColumnId
      boardId: BoardId
      name: string
      now: IsoDateString
    }
  | { type: 'column/renamed'; id: ColumnId; name: string; now: IsoDateString }
  | { type: 'column/deleted'; id: ColumnId }
  | {
      type: 'task/added'
      id: TaskId
      columnId: ColumnId
      title: string
      description: string
      now: IsoDateString
    }
  | {
      type: 'task/updated'
      id: TaskId
      title: string
      description: string
      now: IsoDateString
    }
  | { type: 'task/deleted'; id: TaskId }

type ActionOf<T extends KanbanAction['type']> = Extract<
  KanbanAction,
  { type: T }
>

// ID の生成と現在時刻の取得はここで行い、reducer を純粋関数に保つ。
const newId = (): string => crypto.randomUUID()
const nowIso = (): IsoDateString => new Date().toISOString()

export const addBoard = (name: string): ActionOf<'board/added'> => ({
  type: 'board/added',
  id: newId(),
  name,
  now: nowIso(),
})

export const renameBoard = (
  id: BoardId,
  name: string,
): ActionOf<'board/renamed'> => ({
  type: 'board/renamed',
  id,
  name,
  now: nowIso(),
})

export const deleteBoard = (id: BoardId): ActionOf<'board/deleted'> => ({
  type: 'board/deleted',
  id,
})

export const addColumn = (
  boardId: BoardId,
  name: string,
): ActionOf<'column/added'> => ({
  type: 'column/added',
  id: newId(),
  boardId,
  name,
  now: nowIso(),
})

export const renameColumn = (
  id: ColumnId,
  name: string,
): ActionOf<'column/renamed'> => ({
  type: 'column/renamed',
  id,
  name,
  now: nowIso(),
})

export const deleteColumn = (id: ColumnId): ActionOf<'column/deleted'> => ({
  type: 'column/deleted',
  id,
})

export const addTask = (
  columnId: ColumnId,
  title: string,
  description = '',
): ActionOf<'task/added'> => ({
  type: 'task/added',
  id: newId(),
  columnId,
  title,
  description,
  now: nowIso(),
})

export const updateTask = (
  id: TaskId,
  title: string,
  description: string,
): ActionOf<'task/updated'> => ({
  type: 'task/updated',
  id,
  title,
  description,
  now: nowIso(),
})

export const deleteTask = (id: TaskId): ActionOf<'task/deleted'> => ({
  type: 'task/deleted',
  id,
})

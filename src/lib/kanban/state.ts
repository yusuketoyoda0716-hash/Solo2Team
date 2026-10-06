import type {
  Board,
  BoardId,
  Column,
  ColumnId,
  IsoDateString,
  Task,
  TaskId,
  Workspace,
} from '@/types/kanban'

export type KanbanState = {
  /** フェーズ1ではワークスペースは1つに固定する */
  workspace: Workspace
  boards: Record<BoardId, Board>
  columns: Record<ColumnId, Column>
  tasks: Record<TaskId, Task>
}

export const LOCAL_WORKSPACE_ID = 'local-workspace'

export function createInitialState(now: IsoDateString): KanbanState {
  return {
    workspace: {
      id: LOCAL_WORKSPACE_ID,
      name: 'マイワークスペース',
      createdAt: now,
      updatedAt: now,
    },
    boards: {},
    columns: {},
    tasks: {},
  }
}

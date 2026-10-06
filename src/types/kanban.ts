// カンバンのデータモデル。
// 子は親の ID を持つ（DB に移すときに外部キーとしてそのまま使える形）。
// 日時は localStorage に JSON で保存できるよう ISO 8601 文字列で持つ。

export type WorkspaceId = string
export type BoardId = string
export type ColumnId = string
export type TaskId = string

/** ISO 8601 形式の日時文字列（例: "2026-10-06T12:00:00.000Z"） */
export type IsoDateString = string

/**
 * ボードの入れ物。個人用とチーム用を区別しない
 * （個人用 = メンバーが自分だけのワークスペース）。
 */
export type Workspace = {
  id: WorkspaceId
  name: string
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export type Board = {
  id: BoardId
  workspaceId: WorkspaceId
  name: string
  /** ワークスペース内での並び順（小さいほど先） */
  position: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

/** ボード内の列（Todo / Doing / Done など） */
export type Column = {
  id: ColumnId
  boardId: BoardId
  name: string
  /** ボード内での並び順（小さいほど左） */
  position: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export type Task = {
  id: TaskId
  columnId: ColumnId
  title: string
  description: string
  /** 列内での並び順（小さいほど上） */
  position: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

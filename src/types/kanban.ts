// カンバンのデータモデル。
// 子は親の ID を持つ（DB に移すときに外部キーとしてそのまま使える形）。
// 日時は localStorage に JSON で保存できるよう ISO 8601 文字列で持つ。

export type WorkspaceId = string
export type BoardId = string
export type ColumnId = string
export type TaskId = string
export type LabelId = string

/** ISO 8601 形式の日時文字列（例: "2026-10-06T12:00:00.000Z"） */
export type IsoDateString = string

/**
 * 時刻を持たない日付（例: "2026-10-20"）。開始日・期限日に使う。
 * タイムゾーンで日付がずれないよう、日時ではなく日付だけを持つ。
 */
export type DateOnlyString = string

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
  /** 完了を表す列（未設定なら null）。ここにあるタスクは完了とみなす */
  doneColumnId: ColumnId | null
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
  /** 開始日（未設定なら null） */
  startDate: DateOnlyString | null
  /** 期限日（未設定なら null） */
  dueDate: DateOnlyString | null
  /** 付いているラベル */
  labelIds: LabelId[]
  /**
   * 親課題（なければ null）。親になれるのは同じボードの、親を持たないタスクだけ
   * （階層は1段まで）
   */
  parentId: TaskId | null
  /** 列内での並び順（小さいほど上） */
  position: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

/**
 * ラベルの色。任意の色コードではなく決まった色の名前で持ち、
 * 実際の色（ライト／ダークモードそれぞれ）は CSS 側で決める。
 */
export const LABEL_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'gray',
] as const
export type LabelColor = (typeof LABEL_COLORS)[number]

/** タスクに付けるラベル。ワークスペース全体で共有する */
export type Label = {
  id: LabelId
  workspaceId: WorkspaceId
  name: string
  color: LabelColor
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

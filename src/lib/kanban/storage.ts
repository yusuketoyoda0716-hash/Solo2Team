import { isDateOnly } from '@/lib/date.ts'
import {
  LABEL_COLORS,
  type Board,
  type LabelColor,
  type Task,
} from '@/types/kanban'
import type { KanbanState } from './state.ts'

export const STORAGE_KEY = 'solo2team:kanban'
/** 読めなかった保存データを、上書きされる前に退避しておくキー */
export const CORRUPT_BACKUP_KEY = `${STORAGE_KEY}:corrupt`

// データの形を変えたときは数字を上げ、古い形式からの変換を parseStoredData に足す。
// 履歴:
//   1 = フェーズ1
//   2 = タスクに開始日・期限日を追加
//   3 = ラベルを追加
//   4 = ボードに完了列を追加
//   5 = タスクに親課題を追加
const STORAGE_VERSION = 5

type StoredData = {
  version: typeof STORAGE_VERSION
  state: KanbanState
}

/**
 * 保存されている state を読み込む。
 * 保存がない・localStorage が使えない・形が壊れているときは null を返す。
 */
export function loadState(): KanbanState | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null) return null

  try {
    const state = parseStoredData(JSON.parse(raw))
    if (state) return state
  } catch {
    // JSON として読めない場合も下で同じように扱う
  }

  console.warn('保存データを読み込めなかったため、初期状態で始めます')
  try {
    localStorage.setItem(CORRUPT_BACKUP_KEY, raw)
  } catch {
    // 退避できなくても、アプリは初期状態で動かす
  }
  return null
}

export function saveState(state: KanbanState): void {
  const data: StoredData = { version: STORAGE_VERSION, state }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('データを保存できませんでした', error)
  }
}

// ---- 古い形式の型と、1つ新しい形式への変換 ----

type TaskV4 = Omit<Task, 'parentId'>
type KanbanStateV4 = Omit<KanbanState, 'tasks'> & {
  tasks: Record<string, TaskV4>
}
type BoardV3 = Omit<Board, 'doneColumnId'>
type KanbanStateV3 = Omit<KanbanStateV4, 'boards'> & {
  boards: Record<string, BoardV3>
}
type TaskV2 = Omit<TaskV4, 'labelIds'>
type KanbanStateV2 = Omit<KanbanStateV3, 'tasks' | 'labels'> & {
  tasks: Record<string, TaskV2>
}
type TaskV1 = Omit<TaskV2, 'startDate' | 'dueDate'>
type KanbanStateV1 = Omit<KanbanStateV2, 'tasks'> & {
  tasks: Record<string, TaskV1>
}

function mapValues<From, To>(
  record: Record<string, From>,
  convert: (value: From) => To,
): Record<string, To> {
  return Object.fromEntries(
    Object.entries(record).map(([id, value]) => [id, convert(value)]),
  )
}

/** v1 → v2：タスクに開始日・期限日（未設定）を足す */
const migrateV1ToV2 = (state: KanbanStateV1): KanbanStateV2 => ({
  ...state,
  tasks: mapValues(state.tasks, (t) => ({
    ...t,
    startDate: null,
    dueDate: null,
  })),
})

/** v2 → v3：ラベル一覧（空）と、タスクのラベル（なし）を足す */
const migrateV2ToV3 = (state: KanbanStateV2): KanbanStateV3 => ({
  ...state,
  tasks: mapValues(state.tasks, (t) => ({ ...t, labelIds: [] })),
  labels: {},
})

/** v3 → v4：ボードに完了列（未設定）を足す */
const migrateV3ToV4 = (state: KanbanStateV3): KanbanStateV4 => ({
  ...state,
  boards: mapValues(state.boards, (b) => ({ ...b, doneColumnId: null })),
})

/** v4 → v5：タスクに親課題（なし）を足す */
const migrateV4ToV5 = (state: KanbanStateV4): KanbanState => ({
  ...state,
  tasks: mapValues(state.tasks, (t) => ({ ...t, parentId: null })),
})

/** 保存形式のバージョンを見て、今の形の state にする（読めなければ null） */
function parseStoredData(data: unknown): KanbanState | null {
  if (!isObject(data)) return null
  const { state } = data
  switch (data.version) {
    case 5:
      return isStateShape<KanbanState>(state, schemaV5) ? state : null
    case 4:
      return isStateShape<KanbanStateV4>(state, schemaV4)
        ? migrateV4ToV5(state)
        : null
    case 3:
      return isStateShape<KanbanStateV3>(state, schemaV3)
        ? migrateV4ToV5(migrateV3ToV4(state))
        : null
    case 2:
      return isStateShape<KanbanStateV2>(state, schemaV2)
        ? migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(state)))
        : null
    case 1:
      return isStateShape<KanbanStateV1>(state, schemaV1)
        ? migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(state))))
        : null
    default:
      return null
  }
}

// ---- 読み込んだデータの形の確認 ----
// localStorage の中身は外から書き換えられることもあるので、型を信用せず確かめる。

type FieldType =
  | 'string'
  | 'number'
  | 'stringOrNull'
  | 'dateOrNull'
  | 'stringArray'
  | 'labelColor'
type Fields = Record<string, FieldType>

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLabelColor(value: unknown): value is LabelColor {
  return LABEL_COLORS.some((color) => color === value)
}

function matchesType(value: unknown, type: FieldType): boolean {
  switch (type) {
    case 'stringOrNull':
      return value === null || typeof value === 'string'
    case 'dateOrNull':
      return value === null || (typeof value === 'string' && isDateOnly(value))
    case 'stringArray':
      return Array.isArray(value) && value.every((v) => typeof v === 'string')
    case 'labelColor':
      return isLabelColor(value)
    default:
      return typeof value === type
  }
}

function hasFields(
  value: unknown,
  fields: Fields,
): value is Record<string, unknown> {
  return (
    isObject(value) &&
    Object.entries(fields).every(([key, type]) => matchesType(value[key], type))
  )
}

/** ID をキーにしたオブジェクトで、各値が形を満たし、キーと id が一致するか */
function isEntityRecord(value: unknown, fields: Fields): boolean {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([key, entity]) =>
        hasFields(entity, { id: 'string', ...fields }) && entity.id === key,
    )
  )
}

const timestamps = { createdAt: 'string', updatedAt: 'string' } as const

/** バージョンごとの、各データの項目 */
type Schema = {
  boardFields: Fields
  taskFields: Fields
  /** ラベル一覧があるか（v3 から） */
  hasLabels: boolean
}

const schemaV1: Schema = {
  boardFields: {
    workspaceId: 'string',
    name: 'string',
    position: 'number',
    ...timestamps,
  },
  taskFields: {
    columnId: 'string',
    title: 'string',
    description: 'string',
    position: 'number',
    ...timestamps,
  },
  hasLabels: false,
}

const schemaV2: Schema = {
  ...schemaV1,
  taskFields: {
    ...schemaV1.taskFields,
    startDate: 'dateOrNull',
    dueDate: 'dateOrNull',
  },
}

const schemaV3: Schema = {
  ...schemaV2,
  taskFields: { ...schemaV2.taskFields, labelIds: 'stringArray' },
  hasLabels: true,
}

const schemaV4: Schema = {
  ...schemaV3,
  boardFields: { ...schemaV3.boardFields, doneColumnId: 'stringOrNull' },
}

const schemaV5: Schema = {
  ...schemaV4,
  taskFields: { ...schemaV4.taskFields, parentId: 'stringOrNull' },
}

function isStateShape<S>(value: unknown, schema: Schema): value is S {
  return (
    isObject(value) &&
    hasFields(value.workspace, {
      id: 'string',
      name: 'string',
      ...timestamps,
    }) &&
    isEntityRecord(value.boards, schema.boardFields) &&
    isEntityRecord(value.columns, {
      boardId: 'string',
      name: 'string',
      position: 'number',
      ...timestamps,
    }) &&
    isEntityRecord(value.tasks, schema.taskFields) &&
    (!schema.hasLabels ||
      isEntityRecord(value.labels, {
        workspaceId: 'string',
        name: 'string',
        color: 'labelColor',
        ...timestamps,
      }))
  )
}

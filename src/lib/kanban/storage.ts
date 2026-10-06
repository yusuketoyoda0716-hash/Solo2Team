import { isDateOnly } from '@/lib/date.ts'
import type { Task } from '@/types/kanban'
import type { KanbanState } from './state.ts'

export const STORAGE_KEY = 'solo2team:kanban'
/** 読めなかった保存データを、上書きされる前に退避しておくキー */
export const CORRUPT_BACKUP_KEY = `${STORAGE_KEY}:corrupt`

// データの形を変えたときは数字を上げ、古い形式からの変換を parseStoredData に足す。
// 履歴: 1 = フェーズ1、2 = タスクに開始日・期限日を追加
const STORAGE_VERSION = 2

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

// ---- 古い形式からの変換 ----

type TaskV1 = Omit<Task, 'startDate' | 'dueDate'>
type KanbanStateV1 = Omit<KanbanState, 'tasks'> & {
  tasks: Record<string, TaskV1>
}

/** v1 → v2：タスクに開始日・期限日（未設定）を足す */
function migrateV1ToV2(state: KanbanStateV1): KanbanState {
  return {
    ...state,
    tasks: Object.fromEntries(
      Object.entries(state.tasks).map(([id, task]) => [
        id,
        { ...task, startDate: null, dueDate: null },
      ]),
    ),
  }
}

/** 保存形式のバージョンを見て、今の形の state にする（読めなければ null） */
function parseStoredData(data: unknown): KanbanState | null {
  if (!isObject(data)) return null
  if (data.version === 2 && isStateShape<KanbanState>(data.state, taskFieldsV2))
    return data.state
  if (
    data.version === 1 &&
    isStateShape<KanbanStateV1>(data.state, taskFieldsV1)
  )
    return migrateV1ToV2(data.state)
  return null
}

// ---- 読み込んだデータの形の確認 ----
// localStorage の中身は外から書き換えられることもあるので、型を信用せず確かめる。

type FieldType = 'string' | 'number' | 'dateOrNull'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function matchesType(value: unknown, type: FieldType): boolean {
  if (type === 'dateOrNull') {
    return value === null || (typeof value === 'string' && isDateOnly(value))
  }
  return typeof value === type
}

function hasFields(
  value: unknown,
  fields: Record<string, FieldType>,
): value is Record<string, unknown> {
  return (
    isObject(value) &&
    Object.entries(fields).every(([key, type]) => matchesType(value[key], type))
  )
}

/** ID をキーにしたオブジェクトで、各値が形を満たし、キーと id が一致するか */
function isEntityRecord(
  value: unknown,
  fields: Record<string, FieldType>,
): boolean {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([key, entity]) =>
        hasFields(entity, { id: 'string', ...fields }) && entity.id === key,
    )
  )
}

const timestamps = { createdAt: 'string', updatedAt: 'string' } as const

const taskFieldsV1: Record<string, FieldType> = {
  columnId: 'string',
  title: 'string',
  description: 'string',
  position: 'number',
  ...timestamps,
}

const taskFieldsV2: Record<string, FieldType> = {
  ...taskFieldsV1,
  startDate: 'dateOrNull',
  dueDate: 'dateOrNull',
}

/** state 全体の形を確かめる。タスクの項目はバージョンごとに渡す */
function isStateShape<S>(
  value: unknown,
  taskFields: Record<string, FieldType>,
): value is S {
  return (
    isObject(value) &&
    hasFields(value.workspace, {
      id: 'string',
      name: 'string',
      ...timestamps,
    }) &&
    isEntityRecord(value.boards, {
      workspaceId: 'string',
      name: 'string',
      position: 'number',
      ...timestamps,
    }) &&
    isEntityRecord(value.columns, {
      boardId: 'string',
      name: 'string',
      position: 'number',
      ...timestamps,
    }) &&
    isEntityRecord(value.tasks, taskFields)
  )
}

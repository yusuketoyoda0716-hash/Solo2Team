import type { KanbanState } from './state.ts'

export const STORAGE_KEY = 'solo2team:kanban'
/** 読めなかった保存データを、上書きされる前に退避しておくキー */
export const CORRUPT_BACKUP_KEY = `${STORAGE_KEY}:corrupt`

// データの形を変えたときは数字を上げ、古い形式からの変換を loadState に足す。
const STORAGE_VERSION = 1

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
    const data: unknown = JSON.parse(raw)
    if (isStoredData(data)) return data.state
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

// ---- 読み込んだデータの形の確認 ----
// localStorage の中身は外から書き換えられることもあるので、型を信用せず確かめる。

type FieldType = 'string' | 'number'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasFields(
  value: unknown,
  fields: Record<string, FieldType>,
): value is Record<string, unknown> {
  return (
    isObject(value) &&
    Object.entries(fields).every(([key, type]) => typeof value[key] === type)
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

function isKanbanState(value: unknown): value is KanbanState {
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
    isEntityRecord(value.tasks, {
      columnId: 'string',
      title: 'string',
      description: 'string',
      position: 'number',
      ...timestamps,
    })
  )
}

function isStoredData(value: unknown): value is StoredData {
  return (
    isObject(value) &&
    value.version === STORAGE_VERSION &&
    isKanbanState(value.state)
  )
}

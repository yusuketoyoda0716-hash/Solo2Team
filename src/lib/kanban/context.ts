import { createContext, type Dispatch } from 'react'
import type { KanbanAction } from './actions.ts'
import type { KanbanState } from './state.ts'

// state と dispatch を別の Context にする。
// 操作だけするコンポーネントが、データの変更で再描画されないようにするため。
export const KanbanStateContext = createContext<KanbanState | null>(null)
export const KanbanDispatchContext =
  createContext<Dispatch<KanbanAction> | null>(null)

import { useContext, type Dispatch } from 'react'
import type { KanbanAction } from './actions.ts'
import { KanbanDispatchContext, KanbanStateContext } from './context.ts'
import type { KanbanState } from './state.ts'

export function useKanbanState(): KanbanState {
  const state = useContext(KanbanStateContext)
  if (!state) {
    throw new Error('useKanbanState は KanbanProvider の中で使う')
  }
  return state
}

export function useKanbanDispatch(): Dispatch<KanbanAction> {
  const dispatch = useContext(KanbanDispatchContext)
  if (!dispatch) {
    throw new Error('useKanbanDispatch は KanbanProvider の中で使う')
  }
  return dispatch
}

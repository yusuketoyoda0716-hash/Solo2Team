import { useEffect, useReducer, type ReactNode } from 'react'
import { KanbanDispatchContext, KanbanStateContext } from './context.ts'
import { kanbanReducer } from './reducer.ts'
import { createInitialState } from './state.ts'
import { loadState, saveState } from './storage.ts'

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    kanbanReducer,
    undefined,
    () => loadState() ?? createInitialState(new Date().toISOString()),
  )

  // state が変わるたびに保存する
  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <KanbanStateContext value={state}>
      <KanbanDispatchContext value={dispatch}>{children}</KanbanDispatchContext>
    </KanbanStateContext>
  )
}

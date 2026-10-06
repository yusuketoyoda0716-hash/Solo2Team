import { useReducer, type ReactNode } from 'react'
import { KanbanDispatchContext, KanbanStateContext } from './context.ts'
import { kanbanReducer } from './reducer.ts'
import { createInitialState } from './state.ts'

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(kanbanReducer, undefined, () =>
    createInitialState(new Date().toISOString()),
  )

  return (
    <KanbanStateContext value={state}>
      <KanbanDispatchContext value={dispatch}>{children}</KanbanDispatchContext>
    </KanbanStateContext>
  )
}

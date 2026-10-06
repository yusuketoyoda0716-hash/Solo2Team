import { useState } from 'react'
import { BoardList } from '@/features/board/BoardList.tsx'
import { BoardView, type Highlight } from '@/features/board/BoardView.tsx'
import { LabelManager } from '@/features/label/LabelManager.tsx'
import { TaskListView } from '@/features/list/TaskListView.tsx'
import { useKanbanState } from '@/lib/kanban/hooks.ts'
import { boardIdOfTask, selectBoards } from '@/lib/kanban/selectors.ts'
import type { BoardId, Task } from '@/types/kanban'
import styles from './App.module.css'

type View = 'board' | 'list'

function App() {
  const state = useKanbanState()
  const boards = selectBoards(state)
  const [view, setView] = useState<View>('board')
  const [selectedBoardId, setSelectedBoardId] = useState<BoardId | null>(null)
  const [highlight, setHighlight] = useState<Highlight | null>(null)

  // 未選択のとき・選択中のボードが削除されたときは先頭のボードを開く
  const selectedBoard =
    boards.find((b) => b.id === selectedBoardId) ?? boards[0] ?? null

  const showView = (next: View) => {
    setView(next)
    setHighlight(null)
  }

  const openBoard = (id: BoardId) => {
    setSelectedBoardId(id)
    showView('board')
  }

  // 課題一覧の行から、そのタスクのボードを開いてカードを目立たせる
  const openTask = (task: Task) => {
    const boardId = boardIdOfTask(state, task)
    if (!boardId) return
    setSelectedBoardId(boardId)
    setView('board')
    setHighlight((prev) => ({ taskId: task.id, seq: (prev?.seq ?? 0) + 1 }))
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Solo2Team</h1>
        <span className={styles.workspace}>{state.workspace.name}</span>
        <nav className={styles.tabs} aria-label="表示の切り替え">
          <button
            type="button"
            className={styles.tab}
            aria-current={view === 'board' ? 'page' : undefined}
            onClick={() => showView('board')}
          >
            ボード
          </button>
          <button
            type="button"
            className={styles.tab}
            aria-current={view === 'list' ? 'page' : undefined}
            onClick={() => showView('list')}
          >
            課題一覧
          </button>
        </nav>
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <BoardList
            boards={boards}
            selectedBoardId={
              view === 'board' ? (selectedBoard?.id ?? null) : null
            }
            onSelect={openBoard}
          />
          <LabelManager />
        </aside>
        <main className={styles.main}>
          {view === 'list' ? (
            <TaskListView onOpenTask={openTask} />
          ) : selectedBoard ? (
            <BoardView board={selectedBoard} highlight={highlight} />
          ) : (
            <p className={styles.empty}>
              左の入力欄から、最初のボードを作ってください。
            </p>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

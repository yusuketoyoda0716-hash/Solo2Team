import { useState } from 'react'
import { BoardList } from '@/features/board/BoardList.tsx'
import { BoardView } from '@/features/board/BoardView.tsx'
import { LabelManager } from '@/features/label/LabelManager.tsx'
import { useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectBoards } from '@/lib/kanban/selectors.ts'
import type { BoardId } from '@/types/kanban'
import styles from './App.module.css'

function App() {
  const state = useKanbanState()
  const boards = selectBoards(state)
  const [selectedBoardId, setSelectedBoardId] = useState<BoardId | null>(null)

  // 未選択のとき・選択中のボードが削除されたときは先頭のボードを開く
  const selectedBoard =
    boards.find((b) => b.id === selectedBoardId) ?? boards[0] ?? null

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Solo2Team</h1>
        <span className={styles.workspace}>{state.workspace.name}</span>
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <BoardList
            boards={boards}
            selectedBoardId={selectedBoard?.id ?? null}
            onSelect={setSelectedBoardId}
          />
          <LabelManager />
        </aside>
        <main className={styles.main}>
          {selectedBoard ? (
            <BoardView board={selectedBoard} />
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

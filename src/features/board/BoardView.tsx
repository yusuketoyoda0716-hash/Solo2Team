import { TextInputForm } from '@/components/TextInputForm.tsx'
import { addColumn } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch, useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectColumns } from '@/lib/kanban/selectors.ts'
import type { Board } from '@/types/kanban'
import styles from './BoardView.module.css'
import { ColumnView } from './ColumnView.tsx'

type Props = {
  board: Board
}

/** 開いているボードの表示 */
export function BoardView({ board }: Props) {
  const state = useKanbanState()
  const dispatch = useKanbanDispatch()
  const columns = selectColumns(state, board.id)

  return (
    <section className={styles.boardView} aria-labelledby="board-title">
      <h2 id="board-title" className={styles.title}>
        {board.name}
      </h2>
      <div className={styles.columns}>
        {columns.map((column) => (
          <ColumnView key={column.id} column={column} />
        ))}
        <div className={styles.addColumn}>
          <TextInputForm
            label="新しい列名"
            placeholder="新しい列"
            submitLabel="列を追加"
            onSubmit={(name) => dispatch(addColumn(board.id, name))}
          />
        </div>
      </div>
    </section>
  )
}

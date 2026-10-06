import type { Board } from '@/types/kanban'
import styles from './BoardView.module.css'

type Props = {
  board: Board
}

/** 開いているボードの表示 */
export function BoardView({ board }: Props) {
  return (
    <section className={styles.boardView} aria-labelledby="board-title">
      <h2 id="board-title" className={styles.title}>
        {board.name}
      </h2>
      <p className={styles.empty}>列はまだありません</p>
    </section>
  )
}

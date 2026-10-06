import { closestCorners, DndContext, DragOverlay } from '@dnd-kit/core'
import { TextInputForm } from '@/components/TextInputForm.tsx'
import { TaskCardPreview } from '@/features/task/TaskCardPreview.tsx'
import { addColumn } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch, useKanbanState } from '@/lib/kanban/hooks.ts'
import { selectColumns } from '@/lib/kanban/selectors.ts'
import type { Board, TaskId } from '@/types/kanban'
import styles from './BoardView.module.css'
import { ColumnView } from './ColumnView.tsx'
import { useTaskDragAndDrop } from './useTaskDragAndDrop.ts'

/** 課題一覧から開いたタスク。seq は同じタスクをもう一度開いたときにも反応させるため */
export type Highlight = { taskId: TaskId; seq: number }

type Props = {
  board: Board
  /** 目立たせるタスク（課題一覧から開いたとき） */
  highlight?: Highlight | null
}

/** 開いているボードの表示 */
export function BoardView({ board, highlight = null }: Props) {
  const state = useKanbanState()
  const dispatch = useKanbanDispatch()
  const columns = selectColumns(state, board.id)
  const { sensors, taskIdsByColumn, activeTask, accessibility, handlers } =
    useTaskDragAndDrop(columns)

  return (
    <section className={styles.boardView} aria-labelledby="board-title">
      <h2 id="board-title" className={styles.title}>
        {board.name}
      </h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={accessibility}
        {...handlers}
      >
        <div className={styles.columns}>
          {columns.map((column) => (
            <ColumnView
              key={column.id}
              column={column}
              tasks={(taskIdsByColumn[column.id] ?? []).map(
                (id) => state.tasks[id],
              )}
              highlight={highlight}
            />
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
        <DragOverlay>
          {activeTask && <TaskCardPreview task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </section>
  )
}

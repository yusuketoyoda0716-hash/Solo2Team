import { useState } from 'react'
import { TextInputForm } from '@/components/TextInputForm.tsx'
import { addBoard, deleteBoard, renameBoard } from '@/lib/kanban/actions.ts'
import { useKanbanDispatch } from '@/lib/kanban/hooks.ts'
import type { Board, BoardId } from '@/types/kanban'
import styles from './BoardList.module.css'

type Props = {
  boards: Board[]
  selectedBoardId: BoardId | null
  onSelect: (id: BoardId) => void
}

export function BoardList({ boards, selectedBoardId, onSelect }: Props) {
  const dispatch = useKanbanDispatch()

  return (
    <nav className={styles.boardList} aria-label="ボード一覧">
      <h2 className={styles.heading}>ボード</h2>
      {boards.length === 0 ? (
        <p className={styles.empty}>ボードはまだありません</p>
      ) : (
        <ul className={styles.list}>
          {boards.map((board) => (
            <BoardListItem
              key={board.id}
              board={board}
              isSelected={board.id === selectedBoardId}
              onSelect={() => onSelect(board.id)}
            />
          ))}
        </ul>
      )}
      <TextInputForm
        label="新しいボード名"
        placeholder="新しいボード"
        submitLabel="追加"
        onSubmit={(name) => {
          const action = addBoard(name)
          dispatch(action)
          // 追加したボードをそのまま開く
          onSelect(action.id)
        }}
      />
    </nav>
  )
}

type ItemProps = {
  board: Board
  isSelected: boolean
  onSelect: () => void
}

function BoardListItem({ board, isSelected, onSelect }: ItemProps) {
  const dispatch = useKanbanDispatch()
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <li className={styles.item}>
        <TextInputForm
          label="ボード名"
          submitLabel="保存"
          initialValue={board.name}
          autoFocus
          onSubmit={(name) => {
            dispatch(renameBoard(board.id, name))
            setIsEditing(false)
          }}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    )
  }

  const handleDelete = () => {
    const ok = window.confirm(
      `ボード「${board.name}」を削除しますか？\n中の列とタスクもすべて削除されます。`,
    )
    if (ok) dispatch(deleteBoard(board.id))
  }

  return (
    <li
      className={isSelected ? `${styles.item} ${styles.selected}` : styles.item}
    >
      <button
        type="button"
        className={styles.name}
        aria-current={isSelected ? 'page' : undefined}
        onClick={onSelect}
      >
        {board.name}
      </button>
      <button
        type="button"
        aria-label={`ボード「${board.name}」の名前を変更`}
        onClick={() => setIsEditing(true)}
      >
        名前変更
      </button>
      <button
        type="button"
        aria-label={`ボード「${board.name}」を削除`}
        onClick={handleDelete}
      >
        削除
      </button>
    </li>
  )
}

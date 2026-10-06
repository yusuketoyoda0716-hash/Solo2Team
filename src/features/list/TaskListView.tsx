import { useState } from 'react'
import { LabelChip } from '@/features/label/LabelChip.tsx'
import {
  formatDateTime,
  formatShortDate,
  isOverdue,
  todayDateOnly,
} from '@/lib/date.ts'
import { useKanbanState } from '@/lib/kanban/hooks.ts'
import type { Task } from '@/types/kanban'
import {
  DEFAULT_SORT,
  selectTaskRows,
  sortTaskRows,
  type SortKey,
  type SortOrder,
} from './taskRows.ts'
import styles from './TaskListView.module.css'

type Props = {
  /** 行のタスクをボードで開く */
  onOpenTask: (task: Task) => void
}

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'title', label: '件名' },
  { key: 'board', label: 'ボード' },
  { key: 'status', label: '状態' },
]
const SORTABLE_DATE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'startDate', label: '開始日' },
  { key: 'dueDate', label: '期限日' },
]

/** 全ボードのタスクを表で見る画面（Backlog の課題一覧のイメージ） */
export function TaskListView({ onOpenTask }: Props) {
  const state = useKanbanState()
  const [order, setOrder] = useState<SortOrder>(DEFAULT_SORT)
  const rows = sortTaskRows(selectTaskRows(state), order)
  const today = todayDateOnly()

  // 同じ見出しをもう一度押すと昇順・降順を切り替える
  const toggleSort = (key: SortKey) =>
    setOrder((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'updatedAt' ? 'desc' : 'asc' },
    )

  const header = (key: SortKey, label: string) => {
    const active = order.key === key
    return (
      <th
        key={key}
        scope="col"
        aria-sort={
          active
            ? order.direction === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
      >
        <button
          type="button"
          className={styles.sortButton}
          onClick={() => toggleSort(key)}
        >
          {label}
          <span aria-hidden="true" className={styles.sortMark}>
            {active ? (order.direction === 'asc' ? '▲' : '▼') : ''}
          </span>
        </button>
      </th>
    )
  }

  return (
    <section className={styles.listView} aria-labelledby="list-title">
      <div className={styles.titleRow}>
        <h2 id="list-title" className={styles.title}>
          課題一覧
        </h2>
        <span className={styles.count}>{rows.length} 件</span>
      </div>
      {rows.length === 0 ? (
        <p className={styles.empty}>タスクはまだありません</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {SORTABLE_COLUMNS.map((c) => header(c.key, c.label))}
                <th scope="col">ラベル</th>
                {SORTABLE_DATE_COLUMNS.map((c) => header(c.key, c.label))}
                <th scope="col">親課題</th>
                {header('updatedAt', '更新日時')}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ task, board, column, done, parent, labels }) => {
                const overdue = !done && isOverdue(task.dueDate, today)
                return (
                  <tr key={task.id}>
                    <td>
                      <button
                        type="button"
                        className={styles.titleButton}
                        aria-label={`タスク「${task.title}」をボードで開く`}
                        onClick={() => onOpenTask(task)}
                      >
                        {task.title}
                      </button>
                    </td>
                    <td>{board.name}</td>
                    <td>
                      {column.name}
                      {done && <span className={styles.doneMark}>完了</span>}
                    </td>
                    <td>
                      <span className={styles.labels}>
                        {labels.map((l) => (
                          <LabelChip key={l.id} label={l} />
                        ))}
                      </span>
                    </td>
                    <td>
                      {task.startDate && formatShortDate(task.startDate, today)}
                    </td>
                    <td className={overdue ? styles.overdue : undefined}>
                      {task.dueDate && formatShortDate(task.dueDate, today)}
                      {overdue && (
                        <span className={styles.badge}>期限切れ</span>
                      )}
                    </td>
                    <td>{parent?.title}</td>
                    <td className={styles.muted}>
                      {formatDateTime(task.updatedAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

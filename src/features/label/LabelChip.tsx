import type { Label } from '@/types/kanban'
import styles from './LabelChip.module.css'

type Props = {
  label: Pick<Label, 'name' | 'color'>
}

/** 色つきのラベル表示。色は CSS 変数（--label-<色>-bg / -fg）から取る */
export function LabelChip({ label }: Props) {
  return (
    <span
      className={styles.chip}
      style={{
        background: `var(--label-${label.color}-bg)`,
        color: `var(--label-${label.color}-fg)`,
      }}
    >
      {label.name}
    </span>
  )
}

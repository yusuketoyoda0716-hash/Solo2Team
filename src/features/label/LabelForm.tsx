import { useId, useState } from 'react'
import { LABEL_COLORS, type LabelColor } from '@/types/kanban'
import { LABEL_COLOR_NAMES } from './labelColors.ts'
import styles from './LabelForm.module.css'

type Props = {
  /** 名前の入力欄の読み上げ用ラベル */
  nameLabel: string
  submitLabel: string
  /** 名前は前後の空白を取り除いて渡す */
  onSubmit: (name: string, color: LabelColor) => void
  /** 同じ名前のラベルがすでにあるか */
  isNameTaken: (name: string) => boolean
  initialName?: string
  initialColor?: LabelColor
  onCancel?: () => void
  autoFocus?: boolean
}

/** ラベルの名前と色を入力するフォーム。追加と編集の両方で使う */
export function LabelForm({
  nameLabel,
  submitLabel,
  onSubmit,
  isNameTaken,
  initialName = '',
  initialColor = 'blue',
  onCancel,
  autoFocus = false,
}: Props) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState<LabelColor>(initialColor)
  const errorId = useId()

  const trimmed = name.trim()
  const taken = trimmed !== '' && isNameTaken(trimmed)
  const canSubmit = trimmed !== '' && !taken

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        onSubmit(trimmed, color)
        setName(initialName)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel?.()
      }}
    >
      <div className={styles.row}>
        <input
          className={styles.name}
          aria-label={nameLabel}
          placeholder="新しいラベル"
          value={name}
          autoFocus={autoFocus}
          aria-invalid={taken}
          aria-describedby={taken ? errorId : undefined}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          aria-label="ラベルの色"
          value={color}
          onChange={(e) => {
            const next = LABEL_COLORS.find((c) => c === e.target.value)
            if (next) setColor(next)
          }}
        >
          {LABEL_COLORS.map((c) => (
            <option key={c} value={c}>
              {LABEL_COLOR_NAMES[c]}
            </option>
          ))}
        </select>
      </div>
      {taken && (
        <p id={errorId} className={styles.error} role="alert">
          同じ名前のラベルがあります
        </p>
      )}
      <div className={styles.row}>
        <button type="submit" disabled={!canSubmit}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            キャンセル
          </button>
        )}
      </div>
    </form>
  )
}

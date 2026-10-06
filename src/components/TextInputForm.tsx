import { useState } from 'react'
import styles from './TextInputForm.module.css'

type Props = {
  /** 入力欄の読み上げ用ラベル */
  label: string
  submitLabel: string
  /** 前後の空白を取り除いた値を受け取る（空のときは呼ばれない） */
  onSubmit: (value: string) => void
  initialValue?: string
  placeholder?: string
  /** 渡したときだけキャンセルボタンを出し、Esc キーでも呼ぶ */
  onCancel?: () => void
  autoFocus?: boolean
}

/** 1行の入力欄と送信ボタン。追加と名前変更の両方で使う */
export function TextInputForm({
  label,
  submitLabel,
  onSubmit,
  initialValue = '',
  placeholder,
  onCancel,
  autoFocus = false,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const trimmed = value.trim()

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        if (!trimmed) return
        onSubmit(trimmed)
        setValue(initialValue)
      }}
    >
      <input
        className={styles.input}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel?.()
        }}
      />
      <button type="submit" disabled={!trimmed}>
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
      )}
    </form>
  )
}

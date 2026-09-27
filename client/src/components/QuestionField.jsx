import { MenuItem, TextField } from '@mui/material'

// 質問データ（profileQuestions.js の1項目）を受け取り、種類に応じた入力欄を表示する
export default function QuestionField({ question, value, onChange }) {
  const { label, type, options, min, max } = question

  if (type === 'select') {
    return (
      <TextField
        select
        fullWidth
        label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    )
  }

  if (type === 'number') {
    return (
      <TextField
        type="number"
        fullWidth
        label={label}
        value={value ?? ''}
        slotProps={{ htmlInput: { min, max } }}
        // 空欄なら null、それ以外は数値に変換して保存する
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    )
  }

  return (
    <TextField fullWidth label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  )
}

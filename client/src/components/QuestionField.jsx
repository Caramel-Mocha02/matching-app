import { Autocomplete, Box, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material'

// 数値入力欄の値を変換する（空欄なら null、それ以外は数値）
const toNumber = (text) => (text === '' ? null : Number(text))

// 質問データ（data/ フォルダの1項目）を受け取り、種類に応じた入力欄を表示する
export default function QuestionField({ question, value, onChange }) {
  const { label, type, options, min, max, unit } = question

  if (type === 'select') {
    return (
      <TextField select fullWidth label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
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
        onChange={(e) => onChange(toNumber(e.target.value))}
      />
    )
  }

  // 複数選択。value は選んだ値の配列（例：['no', 'sometimes']）
  if (type === 'multiselect') {
    const selected = value ?? []

    // 選択肢が多い場合（都道府県など）は、検索できる入力欄にする
    if (options.length > 10) {
      return (
        <Autocomplete
          multiple
          options={options}
          getOptionLabel={(opt) => opt.label}
          value={options.filter((opt) => selected.includes(opt.value))}
          onChange={(_e, newOptions) => onChange(newOptions.map((opt) => opt.value))}
          renderInput={(params) => <TextField {...params} label={label} placeholder="選択してください" />}
        />
      )
    }

    // 選択肢が少ない場合は、タップで切り替えるチップにする
    const toggle = (v) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
          {options.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              color={selected.includes(opt.value) ? 'primary' : 'default'}
              variant={selected.includes(opt.value) ? 'filled' : 'outlined'}
              onClick={() => toggle(opt.value)}
            />
          ))}
        </Stack>
      </Box>
    )
  }

  // 範囲入力。value は { min, max }（例：{ min: 25, max: 35 }）
  if (type === 'range') {
    const range = value ?? {}
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="number"
            size="small"
            label={`下限（${unit}）`}
            value={range.min ?? ''}
            slotProps={{ htmlInput: { min, max } }}
            onChange={(e) => onChange({ ...range, min: toNumber(e.target.value) })}
          />
          <Typography>〜</Typography>
          <TextField
            type="number"
            size="small"
            label={`上限（${unit}）`}
            value={range.max ?? ''}
            slotProps={{ htmlInput: { min, max } }}
            onChange={(e) => onChange({ ...range, max: toNumber(e.target.value) })}
          />
        </Stack>
      </Box>
    )
  }

  return <TextField fullWidth label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
}

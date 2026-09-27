import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material'

// 入力ステップの一覧。各ステップの中身（質問フォーム）は Phase 3〜5 で作る
const STEPS = ['基本情報', '結婚条件', '外見の好み', '性格・内面', '会話', '生活価値観', '確認']

export default function DiagnosisPage() {
  const [step, setStep] = useState(0) // 今何番目のステップか（0始まり）
  const navigate = useNavigate()

  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (isLast) navigate('/matches')
    else setStep(step + 1)
  }

  return (
    <Stack spacing={3}>
      {/* 進捗表示：「3 / 7」とプログレスバー */}
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ステップ {step + 1} / {STEPS.length}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {STEPS[step]}
          </Typography>
          <Typography color="text.secondary">ここに「{STEPS[step]}」の質問が入ります。</Typography>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="space-between">
        <Button onClick={() => setStep(step - 1)} disabled={step === 0}>
          戻る
        </Button>
        <Button variant="contained" onClick={handleNext}>
          {isLast ? 'マッチングする' : '次へ'}
        </Button>
      </Stack>
    </Stack>
  )
}

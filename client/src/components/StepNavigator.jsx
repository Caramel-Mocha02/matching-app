import { useEffect, useRef } from 'react'
import { Box, ButtonBase, LinearProgress, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { STEPS } from '../data/steps.js'
import { countAll, countStep, isStepComplete } from '../lib/diagnosisProgress.js'

// ステップごとの状態の文字（「6/8」「任意」など）
function stepStatus(data, s) {
  if (!s.questions) return ''
  if (s.optional) return '任意'
  const { answered, total } = countStep(data, s)
  return `${answered}/${total}`
}

// 全体の進み具合（回答した項目数で表示する）
function OverallProgress({ data }) {
  const { answered, total } = countAll(data)
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5, gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>進み具合</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {answered} / {total} 項目
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={total ? (answered / total) * 100 : 0} sx={{ height: 8, borderRadius: 4 }} />
    </Box>
  )
}

// 診断ステップの一覧。押したステップへ移動できる。
//   compact = true：スマホ向け（番号付きのチップを横スクロール）
//   compact = false：横長の画面向け（縦に全ステップを並べる）
export default function StepNavigator({ data, current, onSelect, compact }) {
  const currentRef = useRef(null)

  // スマホ表示では、今のステップが見える位置まで横スクロールする
  useEffect(() => {
    if (compact) currentRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [compact, current])

  const items = STEPS.map((s, i) => {
    const active = i === current
    const done = s.questions && isStepComplete(data, s) && !s.optional
    return { s, i, active, done, status: stepStatus(data, s) }
  })

  if (compact) {
    return (
      <Stack spacing={1.5}>
        <OverallProgress data={data} />
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mx: -2, px: 2 }}>
          {items.map(({ s, i, active, done, status }) => (
            <ButtonBase
              key={s.title}
              ref={active ? currentRef : null}
              onClick={() => onSelect(i)}
              sx={{
                flexShrink: 0,
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                border: 1,
                borderColor: active ? 'primary.main' : 'divider',
                bgcolor: active ? 'primary.main' : done ? '#fdeef2' : 'background.paper',
                color: active ? 'primary.contrastText' : 'text.primary',
                fontSize: 13,
                gap: 0.5,
              }}
            >
              {done && !active ? <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} /> : `${i + 1}.`}
              {s.title}
              {status && <Box component="span" sx={{ opacity: 0.75 }}>（{status}）</Box>}
            </ButtonBase>
          ))}
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <OverallProgress data={data} />
      <Stack spacing={0.5}>
        {items.map(({ s, i, active, done, status }) => (
          <ButtonBase
            key={s.title}
            onClick={() => onSelect(i)}
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              px: 1.5,
              py: 1,
              borderRadius: 2,
              bgcolor: active ? '#fdeef2' : 'transparent',
              borderLeft: 3,
              borderColor: active ? 'primary.main' : 'transparent',
              '&:hover': { bgcolor: '#fdf4f6' },
            }}
          >
            <Box sx={{ width: 28, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {done ? (
                <CheckCircleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              ) : (
                <Typography variant="body2" color="text.secondary">{i + 1}</Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: active ? 700 : 400 }}>{s.title}</Typography>
            <Typography variant="caption" color="text.secondary">{status}</Typography>
          </ButtonBase>
        ))}
      </Stack>
    </Stack>
  )
}

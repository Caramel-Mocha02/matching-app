import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, LinearProgress, Stack, Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchDiagnosis, saveToTable } from '../lib/diagnosis.js'
import QuestionField from '../components/QuestionField.jsx'
import { STEPS } from '../data/steps.js'

// 未回答かどうか（年収の「0」は回答済みとして扱うため、null・空文字・空の配列だけを未回答にする）
const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

// そのステップの回答を取り出す。group があれば JSON 列の中身、無ければテーブルの行そのもの
const getStepValues = (data, step) => {
  const row = data[step.table] ?? {}
  return step.group ? row[step.group] ?? {} : row
}

export default function DiagnosisPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 今何番目のステップか（0始まり）
  // 全テーブルの回答をまとめて持つ → { profiles: {...}, preferences: {...} }
  const [data, setData] = useState({ profiles: {}, preferences: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ステップを切り替えたら、画面の一番上に戻す（質問が多く縦に長いため）
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  // 画面を開いたとき、保存済みの回答があれば読み込んで入力欄に反映する
  useEffect(() => {
    fetchDiagnosis(user.id)
      .then(setData)
      .catch(() => setError('データの読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [user.id])

  const current = STEPS[step]
  // 性別で出し分ける質問（ヒゲなど）：自分についての質問なら自分の性別、相手についてなら相手の性別で判定
  const myGender = data.profiles.gender
  const targetGender = current.about === 'partner' ? (myGender === 'male' ? 'female' : 'male') : myGender
  const questions = (current.questions ?? []).filter((q) => !q.onlyGender || q.onlyGender === targetGender)
  const values = getStepValues(data, current)
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100
  const allAnswered = current.optional || questions.every((q) => !isEmpty(values[q.key]))
  // 範囲入力で「下限 > 上限」になっていないか
  const hasInvalidRange = questions.some(
    (q) => q.type === 'range' && values[q.key]?.min != null && values[q.key]?.max != null && values[q.key].min > values[q.key].max,
  )

  // 1項目の回答を更新する（group がある場合は JSON 列の中を更新）
  const handleChange = (key, value) => {
    setData((prev) => {
      const row = prev[current.table] ?? {}
      const newRow = current.group
        ? { ...row, [current.group]: { ...row[current.group], [key]: value } }
        : { ...row, [key]: value }
      return { ...prev, [current.table]: newRow }
    })
  }

  const handleNext = async () => {
    setError('')

    // このステップに質問があれば、その回答を保存する
    if (questions.length > 0) {
      const payload = current.group
        ? { [current.group]: values } // JSON 列ごと保存
        : Object.fromEntries(questions.map((q) => [q.key, values[q.key]])) // 1項目ずつ列に保存
      setSaving(true)
      try {
        await saveToTable(current.table, user.id, payload)
      } catch {
        setError('保存に失敗しました。時間をおいてもう一度お試しください。')
        return
      } finally {
        setSaving(false)
      }
    }

    if (isLast) navigate('/matches')
    else setStep(step + 1)
  }

  if (loading) {
    return (
      <Box textAlign="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      {/* 進捗表示：「3 / 8」とプログレスバー */}
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ステップ {step + 1} / {STEPS.length}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {current.title}
          </Typography>
          {current.description && (
            <Typography variant="body2" color="text.secondary">{current.description}</Typography>
          )}

          {questions.length > 0 ? (
            <Stack spacing={3} sx={{ mt: 3 }}>
              {questions.map((q) => (
                <QuestionField
                  key={q.key}
                  question={q}
                  value={values[q.key]}
                  onChange={(value) => handleChange(q.key, value)}
                />
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">ここに「{current.title}」の質問が入ります。</Typography>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}
      {hasInvalidRange && <Alert severity="warning">下限が上限より大きくなっています。</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button onClick={() => setStep(step - 1)} disabled={step === 0 || saving}>
          戻る
        </Button>
        <Stack direction="row" spacing={2} alignItems="center">
          {!allAnswered && (
            <Typography variant="body2" color="text.secondary">すべての項目を入力してください</Typography>
          )}
          <Button variant="contained" onClick={handleNext} disabled={!allAnswered || hasInvalidRange || saving}>
            {saving ? '保存中…' : isLast ? 'マッチングする' : '次へ'}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

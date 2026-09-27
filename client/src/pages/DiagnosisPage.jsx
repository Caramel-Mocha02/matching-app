import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, LinearProgress, Stack, Typography,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchProfile, saveProfile } from '../lib/profile.js'
import QuestionField from '../components/QuestionField.jsx'
import { BASIC_QUESTIONS, MARRIAGE_QUESTIONS } from '../data/profileQuestions.js'

// 入力ステップの一覧。questions があるステップは入力フォームを表示する
// （外見・性格などの中身は Phase 4〜5 で追加する）
const STEPS = [
  { title: '基本情報', questions: BASIC_QUESTIONS },
  { title: '結婚条件', questions: MARRIAGE_QUESTIONS },
  { title: '外見の好み' },
  { title: '性格・内面' },
  { title: '会話' },
  { title: '生活価値観' },
  { title: '確認' },
]

// 未回答かどうか（年収の「0」は回答済みとして扱うため、null と空文字だけを未回答にする）
const isEmpty = (v) => v === null || v === undefined || v === ''

export default function DiagnosisPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 今何番目のステップか（0始まり）
  const [answers, setAnswers] = useState({}) // 全ステップの回答をまとめて持つ
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 画面を開いたとき、保存済みのプロフィールがあれば読み込んで入力欄に反映する
  useEffect(() => {
    fetchProfile(user.id)
      .then((profile) => setAnswers(profile ?? {}))
      .catch(() => setError('プロフィールの読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [user.id])

  const current = STEPS[step]
  const questions = current.questions ?? []
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100
  const allAnswered = questions.every((q) => !isEmpty(answers[q.key]))

  const handleChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleNext = async () => {
    setError('')

    // このステップに質問があれば、その回答だけを取り出して保存する
    if (questions.length > 0) {
      const values = Object.fromEntries(questions.map((q) => [q.key, answers[q.key]]))
      setSaving(true)
      try {
        await saveProfile(user.id, values)
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
            {current.title}
          </Typography>

          {questions.length > 0 ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {questions.map((q) => (
                <QuestionField
                  key={q.key}
                  question={q}
                  value={answers[q.key]}
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

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button onClick={() => setStep(step - 1)} disabled={step === 0 || saving}>
          戻る
        </Button>
        <Stack direction="row" spacing={2} alignItems="center">
          {!allAnswered && (
            <Typography variant="body2" color="text.secondary">すべての項目を入力してください</Typography>
          )}
          <Button variant="contained" onClick={handleNext} disabled={!allAnswered || saving}>
            {saving ? '保存中…' : isLast ? 'マッチングする' : '次へ'}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

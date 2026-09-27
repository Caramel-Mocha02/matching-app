import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, LinearProgress, List, ListItem, ListItemIcon,
  ListItemText, Stack, Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
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

// そのステップで表示する質問（ヒゲなど性別で出し分ける質問を除く）
// 自分についての質問なら自分の性別、相手についての質問なら相手の性別で判定する
const getVisibleQuestions = (data, step) => {
  const myGender = data.profiles.gender
  const targetGender = step.about === 'partner' ? (myGender === 'male' ? 'female' : 'male') : myGender
  return (step.questions ?? []).filter((q) => !q.onlyGender || q.onlyGender === targetGender)
}

// そのステップの必須項目がすべて入力済みか
const isStepComplete = (data, step) => {
  if (step.optional) return true
  const values = getStepValues(data, step)
  return getVisibleQuestions(data, step).every((q) => q.optional || !isEmpty(values[q.key]))
}

// 確認ステップ：各ステップの入力状況を一覧にし、「修正」でそのステップへ戻れるようにする
function ReviewStep({ data, onEdit }) {
  return (
    <List disablePadding>
      {STEPS.map((s, i) => {
        if (!s.questions) return null
        const complete = isStepComplete(data, s)
        return (
          <ListItem
            key={s.title}
            disableGutters
            secondaryAction={<Button size="small" onClick={() => onEdit(i)}>修正</Button>}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {complete ? <CheckCircleIcon color="success" /> : <ErrorOutlineIcon color="warning" />}
            </ListItemIcon>
            <ListItemText
              primary={s.title}
              secondary={complete ? (s.optional ? '設定済み（任意）' : '入力済み') : '未入力の項目があります'}
            />
          </ListItem>
        )
      })}
    </List>
  )
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

  // 画面を開いたとき、保存済みの回答を読み込み、最初の未入力ステップから再開する
  useEffect(() => {
    fetchDiagnosis(user.id)
      .then((loaded) => {
        setData(loaded)
        const firstIncomplete = STEPS.findIndex((s) => s.questions && !isStepComplete(loaded, s))
        setStep(firstIncomplete === -1 ? STEPS.length - 1 : firstIncomplete) // 全部済んでいれば確認ステップへ
      })
      .catch(() => setError('データの読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [user.id])

  const current = STEPS[step]
  const questions = getVisibleQuestions(data, current)
  const values = getStepValues(data, current)
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100
  const nextTitle = STEPS[step + 1]?.title
  // 最後の確認ステップでは、すべてのステップが入力済みかを見る
  const canProceed = isLast ? STEPS.every((s) => !s.questions || isStepComplete(data, s)) : isStepComplete(data, current)
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

    if (isLast) navigate('/matches', { state: { recalculate: true } }) // 結果画面で計算し直す印
    else setStep(step + 1)
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      {/* 進捗表示：「3 / 11」とプログレスバー、次のステップ名 */}
      <Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">ステップ {step + 1} / {STEPS.length}</Typography>
          {nextTitle && <Typography variant="body2" color="text.secondary">次：{nextTitle}</Typography>}
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.5, height: 8, borderRadius: 4 }} />
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            {current.title}
          </Typography>
          {current.description && (
            <Typography variant="body2" color="text.secondary">{current.description}</Typography>
          )}

          {current.questions ? (
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
            <>
              <Typography variant="body2" color="text.secondary">
                入力内容を確認して、「マッチングする」を押してください。
              </Typography>
              <ReviewStep data={data} onEdit={setStep} />
            </>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}
      {hasInvalidRange && <Alert severity="warning">下限が上限より大きくなっています。</Alert>}

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Button onClick={() => setStep(step - 1)} disabled={step === 0 || saving}>
          戻る
        </Button>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          {!canProceed && (
            <Typography variant="body2" color="text.secondary">
              {isLast ? '未入力のステップがあります' : 'すべての項目を入力してください'}
            </Typography>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={handleNext}
            disabled={!canProceed || hasInvalidRange || saving}
          >
            {saving ? '保存中…' : isLast ? 'マッチングする' : '次へ'}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

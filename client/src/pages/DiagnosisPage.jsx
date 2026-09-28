import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Stack,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import CloudDoneIcon from '@mui/icons-material/CloudDoneOutlined'
import { useAuth } from '../contexts/AuthContext.jsx'
import { fetchDiagnosis, saveToTable } from '../lib/diagnosis.js'
import {
  buildPayload, countAll, getStepValues, getVisibleQuestions, isEmpty, isStepComplete,
} from '../lib/diagnosisProgress.js'
import QuestionField from '../components/QuestionField.jsx'
import StepNavigator from '../components/StepNavigator.jsx'
import { STEPS } from '../data/steps.js'

const AUTOSAVE_DELAY = 1500 // 入力が止まってから自動保存するまでの時間（ミリ秒）

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

// 保存状態の表示（「保存済み 12:03」など）
function SaveStatus({ status, savedAt, onRetry }) {
  const time = savedAt?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  const text = {
    idle: '回答は自動で保存されます',
    pending: '入力中…',
    saving: '保存中…',
    saved: `保存済み ${time}`,
    error: '保存に失敗しました',
  }[status]

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: status === 'error' ? 'error.main' : 'text.secondary' }}>
      {status === 'saved' && <CloudDoneIcon sx={{ fontSize: 18 }} />}
      {status === 'saving' && <CircularProgress size={14} />}
      <Typography variant="caption">{text}</Typography>
      {status === 'error' && <Button size="small" onClick={onRetry}>再試行</Button>}
    </Stack>
  )
}

export default function DiagnosisPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 今何番目のステップか（0始まり）
  // 全テーブルの回答をまとめて持つ → { profiles: {...}, preferences: {...} }
  const [data, setData] = useState({ profiles: {}, preferences: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle') // idle / pending / saving / saved / error
  const [savedAt, setSavedAt] = useState(null)

  // 自動保存のための入れ物（画面の再描画とは関係なく値を覚えておく）
  const dataRef = useRef(data) // 最新の回答
  const dirtyRef = useRef(new Set()) // 変更があって、まだ保存していないステップの番号
  const timerRef = useRef(null) // 自動保存のタイマー
  const queueRef = useRef(Promise.resolve()) // 保存を1つずつ順番に行うための待ち行列

  useEffect(() => {
    dataRef.current = data
  }, [data])

  // 未保存のステップをすべて保存する。成功すれば true を返す
  const saveDirty = useCallback(() => {
    clearTimeout(timerRef.current)
    queueRef.current = queueRef.current.then(async () => {
      const indexes = [...dirtyRef.current]
      if (indexes.length === 0) return true
      dirtyRef.current.clear()
      setSaveStatus('saving')
      try {
        for (const i of indexes) {
          await saveToTable(STEPS[i].table, user.id, buildPayload(dataRef.current, STEPS[i]))
        }
        setSaveStatus('saved')
        setSavedAt(new Date())
        return true
      } catch {
        indexes.forEach((i) => dirtyRef.current.add(i)) // 失敗したら、次の保存でもう一度試す
        setSaveStatus('error')
        return false
      }
    })
    return queueRef.current
  }, [user.id])

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

  // 別の画面に移動するとき（ヘッダーのリンクなど）も、未保存の変更を保存する
  useEffect(() => () => {
    saveDirty()
  }, [saveDirty])

  // 保存が終わっていないうちにタブを閉じようとしたら、ブラウザの確認ダイアログを出す
  useEffect(() => {
    if (!['pending', 'saving', 'error'].includes(saveStatus)) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [saveStatus])

  // ステップを切り替えたら、画面の一番上に戻す（質問が多く縦に長いため）
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const current = STEPS[step]
  const questions = getVisibleQuestions(data, current)
  const values = getStepValues(data, current)
  const isLast = step === STEPS.length - 1
  const allComplete = STEPS.every((s) => !s.questions || isStepComplete(data, s))
  // 最後の確認ステップでは、すべてのステップが入力済みかを見る
  const canProceed = isLast ? allComplete : isStepComplete(data, current)
  // 範囲入力で「下限 > 上限」になっていないか
  const hasInvalidRange = questions.some(
    (q) => q.type === 'range' && values[q.key]?.min != null && values[q.key]?.max != null && values[q.key].min > values[q.key].max,
  )
  const busy = saveStatus === 'saving'

  // 1項目の回答を更新し、少し待ってから自動保存する
  const handleChange = (key, value) => {
    setData((prev) => {
      const row = prev[current.table] ?? {}
      const newRow = current.group
        ? { ...row, [current.group]: { ...row[current.group], [key]: value } }
        : { ...row, [key]: value }
      return { ...prev, [current.table]: newRow }
    })
    dirtyRef.current.add(step)
    setSaveStatus('pending')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(saveDirty, AUTOSAVE_DELAY)
  }

  // 保存してから、指定したステップへ移動する
  const goToStep = async (index) => {
    setError('')
    if (!(await saveDirty())) {
      setError('保存に失敗しました。通信環境を確認して、もう一度お試しください。')
      return
    }
    setStep(index)
  }

  const handleNext = async () => {
    if (!isLast) return goToStep(step + 1)
    if (await saveDirty()) navigate('/matches', { state: { recalculate: true } }) // 結果画面で計算し直す印
  }

  // 途中保存して、トップ画面に戻る
  const handleSuspend = async () => {
    if (await saveDirty()) navigate('/')
    else setError('保存に失敗しました。通信環境を確認して、もう一度お試しください。')
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const { answered: totalAnswered, total: totalQuestions } = countAll(data)

  return (
    // 横長の画面では左にステップ一覧、右に質問。スマホでは縦に並べる
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, gap: 3, alignItems: 'start' }}>
      <Card sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 88 }}>
        <CardContent>
          <StepNavigator data={data} current={step} onSelect={goToStep} />
        </CardContent>
      </Card>

      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <StepNavigator data={data} current={step} onSelect={goToStep} compact />
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                ステップ {step + 1} / {STEPS.length}
              </Typography>
              <SaveStatus status={saveStatus} savedAt={savedAt} onRetry={saveDirty} />
            </Stack>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              {current.title}
            </Typography>
            {current.description && (
              <Typography variant="body2" color="text.secondary">{current.description}</Typography>
            )}

            {current.questions ? (
              <Stack spacing={3} sx={{ mt: 3 }}>
                {questions.map((q, i) => {
                  const required = !current.optional && !q.optional
                  const answered = required && !isEmpty(values[q.key])
                  return (
                    <Box key={q.key}>
                      {/* 「質問 3 / 8」：このステップの中で今どこにいるか */}
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.5 }}>
                        {answered && <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                        <Typography variant="caption" color="text.secondary">
                          質問 {i + 1} / {questions.length}{!required && '（任意）'}
                        </Typography>
                      </Stack>
                      <QuestionField question={q} value={values[q.key]} onChange={(value) => handleChange(q.key, value)} />
                    </Box>
                  )
                })}
              </Stack>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  入力済み {totalAnswered} / {totalQuestions} 項目。内容を確認して、「マッチングする」を押してください。
                </Typography>
                <ReviewStep data={data} onEdit={goToStep} />
              </>
            )}
          </CardContent>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}
        {hasInvalidRange && <Alert severity="warning">下限が上限より大きくなっています。</Alert>}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Button onClick={() => goToStep(step - 1)} disabled={step === 0 || busy}>
            戻る
          </Button>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" onClick={handleSuspend} disabled={busy}>
              保存して中断
            </Button>
            <Button variant="contained" size="large" onClick={handleNext} disabled={!canProceed || hasInvalidRange || busy}>
              {isLast ? 'マッチングする' : '次へ'}
            </Button>
          </Stack>
        </Stack>
        {!canProceed && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', mt: -2 }}>
            {isLast ? '未入力のステップがあります' : 'すべての必須項目に答えると次へ進めます（入力内容は自動で保存されます）'}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

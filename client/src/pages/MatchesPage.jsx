import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, LinearProgress, Skeleton, Stack, Typography,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import { apiFetch } from '../lib/api.js'
import { labelOf, profileLine } from '../lib/labels.js'
import { POINT_COLORS, scoreTone } from '../lib/scoreTone.js'
import { MUST_CONDITION_QUESTIONS } from '../data/mustConditionQuestions.js'
import LikeButton from '../components/LikeButton.jsx'
import PhotoGallery from '../components/PhotoGallery.jsx'
import ExplanationMarkdown from '../components/ExplanationMarkdown.jsx'

const CATEGORIES = [
  { key: 'personality', label: '性格' },
  { key: 'communication', label: '会話' },
  { key: 'lifestyle', label: '結婚生活' },
  { key: 'appearance', label: '外見' },
  { key: 'cleanliness', label: '清潔感' },
]

const conditionLabel = (key) => MUST_CONDITION_QUESTIONS.find((q) => q.key === key)?.label ?? key

// AI による「おすすめの理由」。保存済みならそれを表示し、無ければサーバーに作成を頼む
function Explanation({ partnerId, initial }) {
  const [text, setText] = useState(initial)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (initial) return
    apiFetch(`/api/matches/${partnerId}/explanation`, { method: 'POST' })
      .then((data) => setText(data.explanation))
      .catch(() => setFailed(true))
  }, [partnerId, initial])

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>おすすめの理由</Typography>
      {text ? (
        <ExplanationMarkdown markdown={text} />
      ) : failed ? (
        <Typography variant="body2" color="text.secondary">説明文を読み込めませんでした。</Typography>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary">AI が解説を作成しています…</Typography>
          <Skeleton /><Skeleton /><Skeleton width="60%" />
        </>
      )}
    </Box>
  )
}

// 「相性が良いポイント」「注意したいポイント」のチップ（色は lib/scoreTone.js の POINT_COLORS）
function PointChip({ label, tone }) {
  const { color, bg, border } = POINT_COLORS[tone]
  return <Chip label={label} size="small" variant="outlined" sx={{ color, bgcolor: bg, borderColor: border }} />
}

// 1人分のカード。PC では左（写真・基本情報・点数）と右（おすすめの理由）の横長、スマホでは縦に並べる
function MatchCard({ match }) {
  const { details } = match
  const cautions = [...details.caution.map((c) => c.topic), ...details.penalties]
  const tone = scoreTone(match.totalScore)

  return (
    <Card>
      <CardContent
        sx={{
          p: { xs: 2, sm: 3 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '380px 1fr' },
          gap: { xs: 2, md: 4 },
        }}
      >
        {/* 左：写真・名前・総合スコア・分野別スコア・ボタン */}
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
            <PhotoGallery photos={match.photoUrls} name={match.nickname} size={96} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Chip label={`おすすめ ${match.rank}位`} size="small" color={match.rank === 1 ? 'primary' : 'default'} sx={{ mb: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{match.nickname}</Typography>
              <Typography variant="body2" color="text.secondary">{profileLine(match)}</Typography>
              <Typography variant="body2" color="text.secondary">年収 {labelOf('annual_income', match.annualIncome)}</Typography>
            </Box>
            {/* 総合スコア：点数に応じて色が変わる */}
            <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
              <Typography variant="caption" color="text.secondary">相性</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1, color: tone.color }}>{match.totalScore}</Typography>
              <Chip label={tone.label} size="small" sx={{ mt: 0.5, bgcolor: tone.color, color: 'white', fontWeight: 700 }} />
            </Box>
          </Stack>

          {/* 分野別スコア：バーも点数に応じた色にする */}
          <Stack spacing={1}>
            {CATEGORIES.map((c) => {
              const score = match.categoryScores[c.key]
              const { color } = scoreTone(score)
              return (
                <Stack key={c.key} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ width: 64 }}>{c.label}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: `${color}26`, '& .MuiLinearProgress-bar': { bgcolor: color } }}
                  />
                  <Typography variant="body2" sx={{ width: 28, textAlign: 'right', fontWeight: 700, color }}>{score}</Typography>
                </Stack>
              )
            })}
          </Stack>

          {/* 相性が良い点・注意したい点 */}
          {details.good.length > 0 && (
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 700 }}>相性が良いポイント</Typography>
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                {details.good.map((g) => <PointChip key={g.topic} label={g.topic} tone="good" />)}
              </Stack>
            </Box>
          )}
          {cautions.length > 0 && (
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 700 }}>注意したいポイント</Typography>
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                {cautions.map((c) => <PointChip key={c} label={c} tone="caution" />)}
              </Stack>
            </Box>
          )}

          {/* いいね（興味を伝える）と、メッセージ（いいねを待たずにすぐ送れる） */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, alignItems: 'start' }}>
            <LikeButton partnerId={match.partnerId} liked={match.liked} likedMe={match.likedMe} fullWidth />
            <Button component={RouterLink} to={`/messages/${match.partnerId}`} variant="contained" startIcon={<ChatIcon />}>
              メッセージ
            </Button>
          </Box>
        </Stack>

        {/* 右：おすすめの理由（スマホでは下に表示） */}
        <Box
          sx={{
            // 左右（スマホでは上下）の区切り線。色を明示しないと黒い線になるため、薄い灰色を指定する
            borderTop: { xs: '1px solid rgba(0, 0, 0, 0.08)', md: 'none' },
            borderLeft: { xs: 'none', md: '1px solid rgba(0, 0, 0, 0.08)' },
            pt: { xs: 2, md: 0 },
            pl: { md: 4 },
          }}
        >
          <Explanation partnerId={match.partnerId} initial={match.explanation} />
        </Box>
      </CardContent>
    </Card>
  )
}

// 0人だったときに、どの条件で何人除外されたかを表示する
function NoMatches({ exclusions }) {
  const rows = Object.entries(exclusions?.byCondition ?? {}).sort((a, b) => b[1] - a[1])
  return (
    <Card variant="outlined" sx={{ maxWidth: 720 }}>
      <CardContent>
        <Typography gutterBottom sx={{ fontWeight: 700 }}>条件に合うお相手が見つかりませんでした</Typography>
        {exclusions && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              登録中のお相手 {exclusions.total} 人のうち、必須条件ごとに除外された人数です。
              人数の多い条件をゆるめると、見つかりやすくなります。
            </Typography>
            {rows.map(([key, count]) => (
              <Typography key={key} variant="body2">・{conditionLabel(key)}：{count}人</Typography>
            ))}
            {exclusions.byPartner > 0 && (
              <Typography variant="body2">・お相手側の必須条件：{exclusions.byPartner}人</Typography>
            )}
          </>
        )}
        <Button component={RouterLink} to="/diagnosis" variant="outlined" sx={{ mt: 2 }}>
          条件を見直す
        </Button>
      </CardContent>
    </Card>
  )
}

export default function MatchesPage() {
  const location = useLocation()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // recalculate = true なら計算し直す（POST）、false なら保存済みの結果を取得（GET）
  const load = useCallback(async (recalculate) => {
    try {
      let data = await apiFetch('/api/matches', { method: recalculate ? 'POST' : 'GET' })
      // まだ一度も計算していなければ、その場で計算する
      if (!recalculate && data.matches.length === 0) data = await apiFetch('/api/matches', { method: 'POST' })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 診断画面の「マッチングする」から来た場合は計算し直す
  useEffect(() => {
    load(Boolean(location.state?.recalculate))
    // 印を消しておく（ページを再読み込みしたときに、また計算し直さないように）
    window.history.replaceState({}, '')
  }, [load, location.state])

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress />
        <Typography color="text.secondary" sx={{ mt: 2 }}>相性の良いお相手を探しています…</Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>あなたへのおすすめ</Typography>
        <Typography variant="body2" color="text.secondary">
          相性スコアは診断の回答からプログラムで計算しています。「おすすめの理由」の文章は AI が作成しています。
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" action={error.includes('診断') && <Button component={RouterLink} to="/diagnosis">診断へ</Button>}>
          {error}
        </Alert>
      )}

      {result && result.matches.length === 0 && <NoMatches exclusions={result.exclusions} />}
      {/* 1人1枚。PC ではカードの中で横に並べる */}
      <Stack spacing={2}>
        {result?.matches.map((m) => <MatchCard key={m.partnerId} match={m} />)}
      </Stack>

      {result && (
        <Button
          onClick={() => {
            setLoading(true)
            setError('')
            load(true)
          }}
          sx={{ alignSelf: 'center' }}
        >
          最新の登録者で探し直す
        </Button>
      )}
    </Stack>
  )
}

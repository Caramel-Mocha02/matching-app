import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography,
} from '@mui/material'
import { apiFetch } from '../lib/api.js'

const formatDate = (iso) => new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// 申請1件分。書類の画像と、入力された生年月日・プロフィールの年齢を見比べて審査する
function RequestCard({ item, onDone }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const under18 = item.ageFromBirthDate != null && item.ageFromBirthDate < 18
  const ageMismatch = item.profileAge != null && item.ageFromBirthDate != null && item.profileAge !== item.ageFromBirthDate

  const review = async (approve) => {
    setSaving(true)
    setError('')
    try {
      await apiFetch(`/api/admin/age-verifications/${item.userId}`, { method: 'POST', body: JSON.stringify({ approve, note }) })
      onDone()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* 書類の画像（10分だけ見られる URL） */}
        <Box>
          {item.documentUrl ? (
            <Box component="a" href={item.documentUrl} target="_blank" rel="noreferrer">
              <Box component="img" src={item.documentUrl} alt="本人確認書類" sx={{ width: '100%', borderRadius: 2, border: 1, borderColor: 'divider' }} />
            </Box>
          ) : (
            <Typography color="text.secondary">画像を読み込めませんでした</Typography>
          )}
        </Box>

        <Stack spacing={1.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.nickname}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{item.email}</Typography>
          <Typography variant="body2">申請日時：{formatDate(item.submittedAt)}</Typography>
          <Typography variant="body2">
            入力された生年月日：<strong>{item.birthDate}</strong>（{item.ageFromBirthDate}歳）
          </Typography>
          <Typography variant="body2">プロフィールの年齢：{item.profileAge ?? '未入力'}{item.profileAge != null && '歳'}</Typography>
          {under18 && <Alert severity="error">生年月日から計算すると18歳未満です。</Alert>}
          {ageMismatch && <Alert severity="warning">プロフィールの年齢と、生年月日から計算した年齢が違います。</Alert>}

          <Typography variant="body2" color="text.secondary">
            書類の生年月日・書類の名前・発行者が読み取れること、入力された生年月日と一致すること、18歳以上であることを確認してください。
          </Typography>
          <TextField
            label="差し戻しの理由（差し戻すときだけ）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            size="small"
            placeholder="例：生年月日が読み取れません"
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => review(true)} disabled={saving || under18}>承認する</Button>
            <Button variant="outlined" onClick={() => review(false)} disabled={saving}>差し戻す</Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// 【運営者用】年齢確認の審査画面
export default function AdminAgeVerificationPage() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    apiFetch('/api/admin/age-verifications')
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>年齢確認の審査</Typography>
      <Typography variant="body2" color="text.secondary">
        承認・差し戻しのどちらの場合も、書類の画像はすぐに削除されます。
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {!items && !error && <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>}
      {items?.length === 0 && <Typography color="text.secondary" sx={{ py: 4 }}>審査待ちの申請はありません。</Typography>}
      {items?.map((item) => <RequestCard key={item.userId} item={item} onDone={load} />)}
    </Stack>
  )
}

import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert, Box, Button, ButtonBase, Card, CardContent, Chip, CircularProgress, Stack, TextField, Typography,
} from '@mui/material'
import BadgeIcon from '@mui/icons-material/BadgeOutlined'
import { useAuth } from '../contexts/AuthContext.jsx'
import { apiFetch } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { AGE_STATUS, ageStatusOf, useMe } from '../lib/useMe.js'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

// 年齢確認：本人確認書類の写真と生年月日を提出する
export default function AgeVerificationPage() {
  const { user } = useAuth()
  const { me, setMe } = useMe()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [birthDate, setBirthDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!me) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const status = ageStatusOf(me)
  const canSubmit = status === 'none' || status === 'rejected'

  const handleSelect = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.size > MAX_SIZE) {
      setError('10MB 以下の画像を選んでください。')
      return
    }
    setError('')
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected)) // 選んだ画像をその場で表示する（まだアップロードはしない）
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      // 1. 書類の画像を、非公開の保存場所にアップロードする
      const ext = file.name.split('.').pop()
      const path = `${user.id}/id-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('id-documents').upload(path, file)
      if (uploadError) throw new Error('アップロードに失敗しました。JPEG・PNG・WebP の画像を選んでください。')
      // 2. 保存場所と生年月日をサーバーに送る（サーバーが状態を「確認中」にする）
      setMe(await apiFetch('/api/age-verification', { method: 'POST', body: JSON.stringify({ documentPath: path, birthDate }) }))
      setFile(null)
      setPreviewUrl(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card sx={{ maxWidth: 640, mx: 'auto' }}>
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>年齢確認</Typography>
            <Chip label={AGE_STATUS[status].label} color={status === 'verified' ? 'success' : status === 'rejected' ? 'warning' : 'default'} />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            安心してご利用いただくため、法律に基づき、18歳以上であることを公的な書類で確認しています。
            年齢確認が終わると、メッセージを送れるようになります。
          </Typography>

          {status === 'rejected' && me.ageVerification?.note && (
            <Alert severity="warning">差し戻しの理由：{me.ageVerification.note}</Alert>
          )}
          {status === 'pending' && <Alert severity="info">{AGE_STATUS.pending.description}</Alert>}
          {status === 'verified' && (
            <Alert severity="success" action={<Button component={RouterLink} to="/messages">メッセージへ</Button>}>
              {AGE_STATUS.verified.description}
            </Alert>
          )}

          {canSubmit && (
            <>
              <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} gutterBottom>提出できる書類</Typography>
                <Typography component="ul" variant="body2" sx={{ pl: 2.5, m: 0 }}>
                  <li>運転免許証</li>
                  <li>マイナンバーカード（表面のみ。裏面の番号は写さないでください）</li>
                  <li>パスポート</li>
                  <li>健康保険証</li>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>生年月日・書類の名前・発行者</strong>が写っていれば、それ以外（住所や顔写真など）は隠してかまいません。
                  書類の画像は、確認が終わったらすぐに削除します。
                </Typography>
              </Box>

              {/* 書類の画像を選ぶ */}
              <ButtonBase
                component="label"
                sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 2, flexDirection: 'column', gap: 1, minHeight: 160 }}
              >
                {previewUrl ? (
                  <Box component="img" src={previewUrl} alt="選んだ書類" sx={{ maxWidth: '100%', maxHeight: 240, borderRadius: 1 }} />
                ) : (
                  <>
                    <BadgeIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="body2">書類の写真を選ぶ</Typography>
                  </>
                )}
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSelect} data-testid="id-document-input" />
              </ButtonBase>

              <TextField
                label="生年月日"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="書類に書かれている生年月日を入力してください"
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Button variant="contained" size="large" onClick={handleSubmit} disabled={!file || !birthDate || submitting}>
                {submitting ? '提出中…' : '提出する'}
              </Button>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

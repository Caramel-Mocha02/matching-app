import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField,
  Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../contexts/AuthContext.jsx'
import { apiFetch } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'

const CONFIRM_TEXT = '退会する' // 押し間違いを防ぐため、この文字を入力しないと退会できない

// 退会の確認画面
function WithdrawDialog({ open, onClose }) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleWithdraw = async () => {
    setDeleting(true)
    setError('')
    try {
      await apiFetch('/api/account', { method: 'DELETE' })
      // 先にトップ画面へ移動してから、ブラウザに残っているログイン情報を消す
      navigate('/', { replace: true, state: { withdrawn: true } })
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>本当に退会しますか？</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2">退会すると、次のデータがすべて削除され、元に戻せません。</Typography>
          <Typography component="ul" variant="body2" sx={{ pl: 2.5, m: 0 }}>
            <li>プロフィール・写真・診断の回答</li>
            <li>マッチング結果</li>
            <li>送った・もらったいいね</li>
            <li>メッセージ（お相手の画面からも消えます）</li>
          </Typography>
          <TextField
            label={`確認のため「${CONFIRM_TEXT}」と入力してください`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            size="small"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting}>やめる</Button>
        <Button variant="contained" color="error" onClick={handleWithdraw} disabled={text !== CONFIRM_TEXT || deleting}>
          {deleting ? '処理中…' : '退会する'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// アカウント画面（ログアウト・退会）
export default function AccountPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <Card sx={{ maxWidth: 560, mx: 'auto' }}>
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Stack spacing={3}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>アカウント</Typography>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">ログイン中のメールアドレス</Typography>
            <Typography sx={{ wordBreak: 'break-all' }}>{user.email}</Typography>
          </Stack>

          <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ alignSelf: 'flex-start' }}>
            ログアウト
          </Button>

          <Divider />

          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>退会</Typography>
            <Typography variant="body2" color="text.secondary">
              退会すると、プロフィールやメッセージなどのデータがすべて削除されます。
            </Typography>
            <Button color="error" onClick={() => setDialogOpen(true)} sx={{ alignSelf: 'flex-start' }}>
              退会する
            </Button>
          </Stack>
        </Stack>
      </CardContent>
      <WithdrawDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Card>
  )
}

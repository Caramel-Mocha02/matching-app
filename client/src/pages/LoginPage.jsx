import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault() // フォーム送信でページが再読み込みされるのを防ぐ
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません。')
      return
    }
    navigate('/diagnosis')
  }

  return (
    <Card variant="outlined" sx={{ maxWidth: 480, mx: 'auto' }}>
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>ログイン</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="メールアドレス"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="パスワード"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? 'ログイン中…' : 'ログイン'}
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            アカウントをお持ちでない方は <Link component={RouterLink} to="/signup">新規登録</Link>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

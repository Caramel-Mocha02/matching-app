import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。')
      return
    }

    setSubmitting(true)
    const { data, error } = await signUp(email, password)
    setSubmitting(false)

    if (error) {
      setError(`登録できませんでした：${error.message}`)
      return
    }

    // Supabase の「メール確認」が有効な場合は、確認メールのリンクを押すまでログインできない
    if (data.session) {
      navigate('/diagnosis')
    } else {
      setInfo('確認メールを送信しました。メール内のリンクを開いてから、ログインしてください。')
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>新規登録</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="success">{info}</Alert>}
          <TextField
            label="メールアドレス"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="パスワード（6文字以上）"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? '登録中…' : '登録する'}
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            すでにアカウントをお持ちの方は <Link component={RouterLink} to="/login">ログイン</Link>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

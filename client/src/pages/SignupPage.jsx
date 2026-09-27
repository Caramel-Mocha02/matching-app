import { Link as RouterLink } from 'react-router-dom'
import { Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'

// 新規登録画面（見た目のみ。Phase 2 で Supabase Auth とつなぐ）
export default function SignupPage() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>新規登録</Typography>
          <TextField label="メールアドレス" type="email" fullWidth />
          <TextField label="パスワード（6文字以上）" type="password" fullWidth />
          <Button variant="contained" size="large" disabled>
            登録する（Phase 2 で実装）
          </Button>
          <Typography variant="body2" textAlign="center">
            すでにアカウントをお持ちの方は <Link component={RouterLink} to="/login">ログイン</Link>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

import { Link as RouterLink } from 'react-router-dom'
import { Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material'

// ログイン画面（見た目のみ。Phase 2 で Supabase Auth とつなぐ）
export default function LoginPage() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>ログイン</Typography>
          <TextField label="メールアドレス" type="email" fullWidth />
          <TextField label="パスワード" type="password" fullWidth />
          <Button variant="contained" size="large" disabled>
            ログイン（Phase 2 で実装）
          </Button>
          <Typography variant="body2" textAlign="center">
            アカウントをお持ちでない方は <Link component={RouterLink} to="/signup">新規登録</Link>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

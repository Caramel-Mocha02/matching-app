import { Card, CardContent, Stack, Typography } from '@mui/material'

// マッチング結果画面（Phase 9 で本実装）
export default function MatchesPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>あなたへのおすすめ</Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary">
            ここに相性の良いお相手が3〜5人表示されます。
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  )
}

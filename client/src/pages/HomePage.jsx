import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'

const FEATURES = [
  { title: '少人数に厳選', text: '大量の検索ではなく、相性の良い3〜5人だけをご紹介します。' },
  { title: '一致率より相性', text: '違いがあっても補い合える組み合わせを高く評価します。' },
  { title: '理由が分かる', text: '相性が良い点と、注意したい点の両方をお伝えします。' },
]

export default function HomePage() {
  // サーバーと通信できているかを確認するための状態（Phase 1 の動作確認用）
  const [serverStatus, setServerStatus] = useState('確認中…')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setServerStatus(data.ok ? '接続OK' : '接続エラー'))
      .catch(() => setServerStatus('接続できません'))
  }, [])

  return (
    <Stack spacing={4}>
      <Box textAlign="center" sx={{ pt: 2 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          相性の良い人に、<br />最短で出会う。
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          価値観・会話・生活スタイルから、あなたと本当に合う人を絞り込みます。
        </Typography>
        <Button component={RouterLink} to="/diagnosis" variant="contained" size="large">
          相性診断をはじめる
        </Button>
      </Box>

      <Stack spacing={2}>
        {FEATURES.map((f) => (
          <Card key={f.title} variant="outlined">
            <CardContent>
              <Typography fontWeight={700}>{f.title}</Typography>
              <Typography variant="body2" color="text.secondary">{f.text}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box textAlign="center">
        <Chip size="small" label={`サーバー: ${serverStatus}`} />
      </Box>
    </Stack>
  )
}

import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatIcon from '@mui/icons-material/Chat'
import { useAuth } from '../contexts/AuthContext.jsx'

const FEATURES = [
  { icon: <GroupsIcon color="primary" />, title: '少人数に厳選', text: '大量の検索ではなく、相性の良い3〜5人だけをご紹介します。' },
  { icon: <FavoriteIcon color="primary" />, title: '一致率より相性', text: '違いがあっても補い合える組み合わせを高く評価します。' },
  { icon: <ChatIcon color="primary" />, title: '理由が分かる', text: '相性が良い点と、注意したい点の両方をお伝えします。' },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <Stack spacing={4}>
      <Box sx={{ textAlign: 'center', pt: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: 28, sm: 34 } }}>
          相性の良い人に、<br />最短で出会う。
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          価値観・会話・生活スタイルから、あなたと本当に合う人を絞り込みます。
        </Typography>

        {/* ログイン中かどうかで、次にやることを案内する */}
        {user ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
            <Button component={RouterLink} to="/matches" variant="contained" size="large">
              おすすめを見る
            </Button>
            <Button component={RouterLink} to="/diagnosis" variant="outlined" size="large">
              診断を続ける・見直す
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <Button component={RouterLink} to="/signup" variant="contained" size="large">
              無料で相性診断をはじめる
            </Button>
            <Typography variant="body2" color="text.secondary">診断の所要時間：約10分</Typography>
          </Stack>
        )}
      </Box>

      <Stack spacing={2}>
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                {f.icon}
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.text}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}

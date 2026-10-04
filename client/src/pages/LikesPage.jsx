import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert, Badge, Box, Button, Card, CardContent, CircularProgress, Stack, Tab, Tabs, Typography,
} from '@mui/material'
import { apiFetch } from '../lib/api.js'
import { profileLine } from '../lib/labels.js'
import { scoreTone } from '../lib/scoreTone.js'
import LikeButton from '../components/LikeButton.jsx'
import PhotoGallery from '../components/PhotoGallery.jsx'

// 「10月4日 14:05」のような日時
const formatDate = (iso) =>
  new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const TABS = [
  { key: 'received', label: 'もらったいいね', empty: 'まだいいねは届いていません。' },
  { key: 'matched', label: 'お互いにいいね', empty: 'まだお互いにいいねした相手はいません。' },
  { key: 'sent', label: '送ったいいね', empty: 'まだいいねを送っていません。「おすすめ」からいいねを送ってみましょう。' },
]

// お相手1人分のカード
function PartnerCard({ partner, tab, onLiked }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', mb: 2 }}>
          <PhotoGallery photos={partner.photoUrls} name={partner.nickname} size={72} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{partner.nickname}</Typography>
            <Typography variant="body2" color="text.secondary">{profileLine(partner)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(partner.likedAt)}に{tab === 'received' ? 'いいねが届きました' : tab === 'sent' ? 'いいねしました' : 'お互いにいいね'}
            </Typography>
          </Box>
          {partner.totalScore != null && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">相性</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1, color: scoreTone(partner.totalScore).color }}>
                {partner.totalScore}
              </Typography>
            </Box>
          )}
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: tab === 'received' ? '1fr 1fr' : '1fr', gap: 1, alignItems: 'start' }}>
          {tab === 'received' && <LikeButton partnerId={partner.partnerId} liked={false} likedMe fullWidth onLiked={onLiked} />}
          {/* いいねを待たずにメッセージを送れる（送れる相手のときだけ表示） */}
          {partner.canMessage ? (
            <Button component={RouterLink} to={`/messages/${partner.partnerId}`} variant="contained" fullWidth>
              メッセージを送る
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              お相手からのいいねかメッセージを待っています
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default function LikesPage() {
  const [tab, setTab] = useState('received')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    apiFetch('/api/likes')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!data && !error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const current = TABS.find((t) => t.key === tab)
  const items = data?.[tab] ?? []

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>いいね</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
        {TABS.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            label={
              <Badge badgeContent={data?.[t.key]?.length ?? 0} color="primary" sx={{ '& .MuiBadge-badge': { right: -12 } }}>
                {t.label}
              </Badge>
            }
            sx={{ pr: 3 }}
          />
        ))}
      </Tabs>

      {items.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>{current.empty}</Typography>
      ) : (
        // 横長の画面では2〜3列に並べる
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {items.map((p) => (
            // いいねを返したら一覧を読み直し、「マッチング成立」タブに切り替える
            <PartnerCard
              key={p.partnerId}
              partner={p}
              tab={tab}
              onLiked={() => {
                load()
                setTab('matched')
              }}
            />
          ))}
        </Box>
      )}
    </Stack>
  )
}

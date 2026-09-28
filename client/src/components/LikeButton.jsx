import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Button, Stack, Typography } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatIcon from '@mui/icons-material/Chat'
import { useAuth } from '../contexts/AuthContext.jsx'
import { sendLike } from '../lib/social.js'

// いいねボタン。状態によって表示が変わる
//   まだ → 「いいね」／ 相手からいいね済み → 「いいねを返す」
//   自分だけいいね済み → 「いいね済み」／ お互いにいいね → 「メッセージを送る」
export default function LikeButton({ partnerId, liked: initialLiked, likedMe, fullWidth, onLiked }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const matched = liked && likedMe

  const handleLike = async () => {
    setSending(true)
    setError('')
    try {
      await sendLike(user.id, partnerId)
      setLiked(true)
      onLiked?.(partnerId)
    } catch {
      setError('いいねを送れませんでした。')
    } finally {
      setSending(false)
    }
  }

  if (matched) {
    return (
      <Stack spacing={0.5} sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <Button component={RouterLink} to={`/messages/${partnerId}`} variant="contained" startIcon={<ChatIcon />} fullWidth={fullWidth}>
          メッセージを送る
        </Button>
        <Typography variant="caption" color="primary" sx={{ textAlign: 'center' }}>マッチングしました！</Typography>
      </Stack>
    )
  }

  if (liked) {
    return (
      <Stack spacing={0.5} sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <Button variant="outlined" startIcon={<FavoriteIcon />} disabled fullWidth={fullWidth}>いいね済み</Button>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          お相手からいいねが届くとメッセージできます
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={0.5} sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Button
        variant="contained"
        startIcon={<FavoriteBorderIcon />}
        onClick={handleLike}
        disabled={sending}
        fullWidth={fullWidth}
      >
        {likedMe ? 'いいねを返してマッチング' : 'いいね'}
      </Button>
      {likedMe && (
        <Typography variant="caption" color="primary" sx={{ textAlign: 'center' }}>お相手からいいねが届いています</Typography>
      )}
      {error && <Typography variant="caption" color="error">{error}</Typography>}
    </Stack>
  )
}

import { useState } from 'react'
import { Button, Stack, Typography } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import { useAuth } from '../contexts/AuthContext.jsx'
import { sendLike } from '../lib/social.js'

// いいねボタン（「興味があります」を相手に伝える）。メッセージはいいねが無くても送れる
//   まだ → 「いいね」／ 相手からいいね済み → 「いいねを返す」
//   自分がいいね済み → 「いいね済み」（お互いなら「お互いにいいね」）
export default function LikeButton({ partnerId, liked: initialLiked, likedMe, fullWidth, onLiked }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <Stack spacing={0.5} sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {liked ? (
        <Button variant="outlined" startIcon={<FavoriteIcon />} disabled fullWidth={fullWidth}>
          {likedMe ? 'お互いにいいね' : 'いいね済み'}
        </Button>
      ) : (
        <Button variant="outlined" startIcon={<FavoriteBorderIcon />} onClick={handleLike} disabled={sending} fullWidth={fullWidth}>
          {likedMe ? 'いいねを返す' : 'いいね'}
        </Button>
      )}
      {likedMe && !liked && (
        <Typography variant="caption" color="primary" sx={{ textAlign: 'center' }}>お相手からいいねが届いています</Typography>
      )}
      {error && <Typography variant="caption" color="error">{error}</Typography>}
    </Stack>
  )
}

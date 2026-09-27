import { useEffect, useState } from 'react'
import { Avatar, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// プロフィール写真のアップロード欄。
// 写真は Storage の「avatars/ユーザーID/…」に保存し、value にはその保存場所（パス）を入れる。
export default function AvatarField({ label, value, onChange }) {
  const { user } = useAuth()
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // 保存済みの写真を表示するため、期限付きの閲覧用 URL を発行する（写真は非公開の場所にあるため）
  useEffect(() => {
    if (!value) return
    supabase.storage
      .from('avatars')
      .createSignedUrl(value, 60 * 60)
      .then(({ data }) => setPreviewUrl(data?.signedUrl ?? null))
  }, [value])

  const handleSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setError('5MB 以下の画像を選んでください。')
      return
    }

    setError('')
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar-${Date.now()}.${ext}` // 毎回違う名前にして、古い画像が表示され続けるのを防ぐ
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file)
    setUploading(false)

    if (uploadError) {
      setError('アップロードに失敗しました。JPEG・PNG・WebP の画像を選んでください。')
      return
    }
    onChange(path) // 「次へ」を押すと、このパスがプロフィールに保存される
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>{label}（任意）</Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Avatar src={previewUrl ?? undefined} sx={{ width: 72, height: 72 }} />
        <Button component="label" variant="outlined" disabled={uploading}>
          {uploading ? <CircularProgress size={20} /> : value ? '写真を変更' : '写真を選ぶ'}
          <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSelect} />
        </Button>
      </Stack>
      {error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}
    </Box>
  )
}

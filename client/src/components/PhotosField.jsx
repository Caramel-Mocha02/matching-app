import { useEffect, useState } from 'react'
import { Box, Button, ButtonBase, Chip, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const MAX_PHOTOS = 5
const MAX_SIZE = 5 * 1024 * 1024 // 1枚 5MB まで

// プロフィール写真（最大5枚）。1枚目がメインの写真になる。
// 写真は Storage の「avatars/ユーザーID/…」に保存し、value にはその保存場所（パス）の配列を入れる。
export default function PhotosField({ label, value, onChange }) {
  const { user } = useAuth()
  const paths = value ?? []
  const [urlByPath, setUrlByPath] = useState({}) // 表示用の期限付き URL
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // 写真は非公開の場所にあるので、表示用の期限付き URL をまとめて発行する
  useEffect(() => {
    const missing = (value ?? []).filter((p) => !urlByPath[p])
    if (missing.length === 0) return
    supabase.storage
      .from('avatars')
      .createSignedUrls(missing, 60 * 60)
      .then(({ data }) => {
        setUrlByPath((prev) => ({ ...prev, ...Object.fromEntries((data ?? []).map((d) => [d.path, d.signedUrl])) }))
      })
  }, [value, urlByPath])

  const handleSelect = async (e) => {
    const files = [...(e.target.files ?? [])].slice(0, MAX_PHOTOS - paths.length)
    e.target.value = '' // 同じファイルをもう一度選べるようにする
    if (files.length === 0) return
    if (files.some((f) => f.size > MAX_SIZE)) {
      setError('1枚 5MB 以下の画像を選んでください。')
      return
    }

    setError('')
    setUploading(true)
    const added = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/photo-${Date.now()}-${added.length}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file)
      if (uploadError) {
        setError('アップロードに失敗しました。JPEG・PNG・WebP の画像を選んでください。')
        break
      }
      added.push(path)
    }
    setUploading(false)
    if (added.length > 0) onChange([...paths, ...added]) // 自動保存される
  }

  const handleRemove = (path) => {
    onChange(paths.filter((p) => p !== path))
    supabase.storage.from('avatars').remove([path]) // 保存場所からも削除する（失敗しても表示には影響しない）
  }

  // 選んだ写真を1枚目（メイン）にする
  const handleMakeMain = (path) => onChange([path, ...paths.filter((p) => p !== path)])

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}（任意・{MAX_PHOTOS}枚まで。1枚目がメインの写真になります）
      </Typography>
      <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
        {paths.map((path, i) => (
          <Box key={path} sx={{ position: 'relative', width: 104 }}>
            <Box
              sx={{ width: 104, height: 104, borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.100', border: i === 0 ? 2 : 0, borderColor: 'primary.main' }}
            >
              {urlByPath[path] && <Box component="img" src={urlByPath[path]} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </Box>
            <IconButton
              size="small"
              onClick={() => handleRemove(path)}
              aria-label="写真を削除"
              sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
            {i === 0 ? (
              <Chip label="メイン" size="small" color="primary" sx={{ position: 'absolute', bottom: 4, left: 4 }} />
            ) : (
              <Button size="small" onClick={() => handleMakeMain(path)} sx={{ fontSize: 11, px: 0.5, minWidth: 0 }}>
                メインにする
              </Button>
            )}
          </Box>
        ))}

        {paths.length < MAX_PHOTOS && (
          <ButtonBase
            component="label"
            disabled={uploading}
            sx={{ width: 104, height: 104, borderRadius: 2, border: '2px dashed', borderColor: 'divider', flexDirection: 'column', color: 'text.secondary' }}
          >
            {uploading ? <CircularProgress size={24} /> : <AddPhotoAlternateIcon />}
            <Typography variant="caption">{uploading ? 'アップロード中' : '写真を追加'}</Typography>
            <input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSelect} />
          </ButtonBase>
        )}
      </Stack>
      {error && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}
    </Box>
  )
}

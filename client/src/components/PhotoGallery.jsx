import { useState } from 'react'
import { Avatar, Box, ButtonBase, Dialog, IconButton, Stack } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

// 相手の写真。1枚目を大きく表示し、2枚目以降は小さな一覧にする。押すと拡大表示する
//   photos：写真の URL の配列（無ければ名前の頭文字を表示）
export default function PhotoGallery({ photos = [], name, size = 96 }) {
  const [open, setOpen] = useState(null) // 拡大表示中の写真の番号（閉じているときは null）

  if (photos.length === 0) {
    return (
      <Avatar sx={{ width: size, height: size, bgcolor: 'primary.light', fontSize: size / 2.5 }}>{name?.[0]}</Avatar>
    )
  }

  const move = (step) => setOpen((i) => (i + step + photos.length) % photos.length)

  return (
    <>
      <Stack spacing={0.75} sx={{ alignItems: 'flex-start' }}>
        <ButtonBase onClick={() => setOpen(0)} sx={{ borderRadius: 2, overflow: 'hidden' }} aria-label="写真を拡大">
          <Box component="img" src={photos[0]} alt={`${name}さんの写真`} sx={{ width: size, height: size, objectFit: 'cover' }} />
        </ButtonBase>
        {photos.length > 1 && (
          <Stack direction="row" spacing={0.5}>
            {photos.slice(1).map((url, i) => (
              <ButtonBase key={url} onClick={() => setOpen(i + 1)} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <Box component="img" src={url} alt="" sx={{ width: size / 4.5, height: size / 4.5, objectFit: 'cover' }} />
              </ButtonBase>
            ))}
          </Stack>
        )}
      </Stack>

      {/* 拡大表示。左右の矢印で写真を切り替える */}
      <Dialog open={open !== null} onClose={() => setOpen(null)} maxWidth="sm">
        {open !== null && (
          <Box sx={{ position: 'relative', bgcolor: 'black' }}>
            <Box component="img" src={photos[open]} alt="" sx={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', mx: 'auto' }} />
            {photos.length > 1 && (
              <>
                <IconButton onClick={() => move(-1)} sx={{ position: 'absolute', left: 8, top: '50%', color: 'white', bgcolor: 'rgba(0,0,0,0.4)' }}>
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton onClick={() => move(1)} sx={{ position: 'absolute', right: 8, top: '50%', color: 'white', bgcolor: 'rgba(0,0,0,0.4)' }}>
                  <ChevronRightIcon />
                </IconButton>
              </>
            )}
          </Box>
        )}
      </Dialog>
    </>
  )
}

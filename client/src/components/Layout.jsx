import { useEffect, useState } from 'react'
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar, Badge, BottomNavigation, BottomNavigationAction, Box, Button, Container, IconButton, Paper, Toolbar,
  Typography,
} from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ChatIcon from '@mui/icons-material/Chat'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../contexts/AuthContext.jsx'
import { apiFetch } from '../lib/api.js'
import { subscribeToIncoming } from '../lib/social.js'

// ログイン中に表示するメニュー。countKey があるものは、件数のバッジを付ける
const NAV_ITEMS = [
  { to: '/diagnosis', label: '診断', icon: <AssignmentIcon /> },
  { to: '/matches', label: 'おすすめ', icon: <FavoriteIcon /> },
  { to: '/likes', label: 'いいね', icon: <ThumbUpIcon />, countKey: 'receivedLikes' },
  { to: '/messages', label: 'メッセージ', icon: <ChatIcon />, countKey: 'unreadMessages' },
]

// アイコンに件数のバッジを付ける（0件なら表示しない）。濃いローズに白いふちを付けて、ピンクのボタンの上でも目立たせる
const BADGE_STYLE = { '& .MuiBadge-badge': { bgcolor: '#c2255c', color: 'white', border: '1.5px solid white' } }
const withBadge = (item, counts) =>
  item.countKey ? <Badge badgeContent={counts[item.countKey] ?? 0} sx={BADGE_STYLE}>{item.icon}</Badge> : item.icon

// もらったいいね・未読メッセージの件数。ページを移動したとき、メッセージが届いたとき、1分ごとに取り直す
function useNotificationCounts(user, pathname) {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    if (!user) return
    const load = () => apiFetch('/api/notifications').then(setCounts).catch(() => {})
    load()
    const timer = setInterval(load, 60 * 1000)
    const unsubscribe = subscribeToIncoming(user.id, load)
    return () => {
      clearInterval(timer)
      unsubscribe()
    }
  }, [user, pathname])

  return user ? counts : {}
}

// 全画面共通のレイアウト。<Outlet /> の位置に各ページが表示される。
// 横長の画面ではヘッダーにメニューを並べ、スマホでは画面下部にメニューを固定表示する。
export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // 今いるページに対応するメニュー（/messages/xxx でも「メッセージ」を選択中にする）
  const activeNav = NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.to ?? false
  const counts = useNotificationCounts(user, pathname)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, textDecoration: 'none' }}>
            <FavoriteIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
              タイパ婚活
            </Typography>
          </Box>

          {user ? (
            <>
              {/* 横長の画面：ヘッダーにメニューを並べる */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    startIcon={withBadge(item, counts)}
                    variant={activeNav === item.to ? 'contained' : 'text'}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              <IconButton onClick={handleLogout} aria-label="ログアウト" title="ログアウト">
                <LogoutIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login">ログイン</Button>
              <Button component={RouterLink} to="/signup" variant="contained">新規登録</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* スマホでは下部メニューに隠れないよう、下の余白を多めに取る */}
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: user ? 12 : 4, md: 6 } }}>
        <Box component="main">
          <Outlet />
        </Box>
      </Container>

      {/* スマホ：画面下部に固定するメニュー */}
      {user && (
        <Paper
          elevation={8}
          sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}
        >
          <BottomNavigation showLabels value={activeNav}>
            {NAV_ITEMS.map((item) => (
              <BottomNavigationAction
                key={item.to}
                component={RouterLink}
                to={item.to}
                value={item.to}
                label={item.label}
                icon={withBadge(item, counts)}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </>
  )
}

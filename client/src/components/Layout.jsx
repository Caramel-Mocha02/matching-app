import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { useAuth } from '../contexts/AuthContext.jsx'

// 全画面共通のヘッダー。<Outlet /> の位置に各ページが表示される
export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: { xs: 0, sm: 1 } }}>
          <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, textDecoration: 'none' }}>
            <FavoriteIcon color="primary" sx={{ mr: 1 }} />
            {/* スマホ幅ではボタンが並びきらないので、ロゴの文字を隠す */}
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
              タイパ婚活
            </Typography>
          </Box>

          {/* ログイン中かどうかでボタンを切り替える */}
          {user ? (
            <>
              <Button component={RouterLink} to="/diagnosis">診断</Button>
              <Button component={RouterLink} to="/matches">おすすめ</Button>
              <Button onClick={handleLogout} color="inherit">ログアウト</Button>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login">ログイン</Button>
              <Button component={RouterLink} to="/signup" variant="contained" sx={{ ml: 1 }}>
                新規登録
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box component="main">
          <Outlet />
        </Box>
      </Container>
    </>
  )
}

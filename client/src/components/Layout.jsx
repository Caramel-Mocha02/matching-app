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
        <Toolbar>
          <FavoriteIcon color="primary" sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, color: 'text.primary', textDecoration: 'none', fontWeight: 700 }}
          >
            タイパ婚活
          </Typography>

          {/* ログイン中かどうかでボタンを切り替える */}
          {user ? (
            <Button onClick={handleLogout}>ログアウト</Button>
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

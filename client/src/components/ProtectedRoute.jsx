import { Navigate, Outlet } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../contexts/AuthContext.jsx'

// ログインしている人だけが見られる画面を囲む。未ログインならログイン画面へ移動させる
export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import DiagnosisPage from './pages/DiagnosisPage.jsx'
import MatchesPage from './pages/MatchesPage.jsx'
import LikesPage from './pages/LikesPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'

// URLと画面の対応表
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* ここから下はログインが必要な画面 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/diagnosis" element={<DiagnosisPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/likes" element={<LikesPage />} />
          {/* /messages は一覧、/messages/相手のID はその相手とのやりとり（同じ画面で切り替える） */}
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:partnerId" element={<MessagesPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

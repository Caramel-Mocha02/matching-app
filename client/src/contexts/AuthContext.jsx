import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// ログイン状態をアプリ全体で共有するための入れ物
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true) // 起動直後、ログイン状態を確認中かどうか

  useEffect(() => {
    // 1. 起動時：ブラウザに保存されたセッションを読み込む（再読み込みしてもログインが続く理由）
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // 2. ログイン・ログアウトが起きるたびに session を更新する
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 各画面で const { user, signIn } = useAuth() のように使う
export function useAuth() {
  return useContext(AuthContext)
}

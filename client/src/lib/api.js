import { supabase } from './supabase.js'

// 自分のサーバー（Express）を呼び出す共通処理。
// ログイン中であることをサーバーに伝えるため、アクセストークンを付けて送る。
export async function apiFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      ...options.headers,
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? '通信に失敗しました。')
  return body
}

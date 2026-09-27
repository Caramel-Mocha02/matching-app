import { createClient } from '@supabase/supabase-js'

// サーバー専用の Supabase 接続。Secret key を使うので RLS に関係なく全ユーザーのデータを扱える。
// このファイルはサーバー側でのみ使い、ブラウザに渡さないこと。
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.warn('⚠ server/.env の SUPABASE_URL または SUPABASE_SECRET_KEY が未設定です（マッチング機能は使えません）')
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY || 'not-set', {
  auth: { persistSession: false },
})

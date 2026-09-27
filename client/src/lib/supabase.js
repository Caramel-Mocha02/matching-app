import { createClient } from '@supabase/supabase-js'

// .env の値を読み込んで Supabase に接続する（VITE_ で始まる変数だけがブラウザで使える）
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

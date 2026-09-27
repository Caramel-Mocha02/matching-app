import 'dotenv/config' // .env ファイルの内容を process.env に読み込む
import express from 'express'
import cors from 'cors'
import { supabaseAdmin } from './lib/supabaseAdmin.js'
import { findMatches, getSavedMatches } from './matching/index.js'
import { getExplanation } from './matching/explain.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json()) // JSON形式のリクエストを受け取れるようにする

// ログイン確認：ブラウザから送られてきたアクセストークンで、誰からのリクエストかを調べる
async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'ログインが必要です。' })

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ error: 'ログインが必要です。' })

  req.user = data.user
  next()
}

// 動作確認用：サーバーが起動しているかを返す
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

// 保存済みのマッチング結果を返す（計算はしない）
app.get('/api/matches', requireUser, async (req, res) => {
  try {
    res.json(await getSavedMatches(req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '結果の取得に失敗しました。' })
  }
})

// マッチングを計算し直して、おすすめの相手を返す
app.post('/api/matches', requireUser, async (req, res) => {
  try {
    const result = await findMatches(req.user.id)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(err.status ?? 500).json({ error: err.status ? err.message : 'マッチングに失敗しました。' })
  }
})

// おすすめの理由（AI による説明文）を返す。初回だけ作成し、以降は保存済みのものを返す
app.post('/api/matches/:partnerId/explanation', requireUser, async (req, res) => {
  try {
    res.json(await getExplanation(req.user.id, req.params.partnerId))
  } catch (err) {
    console.error(err)
    res.status(err.status ?? 500).json({ error: err.status ? err.message : '説明文の作成に失敗しました。' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

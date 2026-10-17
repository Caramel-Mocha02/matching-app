import 'dotenv/config' // .env ファイルの内容を process.env に読み込む
import express from 'express'
import cors from 'cors'
import { supabaseAdmin } from './lib/supabaseAdmin.js'
import { findMatches, getSavedMatches } from './matching/index.js'
import { getExplanation } from './matching/explain.js'
import { getLikesOverview, getConversations, getNotificationCounts } from './social.js'
import { deleteAccount } from './account.js'
import { getMyStatus, isAdmin, listPending, reviewVerification, submitVerification } from './ageVerification.js'

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

// 運営者だけが使える API に付ける（requireUser の後に使う）
function requireAdmin(req, res, next) {
  if (!isAdmin(req.user.email)) return res.status(403).json({ error: '運営者のみ利用できます。' })
  next()
}

// エラーを画面に返す共通処理（status が付いたエラーはそのメッセージを、それ以外は fallback を返す）
const sendError = (res, err, fallback) => {
  console.error(err)
  res.status(err.status ?? 500).json({ error: err.status ? err.message : fallback })
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

// メニューのバッジ用の件数（もらったいいね・未読メッセージ）を返す
app.get('/api/notifications', requireUser, async (req, res) => {
  try {
    res.json(await getNotificationCounts(req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '通知の件数を取得できませんでした。' })
  }
})

// いいねの一覧（もらった・送った・マッチング成立）を返す
// ※ いいねを送る操作はブラウザから Supabase に直接行う（RLS で送れる相手を制限している）
app.get('/api/likes', requireUser, async (req, res) => {
  try {
    res.json(await getLikesOverview(req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'いいねの一覧を取得できませんでした。' })
  }
})

// メッセージの相手一覧を返す（?with=相手のID を付けると、まだやりとりのない相手とのチャットも開ける）
// ※ メッセージの送信・受信はブラウザから Supabase に直接行う（RLS で送れる相手を制限している）
app.get('/api/conversations', requireUser, async (req, res) => {
  try {
    res.json(await getConversations(req.user.id, req.query.with))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'メッセージの一覧を取得できませんでした。' })
  }
})

// 自分の状態（年齢確認の状態・運営者かどうか）を返す
app.get('/api/me', requireUser, async (req, res) => {
  try {
    res.json(await getMyStatus(req.user))
  } catch (err) {
    sendError(res, err, '状態を取得できませんでした。')
  }
})

// 年齢確認の書類を提出する（画像はブラウザから Storage にアップロード済み）
app.post('/api/age-verification', requireUser, async (req, res) => {
  try {
    await submitVerification(req.user.id, req.body)
    res.json(await getMyStatus(req.user))
  } catch (err) {
    sendError(res, err, '提出に失敗しました。時間をおいてもう一度お試しください。')
  }
})

// 【運営者用】年齢確認の審査待ち一覧
app.get('/api/admin/age-verifications', requireUser, requireAdmin, async (req, res) => {
  try {
    res.json(await listPending())
  } catch (err) {
    sendError(res, err, '一覧を取得できませんでした。')
  }
})

// 【運営者用】承認または差し戻し（body：{ approve: true/false, note: 差し戻しの理由 }）
app.post('/api/admin/age-verifications/:userId', requireUser, requireAdmin, async (req, res) => {
  try {
    await reviewVerification(req.params.userId, { approve: req.body.approve === true, note: req.body.note })
    res.json({ ok: true })
  } catch (err) {
    sendError(res, err, '審査の保存に失敗しました。')
  }
})

// 退会：ログイン中のユーザー本人のアカウントと、すべてのデータを削除する
app.delete('/api/account', requireUser, async (req, res) => {
  try {
    await deleteAccount(req.user.id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '退会の処理に失敗しました。時間をおいてもう一度お試しください。' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

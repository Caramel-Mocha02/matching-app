// いいね・メッセージの一覧を返す処理。
// 相手のプロフィールは RLS により本人しか読めないため、サーバー側でまとめて取得する。
import { supabaseAdmin } from './lib/supabaseAdmin.js'
import { getPublicProfiles } from './lib/publicProfiles.js'
import { loadAllUsers, hasCompletedDiagnosis } from './matching/index.js'
import { scoreMatch } from './matching/score.js'

// 自分に関係するいいねを取得する
async function loadLikes(userId) {
  const { data, error } = await supabaseAdmin
    .from('likes')
    .select('from_user, to_user, created_at')
    .or(`from_user.eq.${userId},to_user.eq.${userId}`)
  if (error) throw error
  return data
}

// いいねの一覧 → { received: もらったいいね, sent: 送ったいいね, matched: マッチング成立 }
export async function getLikesOverview(userId) {
  const likes = await loadLikes(userId)
  const sentAt = Object.fromEntries(likes.filter((l) => l.from_user === userId).map((l) => [l.to_user, l.created_at]))
  const receivedAt = Object.fromEntries(likes.filter((l) => l.to_user === userId).map((l) => [l.from_user, l.created_at]))
  const partnerIds = [...new Set([...Object.keys(sentAt), ...Object.keys(receivedAt)])]

  const [profileById, users] = await Promise.all([getPublicProfiles(partnerIds), loadAllUsers()])

  // もらったいいねの相手とも相性スコアを見られるように計算する（お互いに診断を終えている場合のみ）
  const userById = Object.fromEntries(users.map((u) => [u.id, u]))
  const me = userById[userId]
  const scoreWith = (id) => {
    const partner = userById[id]
    if (!me || !partner || !hasCompletedDiagnosis(me) || !hasCompletedDiagnosis(partner)) return null
    return scoreMatch(me, partner).total
  }

  const toItem = (id, likedAt) => ({ ...profileById[id], partnerId: id, likedAt, totalScore: scoreWith(id) })
  const byNewest = (a, b) => b.likedAt.localeCompare(a.likedAt)

  return {
    received: partnerIds.filter((id) => receivedAt[id] && !sentAt[id]).map((id) => toItem(id, receivedAt[id])).sort(byNewest),
    sent: partnerIds.filter((id) => sentAt[id] && !receivedAt[id]).map((id) => toItem(id, sentAt[id])).sort(byNewest),
    matched: partnerIds
      .filter((id) => sentAt[id] && receivedAt[id])
      // マッチング成立日時 = 2人のいいねのうち、後のほう
      .map((id) => toItem(id, sentAt[id] > receivedAt[id] ? sentAt[id] : receivedAt[id]))
      .sort(byNewest),
  }
}

// メッセージの相手一覧（マッチング成立した相手）→ 最後のメッセージと未読数つき
export async function getConversations(userId) {
  const likes = await loadLikes(userId)
  const sent = new Set(likes.filter((l) => l.from_user === userId).map((l) => l.to_user))
  const matchedIds = likes.filter((l) => l.to_user === userId && sent.has(l.from_user)).map((l) => l.from_user)
  if (matchedIds.length === 0) return { conversations: [] }

  const [profileById, messagesRes] = await Promise.all([
    getPublicProfiles(matchedIds),
    supabaseAdmin
      .from('messages')
      .select('sender_id, receiver_id, body, created_at, read_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(2000),
  ])
  if (messagesRes.error) throw messagesRes.error

  const conversations = matchedIds.map((id) => {
    const withPartner = messagesRes.data.filter((m) => m.sender_id === id || m.receiver_id === id)
    const last = withPartner[0] // 新しい順に並んでいるので、先頭が最後のメッセージ
    return {
      ...profileById[id],
      partnerId: id,
      lastMessage: last ? { body: last.body, createdAt: last.created_at, fromMe: last.sender_id === userId } : null,
      unreadCount: withPartner.filter((m) => m.sender_id === id && !m.read_at).length,
    }
  })

  // 最近やりとりした相手を上に（まだやりとりしていない相手はその下）
  conversations.sort((a, b) => (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? ''))
  return { conversations }
}

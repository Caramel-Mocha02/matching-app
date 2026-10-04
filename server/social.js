// いいね・メッセージの一覧を返す処理。
// 相手のプロフィールは RLS により本人しか読めないため、サーバー側でまとめて取得する。
import { supabaseAdmin } from './lib/supabaseAdmin.js'
import { getPublicProfiles } from './lib/publicProfiles.js'
import { loadAllUsers, hasCompletedDiagnosis } from './matching/index.js'
import { scoreMatch } from './matching/score.js'

// 自分に関係するいいね・メッセージ・おすすめの相手をまとめて取得する
async function loadSocialData(userId) {
  const [likesRes, messagesRes, resultsRes] = await Promise.all([
    supabaseAdmin.from('likes').select('from_user, to_user, created_at').or(`from_user.eq.${userId},to_user.eq.${userId}`),
    supabaseAdmin
      .from('messages')
      .select('sender_id, receiver_id, body, created_at, read_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false }) // 新しい順
      .limit(2000),
    supabaseAdmin.from('matching_results').select('partner_id').eq('user_id', userId),
  ])
  for (const res of [likesRes, messagesRes, resultsRes]) if (res.error) throw res.error

  const likes = likesRes.data
  const messages = messagesRes.data
  const likedIds = new Set(likes.filter((l) => l.from_user === userId).map((l) => l.to_user))
  const likedMeIds = new Set(likes.filter((l) => l.to_user === userId).map((l) => l.from_user))
  const talkedIds = new Set(messages.map((m) => (m.sender_id === userId ? m.receiver_id : m.sender_id)))
  const recommendedIds = new Set(resultsRes.data.map((r) => r.partner_id))

  // メッセージを送れる相手（SQL の RLS と同じ条件）：
  //   おすすめに表示された相手 / 自分にいいねをくれた相手 / すでにやりとりが始まっている相手
  const canMessage = (id) => recommendedIds.has(id) || likedMeIds.has(id) || talkedIds.has(id)

  return { likes, messages, likedIds, likedMeIds, talkedIds, canMessage }
}

// メニューのバッジ用の件数 → { receivedLikes: まだ返していないいいねの数, unreadMessages: 未読メッセージの数 }
export async function getNotificationCounts(userId) {
  const [likesRes, unreadRes] = await Promise.all([
    supabaseAdmin.from('likes').select('from_user, to_user').or(`from_user.eq.${userId},to_user.eq.${userId}`),
    supabaseAdmin.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', userId).is('read_at', null),
  ])
  if (likesRes.error) throw likesRes.error
  if (unreadRes.error) throw unreadRes.error
  const liked = new Set(likesRes.data.filter((l) => l.from_user === userId).map((l) => l.to_user))
  const receivedLikes = likesRes.data.filter((l) => l.to_user === userId && !liked.has(l.from_user)).length
  return { receivedLikes, unreadMessages: unreadRes.count ?? 0 }
}

// いいねの一覧 → { received: もらったいいね, sent: 送ったいいね, matched: お互いにいいね }
export async function getLikesOverview(userId) {
  const { likes, likedIds, likedMeIds, canMessage } = await loadSocialData(userId)
  const likedAt = {}
  for (const l of likes) {
    const id = l.from_user === userId ? l.to_user : l.from_user
    if (!likedAt[id] || l.created_at > likedAt[id]) likedAt[id] = l.created_at // 新しいほうの日時
  }
  const partnerIds = Object.keys(likedAt)

  const [profileById, users] = await Promise.all([getPublicProfiles(partnerIds), loadAllUsers()])

  // もらったいいねの相手とも相性スコアを見られるように計算する（お互いに診断を終えている場合のみ）
  const userById = Object.fromEntries(users.map((u) => [u.id, u]))
  const me = userById[userId]
  const scoreWith = (id) => {
    const partner = userById[id]
    if (!me || !partner || !hasCompletedDiagnosis(me) || !hasCompletedDiagnosis(partner)) return null
    return scoreMatch(me, partner).total
  }

  const toItem = (id) => ({
    ...profileById[id],
    partnerId: id,
    likedAt: likedAt[id],
    totalScore: scoreWith(id),
    canMessage: canMessage(id),
  })
  const byNewest = (a, b) => b.likedAt.localeCompare(a.likedAt)
  const pick = (filter) => partnerIds.filter(filter).map(toItem).sort(byNewest)

  return {
    received: pick((id) => likedMeIds.has(id) && !likedIds.has(id)),
    sent: pick((id) => likedIds.has(id) && !likedMeIds.has(id)),
    matched: pick((id) => likedIds.has(id) && likedMeIds.has(id)),
  }
}

// メッセージの相手一覧 → 最後のメッセージと未読数つき
//   一覧に出るのは「やりとりがある相手」と「お互いにいいねした相手」。
//   withPartnerId を指定すると、まだやりとりのない相手でも（送れる相手なら）一覧に加える（チャットを始めるため）
export async function getConversations(userId, withPartnerId) {
  const { messages, likedIds, likedMeIds, talkedIds, canMessage } = await loadSocialData(userId)
  const ids = new Set([...talkedIds, ...[...likedIds].filter((id) => likedMeIds.has(id))])
  if (withPartnerId && canMessage(withPartnerId)) ids.add(withPartnerId)
  if (ids.size === 0) return { conversations: [] }

  const profileById = await getPublicProfiles([...ids])
  const conversations = [...ids]
    .filter((id) => profileById[id]) // 退会した相手などは除く
    .map((id) => {
      const withPartner = messages.filter((m) => m.sender_id === id || m.receiver_id === id)
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

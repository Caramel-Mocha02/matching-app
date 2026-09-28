// いいね・メッセージの送受信（ブラウザから Supabase に直接アクセスする）。
// 「誰に送れるか」はデータベースの RLS で制限しているので、画面を操作しても送れない相手には送れない。
import { supabase } from './supabase.js'

// いいねを送る。すでにいいね済み（重複エラー）の場合は成功扱いにする
export async function sendLike(userId, partnerId) {
  const { error } = await supabase.from('likes').insert({ from_user: userId, to_user: partnerId })
  if (error && error.code !== '23505') throw error // 23505 = 同じ行がすでにある
}

// 2人の間のメッセージを古い順に取得する
export async function fetchMessages(userId, partnerId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

// メッセージを送り、保存された行（id や送信日時つき）を返す
export async function sendMessage(userId, partnerId, body) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: userId, receiver_id: partnerId, body })
    .select()
    .single()
  if (error) throw error
  return data
}

// 相手から届いた未読メッセージを既読にする
export async function markAsRead(userId, partnerId) {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', userId)
    .eq('sender_id', partnerId)
    .is('read_at', null)
}

// 自分宛てのメッセージが届いたら onMessage を呼ぶ（Supabase Realtime）。戻り値は購読をやめる関数
export function subscribeToIncoming(userId, onMessage) {
  const channel = supabase
    .channel(`inbox-${userId}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
      (payload) => onMessage(payload.new),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}

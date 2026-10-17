import { useCallback, useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert, Avatar, Badge, Box, Button, ButtonBase, Card, CircularProgress, Divider, IconButton, Stack, TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '../contexts/AuthContext.jsx'
import { apiFetch } from '../lib/api.js'
import { profileLine } from '../lib/labels.js'
import { fetchMessages, markAsRead, sendMessage, subscribeToIncoming } from '../lib/social.js'

// 画面に収まる高さ（ヘッダー・下部メニュー・余白の分を引く）。この中でメッセージだけがスクロールする
const PANEL_HEIGHT = { xs: 'calc(100dvh - 190px)', md: 'calc(100dvh - 150px)' }

const formatTime = (iso) => {
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  return isToday
    ? d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
}

// 左側（スマホでは1画面）：メッセージの相手一覧
function ConversationList({ conversations, selectedId }) {
  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary" gutterBottom>まだやりとりしている相手がいません。</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          「おすすめ」に表示された相手には、いいねを待たずにメッセージを送れます。
        </Typography>
        <Button component={RouterLink} to="/matches" sx={{ mt: 1 }}>おすすめを見る</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ overflowY: 'auto', height: '100%' }}>
      {conversations.map((c) => (
        <ButtonBase
          key={c.partnerId}
          component={RouterLink}
          to={`/messages/${c.partnerId}`}
          sx={{
            display: 'flex',
            width: '100%',
            justifyContent: 'flex-start',
            textAlign: 'left',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: c.partnerId === selectedId ? '#fdeef2' : 'transparent',
          }}
        >
          <Badge badgeContent={c.unreadCount} color="primary">
            <Avatar src={c.avatarUrl ?? undefined} sx={{ bgcolor: 'primary.light' }}>{c.nickname?.[0]}</Avatar>
          </Badge>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: c.unreadCount ? 700 : 500 }}>{c.nickname}</Typography>
              {c.lastMessage && (
                <Typography variant="caption" color="text.secondary">{formatTime(c.lastMessage.createdAt)}</Typography>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              {c.lastMessage ? `${c.lastMessage.fromMe ? 'あなた：' : ''}${c.lastMessage.body}` : '最初のメッセージを送ってみましょう'}
            </Typography>
          </Box>
        </ButtonBase>
      ))}
    </Box>
  )
}

// 右側（スマホでは1画面）：1人とのやりとり
function ChatPanel({ partner, onActivity }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const partnerId = partner.partnerId

  // メッセージを読み込み、相手からの未読を既読にする。新しいメッセージが届いたら追加する
  useEffect(() => {
    let active = true
    fetchMessages(user.id, partnerId)
      .then((rows) => {
        if (!active) return
        setMessages(rows)
        markAsRead(user.id, partnerId).then(onActivity)
      })
      .catch(() => setError('メッセージを読み込めませんでした。'))

    const unsubscribe = subscribeToIncoming(user.id, (msg) => {
      if (msg.sender_id !== partnerId) return // 別の相手からのメッセージは一覧側で扱う
      setMessages((prev) => [...(prev ?? []), msg])
      markAsRead(user.id, partnerId).then(onActivity)
    })

    // Realtime は待ち受けを始めてから届くようになるまで1秒ほどかかる。
    // その間に届いたメッセージを取りこぼさないよう、2秒後に一度だけ読み直す
    const catchUp = setTimeout(() => {
      fetchMessages(user.id, partnerId).then((rows) => active && setMessages(rows)).catch(() => {})
    }, 2000)

    return () => {
      active = false
      clearTimeout(catchUp)
      unsubscribe()
    }
  }, [user.id, partnerId, onActivity])

  // 新しいメッセージが増えたら一番下までスクロールする
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    try {
      const saved = await sendMessage(user.id, partnerId, body)
      setMessages((prev) => [...(prev ?? []), saved])
      setText('')
      onActivity()
    } catch {
      setError('送信できませんでした。時間をおいてもう一度お試しください。')
    } finally {
      setSending(false)
    }
  }

  // 自分が送ったメッセージのうち、最後に読まれたもの（「既読」を表示する位置）
  const lastReadId = [...(messages ?? [])].reverse().find((m) => m.sender_id === user.id && m.read_at)?.id

  return (
    <Stack sx={{ height: '100%' }}>
      {/* 上部：相手の名前（スマホでは戻るボタンつき） */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 2, py: 1.5 }}>
        <IconButton onClick={() => navigate('/messages')} sx={{ display: { md: 'none' } }} aria-label="一覧に戻る">
          <ArrowBackIcon />
        </IconButton>
        <Avatar src={partner.avatarUrl ?? undefined} sx={{ bgcolor: 'primary.light' }}>{partner.nickname?.[0]}</Avatar>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{partner.nickname}</Typography>
          <Typography variant="caption" color="text.secondary">{profileLine(partner)}</Typography>
        </Box>
      </Stack>
      <Divider />

      {/* 中央：メッセージ（ここだけスクロールする） */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2, bgcolor: 'background.default' }}>
        {messages === null && !error && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>}
        {messages?.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            まずは挨拶から始めてみましょう。
          </Typography>
        )}
        <Stack spacing={1}>
          {messages?.map((m) => {
            const mine = m.sender_id === user.id
            return (
              <Stack key={m.id} direction="row" spacing={1} sx={{ justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
                {mine && (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right', lineHeight: 1.3 }}>
                    {m.id === lastReadId && <>既読<br /></>}
                    {formatTime(m.created_at)}
                  </Typography>
                )}
                <Box
                  sx={{
                    maxWidth: '75%',
                    px: 1.5,
                    py: 1,
                    borderRadius: 3,
                    bgcolor: mine ? 'primary.main' : 'background.paper',
                    color: mine ? 'primary.contrastText' : 'text.primary',
                    border: mine ? 0 : 1,
                    borderColor: 'divider',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <Typography variant="body2">{m.body}</Typography>
                </Box>
                {!mine && <Typography variant="caption" color="text.secondary">{formatTime(m.created_at)}</Typography>}
              </Stack>
            )
          })}
        </Stack>
        <div ref={endRef} />
      </Box>

      {/* 下部：入力欄 */}
      <Divider />
      {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}
      <Stack direction="row" spacing={1} sx={{ p: 1.5, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="メッセージを入力"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          // Ctrl（Mac は ⌘）+ Enter で送信。日本語の変換中の Enter では送信しない
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) handleSend()
          }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!text.trim() || sending} aria-label="送信">
          <SendIcon />
        </IconButton>
      </Stack>
    </Stack>
  )
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { partnerId } = useParams() // /messages/:partnerId のとき、選んでいる相手
  const [conversations, setConversations] = useState(null)
  const [error, setError] = useState('')

  // 相手を選んでいるときは ?with=相手のID を付ける（まだやりとりのない相手とも会話を始められるように）
  const loadConversations = useCallback(() => {
    apiFetch(partnerId ? `/api/conversations?with=${partnerId}` : '/api/conversations')
      .then((data) => setConversations(data.conversations))
      .catch((err) => setError(err.message))
  }, [partnerId])

  // 一覧を読み込む。メッセージが届いたら、未読数や最後のメッセージを更新するため読み直す
  useEffect(() => {
    loadConversations()
    return subscribeToIncoming(user.id, loadConversations)
  }, [user.id, loadConversations])

  if (!conversations && !error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const partner = conversations?.find((c) => c.partnerId === partnerId)

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {/* 横長の画面：左に一覧、右にやりとり。スマホ：どちらか一方を表示 */}
      <Card sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, height: PANEL_HEIGHT }}>
        <Box
          sx={{
            display: { xs: partnerId ? 'none' : 'block', md: 'block' },
            borderRight: { md: '1px solid rgba(0, 0, 0, 0.08)' }, // 一覧とやりとりの間の区切り線
            minHeight: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, px: 2, py: 1.5 }}>メッセージ</Typography>
          <Divider />
          <Box sx={{ height: 'calc(100% - 57px)' }}>
            <ConversationList conversations={conversations ?? []} selectedId={partnerId} />
          </Box>
        </Box>

        <Box sx={{ display: { xs: partnerId ? 'block' : 'none', md: 'block' }, minHeight: 0, minWidth: 0 }}>
          {partner ? (
            <ChatPanel key={partner.partnerId} partner={partner} onActivity={loadConversations} />
          ) : (
            <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {partnerId
                  ? 'この相手にはメッセージを送れません。「おすすめ」に表示された相手か、いいねをくれた相手に送れます。'
                  : '左の一覧から、メッセージを送る相手を選んでください。'}
              </Typography>
            </Stack>
          )}
        </Box>
      </Card>
    </Stack>
  )
}

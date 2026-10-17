import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'

// 自分の状態（年齢確認の状態・運営者かどうか）を取得する
//   me：{ ageVerification: { status, note, ... } または null, isAdmin } ／ 読み込み中は null
//   reload：取り直す関数（書類を提出した後などに使う）
export function useMe() {
  const [me, setMe] = useState(null)
  const reload = useCallback(() => apiFetch('/api/me').then(setMe).catch(() => setMe({ ageVerification: null, isAdmin: false })), [])

  useEffect(() => {
    reload()
  }, [reload])

  return { me, reload, setMe }
}

// 年齢確認の状態ごとの表示
export const AGE_STATUS = {
  none: { label: '未提出', description: 'メッセージを送るには、年齢確認が必要です。' },
  pending: { label: '確認中', description: '提出された書類を確認しています。通常1〜2営業日で完了します。' },
  verified: { label: '確認済み', description: '年齢確認が完了しています。' },
  rejected: { label: '差し戻し', description: '書類を確認できませんでした。内容を確認して、もう一度提出してください。' },
}
export const ageStatusOf = (me) => me?.ageVerification?.status ?? 'none'

// 画面を使わずにマッチング結果を確認するスクリプト（動作確認・ルール調整用）。
// 実行：server フォルダで npm run try-matching -- test-user-01@example.com
import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { findMatches } from '../matching/index.js'

const CATEGORY_NAMES = {
  personality: '性格', communication: '会話', lifestyle: '生活', appearance: '外見', cleanliness: '清潔感',
}

async function main() {
  const email = process.argv[2]
  if (!email) throw new Error('メールアドレスを指定してください（例：npm run try-matching -- test-user-01@example.com）')

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const user = data.users.find((u) => u.email === email)
  if (!user) throw new Error(`${email} のユーザーが見つかりません`)

  const { candidateCount, matches } = await findMatches(user.id)
  console.log(`\n${email} のマッチング結果（必須条件を通過した候補：${candidateCount}人）\n`)

  for (const m of matches) {
    const categories = Object.entries(m.categoryScores).map(([k, v]) => `${CATEGORY_NAMES[k]}${v}`).join(' / ')
    console.log(`${m.rank}位 ${m.nickname}（${m.age}歳・${m.prefecture}） 総合 ${m.totalScore}点`)
    console.log(`   ${categories}`)
    for (const g of m.details.good.slice(0, 2)) console.log(`   ◎ ${g.question} → ${g.mine} × ${g.theirs}（${g.score}）`)
    for (const c of m.details.caution.slice(0, 2)) console.log(`   △ ${c.question} → ${c.mine} × ${c.theirs}（${c.score}）`)
    for (const p of m.details.penalties) console.log(`   ✕ 減点：${p}`)
    console.log('')
  }
}

main().catch((err) => {
  console.error('エラー：', err.message)
  process.exit(1)
})

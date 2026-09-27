// 動作確認用のテストユーザー（ダミーの登録者）を作るスクリプト。
// 実行：server フォルダで npm run seed
// 何度実行しても大丈夫（前回作ったテストユーザーを削除してから作り直す）。
import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { STEPS } from '../../client/src/data/steps.js'

const USER_COUNT = 20 // 男女10人ずつ
const PASSWORD = 'dummy-password-123'

const NICKNAMES = {
  male: ['はると', 'そうた', 'ゆうき', 'りく', 'たくみ', 'しょう', 'けんた', 'だいき', 'こうへい', 'ゆうと'],
  female: ['さくら', 'あおい', 'ゆい', 'みさき', 'はるか', 'なな', 'かな', 'まい', 'りこ', 'ちひろ'],
}
const AREAS = ['東京都', '東京都', '東京都', '神奈川県', '埼玉県', '千葉県', '大阪府']

// 毎回同じ結果になる乱数（結果を見比べやすくするため）
let seed = 42
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = (list) => list[Math.floor(random() * list.length)]
const pickSome = (list, max) => list.filter(() => random() < max / list.length).slice(0, max)

// 現実の婚活ユーザーに近づけるため、一部の質問は選ばれやすい回答を指定する（同じ値を複数並べると出やすくなる）
const REALISTIC = {
  marital_history: ['none', 'none', 'none', 'none', 'none', 'none', 'divorced'],
  has_children: ['none', 'none', 'none', 'none', 'none', 'none', 'living_apart'],
  smoking: ['no', 'no', 'no', 'no', 'no', 'sometimes', 'yes'],
  marriage_intent: ['strong', 'strong', 'yes', 'yes', 'yes', 'undecided'],
  wants_children: ['yes', 'yes', 'yes', 'maybe', 'maybe', 'no'],
  annual_income: [300, 400, 400, 500, 500, 600, 600, 800, 1000],
}

// 質問1つ分のランダムな回答を作る
function randomAnswer(q, user) {
  if (REALISTIC[q.key]) return pick(REALISTIC[q.key])
  switch (q.type) {
    case 'select': return pick(q.options).value
    case 'choice': return pick(q.options).value
    case 'multiselect': return pickSome(q.options, 2).map((o) => o.value)
    case 'scale': return pick([3, 3, 2, 2, 1])
    case 'likes': {
      // 1〜2個だけ好き／苦手を付ける（それ以外は「どちらでも」）
      const likes = {}
      for (const o of pickSome(q.options, 2)) likes[o.value] = random() < 0.6 ? 'like' : 'dislike'
      return likes
    }
    case 'number':
      if (q.key === 'height') return user.gender === 'male' ? 165 + Math.floor(random() * 20) : 150 + Math.floor(random() * 18)
      return q.min
    default: return null
  }
}

// 必須条件はランダムにせず、現実的なものだけを一部の人に付ける
function mustConditions(user) {
  const conditions = {}
  if (random() < 0.5) conditions.age = { min: user.age - 6, max: user.age + 6 }
  if (random() < 0.3) conditions.smoking = ['no', 'sometimes']
  return conditions
}

function buildUser(i) {
  const gender = i % 2 === 0 ? 'male' : 'female'
  const user = {
    gender,
    nickname: NICKNAMES[gender][Math.floor(i / 2)],
    age: 26 + Math.floor(random() * 14), // 26〜39歳
    prefecture: pick(AREAS),
  }
  const rows = { profiles: { ...user }, preferences: {} }

  for (const step of STEPS) {
    if (!step.questions) continue
    if (step.group === 'must_conditions') {
      rows.preferences.must_conditions = mustConditions(user)
      continue
    }
    const target = step.about === 'partner' ? (gender === 'male' ? 'female' : 'male') : gender
    const answers = {}
    for (const q of step.questions) {
      if (q.onlyGender && q.onlyGender !== target) continue
      if (q.key in user) continue // 性別・年齢などは上で決めた値を使う
      answers[q.key] = randomAnswer(q, user)
    }
    if (step.group) rows[step.table][step.group] = answers
    else Object.assign(rows[step.table], answers)
  }
  rows.profiles.desired_residence = 'any'
  return rows
}

async function deleteOldDummies() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const dummies = data.users.filter((u) => u.user_metadata?.dummy)
  for (const u of dummies) {
    // ユーザーを消すと、profiles・preferences の行も自動で消える（on delete cascade）
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(u.id)
    if (delError) throw delError
  }
  console.log(`前回のテストユーザーを ${dummies.length} 人削除しました`)
}

async function main() {
  await deleteOldDummies()

  for (let i = 0; i < USER_COUNT; i++) {
    const rows = buildUser(i)
    const email = `test-user-${String(i + 1).padStart(2, '0')}@example.com`

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true, // 確認メールを送らずに登録済みにする
      user_metadata: { dummy: true }, // テストユーザーの目印
    })
    if (error) throw error

    const id = data.user.id
    const { error: e1 } = await supabaseAdmin.from('profiles').insert({ ...rows.profiles, id })
    if (e1) throw e1
    const { error: e2 } = await supabaseAdmin.from('preferences').insert({ ...rows.preferences, id })
    if (e2) throw e2

    console.log(`作成：${email}（${rows.profiles.nickname}・${rows.profiles.age}歳・${rows.profiles.prefecture}）`)
  }
  console.log(`\nテストユーザーを ${USER_COUNT} 人作成しました（パスワードは全員 ${PASSWORD}）`)
}

main().catch((err) => {
  console.error('エラー：', err.message)
  process.exit(1)
})

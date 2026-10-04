// 動作確認用のテストユーザー（ダミーの登録者）と、いいね・会話のサンプルを作るスクリプト。
// 実行：server フォルダで npm run seed
// 何度実行しても大丈夫（前回作ったテストユーザーを削除してから作り直す。関係するいいね・メッセージも消える）。
import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { STEPS } from '../../client/src/data/steps.js'
import { flatQuestions } from '../../client/src/lib/diagnosisProgress.js'

const USER_COUNT = 20 // 男女10人ずつ（このほかに下の EXTRA_USERS を追加する）
const PASSWORD = 'dummy-password-123'

const NICKNAMES = {
  male: ['はると', 'そうた', 'ゆうき', 'りく', 'たくみ', 'しょう', 'けんた', 'だいき', 'こうへい', 'ゆうと'],
  female: ['さくら', 'あおい', 'ゆい', 'みさき', 'はるか', 'なな', 'かな', 'まい', 'りこ', 'ちひろ'],
}
const AREAS = ['東京都', '東京都', '東京都', '神奈川県', '埼玉県', '千葉県', '大阪府']

// 婚活で人気の高い条件（追加するユーザーに共通で付ける）
const POPULAR_COMMON = { smoking: 'no', marital_history: 'none', has_children: 'none', marriage_intent: 'strong' }

// 追加するユーザー。ここに書いた項目は固定、それ以外の回答はランダム（height は外見の項目に入れる）
const EXTRA_USERS = [
  // ハイスペックな男性
  ...[
    { nickname: 'れん', age: 34, occupation: 'medical', annual_income: 1500, education: 'graduate', height: 180, prefecture: '東京都' },
    { nickname: 'かいと', age: 36, occupation: 'executive', annual_income: 1500, education: 'university', height: 178, prefecture: '東京都' },
    { nickname: 'そうすけ', age: 32, occupation: 'professional', annual_income: 1000, education: 'university', height: 176, prefecture: '東京都' },
    { nickname: 'みなと', age: 30, occupation: 'company_employee', annual_income: 1000, education: 'graduate', height: 182, prefecture: '東京都' },
    { nickname: 'あきら', age: 38, occupation: 'medical', annual_income: 1500, education: 'graduate', height: 177, prefecture: '神奈川県' },
    { nickname: 'しゅん', age: 33, occupation: 'company_employee', annual_income: 800, education: 'university', height: 185, prefecture: '東京都' },
    { nickname: 'ひろと', age: 35, occupation: 'professional', annual_income: 1000, education: 'graduate', height: 175, prefecture: '大阪府' },
    { nickname: 'ゆうせい', age: 29, occupation: 'executive', annual_income: 800, education: 'university', height: 179, prefecture: '東京都' },
  ].map((u) => ({ ...u, gender: 'male', tag: 'ハイスペック' })),
  // 追加の女性
  ...[
    { nickname: 'みゆ', age: 27, occupation: 'medical', annual_income: 400, education: 'vocational', height: 158, prefecture: '東京都' },
    { nickname: 'えりか', age: 31, occupation: 'company_employee', annual_income: 500, education: 'university', height: 162, prefecture: '東京都' },
    { nickname: 'あやか', age: 29, occupation: 'teacher', annual_income: 400, education: 'university', height: 155, prefecture: '神奈川県' },
    { nickname: 'しおり', age: 33, occupation: 'professional', annual_income: 600, education: 'graduate', height: 164, prefecture: '東京都' },
    { nickname: 'ことね', age: 26, occupation: 'company_employee', annual_income: 300, education: 'university', height: 153, prefecture: '埼玉県' },
    { nickname: 'のぞみ', age: 35, occupation: 'civil_servant', annual_income: 500, education: 'university', height: 160, prefecture: '千葉県' },
    { nickname: 'ゆきな', age: 30, occupation: 'company_employee', annual_income: 600, education: 'university', height: 165, prefecture: '東京都' },
    { nickname: 'まな', age: 28, occupation: 'other', annual_income: 300, education: 'junior_college', height: 157, prefecture: '東京都' },
  ].map((u) => ({ ...u, gender: 'female', tag: '追加' })),
]

// テストユーザー同士の会話（[男性, 女性, 最初に送る人, メッセージ…]）。メッセージは交互に送ったことにする
const SAMPLE_CONVERSATIONS = [
  ['はると', 'ちひろ', 'male', [
    'はじめまして！プロフィールを拝見して、休日の過ごし方が似ているなと思ってメッセージしました。',
    'はじめまして、メッセージありがとうございます！カフェ巡りがお好きなんですね。私もよく行きます☕',
    '本当ですか！最近行ったお店でおすすめはありますか？',
    '清澄白河のコーヒー屋さんが良かったです。はるとさんはどのあたりに行かれますか？',
    '自分は中目黒あたりが多いです。よかったら今度ご一緒しませんか？',
    'ぜひ！来週末はいかがですか？',
  ]],
  ['れん', 'さくら', 'female', [
    'はじめまして。相性診断で「会話のテンポ」が合うと出ていたので、思い切ってメッセージしてみました。',
    'はじめまして、うれしいです！僕も診断結果を見て気になっていました。',
    'お仕事は医療関係なんですね。忙しそうですが、お休みの日はどう過ごしていますか？',
    '当直明けは家でゆっくりして、それ以外は旅行に行くことが多いです。さくらさんは旅行お好きですか？',
    '大好きです！去年は金沢に行きました。',
  ]],
  ['そうすけ', 'あやか', 'male', [
    'こんにちは。家事分担の考え方が近いと出ていて、気になってメッセージしました。',
    'こんにちは！たしかに大事なところですよね。料理は得意ですか？',
    '休日に作り置きするくらいですが、料理は好きです。あやかさんは？',
    '私も作るのは好きなんですが、片付けが苦手で…笑',
    'それならちょうど良さそうですね。片付けは得意です！',
    '頼もしいです笑 今度おすすめのレシピ教えてください。',
  ]],
  ['みなと', 'えりか', 'female', [
    'はじめまして！同じ東京在住で、お仕事の雰囲気も近そうだなと思いました。',
    'はじめまして。メッセージありがとうございます。えりかさんはどんなお仕事をされているんですか？',
    'メーカーで商品企画をしています。みなとさんは？',
    'IT企業でエンジニアをしています。仕事の話になると止まらないタイプです笑',
  ]],
]

// 実際に登録しているユーザー（あなた）に届く、テストユーザーからの最初のメッセージ
const MESSAGES_TO_REAL_USERS = [
  'はじめまして！相性診断で相性が良いと出ていたのでメッセージしました。休日はどんなふうに過ごされることが多いですか？',
  'こんにちは。プロフィールを拝見して、価値観が近そうだなと感じました。よろしくお願いします！',
]

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
  if (q.about === 'self' && REALISTIC[q.key]) return pick(REALISTIC[q.key])
  switch (q.type) {
    case 'select': return pick(q.options).value
    case 'choice': return pick(q.options).value
    case 'multiselect': return pickSome(q.options, 2).map((o) => o.value)
    case 'scale': return pick([3, 3, 2, 2, 1])
    case 'photos': return []
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

// テストユーザー1人分のデータを作る。fixed：ランダムにせず固定したい項目（height は外見に入れる）
function buildUser(gender, nickname, fixed = {}) {
  const { height, ...fixedProfile } = fixed
  const user = {
    gender,
    nickname,
    age: 26 + Math.floor(random() * 14), // 26〜39歳
    prefecture: pick(AREAS),
    ...fixedProfile,
  }
  const rows = { profiles: { ...user }, preferences: {} }
  const partnerGender = gender === 'male' ? 'female' : 'male'

  for (const step of STEPS) {
    for (const q of flatQuestions(step)) {
      if (q.group === 'must_conditions') continue // 必須条件は下でまとめて作る
      if (q.onlyGender && q.onlyGender !== (q.about === 'partner' ? partnerGender : gender)) continue
      if (q.table === 'profiles' && !q.group && q.key in user) continue // 性別・年齢などは上で決めた値を使う
      const value = randomAnswer(q, user)
      if (q.group) rows[q.table][q.group] = { ...rows[q.table][q.group], [q.key]: value }
      else rows[q.table][q.key] = value
    }
  }
  rows.preferences.must_conditions = mustConditions(user)
  rows.profiles.desired_residence = 'any'
  if (height) rows.profiles.appearance.height = height
  return rows
}

// 作成するテストユーザーの一覧 → [{ gender, nickname, fixed, tag }]
function userList() {
  const list = []
  for (let i = 0; i < USER_COUNT; i++) {
    const gender = i % 2 === 0 ? 'male' : 'female'
    list.push({ gender, nickname: NICKNAMES[gender][Math.floor(i / 2)] })
  }
  for (const { nickname, gender, tag, ...spec } of EXTRA_USERS) {
    list.push({ gender, nickname, tag, fixed: { ...POPULAR_COMMON, ...spec } })
  }
  return list
}

async function deleteOldDummies() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  const dummies = data.users.filter((u) => u.user_metadata?.dummy)
  for (const u of dummies) {
    // ユーザーを消すと、profiles・preferences・いいね・メッセージの行も自動で消える（on delete cascade）
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(u.id)
    if (delError) throw delError
  }
  console.log(`前回のテストユーザーを ${dummies.length} 人削除しました`)
  return data.users.filter((u) => !u.user_metadata?.dummy) // 実際に登録しているユーザー
}

// 2人の会話を作る。日時は daysAgo 日前から、数十分〜数時間おきに並べる。最後のメッセージだけ未読にする
async function insertConversation(firstSenderId, secondSenderId, texts, daysAgo) {
  let time = Date.now() - daysAgo * 24 * 60 * 60 * 1000
  const rows = texts.map((body, i) => {
    time += (20 + Math.floor(random() * 240)) * 60 * 1000
    const createdAt = new Date(Math.min(time, Date.now() - 60 * 1000)).toISOString()
    const [sender, receiver] = i % 2 === 0 ? [firstSenderId, secondSenderId] : [secondSenderId, firstSenderId]
    return { sender_id: sender, receiver_id: receiver, body, created_at: createdAt, read_at: i === texts.length - 1 ? null : createdAt }
  })
  const { error } = await supabaseAdmin.from('messages').insert(rows)
  if (error) throw error
}

async function insertLike(fromId, toId) {
  const { error } = await supabaseAdmin.from('likes').insert({ from_user: fromId, to_user: toId })
  if (error) throw error
}

async function main() {
  const realUsers = await deleteOldDummies()

  // 1. テストユーザーを作る
  const created = [] // { id, gender, nickname, tag }
  for (const [i, u] of userList().entries()) {
    const rows = buildUser(u.gender, u.nickname, u.fixed)
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

    created.push({ id, gender: u.gender, nickname: u.nickname, tag: u.tag })
    const spec = u.fixed ? `・年収${rows.profiles.annual_income}万円〜・${rows.profiles.appearance.height}cm【${u.tag}】` : ''
    console.log(`作成：${email}（${u.nickname}・${rows.profiles.age}歳・${rows.profiles.prefecture}${spec}）`)
  }
  const idOf = (nickname) => created.find((u) => u.nickname === nickname).id

  // 2. テストユーザー同士の会話（お互いにいいねもしておく）
  for (const [i, [man, woman, first, texts]] of SAMPLE_CONVERSATIONS.entries()) {
    const [a, b] = first === 'male' ? [idOf(man), idOf(woman)] : [idOf(woman), idOf(man)]
    await insertLike(a, b)
    await insertLike(b, a)
    await insertConversation(a, b, texts, SAMPLE_CONVERSATIONS.length - i)
    console.log(`会話：${man} × ${woman}（${texts.length}通）`)
  }

  // 3. 指定したユーザー（.env の SEED_DEMO_EMAILS）にだけ、異性のテストユーザーからいいねと最初のメッセージを届ける
  //    ほかの実ユーザーには送らない（指定がなければ誰にも送らない）
  const demoEmails = (process.env.SEED_DEMO_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)
  for (const real of realUsers.filter((u) => demoEmails.includes(u.email))) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('gender').eq('id', real.id).maybeSingle()
    if (!profile?.gender) continue // 性別が未登録なら送らない
    const senders = created.filter((u) => u.gender !== profile.gender && u.tag).slice(0, 4)
    for (const [i, s] of senders.entries()) {
      await insertLike(s.id, real.id) // 4人ともいいね
      if (i < MESSAGES_TO_REAL_USERS.length) await insertConversation(s.id, real.id, [MESSAGES_TO_REAL_USERS[i]], 1)
    }
    console.log(`${real.email} に、${senders.map((s) => s.nickname).join('・')} からいいね（うち${MESSAGES_TO_REAL_USERS.length}人はメッセージも）`)
  }

  console.log(`\nテストユーザーを ${created.length} 人作成しました（パスワードは全員 ${PASSWORD}）`)
}

main().catch((err) => {
  console.error('エラー：', err.message)
  process.exit(1)
})

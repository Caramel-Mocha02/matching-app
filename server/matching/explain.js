// Phase 10：「なぜこの人がおすすめなのか」の説明文を作る。
// スコアはプログラムで計算済み。AI には、その結果を「文章にすること」だけを頼む。
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const MODEL = 'claude-opus-5'
// API キーが無い場合は AI を使わず、定型文で説明する
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null

const CATEGORY_NAMES = {
  personality: '性格・内面', communication: '会話', lifestyle: '結婚・生活価値観', appearance: '外見', cleanliness: '清潔感',
}

// AI への指示（ここを書き換えると、説明文の書き方を調整できる）
const INSTRUCTIONS = `あなたは婚活アプリの相性アドバイザーです。
プログラムが計算した相性データをもとに、「なぜこのお相手がおすすめなのか」をユーザー本人に向けて説明してください。

# 守ること
- 点数を変えたり、評価し直したりしない。渡されたデータにないことを事実のように書かない。
- 「完璧」「運命」「必ずうまくいく」「最高の相性」などの断定はしない。「〜しやすいでしょう」「〜かもしれません」のように書く。
- 相性が良い点を2〜3個書く。2人の回答の組み合わせが、なぜ良いのかを具体的に書く。似ている点だけでなく、違いが補い合っている点もあれば触れる。
- 注意したい点を1〜2個書く。相手を否定せず、会ったときや話し合うときのヒントを添える。
- 外見・容姿・年収には触れない。
- です・ます調で、全体で300字程度にする。

# 出力の形式（この形式だけを出力する）
【相性が良いポイント】
・（1つ目）
・（2つ目）
【注意したいポイント】
・（1つ目）
（最後に、前向きな一言を1文）`

// AI に渡す材料を文章にまとめる
function buildInput(row, nickname) {
  const lines = [
    `お相手：${nickname}さん`,
    `総合相性スコア：${row.total_score}点`,
    `分野別スコア：${Object.entries(row.category_scores).map(([k, v]) => `${CATEGORY_NAMES[k]}${v}点`).join('、')}`,
    '',
    '相性が良い組み合わせ（あなたの回答 × お相手の回答）：',
    ...row.details.good.map((g) => `- ${g.topic}：「${g.mine}」×「${g.theirs}」`),
    '',
    '違いが大きい組み合わせ（あなたの回答 × お相手の回答）：',
    ...row.details.caution.map((c) => `- ${c.topic}：「${c.mine}」×「${c.theirs}」`),
    ...row.details.penalties.map((p) => `- ${p}`),
  ]
  return lines.join('\n')
}

// API キーが無いときの定型文
function templateExplanation(row, nickname) {
  const good = row.details.good.slice(0, 3).map((g) => `・${g.topic}：あなたは「${g.mine}」、${nickname}さんは「${g.theirs}」です。`)
  const caution = [
    ...row.details.caution.slice(0, 2).map((c) => `・${c.topic}：あなたは「${c.mine}」、${nickname}さんは「${c.theirs}」です。`),
    ...row.details.penalties.slice(0, 1).map((p) => `・${p}`),
  ]
  return [
    '【相性が良いポイント】',
    ...(good.length > 0 ? good : ['・全体的にバランスの取れた組み合わせです。']),
    '【注意したいポイント】',
    ...(caution.length > 0 ? caution : ['・大きな違いは見つかりませんでしたが、実際に話して確かめてみましょう。']),
    '気になる点は、会ったときにお互いの考えを聞いてみてください。',
  ].join('\n')
}

// 説明文を取得する。保存済みならそれを返し、無ければ作って保存する
export async function getExplanation(userId, partnerId) {
  const { data: row, error } = await supabaseAdmin
    .from('matching_results')
    .select('*')
    .eq('user_id', userId)
    .eq('partner_id', partnerId)
    .maybeSingle()
  if (error) throw error
  if (!row) {
    const notFound = new Error('マッチング結果が見つかりません。')
    notFound.status = 404
    throw notFound
  }
  if (row.explanation) return { explanation: row.explanation }

  const { data: partner } = await supabaseAdmin.from('profiles').select('nickname').eq('id', partnerId).single()
  const nickname = partner?.nickname ?? 'お相手'

  // API キーが無い間は定型文を返す（保存しないので、キーを設定すれば AI の説明に切り替わる）
  if (!anthropic) return { explanation: templateExplanation(row, nickname) }

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: INSTRUCTIONS,
      messages: [{ role: 'user', content: buildInput(row, nickname) }],
      output_config: { effort: 'low' }, // 短い文章を書くだけなので、考える量は少なめでよい
      // 安全のための判定で断られた場合に、自動で別のモデルで作り直す
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    })

    // それでも断られた場合は、定型文にする
    if (response.stop_reason === 'refusal') {
      return { explanation: templateExplanation(row, nickname) }
    }

    // 返ってきた内容のうち、文章（text）の部分だけをつなげる
    const explanation = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    await supabaseAdmin.from('matching_results').update({ explanation }).eq('id', row.id)
    return { explanation }
  } catch (err) {
    // AI の呼び出しに失敗しても画面が空にならないよう、定型文を返す（保存はしない）
    console.error('Claude API エラー：', err.message)
    return { explanation: templateExplanation(row, nickname) }
  }
}

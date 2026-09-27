// Phase 8：相性スコアの計算。
// 点数の決め方（ルール）は rules.js にあり、このファイルは計算の手順だけを担当する。
import { PERSONALITY_QUESTIONS } from '../../client/src/data/personalityQuestions.js'
import { COMMUNICATION_QUESTIONS } from '../../client/src/data/communicationQuestions.js'
import { LIFESTYLE_QUESTIONS } from '../../client/src/data/lifestyleQuestions.js'
import { MARRIAGE_QUESTIONS } from '../../client/src/data/profileQuestions.js'
import { APPEARANCE_PREFERENCE_QUESTIONS } from '../../client/src/data/appearanceQuestions.js'
import { CLEANLINESS_SELF_QUESTIONS } from '../../client/src/data/cleanlinessQuestions.js'
import {
  WEIGHTS, DISTANCE_SCORES, PAIR_RULES, PENALTIES, LIKE_SCORES, HEIGHT_SCORES,
  CLEANLINESS_LEVEL_SCORES, GOOD_POINT_MIN, CAUTION_POINT_MAX,
} from './rules.js'

// 「結婚条件」のうち、生活価値観として相性を見る項目
const MARRIAGE_KEYS_FOR_SCORE = [
  'marriage_intent', 'marriage_timing', 'wants_children', 'dual_income', 'relocation', 'living_with_parents',
]

// 分野ごとの質問一覧。path は profiles の中での場所（'personality.planning' や 'dual_income'）
const withPath = (prefix, questions) => questions.map((q) => ({ path: prefix ? `${prefix}.${q.key}` : q.key, q }))
const CATEGORY_QUESTIONS = {
  personality: withPath('personality', PERSONALITY_QUESTIONS),
  communication: withPath('communication', COMMUNICATION_QUESTIONS),
  lifestyle: [
    ...withPath('lifestyle', LIFESTYLE_QUESTIONS),
    ...withPath(null, MARRIAGE_QUESTIONS.filter((q) => MARRIAGE_KEYS_FOR_SCORE.includes(q.key))),
  ],
}

// 'personality.planning' のような path で値を取り出す
const getValue = (profile, path) => path.split('.').reduce((obj, key) => obj?.[key], profile)
const labelOf = (q, value) => q.options.find((o) => o.value === value)?.label ?? value
const average = (items) => {
  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0)
  if (totalWeight === 0) return null
  return items.reduce((sum, it) => sum + it.score * it.weight, 0) / totalWeight
}

// 2人の回答の組み合わせから、1つの質問の点数（0〜100）を出す
export function pairScore(path, q, a, b) {
  const pairs = PAIR_RULES[path]?.pairs ?? {}
  // 組み合わせルールがあればそれを使う（A×B でも B×A でも見つかるようにする）
  const fromRule = pairs[`${a}×${b}`] ?? pairs[`${b}×${a}`]
  if (fromRule != null) return fromRule

  // 無ければ類似性：選択肢がいくつ離れているかで点数を決める
  const values = q.options.map((o) => o.value)
  const i = values.indexOf(a)
  const j = values.indexOf(b)
  if (i < 0 || j < 0) return null
  return DISTANCE_SCORES[values.length][Math.abs(i - j)]
}

// 性格・会話・生活価値観：質問ごとの点数の加重平均
function scoreCategory(category, profileA, profileB) {
  const items = []
  for (const { path, q } of CATEGORY_QUESTIONS[category]) {
    const a = getValue(profileA, path)
    const b = getValue(profileB, path)
    const score = pairScore(path, q, a, b)
    if (score == null) continue // どちらかが未回答の質問は計算に入れない
    items.push({
      category,
      question: q.label,
      mine: labelOf(q, a),
      theirs: labelOf(q, b),
      score,
      weight: PAIR_RULES[path]?.weight ?? 1,
    })
  }
  return { score: average(items), items }
}

// 外見（片方向）：「好みを持つ人」から見て「相手の外見」が何点か
function appearanceOneWay(prefs = {}, appearance = {}) {
  const scores = APPEARANCE_PREFERENCE_QUESTIONS.map((q) => {
    const value = appearance[q.key]
    if (q.key === 'height') {
      const range = prefs.height ?? {}
      if (range.min == null && range.max == null) return HEIGHT_SCORES.noPreference
      if (value == null) return HEIGHT_SCORES.noPreference
      const below = range.min != null ? range.min - value : 0
      const above = range.max != null ? value - range.max : 0
      const gap = Math.max(below, above, 0)
      if (gap === 0) return HEIGHT_SCORES.inRange
      return gap <= HEIGHT_SCORES.nearCm ? HEIGHT_SCORES.near : HEIGHT_SCORES.far
    }
    const likes = prefs[q.key] ?? {}
    // 雰囲気は複数選択なので、1つでも「好き」があれば好き、「苦手」だけなら苦手とみなす
    const values = Array.isArray(value) ? value : [value]
    if (values.some((v) => likes[v] === 'like')) return LIKE_SCORES.like
    if (values.some((v) => likes[v] === 'dislike')) return LIKE_SCORES.dislike
    return LIKE_SCORES.neutral
  })
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// 清潔感（片方向）：自分が重視する項目ほど、相手の気をつけ具合が強く影響する
function cleanlinessOneWay(importance = {}, cleanliness = {}) {
  const items = CLEANLINESS_SELF_QUESTIONS.map((q) => ({
    score: CLEANLINESS_LEVEL_SCORES[cleanliness[q.key]] ?? CLEANLINESS_LEVEL_SCORES[2],
    weight: importance[q.key] ?? 2, // 重視する=3、普通=2、気にしない=1
  }))
  return average(items)
}

// 明らかに相性が悪い組み合わせを探す
function findPenalties(profileA, profileB) {
  return PENALTIES.filter(({ path, pair }) => {
    const a = getValue(profileA, path)
    const b = getValue(profileB, path)
    return pair === `${a}×${b}` || pair === `${b}×${a}`
  })
}

// 2人の相性を計算する。me / other は { profile, preferences }
export function scoreMatch(me, other) {
  const personality = scoreCategory('personality', me.profile, other.profile)
  const communication = scoreCategory('communication', me.profile, other.profile)
  const lifestyle = scoreCategory('lifestyle', me.profile, other.profile)

  // 外見と清潔感は、お互いから見た点数の平均（2人の組み合わせとして見るため）
  const appearance = (
    appearanceOneWay(me.preferences.appearance, other.profile.appearance)
    + appearanceOneWay(other.preferences.appearance, me.profile.appearance)
  ) / 2
  const cleanliness = (
    cleanlinessOneWay(me.preferences.cleanliness, other.profile.cleanliness)
    + cleanlinessOneWay(other.preferences.cleanliness, me.profile.cleanliness)
  ) / 2

  const categoryScores = {
    personality: Math.round(personality.score ?? 0),
    communication: Math.round(communication.score ?? 0),
    lifestyle: Math.round(lifestyle.score ?? 0),
    appearance: Math.round(appearance),
    cleanliness: Math.round(cleanliness),
  }

  // 総合スコア = 分野別スコア × 配分 の合計 − 減点
  const penalties = findPenalties(me.profile, other.profile)
  const weighted = Object.entries(WEIGHTS).reduce((sum, [key, w]) => sum + categoryScores[key] * w, 0)
  const penaltyTotal = penalties.reduce((sum, p) => sum + p.points, 0)
  const total = Math.max(0, Math.min(100, Math.round(weighted - penaltyTotal)))

  // 説明文（Phase 10）の材料：相性が良い点・注意したい点
  const allItems = [...personality.items, ...communication.items, ...lifestyle.items]
  const strip = (it) => ({ category: it.category, question: it.question, mine: it.mine, theirs: it.theirs, score: it.score })
  const good = allItems.filter((it) => it.score >= GOOD_POINT_MIN).sort((a, b) => b.score - a.score).slice(0, 5).map(strip)
  const caution = allItems.filter((it) => it.score <= CAUTION_POINT_MAX).sort((a, b) => a.score - b.score).slice(0, 5).map(strip)

  return {
    total,
    categoryScores,
    details: { good, caution, penalties: penalties.map((p) => p.reason) },
  }
}

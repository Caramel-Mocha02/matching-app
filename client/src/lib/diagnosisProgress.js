// 診断の回答の読み書きと、「どこまで答えたか」の判定をまとめたファイル。
// 診断画面・ステップ一覧（StepNavigator）・テストユーザー作成（seed.js）から使う。
import { STEPS } from '../data/steps.js'

// 未回答かどうか（年収の「0」は回答済みとして扱うため、null・空文字・空の配列だけを未回答にする）
export const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

// ステップに含まれる質問をすべて取り出す（組にした項目は、自分・相手の2問に分ける）
export const flatQuestions = (step) =>
  (step.items ?? []).flatMap((item) => ('self' in item ? [item.self, item.partner] : [item])).filter(Boolean)

// 質問の回答を読む／書く（group があれば JSON 列の中、無ければテーブルの列）
export const getValue = (data, q) => {
  const row = data[q.table] ?? {}
  return q.group ? row[q.group]?.[q.key] : row[q.key]
}
export const setValue = (data, q, value) => {
  const row = data[q.table] ?? {}
  const newRow = q.group ? { ...row, [q.group]: { ...row[q.group], [q.key]: value } } : { ...row, [q.key]: value }
  return { ...data, [q.table]: newRow }
}

// 性別で出し分ける質問（ヒゲなど）を表示するか。自分についてなら自分の性別、相手についてなら相手の性別で判定する
export const isVisible = (data, q) => {
  if (!q?.onlyGender) return Boolean(q)
  const myGender = data.profiles.gender
  const gender = q.about === 'partner' ? (myGender === 'male' ? 'female' : 'male') : myGender
  return q.onlyGender === gender
}

// 画面に表示する項目（組にした項目は、表示しない側を null にする。両方とも表示しなければ項目ごと除く）
export const getVisibleItems = (data, step) =>
  (step.items ?? [])
    .map((item) => {
      if (!('self' in item)) return isVisible(data, item) ? item : null
      const self = isVisible(data, item.self) ? item.self : null
      const partner = isVisible(data, item.partner) ? item.partner : null
      return self || partner ? { ...item, self, partner } : null
    })
    .filter(Boolean)

// 回答が必須の質問
const getRequiredQuestions = (data, step) => flatQuestions(step).filter((q) => isVisible(data, q) && !q.optional)

// そのステップの回答数 → { answered: 答えた数, total: 必須の質問数 }
export const countStep = (data, step) => {
  const required = getRequiredQuestions(data, step)
  return { answered: required.filter((q) => !isEmpty(getValue(data, q))).length, total: required.length }
}

// そのステップの必須項目がすべて入力済みか
export const isStepComplete = (data, step) => {
  const { answered, total } = countStep(data, step)
  return answered === total
}

// 全ステップの合計 → { answered, total }
export const countAll = (data) =>
  STEPS.filter((s) => s.items).reduce(
    (sum, s) => {
      const c = countStep(data, s)
      return { answered: sum.answered + c.answered, total: sum.total + c.total }
    },
    { answered: 0, total: 0 },
  )

// 保存用のデータをテーブルごとに作る → { profiles: {...}, preferences: {...} }
//   group があれば JSON 列ごと、無ければ1項目ずつ列に保存する
export const buildPayloads = (data, step) => {
  const payloads = {}
  for (const q of flatQuestions(step)) {
    const row = data[q.table] ?? {}
    payloads[q.table] ??= {}
    if (q.group) payloads[q.table][q.group] = row[q.group] ?? {}
    else payloads[q.table][q.key] = row[q.key] ?? (q.type === 'photos' ? [] : null)
  }
  return payloads
}

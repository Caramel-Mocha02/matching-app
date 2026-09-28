// 診断の「どこまで答えたか」を判定する処理をまとめたファイル。
// 診断画面とステップ一覧（StepNavigator）の両方から使う。
import { STEPS } from '../data/steps.js'

// 未回答かどうか（年収の「0」は回答済みとして扱うため、null・空文字・空の配列だけを未回答にする）
export const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

// そのステップの回答を取り出す。group があれば JSON 列の中身、無ければテーブルの行そのもの
export const getStepValues = (data, step) => {
  const row = data[step.table] ?? {}
  return step.group ? row[step.group] ?? {} : row
}

// そのステップで表示する質問（ヒゲなど性別で出し分ける質問を除く）
// 自分についての質問なら自分の性別、相手についての質問なら相手の性別で判定する
export const getVisibleQuestions = (data, step) => {
  const myGender = data.profiles.gender
  const targetGender = step.about === 'partner' ? (myGender === 'male' ? 'female' : 'male') : myGender
  return (step.questions ?? []).filter((q) => !q.onlyGender || q.onlyGender === targetGender)
}

// 回答が必須の質問（任意のステップ・任意の質問を除く）
const getRequiredQuestions = (data, step) =>
  step.optional ? [] : getVisibleQuestions(data, step).filter((q) => !q.optional)

// そのステップの回答数 → { answered: 答えた数, total: 必須の質問数 }
export const countStep = (data, step) => {
  const values = getStepValues(data, step)
  const required = getRequiredQuestions(data, step)
  return { answered: required.filter((q) => !isEmpty(values[q.key])).length, total: required.length }
}

// そのステップの必須項目がすべて入力済みか
export const isStepComplete = (data, step) => {
  const { answered, total } = countStep(data, step)
  return answered === total
}

// 全ステップの合計 → { answered, total }
export const countAll = (data) =>
  STEPS.filter((s) => s.questions).reduce(
    (sum, s) => {
      const c = countStep(data, s)
      return { answered: sum.answered + c.answered, total: sum.total + c.total }
    },
    { answered: 0, total: 0 },
  )

// 保存用のデータを作る（group があれば JSON 列ごと、無ければ1項目ずつ列に保存）
export const buildPayload = (data, step) => {
  const values = getStepValues(data, step)
  return step.group
    ? { [step.group]: values }
    : Object.fromEntries(step.questions.map((q) => [q.key, values[q.key] ?? null]))
}

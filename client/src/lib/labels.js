import { BASIC_QUESTIONS } from '../data/profileQuestions.js'

// 保存されている値（'company_employee' や 400）を、画面用の文字（'会社員' や '400〜500万円'）に変える
export const labelOf = (key, value) =>
  BASIC_QUESTIONS.find((q) => q.key === key)?.options?.find((o) => o.value === value)?.label ?? value

// 「29歳・会社員・東京都」のような1行の紹介文
export const profileLine = (p) => [p.age && `${p.age}歳`, labelOf('occupation', p.occupation), p.prefecture].filter(Boolean).join('・')

import { BASIC_QUESTIONS, MARRIAGE_QUESTIONS, PREFECTURES } from './profileQuestions.js'

// プロフィールの質問から選択肢を借りてくる（選択肢を二重に管理しないため）
const optionsOf = (key) => [...BASIC_QUESTIONS, ...MARRIAGE_QUESTIONS].find((q) => q.key === key).options

// 必須条件の質問一覧。key は profiles の列名とそろえる（Phase 7 の絞り込みでそのまま使うため）
//   type: 'range'（下限〜上限） / 'multiselect'（許容する値を複数選ぶ） / 'select'
//   何も選ばなければ「条件なし」として扱う
export const MUST_CONDITION_QUESTIONS = [
  { key: 'age', label: '年齢', type: 'range', unit: '歳', min: 18, max: 99 },
  {
    key: 'prefecture', label: '居住地', type: 'multiselect',
    options: PREFECTURES.map((p) => ({ value: p, label: p })),
  },
  { key: 'smoking', label: '喫煙', type: 'multiselect', options: optionsOf('smoking') },
  { key: 'marital_history', label: '婚姻歴', type: 'multiselect', options: optionsOf('marital_history') },
  { key: 'has_children', label: '子どもの有無', type: 'multiselect', options: optionsOf('has_children') },
  { key: 'marriage_intent', label: '結婚意思', type: 'multiselect', options: optionsOf('marriage_intent') },
  { key: 'wants_children', label: '子ども希望', type: 'multiselect', options: optionsOf('wants_children') },
  {
    key: 'annual_income', label: '年収（下限）', type: 'select',
    // 0 =「こだわらない」（0万円以上＝誰でもOK）
    options: [{ value: 0, label: 'こだわらない' }, ...optionsOf('annual_income').slice(1).map((o) => ({ ...o, label: `${o.value}万円以上` }))],
  },
]

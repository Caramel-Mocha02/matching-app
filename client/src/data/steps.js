import { BASIC_QUESTIONS, MARRIAGE_QUESTIONS } from './profileQuestions.js'
import { MUST_CONDITION_QUESTIONS } from './mustConditionQuestions.js'

// 診断ステップの一覧。上から順に表示される。
//   table:    保存先のテーブル（'profiles' または 'preferences'）
//   group:    JSON 列にまとめて保存する場合の列名（省略時は1項目＝1列で保存）
//   optional: true なら未入力のまま次へ進める
//   questions が無いステップは、まだ中身を作っていない仮のステップ
export const STEPS = [
  { title: '基本情報', table: 'profiles', questions: BASIC_QUESTIONS },
  { title: '結婚条件', table: 'profiles', questions: MARRIAGE_QUESTIONS },
  {
    title: '必須条件',
    description: 'お相手に「これだけは譲れない」条件を選んでください。選ばなかった項目は条件なしになります。条件を増やすほど紹介できる人数は減ります。',
    table: 'preferences',
    group: 'must_conditions',
    optional: true,
    questions: MUST_CONDITION_QUESTIONS,
  },
  { title: '外見の好み' },
  { title: '性格・内面' },
  { title: '会話' },
  { title: '生活価値観' },
  { title: '確認' },
]

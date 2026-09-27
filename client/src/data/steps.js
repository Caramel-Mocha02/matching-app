import { BASIC_QUESTIONS, MARRIAGE_QUESTIONS } from './profileQuestions.js'
import { MUST_CONDITION_QUESTIONS } from './mustConditionQuestions.js'
import { APPEARANCE_SELF_QUESTIONS, APPEARANCE_PREFERENCE_QUESTIONS } from './appearanceQuestions.js'
import { CLEANLINESS_SELF_QUESTIONS, CLEANLINESS_PREFERENCE_QUESTIONS } from './cleanlinessQuestions.js'

// 診断ステップの一覧。上から順に表示される。
//   table:    保存先のテーブル（'profiles' または 'preferences'）
//   group:    JSON 列にまとめて保存する場合の列名（省略時は1項目＝1列で保存）
//   about:    'self'（自分について） / 'partner'（相手について）。性別で出し分ける質問に使う
//   optional: true なら未入力のまま次へ進める
//   questions が無いステップは、まだ中身を作っていない仮のステップ
export const STEPS = [
  { title: '基本情報', table: 'profiles', about: 'self', questions: BASIC_QUESTIONS },
  { title: '結婚条件', table: 'profiles', about: 'self', questions: MARRIAGE_QUESTIONS },
  {
    title: '必須条件',
    description: 'お相手に「これだけは譲れない」条件を選んでください。選ばなかった項目は条件なしになります。条件を増やすほど紹介できる人数は減ります。',
    table: 'preferences',
    group: 'must_conditions',
    about: 'partner',
    optional: true,
    questions: MUST_CONDITION_QUESTIONS,
  },
  {
    title: 'あなたの外見',
    description: 'ご自身に一番近いものを選んでください。',
    table: 'profiles',
    group: 'appearance',
    about: 'self',
    questions: APPEARANCE_SELF_QUESTIONS,
  },
  {
    title: '外見の好み',
    description: 'こだわりがある項目だけ「好き」「苦手」を選んでください。それ以外は「どちらでも」のままで大丈夫です。',
    table: 'preferences',
    group: 'appearance',
    about: 'partner',
    optional: true,
    questions: APPEARANCE_PREFERENCE_QUESTIONS,
  },
  {
    title: 'あなたの身だしなみ',
    description: 'ふだん、それぞれどのくらい気をつけていますか？',
    table: 'profiles',
    group: 'cleanliness',
    about: 'self',
    questions: CLEANLINESS_SELF_QUESTIONS,
  },
  {
    title: '清潔感の好み',
    description: 'お相手のそれぞれの項目を、どのくらい重視しますか？',
    table: 'preferences',
    group: 'cleanliness',
    about: 'partner',
    optional: true,
    questions: CLEANLINESS_PREFERENCE_QUESTIONS,
  },
  { title: '性格・内面' },
  { title: '会話' },
  { title: '生活価値観' },
  { title: '確認' },
]

import { BASIC_QUESTIONS, MARRIAGE_QUESTIONS } from './profileQuestions.js'
import { MUST_CONDITION_QUESTIONS } from './mustConditionQuestions.js'
import { APPEARANCE_SELF_QUESTIONS, APPEARANCE_PREFERENCE_QUESTIONS } from './appearanceQuestions.js'
import { CLEANLINESS_SELF_QUESTIONS, CLEANLINESS_PREFERENCE_QUESTIONS } from './cleanlinessQuestions.js'
import { PERSONALITY_QUESTIONS } from './personalityQuestions.js'
import { COMMUNICATION_QUESTIONS } from './communicationQuestions.js'
import { LIFESTYLE_QUESTIONS } from './lifestyleQuestions.js'

// ------------------------------------------------------------
// 質問ごとの保存先
// ------------------------------------------------------------
// 質問ひとつひとつに「どこに保存するか」を付けておく。こうすると、保存先の違う質問を
// 1つのステップにまとめられる（例：自分の体型は profiles、相手に求める体型は preferences）。
//   table:    保存先のテーブル（'profiles' または 'preferences'）
//   group:    JSON 列にまとめて保存する場合の列名（無ければ1項目＝1列で保存）
//   about:    'self'（自分について） / 'partner'（相手について）。性別で出し分ける質問に使う
//   optional: true なら未入力でも次へ進める
const withTarget = (questions, target) => questions.map((q) => ({ ...q, ...target }))
const find = (list, key) => list.find((q) => q.key === key)

const basic = withTarget(BASIC_QUESTIONS, { table: 'profiles', about: 'self' })
const marriage = withTarget(MARRIAGE_QUESTIONS, { table: 'profiles', about: 'self' })
const must = withTarget(MUST_CONDITION_QUESTIONS, { table: 'preferences', group: 'must_conditions', about: 'partner', optional: true })
const appearanceSelf = withTarget(APPEARANCE_SELF_QUESTIONS, { table: 'profiles', group: 'appearance', about: 'self' })
const appearancePref = withTarget(APPEARANCE_PREFERENCE_QUESTIONS, {
  table: 'preferences', group: 'appearance', about: 'partner', optional: true, inline: true,
})
const cleanlinessSelf = withTarget(CLEANLINESS_SELF_QUESTIONS, { table: 'profiles', group: 'cleanliness', about: 'self' })
const cleanlinessPref = withTarget(CLEANLINESS_PREFERENCE_QUESTIONS, { table: 'preferences', group: 'cleanliness', about: 'partner', optional: true })

// ------------------------------------------------------------
// 「自分」と「相手に求めること」を1つの項目にまとめる
// ------------------------------------------------------------
//   { label: 項目名, self: 自分についての質問, partner: 相手についての質問 }
const pair = (label, self, partner) => ({ label, self, partner })
// 基本情報・結婚の項目と、必須条件を組にする（例：自分の年齢 ＋ 相手の年齢の範囲）
const withMust = (list, key) =>
  pair(find(list, key).label, { ...find(list, key), label: 'あなた' }, { ...find(must, key), label: 'お相手に求める条件' })

// ------------------------------------------------------------
// 診断ステップの一覧（上から順に表示される）
// ------------------------------------------------------------
//   items：質問、または pair() で組にした項目の並び
//   items が無いステップは「確認」ステップ（入力状況の一覧を表示する）
export const STEPS = [
  {
    title: '基本情報',
    description: '右側（スマホでは下側）の「お相手に求める条件」は必須条件です。合わない人は紹介しません。選ばなければ条件なしになります。',
    items: [
      find(basic, 'photo_paths'),
      find(basic, 'nickname'),
      find(basic, 'gender'),
      withMust(basic, 'age'),
      withMust(basic, 'prefecture'),
      find(basic, 'occupation'),
      withMust(basic, 'annual_income'),
      find(basic, 'education'),
      withMust(basic, 'marital_history'),
      withMust(basic, 'has_children'),
      withMust(basic, 'smoking'),
    ],
  },
  {
    title: '結婚について',
    description: '「お相手に求める条件」は必須条件です。条件を増やすほど紹介できる人数は減ります。',
    items: [
      withMust(marriage, 'marriage_intent'),
      find(marriage, 'marriage_timing'),
      withMust(marriage, 'wants_children'),
      ...['desired_children_count', 'dual_income', 'desired_residence', 'relocation', 'living_with_parents'].map((k) => find(marriage, k)),
    ],
  },
  {
    title: '外見',
    description: '「あなた」はご自身に一番近いものを、「お相手の好み」はこだわりがある選択肢だけ「好き」「苦手」を選んでください。',
    items: appearanceSelf.map((q) =>
      pair(
        q.label.replace('（当てはまるものをすべて）', ''),
        { ...q, label: q.type === 'multiselect' ? 'あなた（当てはまるものをすべて）' : 'あなた' },
        { ...find(appearancePref, q.key), label: 'お相手の好み' },
      ),
    ),
  },
  {
    title: '清潔感',
    description: 'ご自身がふだんどのくらい気をつけているかと、お相手のその項目をどのくらい重視するかを選んでください。',
    items: cleanlinessSelf.map((q) =>
      pair(q.label, { ...q, label: 'あなたの気をつけ具合' }, { ...find(cleanlinessPref, q.key), label: 'お相手に求める度合い' }),
    ),
  },
  {
    title: '性格・内面',
    description: '正解はありません。理想ではなく、実際の自分に一番近いものを選んでください。',
    items: withTarget(PERSONALITY_QUESTIONS, { table: 'profiles', group: 'personality', about: 'self' }),
  },
  {
    title: '会話',
    description: 'ふだんの会話や、意見が合わないときのことを思い浮かべて答えてください。',
    items: withTarget(COMMUNICATION_QUESTIONS, { table: 'profiles', group: 'communication', about: 'self' }),
  },
  {
    title: '生活価値観',
    description: '結婚後の暮らしを想像して答えてください。',
    items: withTarget(LIFESTYLE_QUESTIONS, { table: 'profiles', group: 'lifestyle', about: 'self' }),
  },
  { title: '確認' },
]

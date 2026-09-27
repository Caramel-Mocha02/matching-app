// 清潔感・身だしなみの項目。
// 自分については「どのくらい気をつけているか」、相手については「どのくらい重視するか」を
// 3段階（3 / 2 / 1）の数値で保存する。数値にしておくとスコア計算がしやすい。
const ITEMS = [
  { key: 'hair', label: '髪（寝ぐせ・手入れ）' },
  { key: 'skin', label: '肌（保湿・ムダ毛の処理）' },
  { key: 'teeth', label: '歯（歯磨き・口臭ケア）' },
  { key: 'nails', label: '爪（短く清潔に）' },
  { key: 'clothes', label: '服装（シワ・汚れがない）' },
  { key: 'shoes', label: '靴（汚れ・すり減りがない）' },
  { key: 'body_odor', label: '体臭（汗・においのケア）' },
  { key: 'perfume', label: '香水（つけすぎない）' },
  { key: 'table_manners', label: '食事マナー（音・姿勢・箸使い）' },
  { key: 'tidiness', label: '部屋の整理整頓' },
]

export const CLEANLINESS_SELF_QUESTIONS = ITEMS.map((item) => ({
  ...item,
  type: 'scale',
  options: [
    { value: 3, label: 'しっかり' },
    { value: 2, label: 'ほどほど' },
    { value: 1, label: 'あまり' },
  ],
}))

// 未回答の項目は「普通（2）」として扱う（default は未回答時に画面で選択済みに見せる値）
export const CLEANLINESS_PREFERENCE_QUESTIONS = ITEMS.map((item) => ({
  ...item,
  type: 'scale',
  default: 2,
  options: [
    { value: 3, label: '重視する' },
    { value: 2, label: '普通' },
    { value: 1, label: '気にしない' },
  ],
}))

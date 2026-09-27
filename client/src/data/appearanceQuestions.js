// 外見の質問一覧。
// 「あなたの外見」ではこの選択肢から自分に当てはまるものを選び、
// 「外見の好み」では同じ選択肢それぞれに「好き / どちらでも / 苦手」を付ける。
//   onlyGender: その性別の人の外見にだけ表示する（ヒゲなど）

export const APPEARANCE_SELF_QUESTIONS = [
  { key: 'height', label: '身長（cm）', type: 'number', min: 130, max: 220 },
  {
    key: 'body_type', label: '体型', type: 'select',
    options: [
      { value: 'slim', label: '細身' },
      { value: 'slightly_slim', label: 'やや細め' },
      { value: 'average', label: '普通' },
      { value: 'muscular', label: '筋肉質' },
      { value: 'slightly_chubby', label: 'ややぽっちゃり' },
      { value: 'chubby', label: 'ぽっちゃり' },
    ],
  },
  {
    key: 'face_type', label: '顔の系統', type: 'select',
    options: [
      { value: 'salt', label: '塩顔（あっさり）' },
      { value: 'soy', label: 'しょうゆ顔（すっきり）' },
      { value: 'sauce', label: 'ソース顔（くっきり）' },
      { value: 'baby', label: '童顔' },
      { value: 'mature', label: '大人顔' },
    ],
  },
  {
    key: 'face_shape', label: '輪郭', type: 'select',
    options: [
      { value: 'round', label: '丸顔' },
      { value: 'oval', label: '卵型' },
      { value: 'long', label: '面長' },
      { value: 'square', label: 'ベース型' },
      { value: 'triangle', label: '逆三角形' },
    ],
  },
  {
    key: 'eyes', label: '目', type: 'select',
    options: [
      { value: 'double', label: '二重' },
      { value: 'inner_double', label: '奥二重' },
      { value: 'single', label: '一重' },
    ],
  },
  {
    key: 'nose', label: '鼻', type: 'select',
    options: [
      { value: 'high', label: '高め' },
      { value: 'average', label: '普通' },
      { value: 'small', label: '小ぶり' },
    ],
  },
  {
    key: 'mouth', label: '口元', type: 'select',
    options: [
      { value: 'thin', label: '薄め' },
      { value: 'average', label: '普通' },
      { value: 'full', label: 'ふっくら' },
    ],
  },
  {
    key: 'hairstyle', label: '髪型', type: 'select',
    options: [
      { value: 'very_short', label: 'ベリーショート・坊主' },
      { value: 'short', label: 'ショート' },
      { value: 'medium', label: 'ミディアム' },
      { value: 'long', label: 'ロング' },
    ],
  },
  {
    key: 'beard', label: 'ヒゲ', type: 'select', onlyGender: 'male',
    options: [
      { value: 'none', label: 'なし' },
      { value: 'light', label: 'うっすら' },
      { value: 'full', label: 'しっかり' },
    ],
  },
  {
    key: 'vibe', label: '雰囲気（当てはまるものをすべて）', type: 'multiselect',
    options: [
      { value: 'fresh', label: '爽やか' },
      { value: 'intellectual', label: '知的' },
      { value: 'masculine', label: '男性的' },
      { value: 'feminine', label: '女性的' },
      { value: 'androgynous', label: '中性的' },
      { value: 'cute', label: '可愛い' },
      { value: 'mature', label: '大人っぽい' },
      { value: 'wild', label: 'ワイルド' },
      { value: 'gentle', label: '優しそう' },
    ],
  },
]

// 外見の好み：身長は希望範囲、それ以外は選択肢ごとに好き／苦手を付ける
export const APPEARANCE_PREFERENCE_QUESTIONS = [
  { key: 'height', label: '身長の希望', type: 'range', unit: 'cm', min: 130, max: 220 },
  ...APPEARANCE_SELF_QUESTIONS
    .filter((q) => q.options)
    .map((q) => ({ ...q, label: q.label.replace('（当てはまるものをすべて）', ''), type: 'likes' })),
]

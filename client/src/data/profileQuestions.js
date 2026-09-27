// プロフィールの質問一覧。
// key はデータベースの列名と同じにする。質問を増やすときは、ここと SQL の両方に追加する。
//   type: 'text'（自由入力） / 'number'（数値） / 'select'（選択肢）
//   options: { value: 保存する値, label: 画面に表示する文字 }

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

const prefectureOptions = PREFECTURES.map((p) => ({ value: p, label: p }))

// ステップ1：基本情報
//   optional: true の質問は未入力でも次へ進める
export const BASIC_QUESTIONS = [
  { key: 'avatar_path', label: 'プロフィール写真', type: 'avatar', optional: true },
  { key: 'nickname', label: 'ニックネーム', type: 'text' },
  { key: 'age', label: '年齢', type: 'number', min: 18, max: 99 },
  {
    key: 'gender', label: '性別', type: 'select',
    options: [
      { value: 'male', label: '男性' },
      { value: 'female', label: '女性' },
    ],
  },
  { key: 'prefecture', label: '居住地', type: 'select', options: prefectureOptions },
  {
    key: 'occupation', label: '職業', type: 'select',
    options: [
      { value: 'company_employee', label: '会社員' },
      { value: 'civil_servant', label: '公務員' },
      { value: 'executive', label: '経営者・役員' },
      { value: 'self_employed', label: '自営業・フリーランス' },
      { value: 'medical', label: '医療関係' },
      { value: 'teacher', label: '教育関係' },
      { value: 'professional', label: '士業・専門職' },
      { value: 'other', label: 'その他' },
    ],
  },
  {
    key: 'annual_income', label: '年収', type: 'select',
    options: [
      { value: 0, label: '300万円未満' },
      { value: 300, label: '300〜400万円' },
      { value: 400, label: '400〜500万円' },
      { value: 500, label: '500〜600万円' },
      { value: 600, label: '600〜800万円' },
      { value: 800, label: '800〜1000万円' },
      { value: 1000, label: '1000〜1500万円' },
      { value: 1500, label: '1500万円以上' },
    ],
  },
  {
    key: 'education', label: '学歴', type: 'select',
    options: [
      { value: 'high_school', label: '高校卒' },
      { value: 'vocational', label: '専門学校卒' },
      { value: 'junior_college', label: '短大・高専卒' },
      { value: 'university', label: '大学卒' },
      { value: 'graduate', label: '大学院卒' },
      { value: 'other', label: 'その他' },
    ],
  },
  {
    key: 'marital_history', label: '婚姻歴', type: 'select',
    options: [
      { value: 'none', label: 'なし' },
      { value: 'divorced', label: '離別' },
      { value: 'widowed', label: '死別' },
    ],
  },
  {
    key: 'has_children', label: '子どもの有無', type: 'select',
    options: [
      { value: 'none', label: 'なし' },
      { value: 'living_together', label: 'あり（同居）' },
      { value: 'living_apart', label: 'あり（別居）' },
    ],
  },
  {
    key: 'smoking', label: '喫煙', type: 'select',
    options: [
      { value: 'no', label: '吸わない' },
      { value: 'sometimes', label: 'ときどき吸う' },
      { value: 'yes', label: '吸う' },
    ],
  },
]

// ステップ2：結婚に関する情報
export const MARRIAGE_QUESTIONS = [
  {
    key: 'marriage_intent', label: '結婚意思', type: 'select',
    options: [
      { value: 'strong', label: 'すぐにでもしたい' },
      { value: 'yes', label: '良い人がいればしたい' },
      { value: 'undecided', label: 'まだ分からない' },
    ],
  },
  {
    key: 'marriage_timing', label: '結婚希望時期', type: 'select',
    options: [
      { value: 'within_1y', label: '1年以内' },
      { value: 'within_2y', label: '2年以内' },
      { value: 'within_3y', label: '3年以内' },
      { value: 'undecided', label: '良い人がいれば' },
    ],
  },
  {
    key: 'wants_children', label: '子ども希望', type: 'select',
    options: [
      { value: 'yes', label: '欲しい' },
      { value: 'maybe', label: '相手と相談して決めたい' },
      { value: 'no', label: '欲しくない' },
    ],
  },
  {
    key: 'desired_children_count', label: '希望人数', type: 'select',
    options: [
      { value: '1', label: '1人' },
      { value: '2', label: '2人' },
      { value: '3+', label: '3人以上' },
      { value: 'undecided', label: '未定・希望しない' },
    ],
  },
  {
    key: 'dual_income', label: '共働きへの考え', type: 'select',
    options: [
      { value: 'want', label: '共働きを希望' },
      { value: 'either', label: 'どちらでもよい' },
      { value: 'single_income', label: '片方が家庭に入りたい' },
    ],
  },
  {
    key: 'desired_residence', label: '希望居住地', type: 'select',
    options: [{ value: 'any', label: 'こだわらない' }, ...prefectureOptions],
  },
  {
    key: 'relocation', label: '転勤への考え', type: 'select',
    options: [
      { value: 'ok', label: '問題ない' },
      { value: 'depends', label: '状況による' },
      { value: 'ng', label: '避けたい' },
    ],
  },
  {
    key: 'living_with_parents', label: '親との同居への考え', type: 'select',
    options: [
      { value: 'ok', label: '同居してもよい' },
      { value: 'depends', label: '状況による' },
      { value: 'ng', label: '同居したくない' },
    ],
  },
]

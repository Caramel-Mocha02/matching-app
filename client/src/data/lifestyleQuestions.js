// 結婚・生活価値観の質問。
// 選択肢は「一方の端 → もう一方の端」の順に並べる（相性ルールを作りやすくするため）。
// value は相性ルールで使う名前なので、後から変えないこと（label は自由に変えてよい）。
// ※ 共働き・住む場所・親との同居は「結婚条件」ステップで聞いているので、ここでは聞かない。
export const LIFESTYLE_QUESTIONS = [
  // お金
  {
    key: 'spending', label: 'お金の使い方はどれに近いですか？', type: 'choice',
    options: [
      { value: 'frugal', label: 'できるだけ節約したい' },
      { value: 'balanced', label: '使うところと節約するところを分けたい' },
      { value: 'experience', label: '趣味や経験にはしっかりお金をかけたい' },
      { value: 'free', label: '欲しいものは我慢しない' },
    ],
  },
  {
    key: 'saving', label: '毎月の貯金について、どう考えていますか？', type: 'choice',
    options: [
      { value: 'strict', label: '収入の2割以上は必ず貯金したい' },
      { value: 'regular', label: '毎月決まった額を貯金したい' },
      { value: 'leftover', label: '余った分を貯金すればいい' },
      { value: 'little', label: '貯金はあまり気にしない' },
    ],
  },
  {
    key: 'investing', label: '投資（NISA・株など）について、どう考えていますか？', type: 'choice',
    options: [
      { value: 'active', label: '積極的に取り組んでいる' },
      { value: 'some', label: '少額で取り組んでいる' },
      { value: 'interested', label: '興味はあるがしていない' },
      { value: 'avoid', label: 'したくない' },
    ],
  },
  {
    key: 'household_budget', label: '結婚後の家計管理はどうしたいですか？', type: 'choice',
    options: [
      { value: 'joint', label: 'すべて共通の財布にしたい' },
      { value: 'partial', label: '生活費だけ共通にしたい' },
      { value: 'separate', label: '基本的には別々にしたい' },
    ],
  },
  // 家事・育児・仕事
  {
    key: 'housework', label: '家事の分担はどうしたいですか？', type: 'choice',
    options: [
      { value: 'mostly_me', label: '自分が多めに担当したい' },
      { value: 'equal', label: 'きっちり半分ずつにしたい' },
      { value: 'flexible', label: '得意なほう・時間があるほうがやればいい' },
      { value: 'mostly_partner', label: '相手に多めにお願いしたい' },
    ],
  },
  {
    key: 'childcare', label: '育児にはどのように関わりたいですか？', type: 'choice',
    options: [
      { value: 'lead', label: '自分が中心になって関わりたい' },
      { value: 'equal', label: '2人で同じくらい関わりたい' },
      { value: 'support', label: 'できる範囲でサポートしたい' },
      { value: 'partner', label: '相手を中心にお願いしたい' },
    ],
  },
  {
    key: 'work_life', label: '仕事と家庭のバランスはどう考えていますか？', type: 'choice',
    options: [
      { value: 'career', label: '仕事を優先したい時期がある' },
      { value: 'balanced', label: '仕事と家庭を両立したい' },
      { value: 'family', label: '家庭を優先したい' },
    ],
  },
  {
    key: 'education', label: '子どもの教育方針はどれに近いですか？', type: 'choice',
    options: [
      { value: 'intensive', label: '受験や習い事に積極的に取り組ませたい' },
      { value: 'supportive', label: '本人の希望を尊重しつつ、しっかり支援したい' },
      { value: 'free', label: 'のびのびと自由に育てたい' },
    ],
  },
  // 休日・暮らし
  {
    key: 'holiday', label: '休日はどのように過ごしたいですか？', type: 'choice',
    options: [
      { value: 'outdoor', label: '外に出かけたい' },
      { value: 'mix', label: '出かける日と家で過ごす日が半々' },
      { value: 'home', label: '家でゆっくりしたい' },
    ],
  },
  {
    key: 'travel', label: '旅行にはどのくらい行きたいですか？', type: 'choice',
    options: [
      { value: 'often', label: '年に数回以上' },
      { value: 'sometimes', label: '年に1〜2回' },
      { value: 'rarely', label: 'あまり行かなくていい' },
    ],
  },
  {
    key: 'eating_out', label: '外食の頻度はどのくらいが理想ですか？', type: 'choice',
    options: [
      { value: 'often', label: '週に数回' },
      { value: 'weekly', label: '週に1回くらい' },
      { value: 'sometimes', label: '月に数回' },
      { value: 'rarely', label: 'ほとんど自炊' },
    ],
  },
  {
    key: 'housing', label: '将来の住まいの希望は？', type: 'choice',
    options: [
      { value: 'own_house', label: '持ち家（一戸建て）' },
      { value: 'own_condo', label: '持ち家（マンション）' },
      { value: 'rent', label: 'ずっと賃貸でいい' },
      { value: 'any', label: 'こだわらない' },
    ],
  },
  {
    key: 'parents_relation', label: 'お互いの親とは、どのくらい付き合いたいですか？', type: 'choice',
    options: [
      { value: 'close', label: '月に1回以上は会いたい' },
      { value: 'regular', label: '年に数回（帰省など）' },
      { value: 'minimal', label: '冠婚葬祭などの必要なときだけ' },
    ],
  },
]

// 性格・内面の質問。
// 選択肢は「一方の端 → もう一方の端」の順に並べる（相性ルールを作りやすくするため）。
// value は相性ルールで使う名前なので、後から変えないこと（label は自由に変えてよい）。
export const PERSONALITY_QUESTIONS = [
  {
    key: 'planning', label: '旅行や休日の予定はどのように立てますか？', type: 'choice',
    options: [
      { value: 'very_planned', label: '細かく計画を立てる' },
      { value: 'planned', label: '大まかに決めておく' },
      { value: 'flexible', label: 'その場で決めることが多い' },
      { value: 'spontaneous', label: 'ほとんど決めずに動く' },
    ],
  },
  {
    key: 'together_time', label: '恋人・配偶者とはどの程度一緒に過ごしたいですか？', type: 'choice',
    options: [
      { value: 'always', label: 'できるだけ一緒にいたい' },
      { value: 'mostly', label: '基本は一緒、たまに一人の時間も欲しい' },
      { value: 'balanced', label: '一緒の時間と一人の時間は半々くらい' },
      { value: 'independent', label: '一人の時間を多めに取りたい' },
    ],
  },
  {
    key: 'friends', label: '友人との付き合いをどの程度大切にしますか？', type: 'choice',
    options: [
      { value: 'very', label: '週に何度も会うくらい大切' },
      { value: 'often', label: '月に数回は会いたい' },
      { value: 'sometimes', label: 'たまに会えれば十分' },
      { value: 'rarely', label: 'ほとんど会わない' },
    ],
  },
  {
    key: 'decision', label: '2人で何かを決めるとき、どうしたいですか？', type: 'choice',
    options: [
      { value: 'lead', label: '自分が決めてリードしたい' },
      { value: 'propose', label: '自分が案を出して相談したい' },
      { value: 'together', label: '一緒に考えて決めたい' },
      { value: 'follow', label: '相手に決めてもらいたい' },
    ],
  },
  {
    key: 'affection', label: '愛情表現はどのくらいしたい（されたい）ですか？', type: 'choice',
    options: [
      { value: 'lots', label: '言葉や態度で頻繁に伝え合いたい' },
      { value: 'moderate', label: 'ときどき伝え合えれば十分' },
      { value: 'little', label: '言葉にしなくても伝わっていればいい' },
    ],
  },
  {
    key: 'contact', label: '離れているとき、連絡はどのくらい取りたいですか？', type: 'choice',
    options: [
      { value: 'many', label: '1日に何度もやりとりしたい' },
      { value: 'daily', label: '1日1回くらいは連絡したい' },
      { value: 'as_needed', label: '用事があるときだけでいい' },
    ],
  },
  {
    key: 'mood', label: '気分の浮き沈みはどのくらいありますか？', type: 'choice',
    options: [
      { value: 'stable', label: 'ほとんどない' },
      { value: 'slight', label: '少しある' },
      { value: 'moderate', label: 'それなりにある' },
      { value: 'large', label: '大きいほうだと思う' },
    ],
  },
  {
    key: 'opposite_sex_friends', label: '相手が異性の友人と2人で食事に行くことをどう思いますか？', type: 'choice',
    options: [
      { value: 'ok', label: '特に気にしない' },
      { value: 'tell_me', label: '事前に言ってくれれば大丈夫' },
      { value: 'prefer_not', label: 'できれば避けてほしい' },
      { value: 'ng', label: 'やめてほしい' },
    ],
  },
]

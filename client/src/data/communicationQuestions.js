// 会話・コミュニケーションの質問。
// 選択肢は「一方の端 → もう一方の端」の順に並べる（相性ルールを作りやすくするため）。
// value は相性ルールで使う名前なので、後から変えないこと（label は自由に変えてよい）。
// topic は結果画面の「相性が良い点」などに表示する短い見出し。
export const COMMUNICATION_QUESTIONS = [
  {
    key: 'first_meeting', topic: '会話の役割分担', label: '初対面の人と2人きりになったとき、どのような状態が理想ですか？', type: 'choice',
    options: [
      { value: 'lead', label: '自分から話題を振って盛り上げたい' },
      { value: 'both', label: 'お互いに同じくらい話したい' },
      { value: 'listen', label: '相手に話してもらい、聞き役になりたい' },
      { value: 'quiet', label: '無理に話さず、自然な流れに任せたい' },
    ],
  },
  {
    key: 'silence', topic: '沈黙の感じ方', label: '会話が途切れたとき、どう感じますか？', type: 'choice',
    options: [
      { value: 'comfortable', label: '沈黙も心地よい' },
      { value: 'fine', label: '特に気にならない' },
      { value: 'slightly_awkward', label: '少し気まずい' },
      { value: 'awkward', label: '何か話さないと落ち着かない' },
    ],
  },
  {
    key: 'tempo', topic: '会話のテンポ', label: '会話のテンポはどれに近いですか？', type: 'choice',
    options: [
      { value: 'fast', label: 'テンポよく、たくさん話す' },
      { value: 'moderate', label: 'ほどよいペースで話す' },
      { value: 'slow', label: 'ゆっくり考えながら話す' },
    ],
  },
  {
    key: 'daily_sharing', topic: '日々の出来事の共有', label: 'その日にあった出来事を、相手に話したいですか？', type: 'choice',
    options: [
      { value: 'always', label: '毎日たくさん話したい' },
      { value: 'sometimes', label: '話したいことがあれば話す' },
      { value: 'rarely', label: 'あまり話さない' },
    ],
  },
  {
    key: 'complaint', topic: '不満の伝え方', label: '不満があるとき、どのように相手に伝えますか？', type: 'choice',
    options: [
      { value: 'immediately', label: 'その場ですぐに伝える' },
      { value: 'calmly_later', label: '気持ちを整理してから落ち着いて話す' },
      { value: 'indirectly', label: '遠回しに伝える・態度で示す' },
      { value: 'endure', label: '我慢して言わないことが多い' },
    ],
  },
  {
    key: 'conflict', topic: '意見が衝突したとき', label: '意見が衝突したとき、どのように対応しますか？', type: 'choice',
    options: [
      { value: 'discuss_now', label: 'その場で納得いくまで話し合う' },
      { value: 'cool_down', label: '時間をおいて冷静になってから話し合う' },
      { value: 'give_in', label: '自分が折れることが多い' },
      { value: 'avoid', label: 'その話題を避ける' },
    ],
  },
  {
    key: 'make_up', topic: '仲直りのしかた', label: '喧嘩のあと、どのように仲直りしたいですか？', type: 'choice',
    options: [
      { value: 'talk_it_out', label: 'きちんと話して、お互いに謝りたい' },
      { value: 'quick', label: 'ひと言謝って、すぐに切り替えたい' },
      { value: 'natural', label: '時間が経てば自然に元に戻ればいい' },
      { value: 'wait', label: '相手から歩み寄ってほしい' },
    ],
  },
  {
    key: 'advice', topic: '相談への向き合い方', label: '悩みを相談されたとき、どうすることが多いですか？', type: 'choice',
    options: [
      { value: 'solution', label: '解決策を一緒に考える' },
      { value: 'ask_first', label: '共感と解決策、どちらが欲しいか確認する' },
      { value: 'empathy', label: 'まず気持ちに共感する' },
      { value: 'listen', label: '口を挟まずに聞く' },
    ],
  },
  {
    key: 'humor', topic: '笑いの大切さ', label: '会話の中で、笑いの要素はどのくらい大切ですか？', type: 'choice',
    options: [
      { value: 'very', label: 'とても大切' },
      { value: 'somewhat', label: 'あると嬉しい' },
      { value: 'not_needed', label: '特に求めない' },
    ],
  },
]

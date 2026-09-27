// ============================================================
// 相性ルール（このファイルを書き換えると、マッチングの考え方を調整できる）
// ============================================================

// 総合スコアの配分（合計 1.0 = 100%）
export const WEIGHTS = {
  personality: 0.30, // 内面・性格
  communication: 0.20, // 会話・コミュニケーション
  lifestyle: 0.25, // 結婚・生活価値観
  appearance: 0.15, // 外見
  cleanliness: 0.10, // 清潔感
}

// ------------------------------------------------------------
// 1. 類似性（初期ルール）
// ------------------------------------------------------------
// 下の PAIR_RULES に書かれていない質問は、「選択肢が近いほど高評価」で計算する。
// 選択肢は端から端へ順に並んでいるので、何個離れているか（距離）で点数を決める。
//   例：4択の質問で「細かく計画する」×「大まかに決める」→ 距離1 → 85点
export const DISTANCE_SCORES = {
  2: [100, 40],
  3: [100, 65, 20],
  4: [100, 85, 55, 20],
}

// ------------------------------------------------------------
// 2. 組み合わせルール（補完性を含む）
// ------------------------------------------------------------
// 「近いほど良い」とは限らない質問は、組み合わせごとに点数（0〜100）を決める。
// 'A×B' と書けば 'B×A' も同じ点数になる。書いていない組み合わせは類似性で計算する。
// weight：その質問の重要度（省略時は 1）。2 にすると他の質問の2倍の影響を持つ。
export const PAIR_RULES = {
  // ---- 性格・内面 ----
  'personality.planning': {
    // 計画的 × やや柔軟は、お互いを補い合えるので高評価
    pairs: {
      'very_planned×very_planned': 90, 'very_planned×planned': 90, 'very_planned×flexible': 70, 'very_planned×spontaneous': 20,
      'planned×planned': 95, 'planned×flexible': 85, 'planned×spontaneous': 55,
      'flexible×flexible': 85, 'flexible×spontaneous': 75,
      'spontaneous×spontaneous': 60,
    },
  },
  'personality.decision': {
    // リードしたい人 × 任せたい人は好相性。リードしたい人同士・任せたい人同士はぶつかりやすい
    pairs: {
      'lead×lead': 30, 'lead×propose': 55, 'lead×together': 70, 'lead×follow': 95,
      'propose×propose': 70, 'propose×together': 90, 'propose×follow': 85,
      'together×together': 95, 'together×follow': 75,
      'follow×follow': 35,
    },
  },
  'personality.mood': {
    // 気分が安定している人は誰とでも合いやすい。浮き沈みが大きい人同士は衝突しやすい
    pairs: {
      'stable×stable': 95, 'stable×slight': 95, 'stable×moderate': 85, 'stable×large': 70,
      'slight×slight': 90, 'slight×moderate': 75, 'slight×large': 55,
      'moderate×moderate': 55, 'moderate×large': 35,
      'large×large': 15,
    },
  },
  'personality.together_time': { weight: 2 },
  'personality.opposite_sex_friends': { weight: 1.5 },

  // ---- 会話 ----
  'communication.first_meeting': {
    // 話したい人 × 聞きたい人は好相性。聞き役同士は会話が続きにくい
    pairs: {
      'lead×lead': 60, 'lead×both': 85, 'lead×listen': 95, 'lead×quiet': 75,
      'both×both': 95, 'both×listen': 80, 'both×quiet': 65,
      'listen×listen': 45, 'listen×quiet': 40,
      'quiet×quiet': 50,
    },
  },
  'communication.complaint': {
    // 落ち着いて話す人同士が最も良い。遠回し・我慢同士は不満が溜まりやすい
    weight: 1.5,
    pairs: {
      'immediately×immediately': 70, 'immediately×calmly_later': 80, 'immediately×indirectly': 35, 'immediately×endure': 40,
      'calmly_later×calmly_later': 100, 'calmly_later×indirectly': 60, 'calmly_later×endure': 55,
      'indirectly×indirectly': 30, 'indirectly×endure': 30,
      'endure×endure': 20,
    },
  },
  'communication.conflict': {
    weight: 1.5,
    pairs: {
      'discuss_now×discuss_now': 65, 'discuss_now×cool_down': 60, 'discuss_now×give_in': 70, 'discuss_now×avoid': 15,
      'cool_down×cool_down': 100, 'cool_down×give_in': 75, 'cool_down×avoid': 40,
      'give_in×give_in': 60, 'give_in×avoid': 40,
      'avoid×avoid': 25,
    },
  },
  'communication.make_up': {
    pairs: {
      'talk_it_out×talk_it_out': 100, 'talk_it_out×quick': 80, 'talk_it_out×natural': 45, 'talk_it_out×wait': 50,
      'quick×quick': 90, 'quick×natural': 65, 'quick×wait': 55,
      'natural×natural': 75, 'natural×wait': 30,
      'wait×wait': 10,
    },
  },
  'communication.advice': {
    // 「解決策」×「共感」も、相手に合わせられれば補い合える
    pairs: {
      'solution×solution': 70, 'solution×ask_first': 90, 'solution×empathy': 75, 'solution×listen': 60,
      'ask_first×ask_first': 100, 'ask_first×empathy': 90, 'ask_first×listen': 85,
      'empathy×empathy': 85, 'empathy×listen': 80,
      'listen×listen': 70,
    },
  },

  // ---- 結婚・生活価値観 ----
  'lifestyle.housework': {
    // 自分が多めにやりたい人 × 相手に任せたい人は好相性。任せたい人同士は最悪
    weight: 1.5,
    pairs: {
      'mostly_me×mostly_me': 60, 'mostly_me×equal': 70, 'mostly_me×flexible': 85, 'mostly_me×mostly_partner': 100,
      'equal×equal': 95, 'equal×flexible': 75, 'equal×mostly_partner': 30,
      'flexible×flexible': 95, 'flexible×mostly_partner': 60,
      'mostly_partner×mostly_partner': 10,
    },
  },
  'lifestyle.childcare': {
    weight: 1.5,
    pairs: {
      'lead×lead': 60, 'lead×equal': 80, 'lead×support': 90, 'lead×partner': 100,
      'equal×equal': 100, 'equal×support': 70, 'equal×partner': 30,
      'support×support': 40, 'support×partner': 35,
      'partner×partner': 5,
    },
  },
  'lifestyle.work_life': {
    pairs: {
      'career×career': 55, 'career×balanced': 80, 'career×family': 80,
      'balanced×balanced': 100, 'balanced×family': 85,
      'family×family': 85,
    },
  },
  'lifestyle.housing': {
    // 「こだわらない」人は誰とでも合う
    pairs: {
      'own_house×own_house': 100, 'own_house×own_condo': 75, 'own_house×rent': 35, 'own_house×any': 90,
      'own_condo×own_condo': 100, 'own_condo×rent': 50, 'own_condo×any': 90,
      'rent×rent': 100, 'rent×any': 90,
      'any×any': 100,
    },
  },
  'lifestyle.spending': { weight: 1.5 },
  'lifestyle.saving': { weight: 1.5 },
  'wants_children': { weight: 2 },
  'dual_income': {
    weight: 1.5,
    pairs: {
      'want×want': 100, 'want×either': 90, 'want×single_income': 20,
      'either×either': 100, 'either×single_income': 85,
      'single_income×single_income': 80,
    },
  },
}

// ------------------------------------------------------------
// 3. 明らかに相性が悪い組み合わせ（総合スコアから減点）
// ------------------------------------------------------------
// 上の点数が低いだけでなく、結婚生活で大きな問題になりやすいものを追加で減点する。
export const PENALTIES = [
  { path: 'wants_children', pair: 'yes×no', points: 10, reason: '子どもについての希望が正反対' },
  { path: 'dual_income', pair: 'want×single_income', points: 8, reason: '共働きについての考えが正反対' },
  { path: 'lifestyle.housework', pair: 'mostly_partner×mostly_partner', points: 8, reason: 'お互いに家事を相手に任せたい' },
  { path: 'lifestyle.childcare', pair: 'partner×partner', points: 8, reason: 'お互いに育児を相手に任せたい' },
  { path: 'lifestyle.spending', pair: 'frugal×free', points: 6, reason: 'お金の使い方が正反対' },
  { path: 'lifestyle.saving', pair: 'strict×little', points: 5, reason: '貯金への考え方が正反対' },
  { path: 'personality.together_time', pair: 'always×independent', points: 6, reason: '一緒に過ごしたい時間の長さが大きく違う' },
  { path: 'personality.opposite_sex_friends', pair: 'ok×ng', points: 5, reason: '異性の友人との付き合い方の考えが正反対' },
  { path: 'communication.conflict', pair: 'discuss_now×avoid', points: 5, reason: '意見が衝突したときの対応が正反対' },
  { path: 'communication.make_up', pair: 'wait×wait', points: 5, reason: 'お互いに相手から歩み寄ってほしい' },
]

// ------------------------------------------------------------
// 4. 外見・清潔感
// ------------------------------------------------------------
// 外見：相手の特徴が自分の「好き／どちらでも／苦手」のどれに当たるか
export const LIKE_SCORES = { like: 100, neutral: 70, dislike: 15 }
// 身長：希望範囲内なら100点、5cm以内のずれなら60点、それ以上は25点。希望なしは70点
export const HEIGHT_SCORES = { inRange: 100, near: 60, far: 25, noPreference: 70, nearCm: 5 }
// 清潔感：相手が「しっかり(3) / ほどほど(2) / あまり(1)」気をつけている場合の点数。
// 自分が「重視する」項目ほど影響が大きくなる
export const CLEANLINESS_LEVEL_SCORES = { 3: 100, 2: 70, 1: 30 }

// 「相性が良いポイント」「注意したいポイント」として扱う点数の境目
export const GOOD_POINT_MIN = 85
export const CAUTION_POINT_MAX = 40

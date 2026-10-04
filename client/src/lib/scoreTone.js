// 診断結果で使う色。背景のローズピンクになじむよう、ピンク〜紫系でそろえている。
// 色を変えたいときは、このファイルだけを書き換える。

// 点数に応じた色と言葉（上から順に、min 以上なら当てはまる）
const TONES = [
  { min: 85, color: '#c2255c', label: 'とても良い' }, // 濃いローズ
  { min: 70, color: '#d6668b', label: '良い' }, // ローズ
  { min: 55, color: '#a07ba0', label: 'ふつう' }, // モーヴ
  { min: 0, color: '#a39a9e', label: '低め' }, // 温かみのあるグレー
]

// 例：scoreTone(78) → { color: '#d6668b', label: '良い' }
export const scoreTone = (score) => TONES.find((t) => (score ?? 0) >= t.min)

// 「相性が良いポイント」「注意したいポイント」の色（文字・枠の背景・チップの線）
export const POINT_COLORS = {
  good: { color: '#c2255c', bg: '#fdf0f4', border: '#f2b8cb' }, // ローズ
  caution: { color: '#8a5a83', bg: '#f7f2f7', border: '#d9c6d6' }, // プラム
}

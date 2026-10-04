// 点数に応じた色と言葉。境目や色を変えたいときは、ここだけを書き換える
const TONES = [
  { min: 85, color: '#d6336c', label: 'とても良い' },
  { min: 70, color: '#2e7d32', label: '良い' },
  { min: 55, color: '#ef6c00', label: 'ふつう' },
  { min: 0, color: '#9e9e9e', label: '低め' },
]

// 例：scoreTone(78) → { color: '#2e7d32', label: '良い' }
export const scoreTone = (score) => TONES.find((t) => (score ?? 0) >= t.min)

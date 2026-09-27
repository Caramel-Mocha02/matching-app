// Phase 7：必須条件による絞り込み。
// 必須条件は { age: {min, max}, smoking: ['no'], annual_income: 400, ... } の形で保存されている。
// キーは profiles の列名と同じなので、「相手の profiles[キー]」が条件を満たすかを調べればよい。

// 条件1つを満たしているか。条件の値の形で判定方法を変える
function meetsCondition(value, condition) {
  // 範囲 { min, max }：下限・上限のうち入力されているものだけ確認する
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if (value == null) return false
    if (condition.min != null && value < condition.min) return false
    if (condition.max != null && value > condition.max) return false
    return true
  }
  // 配列 ['no', 'sometimes']：相手の値がその中に含まれているか
  if (Array.isArray(condition)) {
    return condition.includes(value)
  }
  // 数値 400：相手の値がそれ以上か（年収の下限）
  if (typeof condition === 'number') {
    return value != null && value >= condition
  }
  return true
}

// 条件が「指定なし」かどうか（空の配列・0・下限上限とも空）
function isNoCondition(condition) {
  if (condition == null || condition === 0) return true
  if (Array.isArray(condition)) return condition.length === 0
  if (typeof condition === 'object') return condition.min == null && condition.max == null
  return false
}

// profile が mustConditions をすべて満たすか。満たさない条件のキーを返す（全部満たせば空配列）
export function unmetConditions(profile, mustConditions = {}) {
  return Object.entries(mustConditions)
    .filter(([, condition]) => !isNoCondition(condition))
    .filter(([key, condition]) => !meetsCondition(profile[key], condition))
    .map(([key]) => key)
}

// 候補者を絞り込む。
// 1. 異性であること
// 2. 自分の必須条件を相手が満たすこと
// 3. 相手の必須条件を自分が満たすこと（相手に除外される人を紹介しても会えないため）
export function filterCandidates(me, candidates) {
  return candidates.filter((c) => {
    if (c.profile.gender === me.profile.gender) return false
    if (unmetConditions(c.profile, me.preferences.must_conditions).length > 0) return false
    if (unmetConditions(me.profile, c.preferences.must_conditions).length > 0) return false
    return true
  })
}

// 0人になったときの手がかり：異性のうち、各条件で何人が除外されたかを数える
//   → { total: 異性の人数, byCondition: { annual_income: 8, age: 5 }, byPartner: 相手の条件で除外された人数 }
export function countExclusions(me, candidates) {
  const opposite = candidates.filter((c) => c.profile.gender !== me.profile.gender)
  const byCondition = {}
  let byPartner = 0
  for (const c of opposite) {
    for (const key of unmetConditions(c.profile, me.preferences.must_conditions)) {
      byCondition[key] = (byCondition[key] ?? 0) + 1
    }
    if (unmetConditions(me.profile, c.preferences.must_conditions).length > 0) byPartner++
  }
  return { total: opposite.length, byCondition, byPartner }
}

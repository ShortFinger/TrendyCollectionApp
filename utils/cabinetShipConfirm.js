/**
 * @param {Array<{ isDefault?: boolean }>} list - 与 addressApi.normalizeAddress 一致，isDefault 已为 boolean
 * @returns {object | null}
 */
export function findDefaultAddress(list) {
  if (!Array.isArray(list) || list.length === 0) return null
  const hit = list.find((a) => a && a.isDefault === true)
  return hit ?? null
}

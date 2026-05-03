/**
 * @param {Array<{ assetId?: string|number, assetStatus?: string }>} list
 * @returns {string[]}
 */
export function collectInCabinetAssetIds(list) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const row of list) {
    if (!row || row.assetId == null || row.assetId === '') continue
    if (row.assetStatus !== 'IN_CABINET') continue
    out.push(String(row.assetId))
  }
  return out
}

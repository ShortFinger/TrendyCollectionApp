/**
 * 盒柜列表：同单同 SKU 合并展示用分组工具。
 * @see docs/superpowers/specs/2026-05-03-cabinet-merge-same-order-sku-design.md
 */

function normStr(v) {
  if (v == null) return ''
  const s = String(v).trim()
  return s
}

export function resolveOrderId(item) {
  if (!item || typeof item !== 'object') return ''
  return normStr(item.orderId ?? item.order_id)
}

export function resolveSkuId(item) {
  if (!item || typeof item !== 'object') return ''
  return normStr(item.skuId ?? item.sku_id)
}

function parseSortTime(item) {
  const raw = item?.createTime ?? item?.create_time ?? ''
  const t = Date.parse(String(raw).replace(/-/g, '/'))
  return Number.isFinite(t) ? t : 0
}

function rowSortKey(row) {
  return Math.min(...row.members.map(parseSortTime))
}

function sortMembersByCreateTime(members) {
  return [...members].sort((a, b) => {
    const ta = parseSortTime(a)
    const tb = parseSortTime(b)
    if (ta !== tb) return ta - tb
    return String(a.assetId).localeCompare(String(b.assetId))
  })
}

function mergeKeyFor(item) {
  const oid = resolveOrderId(item)
  const sid = resolveSkuId(item)
  if (!oid || !sid) return ''
  return `${oid}\u0000${sid}`
}

function allSameCabinetStatus(members, expectedStatus) {
  return members.every((m) => String(m?.assetStatus || '') === expectedStatus)
}

/**
 * @param {object[]} flatList API 返回的扁平列表
 * @param {string} tabStatus 当前 tab 对应的状态，如 IN_CABINET
 * @returns {{ type: 'group'|'single', mergeKey: string, members: object[], representative: object }[]}
 */
export function buildCabinetDisplayRows(flatList, tabStatus) {
  const list = Array.isArray(flatList) ? flatList : []
  const expected = String(tabStatus || '')

  /** @type {Map<string, object[]>} */
  const buckets = new Map()
  const noKeyItems = []

  for (const item of list) {
    const mk = mergeKeyFor(item)
    if (!mk) {
      noKeyItems.push(item)
      continue
    }
    if (!buckets.has(mk)) buckets.set(mk, [])
    buckets.get(mk).push(item)
  }

  /** @type {{ type: 'group'|'single', mergeKey: string, members: object[], representative: object }[]} */
  const rows = []

  for (const [, members] of buckets) {
    if (members.length >= 2 && allSameCabinetStatus(members, expected)) {
      const sorted = sortMembersByCreateTime(members)
      rows.push({
        type: 'group',
        mergeKey: mergeKeyFor(sorted[0]),
        members: sorted,
        representative: sorted[0]
      })
    } else {
      for (const m of sortMembersByCreateTime(members)) {
        rows.push({
          type: 'single',
          mergeKey: mergeKeyFor(m) || String(m.assetId),
          members: [m],
          representative: m
        })
      }
    }
  }

  for (const item of noKeyItems) {
    rows.push({
      type: 'single',
      mergeKey: `single:${String(item.assetId ?? '')}`,
      members: [item],
      representative: item
    })
  }

  rows.sort((a, b) => {
    const ka = rowSortKey(a)
    const kb = rowSortKey(b)
    if (ka !== kb) return ka - kb
    return String(a.members[0]?.assetId).localeCompare(String(b.members[0]?.assetId))
  })

  return rows
}

/** 组内是否至少有一个 assetId 被选中 */
export function groupHasSelection(members, selectedMap) {
  const m = selectedMap && typeof selectedMap === 'object' ? selectedMap : {}
  return members.some((x) => !!m[String(x?.assetId)])
}

/** 组内是否全部选中 */
export function groupAllSelected(members, selectedMap) {
  const m = selectedMap && typeof selectedMap === 'object' ? selectedMap : {}
  if (members.length === 0) return false
  return members.every((x) => !!m[String(x?.assetId)])
}

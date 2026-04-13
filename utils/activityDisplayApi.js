import { request, API_BASE } from './request.js'

/**
 * @param {string[]} ids 非空，长度建议 ≤ 50
 * @returns {Promise<object[]>} ActivityDisplayVO 列表
 */
export async function fetchActivityDisplayBatch(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return []
  const data = await request({
    base: API_BASE.order,
    url: '/activities/display-batch',
    method: 'POST',
    data: { ids }
  })
  return Array.isArray(data) ? data : []
}

/**
 * @param {string} activityId
 * @returns {Promise<object|null>}
 */
export async function fetchActivityDisplayById(activityId) {
  const id = String(activityId ?? '').trim()
  if (!id) return null
  const list = await fetchActivityDisplayBatch([id])
  return list.find((x) => x && String(x.id ?? '').trim() === id) ?? null
}

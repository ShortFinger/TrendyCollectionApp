import { request, API_BASE } from './request.js'

/**
 * @param {string} activityId
 * @param {number} drawCount - 1, 5, 10, or 20
 * @returns {Promise<{ activityId: string, results: Array, totalDrawn: number, stoppedEarly: boolean, stopReason: string|null }>}
 */
export function submitDraw(activityId, drawCount) {
  return request({
    base: API_BASE.order,
    url: '/api/draw',
    method: 'POST',
    data: { activityId, drawCount }
  })
}

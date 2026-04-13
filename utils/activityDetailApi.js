import { request, API_BASE } from './request.js'

const DEFAULT_CTX = { channel: 'mp-weixin', appVersion: '1.0.0' }

/**
 * @param {string} activityId
 * @param {{ channel: string, appVersion: string }} [ctx]
 * @returns {Promise<object>} ActivityDetailVO
 */
export async function fetchActivityDetail(activityId, ctx = DEFAULT_CTX) {
  const id = String(activityId ?? '').trim()
  if (!id) {
    throw new Error('missing activityId')
  }
  const path = `/v1/activities/${encodeURIComponent(id)}/detail`
  return request({
    base: API_BASE.app,
    url: path,
    method: 'GET',
    data: {
      channel: ctx.channel,
      appVersion: ctx.appVersion
    }
  })
}

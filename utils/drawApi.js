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

export function createDrawOrder(activityId, drawCount, boxId = '') {
  return request({
    base: API_BASE.order,
    url: '/api/orders/draw',
    method: 'POST',
    data: {
      activityId,
      drawCount,
      boxId: boxId || undefined,
      payType: 'wechat',
      paySubType: 'miniapp'
    }
  })
}

export function prepayDrawOrder(orderId, wxAppId) {
  return request({
    base: API_BASE.order,
    url: '/api/orders/draw/prepay',
    method: 'POST',
    data: { orderId, wxAppId }
  })
}

export function paidDrawByOrder(orderId) {
  return request({
    base: API_BASE.order,
    url: '/api/draw/paid',
    method: 'POST',
    data: { orderId }
  })
}

export function simulateConfirmPaid(orderNumber, token) {
  return request({
    base: API_BASE.order,
    url: '/api/pay/wechat/simulate/confirm',
    method: 'POST',
    header: {
      'X-Wx-Sim-Token': token
    },
    data: { orderNumber }
  })
}

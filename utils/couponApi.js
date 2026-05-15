import { API_BASE, request } from './request.js'

export function fetchUserCoupons(status) {
  const params = status ? `?status=${status}` : ''
  return request({
    base: API_BASE.user,
    url: `/coupon/list${params}`,
    method: 'GET'
  })
}

export function claimCoupon(templateId) {
  return request({
    base: API_BASE.user,
    url: `/coupon/claim/${templateId}`,
    method: 'POST'
  })
}

export function claimByExchangeCode(exchangeCode) {
  return request({
    base: API_BASE.user,
    url: '/coupon/claim/exchange',
    method: 'POST',
    data: { exchangeCode }
  })
}

export function claimByShareCode(shareCode) {
  return request({
    base: API_BASE.user,
    url: `/coupon/claim/share/${shareCode}`,
    method: 'POST'
  })
}

export function generateShareCode(templateId) {
  return request({
    base: API_BASE.user,
    url: `/coupon/share-code/${templateId}`,
    method: 'GET'
  })
}

export function fetchAvailableCoupons(orderAmount, productIds, activityId) {
  const params = new URLSearchParams()
  params.append('orderAmount', orderAmount)
  if (productIds) params.append('productIds', productIds.join(','))
  if (activityId) params.append('activityId', activityId)
  return request({
    base: API_BASE.order,
    url: `/coupon/available?${params.toString()}`,
    method: 'GET'
  })
}

import { API_BASE, request } from './request.js'

export function pagePrizeAssets(status, pageNo = 1, pageSize = 20) {
  return request({
    base: API_BASE.order,
    url: '/api/prize-assets',
    method: 'GET',
    data: {
      status,
      pageNo,
      pageSize
    }
  })
}

export function createPrizeShipOrder(assetIds, remark = '') {
  return request({
    base: API_BASE.order,
    url: '/api/prize-ship-orders',
    method: 'POST',
    data: {
      assetIds,
      remark
    }
  })
}

/** 已选在柜奖品一次性熔炼为秘银（需登录，Bearer token） */
export function smeltPrizeAssets(assetIds) {
  return request({
    base: API_BASE.order,
    url: '/api/prize-assets/smelt',
    method: 'POST',
    data: { assetIds }
  })
}

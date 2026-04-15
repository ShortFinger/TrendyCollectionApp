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

export function batchReceivePrizeAssets(assetIds) {
  return request({
    base: API_BASE.order,
    url: '/api/prize-assets/receive',
    method: 'POST',
    data: { assetIds }
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

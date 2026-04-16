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
  const list = Array.isArray(assetIds) ? assetIds : []
  return request({
    base: API_BASE.order,
    url: '/api/prize-assets/smelt',
    method: 'POST',
    data: { assetIds: list }
  })
}

/**
 * 单件熔炼（兼容旧代码或分包缓存仍引用此名）。
 * 与 {@link smeltPrizeAssets}([id]) 等价。
 */
export function smeltPrizeAsset(assetId) {
  return smeltPrizeAssets(assetId == null ? [] : [assetId])
}

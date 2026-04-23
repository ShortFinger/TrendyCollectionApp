import { API_BASE, request } from './request.js'

function normalizeAddress(raw = {}) {
  const def = raw.isDefault ?? raw.defaultAddress ?? raw.defaultFlag
  return {
    id: raw.id ?? raw.addressId ?? '',
    receiverName: raw.receiverName ?? raw.consigneeName ?? '',
    receiverPhone: raw.receiverPhone ?? raw.consigneePhone ?? raw.phone ?? raw.mobile ?? '',
    provinceCode: raw.provinceCode ?? '',
    provinceName: raw.provinceName ?? raw.province ?? '',
    cityCode: raw.cityCode ?? '',
    cityName: raw.cityName ?? raw.city ?? '',
    districtCode: raw.districtCode ?? raw.areaCode ?? '',
    districtName: raw.districtName ?? raw.areaName ?? raw.district ?? '',
    detailAddress: raw.detailAddress ?? raw.addressDetail ?? raw.address ?? '',
    isDefault: def === true || def === 1 || def === '1'
  }
}

function toAddressPayload(payload = {}) {
  return {
    districtCode: payload.districtCode || '',
    provinceName: payload.provinceName || '',
    cityName: payload.cityName || '',
    districtName: payload.districtName || '',
    detailAddress: (payload.detailAddress || '').trim(),
    consigneeName: (payload.receiverName || payload.consigneeName || '').trim(),
    consigneePhone: (payload.receiverPhone || payload.consigneePhone || '').trim(),
    setAsDefault: Boolean(payload.isDefault ?? payload.setAsDefault)
  }
}

function ensureAddressArray(result) {
  const list = Array.isArray(result)
    ? result
    : (result?.records || result?.list || result?.content || [])
  return list.map(normalizeAddress)
}

export function fetchAddressList() {
  return request({
    base: API_BASE.user,
    url: '/addresses',
    method: 'GET'
  }).then(ensureAddressArray)
}

export function createAddress(payload) {
  return request({
    base: API_BASE.user,
    url: '/addresses',
    method: 'POST',
    data: toAddressPayload(payload)
  }).then(normalizeAddress)
}

export function updateAddress(id, payload) {
  return request({
    base: API_BASE.user,
    url: `/addresses/${id}`,
    method: 'PUT',
    data: toAddressPayload(payload)
  }).then(normalizeAddress)
}

export function deleteAddress(id) {
  return request({
    base: API_BASE.user,
    url: `/addresses/${id}`,
    method: 'DELETE'
  })
}

export function setDefaultAddress(id) {
  return request({
    base: API_BASE.user,
    url: `/addresses/${id}/default`,
    method: 'POST'
  })
}

/** 统一接口/网络错误提示（`request` reject 的 `res.data` 或 Error） */
export function formatAddressApiError(err, fallback = '操作失败，请稍后重试') {
  if (err == null) return fallback
  if (typeof err === 'string') return err
  const msg = err.message || err.msg
  if (msg) return String(msg)
  const code = err.code
  if (code === 1014) return '收货地址数量已达上限'
  if (code === 1016) return '默认地址不可删除，请先设置其他默认地址'
  if (code === 1013) return '收货地址不存在'
  if (code === 1015) return '无效的区县代码'
  return fallback
}

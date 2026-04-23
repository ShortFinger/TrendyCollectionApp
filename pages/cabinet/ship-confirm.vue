<template>
  <view class="ship-page">
    <scroll-view class="ship-scroll" scroll-y>
      <view class="section">
        <text class="section-title">待发货商品（{{ items.length }}）</text>
        <view v-if="items.length === 0" class="hint">
          <text>暂无选中商品</text>
        </view>
        <view v-for="row in items" :key="row.assetId" class="line-card">
          <text class="line-name">{{ row.skuName }}</text>
          <text class="line-sub">活动: {{ row.activityId }}</text>
          <text class="line-sub">类型: {{ row.recordType }} | 状态: {{ row.assetStatus }}</text>
          <text class="line-sub">入柜时间: {{ row.createTime }}</text>
        </view>
      </view>
      <view class="bottom-spacer" />
    </scroll-view>

    <view class="ship-bottom-fixed">
      <view class="addr-section">
        <text class="section-title">收货地址</text>
        <view v-if="addressLoading" class="hint">
          <text>加载中…</text>
        </view>
        <view v-else-if="addressLoadError" class="addr-error">
          <text class="addr-error-text">{{ addressLoadError }}</text>
          <button class="retry-btn" type="default" @tap="reloadAddresses">重试</button>
        </view>
        <view v-else-if="defaultAddress" class="addr-card">
          <text class="addr-line">{{ defaultAddress.receiverName }} {{ defaultAddress.receiverPhone }}</text>
          <text class="addr-line">{{ fullRegion(defaultAddress) }}{{ defaultAddress.detailAddress }}</text>
        </view>
        <view v-else class="addr-empty">
          <text>未设置默认收货地址</text>
        </view>
      </view>

      <view class="ship-footer">
        <button class="footer-btn ghost" type="default" :disabled="submitting" @tap="goBack">返回</button>
        <button
          class="footer-btn primary"
          type="default"
          :disabled="!canSubmit"
          :loading="submitting"
          @tap="onSubmit"
        >
          确认发货
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { fetchAddressList, formatAddressApiError } from '@/utils/addressApi.js'
import { createPrizeShipOrder } from '@/utils/cabinetApi.js'
import { findDefaultAddress } from '@/utils/cabinetShipConfirm.js'

const SHIP_CONFIRM_NEED_REFRESH_KEY = 'cabinetShipConfirmNeedRefresh'
const SHIP_CONFIRM_LATEST_PAYLOAD_KEY = 'cabinetShipConfirmLatestPayload'

const assetIds = ref([])
const items = ref([])
const addressLoading = ref(false)
const addressLoadError = ref('')
const defaultAddress = ref(null)
const submitting = ref(false)
/** 同一轮 onShow 内最多弹一次「无默认地址」引导 */
const suppressNoDefaultModal = ref(false)

const canSubmit = computed(() => {
  return (
    assetIds.value.length > 0 &&
    !!defaultAddress.value &&
    !addressLoading.value &&
    !addressLoadError.value &&
    !submitting.value
  )
})

function fullRegion(a) {
  if (!a) return ''
  const p = a.provinceName || ''
  const c = a.cityName || ''
  const d = a.districtName || ''
  return `${p}${c}${d}`
}

function goBack() {
  uni.navigateBack()
}

function tryPromptNoDefault() {
  if (addressLoadError.value) return
  if (addressLoading.value) return
  if (assetIds.value.length === 0) return
  if (defaultAddress.value) return
  if (suppressNoDefaultModal.value) return
  suppressNoDefaultModal.value = true
  uni.showModal({
    title: '请先设置默认地址',
    content: '合并发货需要默认收货地址。请前往收货地址管理新增或设置默认地址。',
    confirmText: '去设置',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/address/list' })
      }
    }
  })
}

onLoad((options) => {
  const rawKey = String(options?.payloadKey || '').trim()
  let payloadKey = rawKey
  // 某些端可能把 query 值做了编码，解码后再取一次
  try {
    const decoded = decodeURIComponent(rawKey)
    if (decoded) payloadKey = decoded
  } catch {
    // ignore decode failure and keep raw key
  }
  let payload = null
  if (rawKey) {
    payload = uni.getStorageSync(rawKey)
  }
  if (!payload && payloadKey && payloadKey !== rawKey) {
    payload = uni.getStorageSync(payloadKey)
  }
  if (!payload) {
    payload = uni.getStorageSync(SHIP_CONFIRM_LATEST_PAYLOAD_KEY)
  }
  if (rawKey) uni.removeStorageSync(rawKey)
  if (payloadKey && payloadKey !== rawKey) uni.removeStorageSync(payloadKey)
  uni.removeStorageSync(SHIP_CONFIRM_LATEST_PAYLOAD_KEY)
  const ids = Array.isArray(payload?.assetIds) ? payload.assetIds : []
  const rows = Array.isArray(payload?.items) ? payload.items : []
  assetIds.value = ids
  items.value = rows
  if (ids.length === 0) {
    uni.showToast({ title: '没有可发货的商品', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 800)
    return
  }
})

async function reloadAddresses() {
  addressLoadError.value = ''
  addressLoading.value = true
  defaultAddress.value = null
  try {
    const list = await fetchAddressList()
    defaultAddress.value = findDefaultAddress(list)
  } catch (e) {
    addressLoadError.value = formatAddressApiError(e, '地址加载失败')
  } finally {
    addressLoading.value = false
    tryPromptNoDefault()
  }
}

onShow(() => {
  suppressNoDefaultModal.value = false
  reloadAddresses()
})

async function onSubmit() {
  if (!canSubmit.value) return
  const ids = assetIds.value
  submitting.value = true
  try {
    const data = await createPrizeShipOrder(ids, '')
    uni.showToast({
      title: `已提交发货申请(${data?.assetCount ?? ids.length}件)`,
      icon: 'none'
    })
    uni.setStorageSync(SHIP_CONFIRM_NEED_REFRESH_KEY, 1)
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  } catch (err) {
    uni.showToast({ title: err?.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.ship-page {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(360rpx + env(safe-area-inset-bottom));
}

.ship-scroll {
  flex: 1;
  min-height: 0;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
}

.section {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.line-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
}

.line-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
  display: block;
}

.line-sub {
  font-size: 22rpx;
  color: #777;
  display: block;
  margin-top: 8rpx;
}

.hint {
  text-align: center;
  color: #888;
  padding: 24rpx 0;
  font-size: 24rpx;
}

.addr-error {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}

.addr-error-text {
  font-size: 24rpx;
  color: #c00;
  display: block;
  margin-bottom: 16rpx;
}

.retry-btn {
  font-size: 24rpx;
}

.addr-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}

.addr-line {
  font-size: 26rpx;
  color: #333;
  display: block;
  line-height: 1.5;
}

.addr-empty {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 24rpx;
  color: #888;
}

.bottom-spacer {
  height: calc(380rpx + env(safe-area-inset-bottom));
}

.ship-bottom-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.addr-section {
  padding: 16rpx 24rpx 6rpx;
}

.ship-footer {
  background: #fff;
  padding: 12rpx 24rpx calc(14rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 16rpx;
}

.footer-btn {
  flex: 1;
  border-radius: 999rpx;
  font-size: 28rpx;
  line-height: 1;
  padding: 22rpx 12rpx;
}

.footer-btn.ghost {
  background: #fff;
  color: #333;
  border: 2rpx solid #ccc;
}

.footer-btn.primary {
  background: #111;
  color: #fff;
  border: none;
}

.footer-btn.primary[disabled] {
  opacity: 0.45;
}
</style>

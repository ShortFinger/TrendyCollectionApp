<template>
  <view class="cabinet-page">
    <view class="tab-row">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ 'tab-item-active': currentTab === tab.key }"
        @tap="onSwitchTab(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view class="list-wrap" scroll-y @scrolltolower="loadMore">
      <view v-if="loading && list.length === 0" class="state">
        <text>加载中...</text>
      </view>
      <view v-else-if="!loading && list.length === 0" class="state">
        <text>暂无数据</text>
      </view>
      <view class="asset-grid">
        <view
          v-for="item in list"
          :key="item.assetId"
          class="asset-card"
          :class="{ selected: selectedMap[item.assetId] }"
          @tap="toggleSelect(item.assetId)"
        >
          <image
            v-if="hasImage(item)"
            class="asset-thumb"
            :src="resolveImageUrl(item)"
            mode="aspectFill"
          />
          <view v-else class="asset-thumb asset-thumb-placeholder">
            <text>暂无图片</text>
          </view>
          <text class="sku-name">{{ resolveSkuName(item) }}</text>
          <text class="recycle-price">回收价 {{ resolveRecyclePrice(item) }} 秘银</text>
          <view v-if="selectedMap[item.assetId]" class="selected-mark">✓</view>
        </view>
      </view>
      <view v-if="loadingMore" class="state">
        <text>加载更多...</text>
      </view>
    </scroll-view>

    <view class="bottom-bar" v-if="currentTab === 'IN_CABINET'">
      <text class="selected-count">已选 {{ selectedIds.length }} 件</text>
      <view class="btn-row">
        <button
          class="btn smelt-bar"
          :disabled="selectedInCabinetIds.length === 0 || submitting || smeltingBatch"
          @tap="onSmeltSelected"
        >
          熔炼
        </button>
        <button class="btn black" :disabled="selectedIds.length === 0 || submitting || smeltingBatch" @tap="onCreateShipOrder">
          合并发货
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { pagePrizeAssets, smeltPrizeAssets } from '@/utils/cabinetApi.js'

const SHIP_CONFIRM_PAYLOAD_KEY_PREFIX = 'cabinetShipConfirmPayload_'
const SHIP_CONFIRM_LATEST_PAYLOAD_KEY = 'cabinetShipConfirmLatestPayload'
const SHIP_CONFIRM_NEED_REFRESH_KEY = 'cabinetShipConfirmNeedRefresh'

const tabs = [
  { key: 'IN_CABINET', label: '在柜' }
]

const currentTab = ref('IN_CABINET')
const list = ref([])
const pageNo = ref(1)
const pageSize = 20
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const smeltingBatch = ref(false)
const selectedMap = ref({})
/** 从确认页返回时是否需要强制刷新；普通返回保留勾选状态 */
const shouldReloadOnShow = ref(true)

const selectedIds = computed(() => Object.keys(selectedMap.value).filter((k) => selectedMap.value[k]))

/** 已勾选且当前列表中仍为在柜的 assetId（批量熔炼仅处理这些） */
const selectedInCabinetIds = computed(() => {
  const inCabinet = new Set(
    list.value.filter((i) => i.assetStatus === 'IN_CABINET').map((i) => i.assetId)
  )
  return selectedIds.value.filter((id) => inCabinet.has(id))
})

function clearSelection() {
  selectedMap.value = {}
}

async function load(reset = false) {
  if (reset) {
    pageNo.value = 1
    total.value = 0
    list.value = []
    clearSelection()
  }
  if (loading.value || loadingMore.value) return
  const firstPage = pageNo.value === 1
  if (firstPage) loading.value = true
  else loadingMore.value = true
  let beforeLen = 0
  try {
    beforeLen = list.value.length
    const data = await pagePrizeAssets(currentTab.value, pageNo.value, pageSize)
    const newList = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total || 0)
    list.value = firstPage ? newList : list.value.concat(newList)
    pageNo.value += 1
  } catch (err) {
    uni.showToast({ title: err?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }

  await nextTick()
  await maybeAutoFillMore({ beforeLen })
}

/** 当内容不足以触发滚动时，`scrolltolower` 可能不会触发；此时自动补齐剩余分页 */
async function maybeAutoFillMore({ beforeLen }) {
  const totalN = Number(total.value || 0)
  if (!totalN) return

  // 服务端仍有剩余，但本次没有新增记录：避免死循环
  if (list.value.length <= beforeLen && beforeLen > 0) return

  if (list.value.length >= totalN) return
  if (loading.value || loadingMore.value) return

  await load(false)
}

function loadMore() {
  if (list.value.length >= total.value) return
  load(false)
}

function onSwitchTab(tab) {
  if (currentTab.value === tab) return
  currentTab.value = tab
  load(true)
}

function toggleSelect(assetId) {
  if (currentTab.value !== 'IN_CABINET') return
  selectedMap.value = {
    ...selectedMap.value,
    [assetId]: !selectedMap.value[assetId]
  }
}

function resolveSkuName(item) {
  const name = item?.skuName || item?.name || item?.title || ''
  return String(name || '未命名商品')
}

function resolveImageUrl(item) {
  return String(
    item?.skuImageUrl ||
      item?.skuImgUrl ||
      item?.skuImage ||
      item?.sku_image ||
      item?.imageUrl ||
      item?.image_url ||
      item?.coverUrl ||
      item?.cover_url ||
      item?.cover ||
      ''
  )
}

function hasImage(item) {
  return !!resolveImageUrl(item)
}

function resolveRecyclePrice(item) {
  const raw =
    item?.recyclePrice ??
    item?.recycle_price ??
    item?.skuRecyclePrice ??
    item?.sku_recycle_price ??
    item?.smeltPrice ??
    item?.price
  const num = Number(raw)
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0
}

function onCreateShipOrder() {
  if (selectedIds.value.length === 0 || submitting.value || smeltingBatch.value) return
  const ids = [...selectedIds.value]
  const idSet = new Set(ids)
  const rows = list.value
    .filter((row) => idSet.has(row.assetId))
    .map((row) => ({
      assetId: row.assetId,
      skuName: resolveSkuName(row),
      skuImageUrl: resolveImageUrl(row),
      recyclePrice: resolveRecyclePrice(row)
    }))
  const payloadKey = `${SHIP_CONFIRM_PAYLOAD_KEY_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const payload = { assetIds: ids, items: rows }
  uni.setStorageSync(payloadKey, payload)
  // 兜底：若 query key 在某端丢失/被编码，确认页可回退到最近一次 payload
  uni.setStorageSync(SHIP_CONFIRM_LATEST_PAYLOAD_KEY, payload)
  shouldReloadOnShow.value = false
  uni.navigateTo({
    url: `/pages/cabinet/ship-confirm?payloadKey=${payloadKey}`,
    fail() {
      uni.removeStorageSync(payloadKey)
      uni.removeStorageSync(SHIP_CONFIRM_LATEST_PAYLOAD_KEY)
      shouldReloadOnShow.value = true
      uni.showToast({ title: '无法打开发货确认页', icon: 'none' })
    }
  })
}

function smeltConfirmContent(n) {
  const head =
    n === 1
      ? '将对当前选中的 1 件在柜物品发起熔炼。'
      : `将对已选的 ${n} 件在柜物品一次性提交熔炼。`
  return [
    head,
    '按回收价兑换秘银（四舍五入到整数）；回收价为 0 或空时获得 0 秘银。',
    '此操作不可撤销；任一件校验失败则整单不会生效。',
    '是否继续？'
  ].join('')
}

async function onSmeltSelected() {
  const ids = [...selectedInCabinetIds.value]
  if (ids.length === 0 || smeltingBatch.value || submitting.value) return
  uni.showModal({
    title: '确认熔炼',
    content: smeltConfirmContent(ids.length),
    confirmText: '开始熔炼',
    cancelText: '取消',
    success: async (res) => {
      if (!res.confirm) return
      smeltingBatch.value = true
      try {
        const data = await smeltPrizeAssets(ids)
        const smelted = Number(data?.smeltedCount ?? 0)
        const skipped = Number(data?.skippedCount ?? 0)
        const totalDelta = Number(data?.mithrilDelta ?? 0)
        let title = `${smelted} 件已熔炼，共获得 ${totalDelta} 秘银`
        if (skipped > 0) {
          title += `（已跳过 ${skipped} 件）`
        }
        uni.showToast({
          title,
          icon: 'none',
          duration: skipped > 0 ? 3000 : 2500
        })
        await load(true)
      } catch (err) {
        uni.showToast({ title: err?.message || '熔炼失败', icon: 'none' })
      } finally {
        smeltingBatch.value = false
      }
    }
  })
}

onShow(() => {
  const needRefresh = uni.getStorageSync(SHIP_CONFIRM_NEED_REFRESH_KEY) === 1
  if (needRefresh) {
    uni.removeStorageSync(SHIP_CONFIRM_NEED_REFRESH_KEY)
    shouldReloadOnShow.value = true
  }
  if (shouldReloadOnShow.value) {
    load(true)
  } else {
    shouldReloadOnShow.value = true
  }
})
</script>

<style lang="scss" scoped>
.cabinet-page {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.tab-row {
  display: flex;
  background: #fff;
  padding: 16rpx 24rpx;
  gap: 16rpx;
}

.tab-item {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: #f0f1f5;
  color: #666;
  font-size: 24rpx;
}

.tab-item-active {
  background: #111;
  color: #fff;
}

.list-wrap {
  flex: 1;
  min-height: 0;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
}

.asset-grid {
  --asset-card-height: 312rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18rpx 8rpx;
  height: 100%;
  min-height: 100%;
  align-content: start;
}

.asset-card {
  background: #fff;
  border: 2rpx solid #e5e7eb;
  border-radius: 12rpx;
  padding: 6rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.asset-card.selected {
  border-color: #93c5fd;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1rpx #bfdbfe;
}

.asset-thumb {
  width: 100%;
  height: 192rpx;
  flex-shrink: 0;
  display: block;
  border-radius: 8rpx;
  background: linear-gradient(145deg, #fde68a 0%, #f9a8d4 45%, #bfdbfe 100%);
}

.asset-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 14rpx;
}

.sku-name {
  font-size: 18rpx;
  font-weight: 600;
  color: #222;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recycle-price {
  font-size: 16rpx;
  color: #4b5563;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-mark {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 14rpx;
  line-height: 22rpx;
  text-align: center;
  font-weight: 700;
}

.state {
  text-align: center;
  color: #888;
  padding: 32rpx 0;
  font-size: 24rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  padding: 14rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.selected-count {
  font-size: 24rpx;
  color: #444;
}

.btn-row {
  display: flex;
  gap: 12rpx;
}

.btn {
  min-width: 180rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  line-height: 1;
  padding: 20rpx 10rpx;
}

.btn.black {
  background: #111;
  color: #fff;
}

.btn.smelt-bar {
  min-width: 140rpx;
  margin: 0;
  background: #fff;
  color: #333;
  border: 2rpx solid #ccc;
}

.btn.smelt-bar[disabled] {
  opacity: 0.45;
}
</style>

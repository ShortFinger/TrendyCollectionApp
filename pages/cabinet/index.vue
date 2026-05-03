<template>
  <view
    class="cabinet-page"
    :class="{ 'cabinet-page--with-bottom': manageMode && currentTab === 'IN_CABINET' }"
  >
    <view class="tab-row">
      <view class="tab-row-left">
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
      <text
        v-if="currentTab === 'IN_CABINET' && !manageMode"
        class="tab-manage"
        @tap="enterManage"
      >管理</text>
      <text
        v-else-if="currentTab === 'IN_CABINET' && manageMode"
        class="tab-manage"
        @tap="exitManage"
      >完成</text>
    </view>

    <view
      v-if="manageMode && currentTab === 'IN_CABINET'"
      class="select-all-row"
    >
      <text class="select-all-link" @tap="onSelectAllLoaded">全选</text>
      <text class="select-all-link" @tap="clearSelection">取消全选</text>
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
          v-for="row in displayRows"
          :key="row.mergeKey"
          class="asset-card"
          :class="{ selected: manageMode && isRowSelected(row) }"
        >
          <view class="asset-card-main" @tap="onRowMainTap(row)">
            <view
              v-if="row.type === 'group' && row.members.length >= 2"
              class="merge-count-badge"
            >
              <text class="merge-count-text">×{{ row.members.length }}</text>
            </view>
            <image
              v-if="hasImage(row.representative)"
              class="asset-thumb"
              :src="resolveImageUrl(row.representative)"
              mode="aspectFill"
            />
            <view v-else class="asset-thumb asset-thumb-placeholder">
              <text>暂无图片</text>
            </view>
            <text class="sku-name">{{ resolveSkuName(row.representative) }}</text>
            <text class="recycle-price">回收价 {{ resolveRecyclePrice(row.representative) }} 秘银</text>
            <view v-if="manageMode && isRowFullySelected(row)" class="selected-mark">✓</view>
          </view>
          <view
            v-if="row.type === 'group' && row.members.length >= 2"
            class="merge-expand"
            @tap.stop="openGroupSheet(row.members)"
          >
            <text class="merge-expand-text">展开</text>
          </view>
        </view>
      </view>
      <view v-if="loadingMore" class="state">
        <text>加载更多...</text>
      </view>
    </scroll-view>

    <view class="bottom-bar" v-if="currentTab === 'IN_CABINET' && manageMode">
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

    <view v-if="sheetOpen" class="sheet-mask" @tap="closeGroupSheet">
      <view class="sheet-panel" @tap.stop>
        <view class="sheet-head">
          <view class="sheet-head-texts">
            <text class="sheet-title">{{ resolveSkuName(sheetMembers[0]) }}</text>
            <text class="sheet-sub">共 {{ sheetMembers.length }} 件 · 同一订单</text>
          </view>
          <text class="sheet-close" @tap="closeGroupSheet">关闭</text>
        </view>
        <scroll-view scroll-y class="sheet-list">
          <view
            v-for="m in sheetMembers"
            :key="m.assetId"
            class="sheet-row"
            @tap="onSheetRowTap(m.assetId)"
          >
            <text v-if="manageMode" class="sheet-check">{{ selectedMap[m.assetId] ? '☑' : '☐' }}</text>
            <view v-else class="sheet-check-placeholder" />
            <image
              v-if="hasImage(m)"
              class="sheet-thumb"
              :src="resolveImageUrl(m)"
              mode="aspectFill"
            />
            <view v-else class="sheet-thumb sheet-thumb-placeholder">
              <text>无图</text>
            </view>
            <view class="sheet-meta">
              <text class="sheet-name">{{ resolveSkuName(m) }}</text>
              <text class="sheet-price">回收价 {{ resolveRecyclePrice(m) }} 秘银</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { pagePrizeAssets, smeltPrizeAssets } from '@/utils/cabinetApi.js'
import {
  buildCabinetDisplayRows,
  groupAllSelected,
  groupHasSelection
} from '@/utils/cabinetMergeGroups.js'
import { collectInCabinetAssetIds } from '@/utils/cabinetSelection.js'

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
const manageMode = ref(false)
const selectedMap = ref({})
/** 从确认页返回时是否需要强制刷新；普通返回保留勾选状态 */
const shouldReloadOnShow = ref(true)

const selectedIds = computed(() => Object.keys(selectedMap.value).filter((k) => selectedMap.value[k]))

const displayRows = computed(() => buildCabinetDisplayRows(list.value, currentTab.value))

const sheetOpen = ref(false)
const sheetMembers = ref([])

function enterManage() {
  if (currentTab.value !== 'IN_CABINET') return
  manageMode.value = true
}

function exitManage() {
  manageMode.value = false
  clearSelection()
  closeGroupSheet()
}

function onSelectAllLoaded() {
  const next = { ...selectedMap.value }
  for (const id of collectInCabinetAssetIds(list.value)) {
    next[id] = true
  }
  selectedMap.value = next
}

function openGroupSheet(members) {
  sheetMembers.value = Array.isArray(members) ? [...members] : []
  sheetOpen.value = true
}

function closeGroupSheet() {
  sheetOpen.value = false
}

function isRowSelected(row) {
  return groupHasSelection(row.members, selectedMap.value)
}

function isRowFullySelected(row) {
  return groupAllSelected(row.members, selectedMap.value)
}

function onRowMainTap(row) {
  if (currentTab.value !== 'IN_CABINET') return

  if (!manageMode.value) {
    const rep = row?.representative
    const url = resolveImageUrl(rep)
    if (!url) {
      uni.showToast({ title: '暂无图片', icon: 'none' })
      return
    }
    uni.previewImage({
      urls: [url],
      current: url
    })
    return
  }

  const allOn = groupAllSelected(row.members, selectedMap.value)
  const next = { ...selectedMap.value }
  for (const m of row.members) {
    const id = String(m.assetId)
    next[id] = !allOn
  }
  selectedMap.value = next
}

function onSheetRowTap(assetId) {
  if (!manageMode.value) return
  toggleMemberInSheet(assetId)
}

function toggleMemberInSheet(assetId) {
  const id = String(assetId)
  selectedMap.value = {
    ...selectedMap.value,
    [id]: !selectedMap.value[id]
  }
}

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
  closeGroupSheet()
  manageMode.value = false
  currentTab.value = tab
  load(true)
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
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.cabinet-page--with-bottom {
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.tab-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  background: #fff;
  padding: 16rpx 24rpx;
}

.tab-row-left {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.tab-manage {
  flex-shrink: 0;
  font-size: 28rpx;
  color: #2563eb;
  padding: 8rpx 0 8rpx 16rpx;
}

.select-all-row {
  display: flex;
  justify-content: flex-end;
  gap: 32rpx;
  padding: 8rpx 24rpx 12rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f1f5;
}

.select-all-link {
  font-size: 26rpx;
  color: #2563eb;
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
  gap: 2rpx;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.asset-card-main {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
  min-height: 0;
  position: relative;
}

.merge-count-badge {
  position: absolute;
  top: 2rpx;
  left: 2rpx;
  z-index: 2;
  background: rgba(17, 24, 39, 0.85);
  color: #fff;
  font-size: 16rpx;
  line-height: 1;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
}

.merge-count-text {
  font-weight: 700;
}

.merge-expand {
  flex-shrink: 0;
  text-align: center;
  padding: 2rpx 0 0;
}

.merge-expand-text {
  font-size: 16rpx;
  color: #2563eb;
}

.sheet-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-panel {
  width: 100%;
  max-height: 62vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.sheet-head-texts {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.sheet-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111;
}

.sheet-sub {
  font-size: 22rpx;
  color: #6b7280;
}

.sheet-close {
  font-size: 26rpx;
  color: #2563eb;
  flex-shrink: 0;
}

.sheet-list {
  max-height: 46vh;
}

.sheet-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.sheet-check {
  font-size: 28rpx;
  width: 36rpx;
  text-align: center;
  flex-shrink: 0;
}

.sheet-check-placeholder {
  width: 36rpx;
  flex-shrink: 0;
}

.sheet-thumb {
  width: 88rpx;
  height: 88rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
  background: #f3f4f6;
}

.sheet-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  color: #9ca3af;
}

.sheet-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.sheet-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #222;
}

.sheet-price {
  font-size: 22rpx;
  color: #6b7280;
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

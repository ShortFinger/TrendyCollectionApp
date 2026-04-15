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
      <view
        v-for="item in list"
        :key="item.assetId"
        class="asset-card"
        @tap="toggleSelect(item.assetId)"
      >
        <view class="asset-main">
          <view class="checkbox" :class="{ checked: selectedMap[item.assetId] }" />
          <view class="meta">
            <text class="sku-name">{{ item.skuName }}</text>
            <text class="sub">活动: {{ item.activityId }}</text>
            <text class="sub">类型: {{ item.recordType }} | 状态: {{ item.assetStatus }}</text>
            <text class="sub">入柜时间: {{ item.createTime }}</text>
          </view>
        </view>
      </view>
      <view v-if="loadingMore" class="state">
        <text>加载更多...</text>
      </view>
    </scroll-view>

    <view class="bottom-bar" v-if="currentTab === 'IN_CABINET'">
      <text class="selected-count">已选 {{ selectedIds.length }} 件</text>
      <view class="btn-row">
        <button class="btn plain" :disabled="selectedIds.length === 0 || submitting" @tap="onReceive">
          标记领取
        </button>
        <button class="btn black" :disabled="selectedIds.length === 0 || submitting" @tap="onCreateShipOrder">
          合并发货
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  batchReceivePrizeAssets,
  createPrizeShipOrder,
  pagePrizeAssets
} from '@/utils/cabinetApi.js'

const tabs = [
  { key: 'IN_CABINET', label: '在柜' },
  { key: 'RECEIVED', label: '已领取' }
]

const currentTab = ref('IN_CABINET')
const list = ref([])
const pageNo = ref(1)
const pageSize = 20
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const selectedMap = ref({})

const selectedIds = computed(() => Object.keys(selectedMap.value).filter((k) => selectedMap.value[k]))

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
  try {
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

async function onReceive() {
  if (selectedIds.value.length === 0 || submitting.value) return
  submitting.value = true
  try {
    const data = await batchReceivePrizeAssets(selectedIds.value)
    const failCount = Array.isArray(data?.failItems) ? data.failItems.length : 0
    uni.showToast({
      title: failCount > 0 ? `成功${data.successCount}，失败${failCount}` : `已领取 ${data.successCount} 件`,
      icon: 'none'
    })
    await load(true)
  } catch (err) {
    uni.showToast({ title: err?.message || '领取失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function onCreateShipOrder() {
  if (selectedIds.value.length === 0 || submitting.value) return
  submitting.value = true
  try {
    const data = await createPrizeShipOrder(selectedIds.value)
    uni.showToast({
      title: `已提交发货申请(${data.assetCount}件)`,
      icon: 'none'
    })
    await load(true)
  } catch (err) {
    uni.showToast({ title: err?.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onShow(() => {
  load(true)
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

.asset-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.asset-main {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.checkbox {
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid #c9c9c9;
  border-radius: 50%;
  margin-top: 6rpx;
}

.checkbox.checked {
  background: #111;
  border-color: #111;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.sku-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #222;
}

.sub {
  font-size: 22rpx;
  color: #777;
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
  padding: 14rpx 24rpx calc(14rpx + env(safe-area-inset-bottom));
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

.btn.plain {
  background: #f0f0f0;
  color: #333;
}

.btn.black {
  background: #111;
  color: #fff;
}
</style>

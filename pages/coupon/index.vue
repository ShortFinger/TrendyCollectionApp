<template>
  <view class="coupon-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="nav-back-icon">‹</text>
      </view>
      <text class="nav-title">优惠券中心</text>
      <view class="nav-right" />
    </view>

    <scroll-view class="coupon-scroll" scroll-y>
      <!-- 顶部标签切换 -->
      <view class="tabs">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          @click="switchTab(tab)"
        >
          <text
            class="tab-text"
            :class="{ 'tab-text-active': tab.key === activeTab }"
          >
            {{ tab.label }}{{ tab.count != null ? ` (${tab.count})` : '' }}
          </text>
        </view>
      </view>

      <!-- 兑换码输入 -->
      <view class="exchange-row">
        <input
          v-model="exchangeCode"
          class="exchange-input"
          placeholder="输入兑换码"
          placeholder-class="exchange-placeholder"
        />
        <view class="exchange-btn" @click="handleExchange">
          <text class="exchange-btn-text">兑换</text>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-wrap">
        <text class="loading-text">加载中…</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!couponList.length" class="empty-wrap">
        <text class="empty-text">暂无优惠券</text>
      </view>

      <!-- 优惠券列表 -->
      <view v-else class="coupon-list">
        <view
          v-for="item in couponList"
          :key="item.userCouponId"
          class="coupon-card"
        >
          <!-- 左侧彩色金额区 -->
          <view
            class="coupon-left"
            :style="{ backgroundColor: getCouponColor(item.couponType) }"
          >
            <view class="coupon-left-top">
              <template v-if="item.couponType === 'CASH'">
                <text class="coupon-amount-prefix">￥</text>
                <text class="coupon-amount">{{ item.discountValue / 100 }}</text>
              </template>
              <template v-else-if="item.couponType === 'DISCOUNT'">
                <text class="coupon-amount">{{ item.discountValue / 10 }}</text>
                <text class="coupon-amount-prefix">折</text>
              </template>
              <text v-else-if="item.couponType === 'FREE_SHIPPING'" class="coupon-tag-text">免运费</text>
              <text v-else-if="item.couponType === 'EXCHANGE'" class="coupon-tag-text">兑换券</text>
            </view>
            <text class="coupon-condition">
              {{ item.minSpend > 0 ? '满' + item.minSpend / 100 + '使用' : '无门槛' }}
            </text>

            <!-- 上下缺口 -->
            <view class="coupon-notch coupon-notch-top" />
            <view class="coupon-notch coupon-notch-bottom" />
          </view>

          <!-- 右侧白色内容区 -->
          <view class="coupon-right">
            <view class="coupon-right-main">
              <view class="coupon-right-header">
                <text class="coupon-title">{{ item.couponName }}</text>
              </view>
              <view class="coupon-sub-row">
                <text class="coupon-expire">有效期至：{{ formatDate(item.validEnd) }}</text>
              </view>

              <view class="coupon-tag-row">
                <view class="coupon-mini-tag">
                  <text class="coupon-mini-tag-text">{{ getScopeLabel(item.scopeType) }}</text>
                </view>
              </view>
            </view>

            <view class="coupon-right-footer">
              <view
                v-if="getStatusText(item)"
                class="coupon-status"
              >
                <text class="coupon-status-text">{{ getStatusText(item) }}</text>
              </view>
              <view
                v-if="activeTab === 'UNUSED'"
                class="coupon-use-btn"
                @click="handleUse(item)"
              >
                <text class="coupon-use-btn-text">去使用</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部预留空间 -->
      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchUserCoupons, claimByExchangeCode } from '@/utils/couponApi.js'

const activeTab = ref('UNUSED')
const couponList = ref([])
const exchangeCode = ref('')
const loading = ref(false)

const tabCounts = ref({ UNUSED: null, USED: null, EXPIRED: null })

const tabs = [
  { key: 'UNUSED', label: '可用' },
  { key: 'USED', label: '已使用' },
  { key: 'EXPIRED', label: '已过期' }
]

const COLOR_MAP = {
  CASH: '#06c167',
  DISCOUNT: '#ff8a34',
  FREE_SHIPPING: '#4285f4',
  EXCHANGE: '#e53935'
}

const SCOPE_LABEL = {
  ALL: '商城通用',
  ACTIVITY: '指定活动',
  PRODUCT: '指定商品'
}

function getCouponColor(type) {
  return COLOR_MAP[type] || '#06c167'
}

function getScopeLabel(scope) {
  return SCOPE_LABEL[scope] || '商城通用'
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function getStatusText(item) {
  if (item.status === 'USED') return '已使用'
  if (item.status === 'EXPIRED') return '已过期'
  if (item.status === 'UNUSED' && item.validEnd) {
    const remain = new Date(item.validEnd).getTime() - Date.now()
    if (remain > 0 && remain < 3 * 24 * 60 * 60 * 1000) return '即将过期'
  }
  return ''
}

async function loadCoupons(status) {
  loading.value = true
  try {
    const data = await fetchUserCoupons(status)
    const list = Array.isArray(data) ? data : (data?.records || data?.list || [])
    couponList.value = list
    tabCounts.value[status] = list.length
  } catch (err) {
    console.error('loadCoupons error', err)
    couponList.value = []
  } finally {
    loading.value = false
  }
}

function switchTab(tab) {
  if (activeTab.value === tab.key) return
  activeTab.value = tab.key
  loadCoupons(tab.key)
}

async function handleExchange() {
  const code = exchangeCode.value.trim()
  if (!code) {
    uni.showToast({ title: '请输入兑换码', icon: 'none' })
    return
  }
  try {
    await claimByExchangeCode(code)
    uni.showToast({ title: '兑换成功', icon: 'success' })
    exchangeCode.value = ''
    loadCoupons(activeTab.value)
  } catch (err) {
    uni.showToast({ title: err?.message || err?.msg || '兑换失败', icon: 'none' })
  }
}

function handleUse(item) {
  const nav = item.navigateType
  const params = item.navigateParams || {}

  if (nav === 'CUSTOM' && item.navigateUrl) {
    uni.navigateTo({ url: item.navigateUrl })
    return
  }

  if (nav === 'PRESET') {
    const target = params.target || params.page
    switch (target) {
      case 'HOME':
        uni.switchTab({ url: '/pages/index/index' })
        return
      case 'ACTIVITY':
        if (params.activityId) {
          uni.navigateTo({ url: '/pages/activity/other/index?id=' + params.activityId })
        }
        return
      case 'PRODUCT':
        if (params.productId) {
          uni.navigateTo({ url: '/pages/product/index?id=' + params.productId })
        }
        return
      case 'CATEGORY':
        uni.switchTab({ url: '/pages/category/index' })
        return
    }
  }

  uni.switchTab({ url: '/pages/index/index' })
}

const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  loadCoupons('UNUSED')
})
</script>

<style lang="scss">
.coupon-page {
  min-height: 100vh;
  background-color: #f6f7fb;
}

.nav-bar {
  height: 88rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.nav-left,
.nav-right {
  width: 80rpx;
  height: 100%;
  display: flex;
  align-items: center;
}

.nav-left {
  justify-content: flex-start;
}

.nav-right {
  justify-content: flex-end;
}

.nav-back-icon {
  font-size: 40rpx;
  color: #111111;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  color: #111111;
}

.coupon-scroll {
  height: calc(100vh - 88rpx);
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.tabs {
  margin-top: 24rpx;
  padding: 0 16rpx;
  display: flex;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: #f0f0f0;
}

.tab-item {
  margin-right: 32rpx;
  padding-bottom: 16rpx;
}

.tab-text {
  font-size: 26rpx;
  color: #999999;
}

.tab-text-active {
  color: #06c167;
  font-weight: 600;
}

.exchange-row {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
}

.exchange-input {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  padding: 0 28rpx;
  background-color: #ffffff;
  font-size: 26rpx;
  box-sizing: border-box;
}

.exchange-placeholder {
  font-size: 26rpx;
  color: #cccccc;
}

.exchange-btn {
  margin-left: 16rpx;
  width: 140rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background-color: #06c167;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exchange-btn-text {
  font-size: 26rpx;
  color: #ffffff;
}

.loading-wrap {
  margin-top: 120rpx;
  display: flex;
  justify-content: center;
}

.loading-text {
  font-size: 26rpx;
  color: #999999;
}

.empty-wrap {
  margin-top: 120rpx;
  display: flex;
  justify-content: center;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}

.coupon-list {
  margin-top: 24rpx;
}

.coupon-card {
  margin-bottom: 20rpx;
  border-radius: 24rpx;
  background-color: transparent;
  display: flex;
}

.coupon-left {
  width: 210rpx;
  border-top-left-radius: 24rpx;
  border-bottom-left-radius: 24rpx;
  padding: 24rpx 18rpx;
  position: relative;
  overflow: hidden;
}

.coupon-left-top {
  flex-direction: row;
  display: flex;
  align-items: baseline;
}

.coupon-amount-prefix {
  font-size: 26rpx;
  color: #ffffff;
}

.coupon-amount {
  margin-left: 4rpx;
  font-size: 46rpx;
  font-weight: 700;
  color: #ffffff;
}

.coupon-tag-text {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #ffffff;
}

.coupon-condition {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #e7fcec;
}

.coupon-notch {
  position: absolute;
  right: -12rpx;
  width: 24rpx;
  height: 24rpx;
  border-radius: 12rpx;
  background-color: #ffffff;
}

.coupon-notch-top {
  top: -12rpx;
}

.coupon-notch-bottom {
  bottom: -12rpx;
}

.coupon-right {
  flex: 1;
  background-color: #ffffff;
  border-top-right-radius: 24rpx;
  border-bottom-right-radius: 24rpx;
  padding: 22rpx 22rpx 22rpx 26rpx;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.coupon-right-main {
  flex: 1;
}

.coupon-right-header {
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coupon-title {
  font-size: 26rpx;
  color: #111111;
  font-weight: 600;
}

.coupon-sub-row {
  margin-top: 8rpx;
}

.coupon-expire {
  font-size: 22rpx;
  color: #999999;
}

.coupon-tag-row {
  margin-top: 12rpx;
  display: flex;
}

.coupon-mini-tag {
  padding: 4rpx 12rpx;
  border-radius: 18rpx;
  background-color: #fef4ea;
  margin-right: 8rpx;
}

.coupon-mini-tag-text {
  font-size: 20rpx;
  color: #ff8a34;
}

.coupon-right-footer {
  margin-left: 16rpx;
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.coupon-status {
  padding: 4rpx 10rpx;
  border-radius: 16rpx;
  background-color: #e6f6ec;
}

.coupon-status-text {
  font-size: 20rpx;
  color: #06c167;
}

.coupon-use-btn {
  margin-top: 12rpx;
  width: 140rpx;
  height: 60rpx;
  border-radius: 30rpx;
  background-color: #06c167;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coupon-use-btn-text {
  font-size: 24rpx;
  color: #ffffff;
}

.bottom-safe {
  height: 80rpx;
}
</style>

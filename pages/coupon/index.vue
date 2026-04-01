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
        >
          <text
            class="tab-text"
            :class="{ 'tab-text-active': tab.key === activeTab }"
          >
            {{ tab.label }}
          </text>
        </view>
      </view>

      <!-- 兑换码输入 -->
      <view class="exchange-row">
        <input
          class="exchange-input"
          placeholder="输入兑换码"
          placeholder-class="exchange-placeholder"
        />
        <view class="exchange-btn">
          <text class="exchange-btn-text">兑换</text>
        </view>
      </view>

      <!-- 优惠券列表 -->
      <view class="coupon-list">
        <view
          v-for="item in couponList"
          :key="item.id"
          class="coupon-card"
        >
          <!-- 左侧彩色金额区 -->
          <view
            class="coupon-left"
            :style="{ backgroundColor: item.leftBg }"
          >
            <view class="coupon-left-top">
              <text v-if="item.amount" class="coupon-amount-prefix">￥</text>
              <text v-if="item.amount" class="coupon-amount">{{ item.amount }}</text>
              <text v-if="item.tagText" class="coupon-tag-text">{{ item.tagText }}</text>
            </view>
            <text v-if="item.condition" class="coupon-condition">
              {{ item.condition }}
            </text>

            <!-- 上下缺口 -->
            <view class="coupon-notch coupon-notch-top" />
            <view class="coupon-notch coupon-notch-bottom" />
          </view>

          <!-- 右侧白色内容区 -->
          <view class="coupon-right">
            <view class="coupon-right-main">
              <view class="coupon-right-header">
                <text class="coupon-title">{{ item.title }}</text>
              </view>
              <view class="coupon-sub-row">
                <text class="coupon-expire">有效期至：{{ item.expire }}</text>
              </view>

              <view class="coupon-tag-row">
                <view
                  v-for="tag in item.tags"
                  :key="tag"
                  class="coupon-mini-tag"
                >
                  <text class="coupon-mini-tag-text">{{ tag }}</text>
                </view>
              </view>
            </view>

            <view class="coupon-right-footer">
              <view
                v-if="item.statusText"
                class="coupon-status"
              >
                <text class="coupon-status-text">{{ item.statusText }}</text>
              </view>
              <view class="coupon-use-btn">
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
const tabs = [
  { key: 'available', label: '可用 (5)' },
  { key: 'used', label: '已使用 (12)' },
  { key: 'expired', label: '已过期' }
]

const activeTab = 'available'

const couponList = [
  {
    id: 1,
    leftBg: '#06c167',
    amount: '20',
    tagText: '全场通用减免券',
    condition: '满 129 使用',
    title: '全场通用减免券',
    expire: '2026.02.15',
    tags: ['商城通用'],
    statusText: '即将过期'
  },
  {
    id: 2,
    leftBg: '#ff8a34',
    amount: '',
    tagText: '免配送费',
    condition: '',
    title: '新会员首单免邮',
    expire: '2026.01.30',
    tags: ['新人专属'],
    statusText: ''
  }
]

const goBack = () => {
  uni.navigateBack()
}
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


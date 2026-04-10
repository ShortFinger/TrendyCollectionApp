<template>
  <view class="blindbox-page">

    <scroll-view class="blindbox-scroll" scroll-y>
      <!-- 顶部主题卡片（当前奖池） -->
      <view class="pool-card">
        <view class="pool-header">
          <view class="pool-badge">
            <text class="pool-badge-text">第 {{ poolInfo.currentBox }}/{{ poolInfo.totalBox }} 箱</text>
          </view>
          <text class="pool-sub">剩余 {{ poolInfo.leftCount }}/{{ poolInfo.totalCount }} 张</text>
        </view>

        <view class="pool-main">
          <view class="pool-cover">
            <view class="pool-cover-inner">
              <text class="pool-cover-text">主题卡面</text>
            </view>
          </view>
          <view class="pool-info">
            <text class="pool-title" number-of-lines="1">{{ poolInfo.title }}</text>
            <text class="pool-desc" number-of-lines="2">{{ poolInfo.desc }}</text>
            <view class="pool-price-row">
              <text class="pool-price">¥{{ poolInfo.price }}</text>
              <text class="pool-price-unit">/ 张</text>
            </view>
          </view>
        </view>

        <view class="pool-actions">
          <view class="pool-action-btn secondary">
            <text class="pool-action-text">玩法说明</text>
          </view>
          <view class="pool-action-btn">
            <text class="pool-action-text">奖池详情</text>
          </view>
        </view>
      </view>

      <!-- 中部标签切换 -->
      <view class="tabs">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
        >
          <text
            class="tab-text"
            :class="{ 'tab-text-active': activeTab === tab.key }"
          >
            {{ tab.label }}
          </text>
        </view>
      </view>

      <!-- 奖池预览区：网格卡片 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">奖池预览</text>
          <text class="section-sub">共 {{ rewardGroups.length }} 组奖项</text>
        </view>

        <view class="reward-grid">
          <view
            v-for="group in rewardGroups"
            :key="group.level"
            class="reward-card"
          >
            <view class="reward-tag" :style="{ backgroundColor: group.tagBg }">
              <text class="reward-tag-text">{{ group.level }} 奖</text>
            </view>
            <view class="reward-cover" :style="{ backgroundColor: group.coverBg }">
              <text class="reward-cover-text">{{ group.short }}</text>
            </view>
            <text class="reward-title" number-of-lines="2">
              {{ group.title }}
            </text>
            <text class="reward-count">
              {{ group.left }}/{{ group.total }} 件
            </text>
          </view>
        </view>
      </view>

      <!-- 抽选记录预留区 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">开盒记录</text>
          <text class="section-sub">最近 20 次</text>
        </view>
        <view class="record-empty">
          <text class="record-empty-main">暂时没有开盒记录</text>
          <text class="record-empty-sub">快去试试手气吧～</text>
        </view>
      </view>

      <view class="bottom-safe" />
    </scroll-view>

    <!-- 底部操作条 -->
    <view class="bottom-bar">
      <view class="bottom-btn ghost">
        <text class="bottom-btn-text ghost-text">收 1 张</text>
      </view>
      <view class="bottom-btn ghost">
        <text class="bottom-btn-text ghost-text">收 3 张</text>
      </view>
      <view class="bottom-btn ghost">
        <text class="bottom-btn-text ghost-text">收 5 张</text>
      </view>
      <view class="bottom-btn primary">
        <text class="bottom-btn-text">全收！</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const poolInfo = {
  title: '潮萌联名盲盒系列',
  desc: '限定款收藏，一次抽取一张，支持多张连抽。',
  price: '59',
  currentBox: 3,
  totalBox: 7,
  leftCount: 59,
  totalCount: 66
}

const tabs = [
  { key: 'current', label: '本箱' },
  { key: 'preview', label: '奖池预览' },
  { key: 'history', label: '开盒记录' }
]

const activeTab = 'current'

const rewardGroups = [
  {
    level: 'A',
    title: '限量抱枕 / 毛毯套装',
    short: '抱枕',
    left: 1,
    total: 2,
    tagBg: '#e6f7ff',
    coverBg: '#f3f8ff'
  },
  {
    level: 'B',
    title: '系列公仔盲盒',
    short: '公仔',
    left: 2,
    total: 4,
    tagBg: '#e8f9f0',
    coverBg: '#e9f7f0'
  },
  {
    level: 'C',
    title: '主题手提袋 / 口罩',
    short: '周边',
    left: 4,
    total: 6,
    tagBg: '#fff3e8',
    coverBg: '#fff7ec'
  },
  {
    level: 'D',
    title: '随机贴纸 / 钥匙扣',
    short: '小物',
    left: 12,
    total: 20,
    tagBg: '#f5f5ff',
    coverBg: '#f3f4ff'
  }
]

const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss">
.blindbox-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
  box-sizing: border-box;
}

.nav-bar {
  height: 88rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
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

.blindbox-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.pool-card {
  margin-top: 24rpx;
  padding: 24rpx 22rpx 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #0fd56a, #02b282);
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.1);
}

.pool-header {
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background-color: rgba(255, 255, 255, 0.16);
}

.pool-badge-text {
  font-size: 22rpx;
  color: #ffffff;
}

.pool-sub {
  font-size: 22rpx;
  color: #e7fcec;
}

.pool-main {
  margin-top: 20rpx;
  flex-direction: row;
  display: flex;
}

.pool-cover {
  width: 180rpx;
  height: 120rpx;
  border-radius: 16rpx;
  background-color: #ffffff;
  padding: 8rpx;
  box-sizing: border-box;
}

.pool-cover-inner {
  flex: 1;
  border-radius: 12rpx;
  background-color: #f3f8ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pool-cover-text {
  font-size: 22rpx;
  color: #4d6b8f;
}

.pool-info {
  flex: 1;
  margin-left: 20rpx;
  justify-content: space-between;
  display: flex;
  flex-direction: column;
}

.pool-title {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}

.pool-desc {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #e8fff4;
}

.pool-price-row {
  margin-top: 10rpx;
  flex-direction: row;
  display: flex;
  align-items: baseline;
}

.pool-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.pool-price-unit {
  margin-left: 4rpx;
  font-size: 22rpx;
  color: #e8fff4;
}

.pool-actions {
  margin-top: 20rpx;
  flex-direction: row;
  display: flex;
  justify-content: flex-end;
}

.pool-action-btn {
  padding: 10rpx 22rpx;
  border-radius: 22rpx;
  background-color: #ffffff;
  margin-left: 12rpx;
}

.pool-action-btn.secondary {
  background-color: rgba(255, 255, 255, 0.16);
}

.pool-action-text {
  font-size: 22rpx;
  color: #02b282;
}

.pool-action-btn.secondary .pool-action-text {
  color: #ffffff;
}

.tabs {
  margin-top: 24rpx;
  padding: 0 8rpx;
  display: flex;
  align-items: center;
}

.tab-item {
  margin-right: 32rpx;
}

.tab-text {
  font-size: 26rpx;
  color: #999999;
}

.tab-text-active {
  color: #02b282;
  font-weight: 600;
}

.section-card {
  margin-top: 16rpx;
  padding: 22rpx 20rpx 20rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.02);
}

.section-header {
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 26rpx;
  color: #333333;
  font-weight: 600;
}

.section-sub {
  font-size: 22rpx;
  color: #999999;
}

.reward-grid {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.reward-card {
  width: 25%;
  box-sizing: border-box;
  padding: 14rpx 8rpx 14rpx;
  margin-bottom: 16rpx;
  padding: 14rpx 12rpx 14rpx;
  border-radius: 18rpx;
  background-color: #f7f8fa;
}

.reward-tag {
  align-self: flex-start;
  padding: 4rpx 12rpx;
  border-radius: 16rpx;
}

.reward-tag-text {
  font-size: 20rpx;
  color: #333333;
}

.reward-cover {
  margin-top: 10rpx;
  height: 100rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-cover-text {
  font-size: 24rpx;
  color: #555555;
}

.reward-title {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #333333;
}

.reward-count {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #999999;
}

.record-empty {
  margin-top: 24rpx;
  padding: 36rpx 12rpx 28rpx;
  border-radius: 18rpx;
  background-color: #f7f8fa;
  align-items: center;
  display: flex;
  flex-direction: column;
}

.record-empty-main {
  font-size: 24rpx;
  color: #666666;
}

.record-empty-sub {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999999;
}

.bottom-safe {
  height: 120rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--window-bottom, 100rpx);
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: #ffffff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bottom-btn {
  height: 72rpx;
  border-radius: 40rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-btn.ghost {
  background-color: #f7f8fa;
}

.bottom-btn.primary {
  flex: 1;
  margin-left: 12rpx;
  background-color: #02b282;
}

.bottom-btn-text {
  font-size: 26rpx;
  color: #ffffff;
}

.ghost-text {
  color: #333333;
}
</style>


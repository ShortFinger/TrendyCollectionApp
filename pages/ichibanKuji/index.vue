<template>
  <view class="blindbox-page">
    <view v-if="loading" class="page-state">
      <text class="page-state-text">加载中…</text>
    </view>
    <view v-else-if="loadError" class="page-state">
      <text class="page-state-text">{{ loadError }}</text>
    </view>
    <block v-else>

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
            v-for="(group, gi) in rewardGroups"
            :key="'rg-' + gi"
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
      <view class="bottom-btn ghost" @tap="onTapPaidDraw(1)">
        <text class="bottom-btn-text ghost-text">收 1 张</text>
      </view>
      <view class="bottom-btn ghost" @tap="onTapPaidDraw(5)">
        <text class="bottom-btn-text ghost-text">收 5 张</text>
      </view>
      <view class="bottom-btn ghost" @tap="onTapPaidDraw(10)">
        <text class="bottom-btn-text ghost-text">收 10 张</text>
      </view>
      <view class="bottom-btn primary" @tap="onTapPaidDraw(20)">
        <text class="bottom-btn-text">全收！</text>
      </view>
    </view>
    </block>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchActivityDetail } from '@/utils/activityDetailApi.js'
import { ensureCanonicalActivityRoute } from '@/utils/activityRouteCanonical.js'
import { createDrawOrder, prepayDrawOrder, paidDrawByOrder, simulateConfirmPaid } from '@/utils/drawApi.js'

const loading = ref(true)
const loadError = ref('')
const vo = ref(null)

const poolInfo = ref({
  title: '',
  desc: '玩法与库存以实际活动为准。',
  price: '—',
  currentBox: 1,
  totalBox: 1,
  leftCount: 0,
  totalCount: 0
})

const tabs = [
  { key: 'current', label: '本箱' },
  { key: 'preview', label: '奖池预览' },
  { key: 'history', label: '开盒记录' }
]

const activeTab = ref('current')

const rewardGroups = ref([])
const paying = ref(false)

const TAG_BG = ['#e6f7ff', '#e8f9f0', '#fff3e8', '#f5f5ff', '#fff0f6', '#f6ffed']

function mapLevelsToGroups(levels) {
  if (!Array.isArray(levels) || levels.length === 0) return []
  return levels.map((lvl, idx) => {
    const title = String(lvl.title ?? '').trim() || `等级 ${idx + 1}`
    const short = title.length > 4 ? title.slice(0, 4) : title
    return {
      level: String(idx + 1),
      title,
      short,
      left: 0,
      total: 0,
      tagBg: TAG_BG[idx % TAG_BG.length],
      coverBg: TAG_BG[(idx + 1) % TAG_BG.length]
    }
  })
}

watch(
  () => vo.value,
  (v) => {
    if (!v) return
    const t = String(v.title ?? '').trim()
    poolInfo.value = {
      ...poolInfo.value,
      title: t || '赏柜活动'
    }
    if (t) uni.setNavigationBarTitle({ title: t })
    rewardGroups.value = mapLevelsToGroups(v.rewardLevels)
  },
  { immediate: true }
)

async function load(id) {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchActivityDetail(id)
    const at = String(data.activityType ?? '').trim()
    if (!ensureCanonicalActivityRoute(id, at)) return
    vo.value = data
  } catch {
    loadError.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  const id = String(query?.activityId ?? '').trim()
  if (!id) {
    loading.value = false
    uni.showToast({ title: '缺少活动参数', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 400)
    return
  }
  load(id)
})

const goBack = () => {
  uni.navigateBack()
}

function getMiniProgramAppId() {
  // #ifdef MP-WEIXIN
  return 'wxeb00df376384e072'
  // #endif
  return ''
}

async function invokeWechatPay(orderId) {
  const wxAppId = getMiniProgramAppId()
  if (!wxAppId) {
    throw new Error('当前环境不支持微信小程序支付')
  }
  const prepay = await prepayDrawOrder(orderId, wxAppId)
  await new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: String(prepay.timeStamp || ''),
      nonceStr: prepay.nonceStr,
      package: prepay.packageVal,
      signType: prepay.signType || 'RSA',
      paySign: prepay.paySign,
      success: resolve,
      fail: reject
    })
  })
  return paidDrawByOrder(orderId)
}

async function invokeDevSimulation(orderId, orderNumber) {
  const token = uni.getStorageSync('wxPaySimToken') || ''
  if (!token) {
    throw new Error('开发联调缺少 wxPaySimToken')
  }
  await simulateConfirmPaid(orderNumber, token)
  return paidDrawByOrder(orderId)
}

async function onTapPaidDraw(drawCount) {
  if (paying.value) return
  if (!vo.value?.id) {
    uni.showToast({ title: '活动信息未就绪', icon: 'none' })
    return
  }
  paying.value = true
  uni.showLoading({ title: '处理中...', mask: true })
  try {
    const order = await createDrawOrder(vo.value.id, drawCount)
    const isMp = typeof wx !== 'undefined'
    const useSimulation = process.env.NODE_ENV !== 'production' && !isMp
    const drawResult = useSimulation
      ? await invokeDevSimulation(order.orderId, order.orderNumber)
      : await invokeWechatPay(order.orderId)
    uni.hideLoading()
    uni.showToast({ title: '抽选成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/card/index?drawResponse=${encodeURIComponent(JSON.stringify(drawResult))}`
      })
    }, 240)
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '支付/抽选失败', icon: 'none' })
  } finally {
    paying.value = false
  }
}
</script>

<style lang="scss">
.page-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.page-state-text {
  font-size: 28rpx;
  color: #666;
}

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


<template>
  <view class="page">
    <view v-if="loading" class="state">
      <text class="state-text">加载中…</text>
    </view>
    <view v-else-if="loadError" class="state">
      <text class="state-text">{{ loadError }}</text>
    </view>
    <view v-else class="content">
      <view class="main">
        <view class="card-area">
          <image
            v-if="displayImageUrl"
            class="card-img"
            :src="displayImageUrl"
            mode="aspectFit"
          />
          <view v-else class="card-placeholder">
            <text class="card-placeholder-text">暂无展示卡</text>
          </view>
        </view>
        <view class="side">
          <view
            v-for="(btn, idx) in sideButtons"
            :key="idx"
            class="side-item"
            @tap="onPlaceholder"
          >
            <text class="side-icon">{{ btn.icon }}</text>
            <text class="side-label">{{ btn.label }}</text>
          </view>
        </view>
      </view>

      <view class="energy">
        <view class="energy-header">
          <text class="energy-label">能量值</text>
          <text class="energy-value">{{ energyInfo.current }}/{{ energyInfo.total }}</text>
        </view>
        <view class="energy-track">
          <view class="energy-fill" :style="{ width: energyPercent + '%' }" />
        </view>
        <text class="energy-guarantee">{{ energyInfo.guaranteeText }}</text>
      </view>
    </view>

    <view v-if="vo" class="bar">
      <view
        v-for="n in drawCounts"
        :key="n"
        class="bar-btn"
        :class="{ 'bar-btn-disabled': drawing }"
        @tap="onDraw(n)"
      >
        <text class="bar-btn-text">{{ drawing ? '抽奖中…' : n + '抽' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchActivityDetail } from '@/utils/activityDetailApi.js'
import { ensureCanonicalActivityRoute } from '@/utils/activityRouteCanonical.js'
import { submitDraw } from '@/utils/drawApi.js'

const drawCounts = [1, 5, 10, 20]

const loading = ref(true)
const loadError = ref('')
const vo = ref(null)
const drawing = ref(false)
const activityId = ref('')

const displayImageUrl = computed(() => {
  const v = vo.value
  if (!v) return ''
  const skus = v.skus
  if (Array.isArray(skus)) {
    const displaySku = skus.find(s => s.isDisplayItem)
    if (displaySku?.imageUrl) return displaySku.imageUrl
  }
  const levels = v.rewardLevels
  if (Array.isArray(levels)) {
    for (const level of levels) {
      if (Array.isArray(level.skus)) {
        const displaySku = level.skus.find(s => s.isDisplayItem)
        if (displaySku?.imageUrl) return displaySku.imageUrl
      }
    }
  }
  if (Array.isArray(levels) && levels.length > 0) {
    const icon = String(levels[0]?.icon ?? '').trim()
    if (icon) return icon
  }
  return ''
})

const energyInfo = ref({
  current: 1,
  total: 20,
  guaranteeText: '单人每20包必出SR'
})

const energyPercent = computed(() => {
  const { current, total } = energyInfo.value
  if (!total || total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)))
})

const sideButtons = [
  { icon: '📋', label: '中赏记录' },
  { icon: '🎯', label: '中赏概率' },
  { icon: '❗', label: '购买说明' },
  { icon: '🏆', label: '图鉴奖励' }
]

watch(
  () => vo.value,
  (v) => {
    if (!v) return
    const t = String(v.title ?? '').trim()
    if (t) uni.setNavigationBarTitle({ title: t })
  },
  { immediate: true }
)

async function load(id) {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchActivityDetail(id)
    if (!data) return
    const at = String(data.activityType ?? '').trim()
    if (!ensureCanonicalActivityRoute(id, at)) return
    vo.value = data
    activityId.value = id
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

function onPlaceholder() {
  uni.showToast({ title: '玩法接入中', icon: 'none' })
}

const STOP_REASON_TEXT = {
  POOL_EMPTY: '奖池已空',
  USER_LIMIT_EXCEEDED: '已达抽奖上限'
}

async function onDraw(count) {
  if (drawing.value) return
  if (!activityId.value) return

  drawing.value = true
  try {
    const data = await submitDraw(activityId.value, count)
    const msg = `抽中 ${data.totalDrawn} 个奖品`
    uni.showToast({ title: msg, icon: 'none' })

    if (data.stoppedEarly && data.stopReason) {
      setTimeout(() => {
        uni.showToast({
          title: STOP_REASON_TEXT[data.stopReason] || '抽奖提前结束',
          icon: 'none'
        })
      }, 1500)
    }
  } catch (err) {
    const msg = err?.message || '抽奖失败，请稍后重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    drawing.value = false
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.state {
  padding: 120rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.state-text {
  font-size: 28rpx;
  color: #999;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 0;
}

.card-area {
  flex: 1;
  min-width: 0;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
}

.card-img {
  width: 100%;
  height: 100%;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-placeholder-text {
  font-size: 28rpx;
  color: #666;
}

.side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20rpx;
  padding: 16rpx 12rpx;
}

.side-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.08);
}

.side-icon {
  font-size: 36rpx;
}

.side-label {
  font-size: 22rpx;
  color: #ccc;
}

.energy {
  padding: 24rpx 32rpx 16rpx;
}

.energy-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.energy-label {
  font-size: 26rpx;
  color: #fff;
}

.energy-value {
  font-size: 26rpx;
  color: #999;
}

.energy-track {
  height: 12rpx;
  border-radius: 6rpx;
  background: #333;
  overflow: hidden;
}

.energy-fill {
  height: 100%;
  border-radius: 6rpx;
  background: #d4a84b;
  transition: width 0.3s ease;
}

.energy-guarantee {
  display: block;
  text-align: center;
  margin-top: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #fff;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 12rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #111;
  box-shadow: 0 -2rpx 16rpx rgba(212, 168, 75, 0.15);
  box-sizing: border-box;
}

.bar-btn {
  flex: 1;
  border-radius: 999rpx;
  padding: 20rpx 8rpx;
  text-align: center;
  background: #2a2a2a;
}

.bar-btn-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #e0e0e0;
}

.bar-btn-disabled {
  opacity: 0.4;
}
</style>

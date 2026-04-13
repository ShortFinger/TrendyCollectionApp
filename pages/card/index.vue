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
        <view
          class="cover"
          :style="{ backgroundImage: coverUrl ? `url(${coverUrl})` : '' }"
        />
        <view class="side">
          <view class="side-item" @tap="onPlaceholder">
            <text class="side-text">中赏概率</text>
          </view>
          <view class="side-item" @tap="onPlaceholder">
            <text class="side-text">购买说明</text>
          </view>
        </view>
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

const coverUrl = computed(() => {
  const v = vo.value
  if (!v) return ''
  const levels = v.rewardLevels
  if (Array.isArray(levels) && levels.length > 0) {
    const icon = String(levels[0]?.icon ?? '').trim()
    if (icon) return icon
  }
  return ''
})

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
  background: #f7f8fa;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
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
  color: #666;
}

.state-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.state-sub {
  font-size: 26rpx;
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

.cover {
  flex: 1;
  min-width: 0;
  background-color: #eee;
  background-size: cover;
  background-position: center;
}

.side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24rpx;
  padding: 16rpx 20rpx;
}

.side-item {
  padding: 8rpx 0;
}

.side-text {
  font-size: 26rpx;
  color: #333;
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
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.bar-btn {
  flex: 1;
  border-radius: 999rpx;
  padding: 20rpx 8rpx;
  text-align: center;
  background: #111;
}

.bar-btn-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #fff;
}

.bar-btn-disabled {
  opacity: 0.5;
}
</style>

<template>
  <view class="page">
    <view v-if="loading" class="state">
      <text class="state-text">加载中…</text>
    </view>
    <view v-else-if="loadError" class="state">
      <text class="state-text">{{ loadError }}</text>
    </view>
    <view v-else-if="!available" class="state">
      <text class="state-title">活动不可用</text>
      <text class="state-sub">活动已下架或不存在</text>
    </view>
    <view v-else class="content">
      <view
        class="cover"
        :style="{ backgroundImage: coverUrl ? `url(${coverUrl})` : '' }"
      />
      <view class="body">
        <text v-if="typeCn" class="badge">{{ typeCn }}</text>
        <text class="title">{{ title }}</text>
        <text v-if="priceText" class="price">{{ priceText }}</text>
      </view>
      <view class="bottom-safe" />
    </view>

    <view v-if="available" class="bar">
      <view class="bar-btn primary" @tap="goIchiban">
        <text class="bar-btn-text">去赏柜</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchActivityDisplayById } from '@/utils/activityDisplayApi.js'
import { ensureCanonicalActivityRoute } from '@/utils/activityRouteCanonical.js'
import { formatMoneyPrice, pickActivityTypeCn } from '@/utils/activityCardCommon.js'
import { openInternalUrl } from '@/utils/openInternalUrl.js'

const loading = ref(true)
const loadError = ref('')
const vo = ref(null)
const activityIdRef = ref('')

const available = computed(() => {
  const v = vo.value
  if (!v) return false
  return String(v.status ?? '').trim() === 'ON_SHELF'
})

const title = computed(() => String(vo.value?.title ?? '').trim() || '活动')

const coverUrl = computed(() => {
  const v = vo.value
  if (!v) return ''
  return String(v.squareThumb || v.longThumb || '').trim()
})

const priceText = computed(() => formatMoneyPrice(vo.value?.moneyPrice))

const typeCn = computed(() => pickActivityTypeCn(vo.value))

async function load(id) {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchActivityDisplayById(id)
    if (!data) return
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
  activityIdRef.value = id
  if (!id) {
    loading.value = false
    uni.showToast({ title: '缺少活动参数', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 400)
    return
  }
  load(id)
})

function goIchiban() {
  const id = activityIdRef.value
  if (!id) return
  openInternalUrl(`/pages/ichibanKuji/index?activityId=${encodeURIComponent(id)}`)
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
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
  display: flex;
  flex-direction: column;
}

.cover {
  width: 100%;
  aspect-ratio: 1;
  background-color: #eee;
  background-size: cover;
  background-position: center;
}

.body {
  padding: 24rpx 28rpx;
  background: #fff;
}

.badge {
  display: inline-block;
  font-size: 22rpx;
  font-weight: 600;
  color: #666;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  margin-bottom: 12rpx;
}

.title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.35;
}

.price {
  display: block;
  margin-top: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.bottom-safe {
  height: 24rpx;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.bar-btn {
  border-radius: 999rpx;
  padding: 22rpx;
  text-align: center;
}

.bar-btn.primary {
  background: #111;
}

.bar-btn-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}
</style>

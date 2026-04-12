<template>
  <view class="card" @tap.stop="onTap">
    <view class="card-cover">
      <view
        class="card-image"
        :style="{ backgroundImage: item.squareThumb ? `url(${item.squareThumb})` : '' }"
      />
      <view class="card-corner-marks">
        <image
          v-if="item.lowerLeftCornerMark"
          class="card-corner card-corner-tl"
          :src="item.lowerLeftCornerMark"
          mode="aspectFit"
        />
        <image
          v-if="item.upperLeftCornerMark"
          class="card-corner card-corner-tl"
          :src="item.upperLeftCornerMark"
          mode="aspectFit"
        />
        <image
          v-if="item.lowerRightCornerMark"
          class="card-corner card-corner-br"
          :src="item.lowerRightCornerMark"
          mode="aspectFit"
        />
      </view>
    </view>

    <view class="card-title-row">
      <text v-if="item.tag" class="card-tag">{{ item.tag }}</text>
      <view class="card-title-text-wrap">
        <text class="card-title-measure">{{ item.title }}</text>
        <view class="card-title-viewport">
          <view v-if="titleMarqueeActive" class="card-title-marquee">
            <view
              class="card-title-marquee-track"
              :style="{ animationDuration: titleMarqueeDuration }"
            >
              <text class="card-title-chunk">{{ titleMarqueeChunk }}</text>
              <text class="card-title-chunk">{{ titleMarqueeChunk }}</text>
            </view>
          </view>
          <view v-else class="card-title-static">
            <text class="card-title-plain">{{ item.title }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card-price-row">
      <text v-if="item.priceText" class="card-price">{{ item.priceText }}</text>
      <text class="card-like">{{ formatLikes(item.likes) }}</text>
    </view>

    <view class="card-content" :class="{ 'card-content--no-desc': !descVisible }">
      <view v-if="descVisible" class="card-desc">{{ item.desc }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, getCurrentInstance } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const descVisible = computed(() => String(props.item.desc ?? '').trim() !== '')

const titleMarqueeChunk = computed(
  () => `${String(props.item.title ?? '')}\u3000\u3000`
)

const titleMarqueeActive = ref(false)
const titleMarqueeDuration = ref('12s')

function measureTitleMarquee() {
  const inst = getCurrentInstance()
  const ctx = inst?.proxy
  if (!ctx) return

  nextTick(() => {
    const q = uni.createSelectorQuery().in(ctx)
    q.select('.card-title-viewport').boundingClientRect()
    q.select('.card-title-measure').boundingClientRect()
    q.exec((res) => {
      const viewport = res[0]
      const measure = res[1]
      if (!viewport || !measure || !viewport.width) {
        titleMarqueeActive.value = false
        return
      }
      const overflow = measure.width > viewport.width + 1
      titleMarqueeActive.value = overflow
      if (overflow) {
        const pxPerSec = 42
        const sec = Math.max(5, Math.min(48, measure.width / pxPerSec))
        titleMarqueeDuration.value = `${sec}s`
      }
    })
  })
}

onMounted(measureTitleMarquee)

watch(
  () => [props.item.title, props.item.tag],
  () => measureTitleMarquee(),
  { flush: 'post' }
)

const emit = defineEmits(['cardTap'])

function formatLikes(likes) {
  const value = Number(likes) || 0
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.0', '')}k`
  }
  return `${value}`
}

function onTap() {
  emit('cardTap', props.item)
}
</script>

<style lang="scss" scoped>
.card {
  /* 宽度由外层 .card-list-cell 承担（小程序自定义组件宿主不能依赖 48% 自算宽） */
  width: 100%;
  margin-bottom: 24rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-image {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  background-color: #f5f5f5;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.card-cover {
  position: relative;
  width: 100%;
  flex-shrink: 0;
}

.card-corner-marks {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.card-corner {
  position: absolute;
  width: 56rpx;
  height: 56rpx;
}

.card-corner-tl {
  top: 8rpx;
  left: 8rpx;
}

.card-corner-br {
  bottom: 8rpx;
  right: 8rpx;
}

.card-title-row {
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  padding: 10rpx 8rpx 0;
}

.card-title-text-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.card-title-measure {
  position: absolute;
  left: 0;
  top: 0;
  white-space: nowrap;
  font-size: 23rpx;
  font-weight: 600;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

.card-title-viewport {
  width: 100%;
  height: 36rpx;
  overflow: hidden;
}

.card-title-static {
  width: 100%;
  height: 36rpx;
  overflow: hidden;
}

.card-title-plain {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 23rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.35;
}

.card-title-marquee {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.card-title-marquee-track {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  width: max-content;
  animation-name: card-title-marquee-move;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}

@keyframes card-title-marquee-move {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.card-title-chunk {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 23rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.35;
}

.card-price-row {
  flex-shrink: 0;
  box-sizing: border-box;
  min-height: 48rpx;
  max-height: 48rpx;
  padding: 4rpx 20rpx 0;
  display: flex;
  align-items: center;
}

.card-price {
  font-size: 28rpx;
  font-weight: 600;
  color: #ff4d4f;
  line-height: 1.2;
}

.card-content {
  flex: 0 0 auto;
  padding: 12rpx 10rpx 10rpx;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.card-content--no-desc {
  padding-top: 8rpx;
}

.card-desc {
  flex-shrink: 0;
  font-size: 22rpx;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  word-break: break-word;
}

.card-tag {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #999;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140rpx;
}

.card-like {
  margin-left: auto;
  font-size: 20rpx;
  color: #999;
  line-height: 1.2;
}
</style>

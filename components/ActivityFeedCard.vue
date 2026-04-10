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

    <view class="card-title">{{ item.title }}</view>

    <view class="card-price-row">
      <text v-if="item.priceText" class="card-price">{{ item.priceText }}</text>
    </view>

    <view class="card-content" :class="{ 'card-content--no-desc': !descVisible }">
      <view v-if="descVisible" class="card-desc">{{ item.desc }}</view>

      <view class="card-footer">
        <text class="card-author">{{ item.author }}</text>
        <view class="card-meta">
          <text class="card-tag">{{ item.tag }}</text>
          <text class="card-like">{{ formatLikes(item.likes) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const descVisible = computed(() => String(props.item.desc ?? '').trim() !== '')

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
  height: 280rpx;
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

.card-title {
  flex-shrink: 0;
  box-sizing: border-box;
  min-height: 88rpx;
  max-height: 88rpx;
  padding: 16rpx 20rpx 0;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-break: break-word;
}

.card-price-row {
  flex-shrink: 0;
  box-sizing: border-box;
  min-height: 48rpx;
  max-height: 48rpx;
  padding: 4rpx 20rpx 0;
  display: flex;
  align-items: flex-start;
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

.card-content--no-desc .card-footer {
  margin-top: 0;
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

.card-footer {
  flex-shrink: 0;
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32rpx;
}

.card-author {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 20rpx;
  color: #999;
  max-width: 55%;
}

.card-tag {
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140rpx;
}

.card-like {
  margin-left: 8rpx;
}
</style>

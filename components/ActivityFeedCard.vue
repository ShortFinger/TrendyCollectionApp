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

    <view class="card-title">
      <text>{{ item.title }}</text>
    </view>

    <view v-if="item.priceText" class="card-price-row">
      <text class="card-price">{{ item.priceText }}</text>
    </view>

    <view class="card-content">
      <view class="card-desc">
        <text>{{ item.desc }}</text>
      </view>

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
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

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
  width: 48%;
  margin-bottom: 24rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-sizing: border-box;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 200rpx;
  background-color: #f5f5f5;
}

.card-cover {
  position: relative;
  width: 100%;
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
  padding: 20rpx 20rpx 0;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

.card-price-row {
  padding: 8rpx 20rpx 0;
}

.card-price {
  font-size: 28rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.card-content {
  padding: 12rpx 20rpx 20rpx;
}

.card-desc {
  font-size: 22rpx;
  color: #666;
  line-height: 1.4;
}

.card-footer {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-author {
  font-size: 22rpx;
  color: #999;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 20rpx;
  color: #999;
}

.card-tag {
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  background-color: #f5f5f5;
}

.card-like {
  margin-left: 8rpx;
}
</style>

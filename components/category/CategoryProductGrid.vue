<template>
  <view class="cpg-root">
    <view class="cpg-title-row">
      <text class="cpg-title">热销单品</text>
    </view>
    <view class="cpg-grid">
      <view
        v-for="p in products"
        :key="p.id"
        class="cpg-card"
        @click="emit('itemClick', p)"
      >
        <view class="cpg-img-wrap">
          <image
            v-if="p.imageUrl"
            class="cpg-img"
            :src="p.imageUrl"
            mode="aspectFill"
          />
        </view>
        <view class="cpg-info">
          <text class="cpg-name">{{ p.title }}</text>
          <text class="cpg-price">¥{{ p.price }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  products: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['itemClick'])
</script>

<style lang="scss" scoped>
.cpg-root {
  margin-top: 8rpx;
}

.cpg-title-row {
  margin-bottom: 16rpx;
}

.cpg-title {
  font-size: 28rpx;
  color: #111111;
  font-weight: 600;
}

.cpg-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
}

.cpg-card {
  width: 48%;
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  background-color: #f7f8fa;
  overflow: hidden;
}

.cpg-img-wrap {
  width: 100%;
  height: 180rpx;
  background-color: #e8eaee;
  border-radius: 12rpx 12rpx 0 0;
}

.cpg-img {
  width: 100%;
  height: 100%;
  display: block;
}

.cpg-info {
  padding: 16rpx 16rpx 20rpx;
}

.cpg-name {
  font-size: 24rpx;
  color: #333333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.cpg-price {
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #ff4d4f;
  font-weight: 700;
}
</style>

<template>
  <view class="chs-root">
    <view class="chs-title-row">
      <text class="chs-title">热门搜索</text>
    </view>
    <view class="chs-tags">
      <view
        v-for="(tag, i) in tags"
        :key="i"
        class="chs-tag"
        @click="emit('tagClick', tag)"
      >
        <text class="chs-tag-text">{{ tag }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  tags: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['tagClick'])
</script>

<style lang="scss" scoped>
.chs-root {
  margin-bottom: 32rpx;
}

.chs-title-row {
  margin-bottom: 16rpx;
}

.chs-title {
  font-size: 28rpx;
  color: #111111;
  font-weight: 600;
}

.chs-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chs-tag {
  padding: 10rpx 22rpx;
  border-radius: 32rpx;
  background-color: #f5f5f5;
}

.chs-tag-text {
  font-size: 22rpx;
  color: #666666;
}
</style>

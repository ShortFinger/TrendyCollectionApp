<template>
  <view class="psh-root">
    <view class="psh-status-bar" :style="{ height: statusBarPx + 'px' }" />
    <view class="psh-header">
      <view class="psh-inner">
        <slot />
      </view>
      <view v-if="showDivider" class="psh-divider" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  showDivider: {
    type: Boolean,
    default: true
  }
})

const statusBarPx = uni.getSystemInfoSync().statusBarHeight || 0
</script>

<style lang="scss" scoped>
.psh-root {
  flex-shrink: 0;
}

.psh-status-bar {
  width: 100%;
  flex-shrink: 0;
}

.psh-header {
  flex-shrink: 0;
  background-color: #f7f8fa;
}

.psh-inner {
  padding: 8rpx 32rpx 16rpx;
  box-sizing: border-box;
}

.psh-divider {
  height: 1rpx;
  background-color: #e8e8e8;
  margin: 0 32rpx;
}
</style>

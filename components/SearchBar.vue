<template>
  <view class="sb-root" @click="emit('click')">
    <view class="sb-bar">
      <text class="sb-icon">🔍</text>
      <text class="sb-placeholder">{{ placeholder }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  placeholder: {
    type: String,
    default: '搜索生鲜商品…'
  }
})

const emit = defineEmits(['click'])
</script>

<style lang="scss" scoped>
.sb-root {
  width: 100%;
}

.sb-bar {
  height: 64rpx;
  border-radius: 32rpx;
  background-color: #f2f2f2;
  padding: 0 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
}

.sb-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  opacity: 0.55;
}

.sb-placeholder {
  flex: 1;
  font-size: 26rpx;
  color: #999999;
}
</style>

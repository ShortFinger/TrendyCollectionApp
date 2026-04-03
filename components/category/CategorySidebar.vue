<template>
  <scroll-view class="cs-side" scroll-y :show-scrollbar="false">
    <view
      v-for="item in items"
      :key="item.key"
      class="cs-item"
      :class="{ 'cs-item-active': item.key === activeKey }"
      @click="onSelect(item.key)"
    >
      <text class="cs-text">{{ item.label }}</text>
    </view>
  </scroll-view>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  activeKey: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:activeKey'])

function onSelect(key) {
  if (key !== props.activeKey) {
    emit('update:activeKey', key)
  }
}
</script>

<style lang="scss" scoped>
.cs-side {
  width: 100%;
  height: 100%;
  background-color: #f7f8fa;
  box-sizing: border-box;
}

.cs-item {
  min-height: 96rpx;
  padding: 0 16rpx 0 20rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-left: 6rpx solid transparent;
}

.cs-item-active {
  background-color: #ffffff;
  border-left-color: #02b282;
}

.cs-text {
  font-size: 24rpx;
  color: #555555;
  line-height: 1.35;
}

.cs-item-active .cs-text {
  color: #02b282;
  font-weight: 600;
}
</style>

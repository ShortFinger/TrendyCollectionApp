<template>
  <view class="tabbar">
    <view
      v-for="item in tabList"
      :key="item.key"
      class="tabbar-item"
      @click="handleClick(item)"
    >
      <text
        class="tabbar-icon"
        :class="{ 'tabbar-icon-active': item.key === active }"
      >
        {{ item.icon }}
      </text>
      <text
        class="tabbar-text"
        :class="{ 'tabbar-text-active': item.key === active }"
      >
        {{ item.label }}
      </text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  active: {
    type: String,
    default: 'home'
  }
})

const tabList = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'category', label: '分类', icon: '📂' },
  { key: 'cart', label: '赏柜', icon: '🛒' },
  { key: 'mine', label: '我的', icon: '👤' }
]

const active = props.active

const handleClick = (item) => {
  if (item.key === 'home' && active !== 'home') {
    uni.navigateTo({
      url: '/pages/index/index'
    })
  }

  if (item.key === 'category' && active !== 'category') {
    uni.navigateTo({
      url: '/pages/category/index'
    })
  }

  if (item.key === 'mine' && active !== 'mine') {
    uni.navigateTo({
      url: '/pages/mine/index'
    })
  }
}
</script>

<style lang="scss">
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.tabbar-item {
  flex: 1;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
}

.tabbar-icon {
  font-size: 32rpx;
  color: #999999;
}

.tabbar-icon-active {
  color: #02b282;
}

.tabbar-text {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #999999;
}

.tabbar-text-active {
  color: #02b282;
}
</style>


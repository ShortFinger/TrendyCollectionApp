<template>
  <view class="category-page">
    <!-- 顶部搜索框 -->
    <view class="category-search-wrapper">
      <view class="category-search-box">
        <text class="category-search-placeholder">搜索生鲜商品...</text>
      </view>
    </view>

    <view class="category-content">
      <!-- 左侧分类列表 -->
      <scroll-view class="category-left" scroll-y>
        <view
          v-for="item in categoryList"
          :key="item.key"
          class="category-left-item"
          :class="{ 'category-left-item-active': item.key === activeCategory }"
          @click="activeCategory = item.key"
        >
          <text class="category-left-text">{{ item.label }}</text>
        </view>
      </scroll-view>

      <!-- 右侧内容区域 -->
      <scroll-view class="category-right" scroll-y>
        <!-- 热门搜索 -->
        <view class="hot-search-section">
          <view class="section-title-row">
            <text class="section-title">热门搜索</text>
          </view>
          <view class="tag-row">
            <view
              v-for="tag in hotTags"
              :key="tag"
              class="tag-item"
            >
              <text class="tag-text">{{ tag }}</text>
            </view>
          </view>
        </view>

        <!-- 热销单品 -->
        <view class="hot-products-section">
          <view class="section-title-row">
            <text class="section-title">热销单品</text>
          </view>

          <view class="product-grid">
            <view
              v-for="item in hotProducts"
              :key="item.id"
              class="product-card"
            >
              <view class="product-image">
                <text class="product-image-text">Product {{ item.id }}</text>
              </view>

              <view class="product-info">
                <text class="product-name-cn">
                  {{ item.name }}
                </text>
                <text class="product-desc">
                  {{ item.desc }}
                </text>

                <text class="product-price">
                  ¥{{ item.price }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 底部预留，避免被 TabBar 遮挡 -->
        <view class="bottom-safe" />
      </scroll-view>
    </view>

    <!-- 底部 TabBar 公共组件，高亮“分类” -->
    <TabBar active="category" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from '@/components/TabBar.vue'

const categoryList = [
  { key: 'today', label: '今日推荐' },
  { key: 'fruit', label: '时令水果' },
  { key: 'vegetable', label: '新鲜蔬菜' },
  { key: 'seafood', label: '海鲜水产' },
  { key: 'meat', label: '肉禽蛋类' },
  { key: 'milk', label: '乳品烘焙' },
  { key: 'drink', label: '酒水饮料' },
  { key: 'more', label: '更多分类' }
]

const hotTags = ['波士顿龙虾', '红颜草莓', '有机西红柿']

const hotProducts = [
  {
    id: 1,
    name: 'Product 1',
    desc: '泰国金枕头榴莲A级 2-3kg',
    price: '199.0'
  },
  {
    id: 2,
    name: 'Product 2',
    desc: '澳洲冷鲜西冷牛排 200g',
    price: '58.0'
  }
]

const activeCategory = ref('today')
</script>

<style lang="scss">
.category-page {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.category-search-wrapper {
  padding: 24rpx 32rpx 8rpx;
}

.category-search-box {
  height: 64rpx;
  border-radius: 32rpx;
  background-color: #f3f5f7;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
}

.category-search-placeholder {
  font-size: 24rpx;
  color: #999999;
}

.category-content {
  display: flex;
  height: calc(100vh - 64rpx - 120rpx);
  padding: 0 0 0 24rpx;
  box-sizing: border-box;
}

.category-left {
  width: 168rpx;
  background-color: #f7f8fa;
}

.category-left-item {
  height: 96rpx;
  padding-left: 24rpx;
  display: flex;
  align-items: center;
  border-radius: 0 32rpx 32rpx 0;
  color: #555555;
  font-size: 24rpx;
}

.category-left-item-active {
  background-color: #ffffff;
  color: #02b282;
  font-weight: 600;
  border-left-width: 6rpx;
  border-left-style: solid;
  border-left-color: #02b282;
}

.category-left-text {
  line-height: 1;
}

.category-right {
  flex: 1;
  background-color: #ffffff;
  border-top-left-radius: 24rpx;
  padding: 16rpx 24rpx 24rpx;
  box-sizing: border-box;
}

.hot-search-section {
  margin-bottom: 32rpx;
}

.section-title-row {
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 26rpx;
  color: #333333;
  font-weight: 600;
}

.tag-row {
  flex-direction: row;
  flex-wrap: wrap;
  display: flex;
  gap: 16rpx;
}

.tag-item {
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  background-color: #f5f7fb;
}

.tag-text {
  font-size: 22rpx;
  color: #666666;
}

.hot-products-section {
  margin-top: 8rpx;
}

.product-grid {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.product-card {
  width: 48%;
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  background-color: #f7f8fa;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 180rpx;
  background-color: #e8eaee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image-text {
  font-size: 22rpx;
  color: #aaaaaa;
}

.product-info {
  padding: 16rpx 16rpx 20rpx;
}

.product-name-cn {
  font-size: 22rpx;
  color: #999999;
}

.product-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #333333;
}

.product-price {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #ff4d4f;
}

.bottom-safe {
  height: 140rpx;
}
</style>


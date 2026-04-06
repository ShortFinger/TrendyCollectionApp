<template>
  <view class="cat-page">
    <PageSearchHeader>
      <CategorySearchBar />
    </PageSearchHeader>

    <view class="cat-main">
      <view class="cat-col-left">
        <CategorySidebar
          :items="categoryList"
          :active-key="activeCategory"
          @update:active-key="setActiveCategory"
        />
      </view>

      <scroll-view class="cat-col-right" scroll-y :show-scrollbar="false">
        <CategoryHotSearch :tags="hotTags" />
        <CategoryProductGrid :products="hotProducts" />
        <view class="cat-bottom-safe" />
      </scroll-view>
    </view>

    <TabBar active="category" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import PageSearchHeader from '@/components/PageSearchHeader.vue'
import CategorySearchBar from '@/components/category/CategorySearchBar.vue'
import CategorySidebar from '@/components/category/CategorySidebar.vue'
import CategoryHotSearch from '@/components/category/CategoryHotSearch.vue'
import CategoryProductGrid from '@/components/category/CategoryProductGrid.vue'
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
  { id: 1, title: '泰国金枕头榴莲A级 2-3kg', price: '199.0' },
  { id: 2, title: '澳洲冷鲜西冷牛排 200g', price: '58.0' }
]

const activeCategory = ref('today')

function setActiveCategory(key) {
  activeCategory.value = key
}
</script>

<style lang="scss">
.cat-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

.cat-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  padding-left: 24rpx;
  box-sizing: border-box;
}

.cat-col-left {
  width: 25%;
  min-width: 0;
  height: 100%;
}

.cat-col-right {
  flex: 1;
  min-width: 0;
  height: 100%;
  background-color: #ffffff;
  border-top-left-radius: 24rpx;
  padding: 16rpx 24rpx 24rpx;
  box-sizing: border-box;
}

.cat-bottom-safe {
  height: 140rpx;
}
</style>

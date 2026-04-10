<template>
  <view class="cat-page">
    <PageSearchHeader>
      <view class="home-top-row">
        <view class="home-search-wrap">
          <SearchBar :placeholder="searchPlaceholder" />
        </view>
        <view class="home-bell">🔔</view>
      </view>
    </PageSearchHeader>

    <view class="cat-main">
      <view class="cat-col-left">
        <view v-if="categoryLoadError" class="cat-side-empty">
          <text class="cat-side-empty-text">{{ categoryLoadError }}</text>
        </view>
        <view v-else-if="!categoryList.length" class="cat-side-empty">
          <text class="cat-side-empty-text">暂无分类</text>
        </view>
        <CategorySidebar
          v-else
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
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageSearchHeader from '@/components/PageSearchHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import CategorySidebar from '@/components/category/CategorySidebar.vue'
import CategoryHotSearch from '@/components/category/CategoryHotSearch.vue'
import CategoryProductGrid from '@/components/category/CategoryProductGrid.vue'
import { fetchPublishedSlotsForPage } from '@/utils/cmsSlotLoader.js'
import { SLOT_TYPE_CATEGORY_LIST } from '@/utils/cmsSlotContentTypes.js'
import { buildCategorySidebarItemsFromCmsSlot } from '@/utils/categoryListFromCms.js'

/** 与后台 App 页 `page_key`、槽位 `category_list` 一致 */
const CMS_CATEGORY_PAGE_KEY = 'category'
const CMS_CATEGORY_SLOT_TYPES = [SLOT_TYPE_CATEGORY_LIST]

const hotTags = ['波士顿龙虾', '红颜草莓', '有机西红柿']

const hotProducts = [
  { id: 1, title: '泰国金枕头榴莲A级 2-3kg', price: '199.0' },
  { id: 2, title: '澳洲冷鲜西冷牛排 200g', price: '58.0' }
]

const searchPlaceholder = ref('搜索')

const categoryList = ref([])
const categoryLoadError = ref('')
const activeCategory = ref('')

function syncActiveAfterListChange(list) {
  if (!list.length) {
    activeCategory.value = ''
    return
  }
  const keys = new Set(list.map((x) => x.key))
  if (!activeCategory.value || !keys.has(activeCategory.value)) {
    activeCategory.value = list[0].key
  }
}

watch(categoryList, (list) => {
  syncActiveAfterListChange(list)
})

function setActiveCategory(key) {
  activeCategory.value = key
}

async function loadCategoryCms() {
  categoryLoadError.value = ''
  try {
    const { slots, errors, pageNotFound } = await fetchPublishedSlotsForPage({
      pageKey: CMS_CATEGORY_PAGE_KEY,
      slotTypes: CMS_CATEGORY_SLOT_TYPES,
      channel: 'mp-weixin',
      appVersion: '1.0.0'
    })
    if (pageNotFound) {
      categoryList.value = []
      categoryLoadError.value = '页面未配置'
      return
    }
    const slot = slots[SLOT_TYPE_CATEGORY_LIST]
    categoryList.value = buildCategorySidebarItemsFromCmsSlot(slot)
    if (errors.length > 0 && categoryList.value.length > 0) {
      uni.showToast({ title: '部分内容加载失败', icon: 'none' })
    } else if (errors.length > 0) {
      uni.showToast({ title: '分类加载失败', icon: 'none' })
    }
  } catch {
    categoryList.value = []
    uni.showToast({ title: '分类加载失败', icon: 'none' })
  }
}

onShow(() => {
  loadCategoryCms()
})
</script>

<style lang="scss">
.cat-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom);
}

.home-top-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.home-search-wrap {
  flex: 1;
  min-width: 0;
}

.home-bell {
  width: 52rpx;
  margin-left: 16rpx;
  text-align: right;
  flex-shrink: 0;
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

.cat-side-empty {
  padding: 24rpx 16rpx;
  box-sizing: border-box;
}

.cat-side-empty-text {
  font-size: 22rpx;
  color: #999999;
  line-height: 1.4;
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
  height: 32rpx;
}
</style>

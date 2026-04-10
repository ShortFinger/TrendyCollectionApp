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

      <scroll-view
        class="cat-col-right"
        scroll-y
        :show-scrollbar="false"
        refresher-enabled
        :refresher-triggered="categoryRefresherTriggered"
        @refresherrefresh="handleCategoryRefresherRefresh"
        @scrolltolower="onActivityScrollLower"
        @scroll="closeSortDropdown"
      >
        <view class="cat-sort-row">
          <view class="cat-sort-wrap">
            <view class="cat-sort-picker-trigger" @tap.stop="toggleSortDropdown">
              <text class="cat-sort-picker-text">{{ activitySortDisplayLabel }}</text>
              <text
                class="cat-sort-picker-caret"
                :class="{ 'cat-sort-picker-caret-open': sortDropdownOpen }"
              >▼</text>
            </view>
            <view v-if="sortDropdownOpen" class="cat-sort-dropdown" @tap.stop>
              <view
                v-for="opt in ACTIVITY_SORT_OPTIONS"
                :key="opt.value"
                class="cat-sort-dropdown-item"
                :class="{ 'cat-sort-dropdown-item-active': activitySort === opt.value }"
                @tap="selectActivitySort(opt.value)"
              >
                <text class="cat-sort-dropdown-item-text">{{ opt.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="activityListLoading && !activityCards.length" class="cat-activity-hint">
          <text class="cat-activity-hint-text">加载中…</text>
        </view>
        <view v-else-if="activitiesLoadError" class="cat-activity-hint">
          <text class="cat-activity-hint-text">{{ activitiesLoadError }}</text>
        </view>
        <view v-else class="card-list">
          <template v-if="activityCards.length">
            <ActivityFeedCard
              v-for="(item, index) in activityCards"
              :key="item.id"
              :item="item"
              @cardTap="handleCardClick(index, $event)"
            />
          </template>
          <view v-else class="section-empty card-list-empty">
            <text class="section-empty-text">暂无活动</text>
          </view>
        </view>
        <view class="cat-bottom-safe" />
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageSearchHeader from '@/components/PageSearchHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import CategorySidebar from '@/components/category/CategorySidebar.vue'
import ActivityFeedCard from '@/components/ActivityFeedCard.vue'
import { fetchPublishedSlotsForPage } from '@/utils/cmsSlotLoader.js'
import { SLOT_TYPE_CATEGORY_LIST } from '@/utils/cmsSlotContentTypes.js'
import { buildCategorySidebarItemsFromCmsSlot } from '@/utils/categoryListFromCms.js'
import { fetchCategoryActivitiesPage } from '@/utils/categoryActivitiesApi.js'
import { activityDisplaySnapshotToCardItem } from '@/utils/activityDisplayToCardItem.js'

/** 与后台 App 页 `page_key`、槽位 `category_list` 一致 */
const CMS_CATEGORY_PAGE_KEY = 'category'
const CMS_CATEGORY_SLOT_TYPES = [SLOT_TYPE_CATEGORY_LIST]

const ACTIVITY_PAGE_SIZE = 20

const ACTIVITY_SORT_OPTIONS = [
  { label: '销量', value: 'sales' },
  { label: '热度', value: 'visit_total' }
]

const searchPlaceholder = ref('搜索')

const categoryList = ref([])
const categoryLoadError = ref('')
const activeCategory = ref('')

const activitySort = ref('sales')
const sortDropdownOpen = ref(false)
const activitySortDisplayLabel = computed(() => {
  const opt = ACTIVITY_SORT_OPTIONS.find((o) => o.value === activitySort.value)
  return opt?.label ?? '销量'
})
const activityCards = ref([])
const activityPage = ref(1)
const activityTotal = ref(0)
const activityHasMore = ref(true)
const activityListLoading = ref(false)
const activityListLoadingMore = ref(false)
const activitiesLoadError = ref('')
const activityFetchGen = ref(0)

const TAB_PATHS = [
  '/pages/index/index',
  '/pages/category/index',
  '/pages/ichibanKuji/index',
  '/pages/mine/index'
]

function pathOnly(url) {
  if (!url || typeof url !== 'string') return ''
  const q = url.indexOf('?')
  return q === -1 ? url : url.slice(0, q)
}

function withLeadingSlash(path) {
  if (!path) return ''
  return path[0] === '/' ? path : `/${path}`
}

function openInternalUrl(url) {
  if (!url) return
  const path = withLeadingSlash(pathOnly(url))
  const fullUrl = url.includes('?') ? path + url.slice(url.indexOf('?')) : path
  const isTab = TAB_PATHS.includes(path)
  if (!isTab) {
    uni.navigateTo({ url: fullUrl })
    return
  }
  if (fullUrl.includes('?')) {
    uni.reLaunch({ url: fullUrl })
    return
  }
  uni.switchTab({ url: path })
}

function handleJump(jumpType, jumpUrl) {
  if (!jumpUrl || jumpType === 'none') return
  if (jumpType === 'h5') {
    uni.showToast({
      title: 'H5 跳转待接入',
      icon: 'none'
    })
    return
  }
  openInternalUrl(jumpUrl)
}

function mapActivityItems(raw) {
  return raw.map(activityDisplaySnapshotToCardItem).filter(Boolean)
}

function closeSortDropdown() {
  sortDropdownOpen.value = false
}

function toggleSortDropdown() {
  sortDropdownOpen.value = !sortDropdownOpen.value
}

function selectActivitySort(value) {
  activitySort.value = value
  sortDropdownOpen.value = false
}

async function loadActivityFirstPage() {
  const cat = activeCategory.value
  if (!cat) {
    activityCards.value = []
    activityHasMore.value = false
    activitiesLoadError.value = ''
    return
  }
  const gen = ++activityFetchGen.value
  activityListLoading.value = true
  activitiesLoadError.value = ''
  try {
    const res = await fetchCategoryActivitiesPage({
      categoryId: cat,
      page: 1,
      pageSize: ACTIVITY_PAGE_SIZE,
      channel: 'mp-weixin',
      appVersion: '1.0.0',
      sort: activitySort.value
    })
    if (gen !== activityFetchGen.value) return
    activityTotal.value = res.total
    activityPage.value = 1
    activityCards.value = mapActivityItems(res.items)
    const loaded = activityCards.value.length
    activityHasMore.value =
      loaded < activityTotal.value && res.items.length >= ACTIVITY_PAGE_SIZE
  } catch {
    if (gen !== activityFetchGen.value) return
    activityCards.value = []
    activityHasMore.value = false
    activitiesLoadError.value = '加载失败'
    uni.showToast({ title: '活动加载失败', icon: 'none' })
  } finally {
    if (gen === activityFetchGen.value) {
      activityListLoading.value = false
    }
  }
}

async function loadActivityNextPage() {
  const cat = activeCategory.value
  if (
    !cat ||
    !activityHasMore.value ||
    activityListLoading.value ||
    activityListLoadingMore.value
  ) {
    return
  }
  const gen = activityFetchGen.value
  const nextPage = activityPage.value + 1
  activityListLoadingMore.value = true
  try {
    const res = await fetchCategoryActivitiesPage({
      categoryId: cat,
      page: nextPage,
      pageSize: ACTIVITY_PAGE_SIZE,
      channel: 'mp-weixin',
      appVersion: '1.0.0',
      sort: activitySort.value
    })
    if (gen !== activityFetchGen.value) return
    activityPage.value = nextPage
    const more = mapActivityItems(res.items)
    activityCards.value = activityCards.value.concat(more)
    const loaded = activityCards.value.length
    activityHasMore.value =
      loaded < activityTotal.value && res.items.length >= ACTIVITY_PAGE_SIZE
  } catch {
    uni.showToast({ title: '加载更多失败', icon: 'none' })
  } finally {
    activityListLoadingMore.value = false
  }
}

function onActivityScrollLower() {
  loadActivityNextPage()
}

function handleCardClick(_index, item) {
  if (item?.jumpUrl) {
    handleJump(item.jumpType || 'page', item.jumpUrl)
  }
}

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

watch(activeCategory, () => {
  closeSortDropdown()
  loadActivityFirstPage()
})

watch(activitySort, () => {
  loadActivityFirstPage()
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

const categoryRefresherTriggered = ref(false)

async function handleCategoryRefresherRefresh() {
  categoryRefresherTriggered.value = true
  try {
    await loadCategoryCms()
    await loadActivityFirstPage()
  } finally {
    categoryRefresherTriggered.value = false
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

.cat-sort-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.cat-sort-wrap {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.cat-sort-picker-trigger {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  background-color: #f7f8fa;
  box-sizing: border-box;
  min-width: 200rpx;
}

.cat-sort-picker-text {
  font-size: 26rpx;
  color: #333333;
}

.cat-sort-picker-caret {
  font-size: 18rpx;
  color: #999999;
  line-height: 1;
  transition: transform 0.15s ease;
}

.cat-sort-picker-caret-open {
  transform: rotate(180deg);
}

.cat-sort-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8rpx;
  min-width: 200rpx;
  padding: 8rpx 0;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
  border: 1rpx solid #eeeeee;
}

.cat-sort-dropdown-item {
  padding: 20rpx 28rpx;
}

.cat-sort-dropdown-item-active {
  background-color: #f7f8fa;
}

.cat-sort-dropdown-item-text {
  font-size: 28rpx;
  color: #333333;
}

.cat-sort-dropdown-item-active .cat-sort-dropdown-item-text {
  color: #111111;
  font-weight: 600;
}

.cat-activity-hint {
  padding: 48rpx 16rpx;
  text-align: center;
}

.cat-activity-hint-text {
  font-size: 26rpx;
  color: #999999;
}

.card-list {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.section-empty {
  width: 100%;
  padding: 48rpx 16rpx;
  text-align: center;
}

.section-empty-text {
  font-size: 26rpx;
  color: #999999;
}

.card-list-empty {
  margin-top: 16rpx;
}

.cat-bottom-safe {
  height: 32rpx;
}
</style>

<template>
  <view class="home-page">
    <PageSearchHeader>
      <view class="home-top-row">
        <view class="home-search-wrap">
          <SearchBar :placeholder="searchPlaceholder" />
        </view>
        <view class="home-bell">🔔</view>
      </view>
    </PageSearchHeader>

    <scroll-view
      class="scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="homeRefresherTriggered"
      @refresherrefresh="handleHomeRefresherRefresh"
    >
      <!-- 大 Banner -->
      <view v-if="bannerHasContent" class="banner" :class="{ 'banner--no-photo': !bannerImageSrc }"
        :style="bannerShellStyle" @click="handleBannerClick">
        <view class="banner-left">
          <text class="banner-title">{{ bannerData.title }}</text>
          <text class="banner-sub">{{ bannerData.subTitle }}</text>
          <view v-if="bannerButtonVisible" class="banner-btn">
            <text class="banner-btn-text">{{ bannerData.buttonText }}</text>
          </view>
        </view>
        <view class="banner-right">
          <text v-if="(bannerData.rightText || '').trim()" class="banner-right-text">{{
            bannerData.rightText
          }}</text>
        </view>
      </view>
      <view v-else class="banner-empty">
        <text class="banner-empty-text">暂未配置 Banner</text>
      </view>

      <!-- 图标宫格（无数据时不渲染） -->
      <view v-if="iconList.length" class="icon-grid">
        <view v-for="item in iconList" :key="item.id" class="icon-item" @click="handleCategoryClick(item)">
          <view class="icon-circle" :style="{
            backgroundColor: item.imageUrl ? (item.bgColor || '#f5f5f5') : '#e5e5e5'
          }">
            <image v-if="item.imageUrl" class="icon-circle-img" :src="item.imageUrl" mode="aspectFill" />
            <text v-else-if="item.icon" class="icon-emoji">{{ item.icon }}</text>
          </view>
          <text v-if="item.title" class="icon-title">{{ item.title }}</text>
        </view>
      </view>

      <!-- 卡片区域（来自 index.vue） -->
      <view class="card-list">
        <view v-if="homeCmsLoading" class="home-card-hint">
          <text class="home-card-hint-text">加载中…</text>
        </view>
        <template v-else-if="cards.length">
          <view
            v-for="(item, index) in cards"
            :key="item.id"
            class="card-list-cell"
          >
            <ActivityFeedCard
              :item="item"
              @cardTap="handleCardClick(index, $event)"
            />
          </view>
        </template>
        <view v-else class="section-empty card-list-empty">
          <text class="section-empty-text">暂无活动</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import PageSearchHeader from '@/components/PageSearchHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import ActivityFeedCard from '@/components/ActivityFeedCard.vue'
import { fetchPublishedSlotsForPage } from '@/utils/cmsSlotLoader.js'
import { mergeActivityCardItems } from '@/utils/mergeActivityCards.js'
import {
  CONTENT_TYPE_SEARCH_BAR,
  CONTENT_TYPE_BANNER_SLIDE,
  CONTENT_TYPE_ICON_ENTRY,
  SLOT_TYPE_ACTIVITY_CARD_GRID,
  filterItemsWithContentType,
  firstItemWithContentType,
} from '@/utils/cmsSlotContentTypes.js'
import {
  isRenderablePayload,
  normalizeCmsItemPayload
} from '@/utils/cmsPayloadShape.js'
import { logCmsHomeRenderDiagnostics } from '@/utils/cmsHomeRenderDiagnostics.js'

const CMS_PAGE_KEY = 'home'
const CMS_SLOT_TYPES = ['search_bar', 'banner_row', 'icon_grid', 'activity_card_grid']

const emptyBanner = () => ({
  title: '',
  subTitle: '',
  rightText: '',
  buttonText: '',
  imageUrl: '',
  jumpType: 'none',
  jumpUrl: ''
})

const searchPlaceholder = ref('搜索')
const bannerData = ref(emptyBanner())
const iconList = ref([])
const cards = ref([])
/** 首页 CMS 拉取完成前不展示「暂无活动」，避免请求中空列表误显 */
const homeCmsLoading = ref(true)
const payloadErrorDedupKeys = new Set()
const payloadReportTraceCtx = ref({ requestId: '', traceId: '' })

const resetHomeSections = () => {
  searchPlaceholder.value = '搜索'
  bannerData.value = emptyBanner()
  iconList.value = []
  cards.value = []
}

const bannerImageSrc = computed(() => (bannerData.value.imageUrl || '').trim())

const bannerShellStyle = computed(() => {
  const url = bannerImageSrc.value
  if (!url) {
    return { backgroundColor: '#e5e5e5' }
  }
  return {
    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.2) 100%), url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
})

const bannerButtonVisible = computed(() => (bannerData.value.buttonText || '').trim() !== '')

const bannerHasContent = computed(() => {
  const b = bannerData.value
  if (bannerImageSrc.value) return true
  if ((b.title || '').trim()) return true
  const jt = b.jumpType
  const ju = (b.jumpUrl || '').trim()
  return Boolean(jt && jt !== 'none' && ju)
})

const reportPayloadError = (ctx = {}, payload) => {
  const payloadType = payload === null ? 'null' : Array.isArray(payload) ? 'array' : typeof payload
  const dedupKey = [ctx.pageCode || CMS_PAGE_KEY, ctx.slotType || '', ctx.contentType || '', payloadType].join('|')
  if (payloadErrorDedupKeys.has(dedupKey)) return
  payloadErrorDedupKeys.add(dedupKey)
  console.warn('[appconfig] invalid CMS payload', {
    pageCode: ctx.pageCode || CMS_PAGE_KEY,
    slotType: ctx.slotType || '',
    contentType: ctx.contentType || '',
    payloadType,
    requestId: ctx.requestId || '',
    traceId: ctx.traceId || '',
    appVersion: '1.0.0'
  })
}

const normalizePayloadForRender = (item, ctx = {}) => {
  return normalizeCmsItemPayload(item, ctx, (c, p) => reportPayloadError(c, p))
}

const devAssertNormalizePayload = () => {
  const okObj = normalizePayloadForRender({ payload: { a: 1 } })
  const okArr = normalizePayloadForRender({ payload: [{ a: 1 }] })
  const okFromJsonString = normalizePayloadForRender({ payload: '{"a":1}' })
  if (
    !okObj ||
    !okArr ||
    typeof okFromJsonString !== 'object' ||
    okFromJsonString.a !== 1
  ) {
    throw new Error('normalizePayloadForRender contract failed')
  }
  if (isRenderablePayload('{"a":1}') !== false) {
    throw new Error('normalizePayloadForRender contract failed')
  }
}

const processSearchBar = (slot) => {
  const item = firstItemWithContentType(slot.items, CONTENT_TYPE_SEARCH_BAR)
  if (!item) return
  const data = normalizePayloadForRender(item, {
    ...payloadReportTraceCtx.value,
    pageCode: CMS_PAGE_KEY,
    slotType: slot.slotType,
    contentType: CONTENT_TYPE_SEARCH_BAR
  })
  if (data?.placeholder) searchPlaceholder.value = data.placeholder
}

const processBanner = (slot) => {
  const item = firstItemWithContentType(slot.items, CONTENT_TYPE_BANNER_SLIDE)
  if (!item) return
  const data = normalizePayloadForRender(item, {
    ...payloadReportTraceCtx.value,
    pageCode: CMS_PAGE_KEY,
    slotType: slot.slotType,
    contentType: CONTENT_TYPE_BANNER_SLIDE
  })
  if (!data) return
  const jumpUrl = String(data.jumpUrl || data.linkUrl || '').trim()
  const jumpTypeRaw = data.jumpType != null ? String(data.jumpType).trim() : ''
  const jumpType =
    jumpTypeRaw && jumpTypeRaw !== 'none'
      ? jumpTypeRaw
      : jumpUrl
        ? 'page'
        : 'none'
  bannerData.value = {
    ...emptyBanner(),
    ...data,
    jumpType,
    jumpUrl
  }
}

const processIconGrid = (slot) => {
  const sorted = filterItemsWithContentType(slot.items, CONTENT_TYPE_ICON_ENTRY)
  if (!sorted.length) return
  const items = []
  for (const item of sorted) {
    const data = normalizePayloadForRender(item, {
      ...payloadReportTraceCtx.value,
      pageCode: CMS_PAGE_KEY,
      slotType: slot.slotType,
      contentType: CONTENT_TYPE_ICON_ENTRY
    })
    if (!data) continue
    const imageUrl = String(data.imageUrl || '').trim()
    const title = String(data.title || data.label || '').trim()
    items.push({
      id: item.id,
      title,
      label: data.label || '',
      imageUrl,
      icon: data.icon || '',
      bgColor: data.bgColor || '#f5f5f5',
      link: String(data.link || data.linkUrl || '').trim()
    })
  }
  if (items.length) {
    iconList.value = items
  }
}

const processActivityCards = (slots) => {
  cards.value = mergeActivityCardItems(slots)
}

const slotProcessors = {
  search_bar: processSearchBar,
  banner_row: processBanner,
  icon_grid: processIconGrid,
  activity_card_grid: processActivityCards
}

const processSlots = async (slots) => {
  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) return
  let activityHandled = false
  const ordered = Object.entries(slots)
    .map(([slotType, slot]) => ({
      slotType,
      slot,
      order: slot?.sortOrder ?? 0
    }))
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.slotType.localeCompare(b.slotType)
    )
  for (const { slotType, slot } of ordered) {
    if (slotType === SLOT_TYPE_ACTIVITY_CARD_GRID) {
      if (!activityHandled) {
        const activityProcessor = slotProcessors[SLOT_TYPE_ACTIVITY_CARD_GRID]
        if (activityProcessor) await activityProcessor(slots)
        activityHandled = true
      }
      continue
    }
    const processor = slotProcessors[slotType]
    if (processor) await processor({ ...slot, slotType })
  }
}

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

const handleJump = (jumpType, jumpUrl) => {
  if (!jumpUrl || jumpType === 'none') return
  if (jumpType === 'h5') {
    // 当前项目未配置 webview 页时，先提示后续接入
    uni.showToast({
      title: 'H5 跳转待接入',
      icon: 'none'
    })
    return
  }
  openInternalUrl(jumpUrl)
}

const handleBannerClick = () => {
  handleJump(bannerData.value.jumpType, bannerData.value.jumpUrl)
}

const handleCategoryClick = (item) => {
  openInternalUrl(item.link)
}

const loadHomeData = async () => {
  homeCmsLoading.value = true
  try {
    resetHomeSections()
    payloadErrorDedupKeys.clear()
    payloadReportTraceCtx.value = { requestId: '', traceId: '' }
    const { slots, errors, pageNotFound, meta } = await fetchPublishedSlotsForPage({
      pageKey: CMS_PAGE_KEY,
      slotTypes: CMS_SLOT_TYPES,
      channel: 'mp-weixin',
      appVersion: '1.0.0'
    })
    payloadReportTraceCtx.value = meta
    if (pageNotFound) {
      uni.showToast({ title: '页面不存在', icon: 'none' })
      return
    }
    await processSlots(slots)
    logCmsHomeRenderDiagnostics(
      slots,
      iconList.value.length,
      cards.value.length
    )
    if (errors.length > 0 && Object.keys(slots).length > 0) {
      uni.showToast({ title: '部分内容加载失败', icon: 'none' })
    } else if (errors.length === CMS_SLOT_TYPES.length) {
      uni.showToast({ title: '首页数据加载失败', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '首页数据加载失败', icon: 'none' })
  } finally {
    homeCmsLoading.value = false
  }
}

const homeRefresherTriggered = ref(false)

async function handleHomeRefresherRefresh() {
  homeRefresherTriggered.value = true
  try {
    await loadHomeData()
  } finally {
    homeRefresherTriggered.value = false
  }
}

const handleCardClick = (_index, item) => {
  if (item?.jumpUrl) {
    handleJump(item.jumpType || 'page', item.jumpUrl)
  }
}

if (process.env.NODE_ENV === 'development') {
  devAssertNormalizePayload()
}

onMounted(() => {
  loadHomeData()
})
</script>

<style lang="scss">
.home-page {
  background-color: #f7f8fa;
  min-height: 100vh;
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

.scroll {
  flex: 1;
  min-height: 0;
  margin-top: 24rpx;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

/* Banner */
.banner {
  background-color: #e5e5e5;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  box-sizing: border-box;
  height: 280rpx;
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  overflow: hidden;
}

.banner--no-photo {
  color: #333;
}

.banner--no-photo .banner-sub {
  opacity: 1;
  color: #666;
}

.banner--no-photo .banner-right-text {
  opacity: 1;
  color: #999;
}

.banner-left {
  flex: 1.4;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.banner-title {
  font-size: 32rpx;
  font-weight: 600;
}

.banner-sub {
  margin-top: 12rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.banner-btn {
  margin-top: 24rpx;
  width: 160rpx;
  height: 56rpx;
  border-radius: 56rpx;
  background-color: #ffffff;
  justify-content: center;
  align-items: center;
  display: flex;
}

.banner-btn-text {
  font-size: 24rpx;
  color: #00c36f;
}

.banner-right {
  flex: 1;
  align-items: flex-end;
  justify-content: flex-end;
  display: flex;
}

.banner-right-text {
  font-size: 22rpx;
  opacity: 0.5;
}

.banner-empty {
  background-color: #f0f0f0;
  border-radius: 24rpx;
  padding: 48rpx 28rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.banner-empty-text {
  font-size: 26rpx;
  color: #999;
}

.section-empty {
  width: 100%;
  padding: 48rpx 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.section-empty-text {
  font-size: 26rpx;
  color: #999;
}

.card-list-empty {
  width: 100%;
  min-height: 160rpx;
  margin-top: 0;
}

.home-card-hint {
  width: 100%;
  padding: 48rpx 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.home-card-hint-text {
  font-size: 26rpx;
  color: #999999;
}

/* 图标宫格 */
.icon-grid {
  margin-top: 32rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  padding: 32rpx 20rpx 24rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.icon-item {
  width: 25%;
  margin-bottom: 32rpx;
  align-items: center;
  display: flex;
  flex-direction: column;
}

.icon-circle {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  display: flex;
}

.icon-circle-img {
  width: 100%;
  height: 100%;
}

.icon-emoji {
  font-size: 40rpx;
}

.icon-title {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #666;
  text-align: center;
}

/* 限时秒杀 */
.flash-sale {
  margin-top: 32rpx;
  border-radius: 24rpx;
  background-color: #ffffff;
  padding: 24rpx 20rpx 28rpx;
}

.flash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flash-title-box {
  flex-direction: row;
  display: flex;
  align-items: center;
}

.flash-title {
  color: #ff4d4f;
  font-size: 26rpx;
  font-weight: 600;
  margin-right: 16rpx;
}

.flash-timer {
  display: flex;
}

.time-block {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
  background-color: #000;
  margin-right: 8rpx;
  justify-content: center;
  align-items: center;
  display: flex;
}

.time-text {
  color: #fff;
  font-size: 22rpx;
}

.flash-more {
  font-size: 22rpx;
  color: #999;
}

.flash-products {
  margin-top: 24rpx;
  flex-direction: row;
  display: flex;
  justify-content: space-between;
}

.flash-card {
  width: 32%;
}

.flash-img {
  width: 100%;
  height: 160rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
}

.flash-name-en {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #333;
}

.flash-name-cn {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #888;
}

.flash-price-row {
  margin-top: 8rpx;
  flex-direction: row;
  display: flex;
  align-items: baseline;
}

.flash-price {
  font-size: 26rpx;
  color: #ff4d4f;
  margin-right: 8rpx;
}

.flash-origin {
  font-size: 20rpx;
  color: #bbb;
  text-decoration: line-through;
}

/* 卡片列表：每行两个 */
.card-list {
  margin-top: 32rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.card-list-cell {
  width: 48%;
  flex: 0 0 48%;
  max-width: 48%;
  box-sizing: border-box;
}

</style>
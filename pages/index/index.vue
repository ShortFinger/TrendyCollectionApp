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

      <scroll-view class="scroll" scroll-y>
        <!-- 大 Banner -->
        <view
          v-if="bannerHasContent"
          class="banner"
          :style="{ backgroundColor: bannerData.bgColor || '#00c36f' }"
          @click="handleBannerClick"
        >
          <view class="banner-left">
            <text class="banner-title">{{ bannerData.title }}</text>
            <text class="banner-sub">{{ bannerData.subTitle }}</text>
            <view class="banner-btn">
              <text class="banner-btn-text">{{ bannerData.buttonText }}</text>
            </view>
          </view>
          <view class="banner-right">
            <text class="banner-right-text">{{ bannerData.rightText }}</text>
          </view>
        </view>
        <view v-else class="banner-empty">
          <text class="banner-empty-text">暂未配置 Banner</text>
        </view>
  
        <!-- 图标宫格 -->
        <view class="icon-grid">
          <template v-if="iconList.length">
            <view
              v-for="item in iconList"
              :key="item.id"
              class="icon-item"
              @click="handleCategoryClick(item)"
            >
              <view class="icon-circle" :style="{ backgroundColor: item.bgColor }">
                <text class="icon-emoji">{{ item.icon }}</text>
              </view>
              <text class="icon-text">{{ item.label }}</text>
            </view>
          </template>
          <view v-else class="section-empty">
            <text class="section-empty-text">暂无入口</text>
          </view>
        </view>
  
        <!-- 卡片区域（来自 index.vue） -->
        <view class="card-list">
          <template v-if="cards.length">
            <view
              v-for="(item, index) in cards"
              :key="item.id"
              class="card"
              @click="handleCardClick(index, item)"
            >
              <view class="card-cover">
                <view
                  class="card-image"
                  :style="{ backgroundImage: item.coverUrl ? `url(${item.coverUrl})` : '' }"
                />
                <view class="card-corner-marks">
                  <image
                    v-if="item.cornerMarks?.upperLeft"
                    class="card-corner card-corner-tl"
                    :src="item.cornerMarks.upperLeft"
                    mode="aspectFit"
                  />
                  <image
                    v-if="item.cornerMarks?.upperRight"
                    class="card-corner card-corner-tr"
                    :src="item.cornerMarks.upperRight"
                    mode="aspectFit"
                  />
                  <image
                    v-if="item.cornerMarks?.lowerLeft"
                    class="card-corner card-corner-bl"
                    :src="item.cornerMarks.lowerLeft"
                    mode="aspectFit"
                  />
                  <image
                    v-if="item.cornerMarks?.lowerRight"
                    class="card-corner card-corner-br"
                    :src="item.cornerMarks.lowerRight"
                    mode="aspectFit"
                  />
                </view>
              </view>
  
              <view class="card-title">
                <text>{{ item.title }}</text>
              </view>

              <view v-if="item.priceText" class="card-price-row">
                <text class="card-price">{{ item.priceText }}</text>
              </view>
  
              <view class="card-content">
                <view class="card-desc">
                  <text>{{ item.desc }}</text>
                </view>
  
                <view class="card-footer">
                  <text class="card-author">{{ item.author }}</text>
                  <view class="card-meta">
                    <text class="card-tag">{{ item.tag }}</text>
                    <text class="card-like">{{ formatLikes(item.likes) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>
          <view v-else class="section-empty card-list-empty">
            <text class="section-empty-text">暂无活动</text>
          </view>
        </view>
      </scroll-view>
  
      <!-- 底部 TabBar 公共组件 -->
      <TabBar active="home" />
    </view>
    </template>
    
    <script setup>
    import { onMounted, ref, computed } from 'vue'
    import TabBar from '@/components/TabBar.vue'
    import PageSearchHeader from '@/components/PageSearchHeader.vue'
    import SearchBar from '@/components/SearchBar.vue'
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

    const CMS_PAGE_KEY = 'home'
    const CMS_SLOT_TYPES = ['search_bar', 'banner_row', 'icon_grid', 'activity_card_grid']

    const emptyBanner = () => ({
      title: '',
      subTitle: '',
      rightText: '',
      buttonText: '',
      jumpType: 'none',
      jumpUrl: '',
      bgColor: ''
    })

    const searchPlaceholder = ref('搜索')
    const bannerData = ref(emptyBanner())
    const iconList = ref([])
    const cards = ref([])
    const payloadErrorDedupKeys = new Set()
    const payloadReportTraceCtx = ref({ requestId: '', traceId: '' })

    const resetHomeSections = () => {
      searchPlaceholder.value = '搜索'
      bannerData.value = emptyBanner()
      iconList.value = []
      cards.value = []
    }

    const bannerHasContent = computed(() => {
      const b = bannerData.value
      if ((b.title || '').trim()) return true
      const jt = b.jumpType
      const ju = (b.jumpUrl || '').trim()
      return Boolean(jt && jt !== 'none' && ju)
    })

    const isRenderablePayload = (payload) => {
      return payload != null && (Array.isArray(payload) || Object.prototype.toString.call(payload) === '[object Object]')
    }

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
      const payload = item?.payload
      if (isRenderablePayload(payload)) {
        return payload
      }
      reportPayloadError(ctx, payload)
      return null
    }

    const devAssertNormalizePayload = () => {
      const okObj = normalizePayloadForRender({ payload: { a: 1 } })
      const okArr = normalizePayloadForRender({ payload: [{ a: 1 }] })
      const badType = isRenderablePayload('{"a":1}')
      if (!okObj || !okArr || badType !== false) {
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
      bannerData.value = {
        ...emptyBanner(),
        ...data,
        jumpType: data.jumpType || 'none',
        jumpUrl: data.jumpUrl || ''
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
        items.push({
          id: item.id,
          label: data.label || '',
          icon: data.icon || '',
          bgColor: data.bgColor || '#f5f5f5',
          link: data.link || ''
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

    const formatLikes = (likes) => {
      const value = Number(likes) || 0
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1).replace('.0', '')}k`
      }
      return `${value}`
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
      uni.navigateTo({ url: jumpUrl })
    }

    const handleBannerClick = () => {
      handleJump(bannerData.value.jumpType, bannerData.value.jumpUrl)
    }

    const handleCategoryClick = (item) => {
      uni.navigateTo({ url: item.link })
    }

    const loadHomeData = async () => {
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
        if (errors.length > 0 && Object.keys(slots).length > 0) {
          uni.showToast({ title: '部分内容加载失败', icon: 'none' })
        } else if (errors.length === CMS_SLOT_TYPES.length) {
          uni.showToast({ title: '首页数据加载失败', icon: 'none' })
        }
      } catch (error) {
        uni.showToast({ title: '首页数据加载失败', icon: 'none' })
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
      padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
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
      background-color: #00c36f;
      border-radius: 24rpx;
      padding: 32rpx 28rpx;
      flex-direction: row;
      display: flex;
      justify-content: space-between;
      color: #fff;
    }
    
    .banner-left {
      flex: 1.4;
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
      width: 80rpx;
      height: 80rpx;
      border-radius: 40rpx;
      justify-content: center;
      align-items: center;
      display: flex;
    }
    
    .icon-emoji {
      font-size: 40rpx;
    }
    
    .icon-text {
      margin-top: 12rpx;
      font-size: 22rpx;
      color: #666;
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

    .card {
      width: 48%;
      margin-bottom: 24rpx;
      border-radius: 24rpx;
      background-color: #ffffff;
      box-sizing: border-box;
      overflow: hidden;
    }

    .card-image {
      width: 100%;
      height: 200rpx;
      background-color: #f5f5f5;
    }

    .card-cover {
      position: relative;
      width: 100%;
    }

    .card-corner-marks {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .card-corner {
      position: absolute;
      width: 56rpx;
      height: 56rpx;
    }

    .card-corner-tl {
      top: 8rpx;
      left: 8rpx;
    }

    .card-corner-tr {
      top: 8rpx;
      right: 8rpx;
    }

    .card-corner-bl {
      bottom: 8rpx;
      left: 8rpx;
    }

    .card-corner-br {
      bottom: 8rpx;
      right: 8rpx;
    }

    .card-title {
      padding: 20rpx 20rpx 0;
      font-size: 26rpx;
      font-weight: 600;
      color: #333;
    }

    .card-price-row {
      padding: 8rpx 20rpx 0;
    }

    .card-price {
      font-size: 28rpx;
      font-weight: 600;
      color: #ff4d4f;
    }

    .card-content {
      padding: 12rpx 20rpx 20rpx;
    }

    .card-desc {
      font-size: 22rpx;
      color: #666;
      line-height: 1.4;
    }

    .card-footer {
      margin-top: 12rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-author {
      font-size: 22rpx;
      color: #999;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 20rpx;
      color: #999;
    }

    .card-tag {
      padding: 2rpx 8rpx;
      border-radius: 8rpx;
      background-color: #f5f5f5;
    }

    .card-like {
      margin-left: 8rpx;
    }
    
    </style>
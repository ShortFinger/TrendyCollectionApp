<template>
    <view class="home-page">
      <!-- 顶部搜索行 -->
      <view class="top-bar">
        <view class="search-box">
          <text class="search-placeholder">{{ searchPlaceholder }}</text>
        </view>
  
        <view class="bell-icon">🔔</view>
      </view>
  
      <scroll-view class="scroll" scroll-y>
        <!-- 大 Banner -->
        <view class="banner" :style="{ backgroundColor: bannerData.bgColor || '#00c36f' }" @click="handleBannerClick">
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
  
        <!-- 图标宫格 -->
        <view class="icon-grid">
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
        </view>
  
        <!-- 卡片区域（来自 index.vue） -->
        <view class="card-list">
          <view
            v-for="(item, index) in cards"
            :key="item.id"
            class="card"
            @click="handleCardClick(index, item)"
          >
            <view
              class="card-image"
              :style="{ backgroundImage: item.coverUrl ? `url(${item.coverUrl})` : '' }"
            />
  
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
        </view>
      </scroll-view>
  
      <!-- 底部 TabBar 公共组件 -->
      <TabBar active="home" />
    </view>
    </template>
    
    <script setup>
    import { onMounted, ref } from 'vue'
    import TabBar from '@/components/TabBar.vue'
    import { request, API_BASE } from '@/utils/request.js'
    import {
      collectActivityIdsFromSlots,
      mergeActivityCardItems
    } from '@/utils/mergeActivityCards.js'

    // --- CMS page cache (module-level, resets on cold start) ---
    let pageCache = { data: null, timestamp: 0 }
    const CACHE_TTL = 3 * 60 * 1000 // 3 minutes

    const searchPlaceholder = ref('新鲜草莓 1.9元/斤')
    const bannerData = ref({
      title: '新春生鲜礼遇',
      subTitle: '全场满99减20元',
      rightText: 'Fresh fruits bank',
      buttonText: '立即抢购',
      jumpType: 'none',
      jumpUrl: '',
      bgColor: '#00c36f'
    })

    const iconList = ref([
      { id: 1, label: '时令水果', icon: '🍎', bgColor: '#e6f7ff' },
      { id: 2, label: '新鲜蔬菜', icon: '🥦', bgColor: '#e8f9f0' },
      { id: 3, label: '海鲜水产', icon: '🦐', bgColor: '#e9f1ff' },
      { id: 4, label: '肉禽蛋类', icon: '🍗', bgColor: '#fff0f0' },
      { id: 5, label: '乳品烘焙', icon: '🥛', bgColor: '#fef3e3' },
    ])
    
    // 卡片区域数据（来自 index.vue）
    const cards = ref([
      {
        id: 1,
        title: 'Food post',
        desc: '20分钟搞定！超级好吃的蒜香大虾做法',
        author: '雨莎小李',
        tag: '图文',
        likes: 1200,
        coverUrl: ''
      },
      {
        id: 2,
        title: 'Healthy',
        desc: '周末减脂餐：彩虹色沙拉碗',
        author: '健身厨',
        tag: '健康餐',
        likes: 856,
        coverUrl: ''
      },
      {
        id: 3,
        title: 'Promotion',
        desc: '产地实拍：这就是我们要的顶级牛里脊',
        author: '生鲜达人',
        tag: '生鲜推荐',
        likes: 2000,
        coverUrl: ''
      }
    ])

    const parsePayload = (item) => {
      try { return JSON.parse(item.payload) }
      catch { return null }
    }

    const processSearchBar = (slot) => {
      const item = slot.items?.[0]
      if (!item) return
      const data = parsePayload(item)
      if (data?.placeholder) {
        searchPlaceholder.value = data.placeholder
      }
    }

    const processBanner = (slot) => {
      const item = slot.items?.[0]
      if (!item) return
      const data = parsePayload(item)
      if (data) {
        bannerData.value = { ...bannerData.value, ...data }
      }
    }

    const processIconGrid = (slot) => {
      if (!slot.items?.length) return
      const sorted = [...slot.items].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      )
      const items = []
      for (const item of sorted) {
        const data = parsePayload(item)
        if (data) {
          items.push({
            id: item.id,
            label: data.label || '',
            icon: data.icon || '',
            bgColor: data.bgColor || '#f5f5f5',
            link: data.link || ''
          })
        }
      }
      if (items.length) {
        iconList.value = items
      }
    }

    const processActivityCards = async (slot) => {
      try {
        const ids = collectActivityIdsFromSlots([slot])
        if (!ids.length) {
          cards.value = []
          return
        }
        const activities = await request({
          url: '/activities/display-batch',
          base: API_BASE.order,
          method: 'POST',
          data: { ids }
        })
        const merged = mergeActivityCardItems([slot], activities)
        cards.value = merged
        if (!merged.length) {
          uni.showToast({ title: '暂无可展示活动', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '活动卡片加载失败', icon: 'none' })
        cards.value = []
      }
    }

    const slotProcessors = {
      search_bar: processSearchBar,
      banner: processBanner,
      icon_grid: processIconGrid,
      activity_card_grid: processActivityCards
    }

    const processSlots = async (slots) => {
      for (const slot of slots) {
        const processor = slotProcessors[slot.slotType]
        if (processor) await processor(slot)
      }
    }

    const fetchHomePage = async () => {
      const now = Date.now()
      if (pageCache.data && (now - pageCache.timestamp < CACHE_TTL)) {
        return pageCache.data
      }
      const data = await request({
        url: '/v1/pages/home/page',
        base: API_BASE.app,
        method: 'GET',
        data: { channel: 'mp-weixin', appVersion: '1.0.0' }
      })
      pageCache = { data, timestamp: Date.now() }
      return data
    }

    const requestData = (url, data = {}) =>
      new Promise((resolve, reject) => {
        uni.request({
          url,
          method: 'GET',
          data,
          success: (res) => {
            const body = res.data || {}
            if (body.code === 0) {
              resolve(body.data)
              return
            }
            reject(new Error(body.message || '请求失败'))
          },
          fail: reject
        })
      })

    const postJson = (url, body) =>
      new Promise((resolve, reject) => {
        uni.request({
          url,
          method: 'POST',
          data: body,
          header: { 'Content-Type': 'application/json' },
          success: (res) => {
            const b = res.data || {}
            if (b.code === 0) {
              resolve(b.data)
              return
            }
            reject(new Error(b.message || '请求失败'))
          },
          fail: reject
        })
      })

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

    const fetchHomeBase = async () => {
      const data = await requestData('/app')
      const placeholder = data?.header?.search?.placeholder
      if (placeholder) {
        searchPlaceholder.value = placeholder
      }
    }

    const fetchBanner = async () => {
      const data = await requestData('/app/banner')
      if (Array.isArray(data) && data.length > 0) {
        bannerData.value = { ...bannerData.value, ...data[0] }
      }
    }

    const fetchCategory = async () => {
      const data = await requestData('/app/category')
      if (Array.isArray(data?.items) && data.items.length > 0) {
        iconList.value = data.items
      }
    }

    const fetchContentCards = async () => {
      const data = await requestData('/app/content-cards', { page: 1, pageSize: 10 })
      if (Array.isArray(data?.items) && data.items.length > 0) {
        cards.value = data.items.map((row) => ({
          ...row,
          priceText: row.priceText || ''
        }))
      }
    }

    /** CMS activity_card_ref + Order display-batch；无配置时回退 content-cards */
    const fetchActivityCardsFromCms = async () => {
      try {
        const page = await requestData(`${API_BASE.app}/v1/pages/home/page`, {
          channel: 'mp-weixin',
          appVersion: '1.0.0'
        })
        const ids = collectActivityIdsFromSlots(page?.slots)
        if (!ids.length) {
          await fetchContentCards()
          return
        }
        const activities = await postJson(`${API_BASE.order}/activities/display-batch`, { ids })
        const merged = mergeActivityCardItems(page.slots, activities)
        cards.value = merged
        if (!merged.length) {
          uni.showToast({
            title: '暂无可展示活动',
            icon: 'none'
          })
        }
      } catch (e) {
        uni.showToast({
          title: '活动卡片加载失败',
          icon: 'none'
        })
        cards.value = []
      }
    }

    const loadHomeData = async () => {
      try {
        const page = await fetchHomePage()
        if (page?.slots) {
          await processSlots(page.slots)
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

    onMounted(() => {
      loadHomeData()
    })
    </script>
    
    <style lang="scss">
    .home-page {
      background-color: #f7f8fa;
      min-height: 100vh;
      padding-bottom: 120rpx;
    }
    
    .top-bar {
      padding: 0 32rpx;
      margin-top: 16rpx;
      display: flex;
      align-items: center;
    }
    
    .search-box {
      flex: 1.2;
      margin: 0 16rpx;
      height: 60rpx;
      border-radius: 60rpx;
      background-color: #f3f5f7;
      display: flex;
      align-items: center;
      padding: 0 24rpx;
    }
    
    .search-placeholder {
      font-size: 24rpx;
      color: #999;
    }
    
    .bell-icon {
      width: 52rpx;
      text-align: right;
    }
    
    .scroll {
      margin-top: 24rpx;
      padding: 0 24rpx 24rpx;
      box-sizing: border-box;
      height: calc(100vh - 44px - 120rpx);
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
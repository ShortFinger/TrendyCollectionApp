<template>
  <view class="page">
    <view v-if="loading" class="state">
      <text class="state-text">加载中…</text>
    </view>
    <view v-else-if="loadError" class="state">
      <text class="state-text">{{ loadError }}</text>
    </view>
    <view v-else class="content">
      <view class="main">
        <view class="card-area">
          <image
            v-if="displayImageUrl"
            class="card-img"
            :src="displayImageUrl"
            mode="aspectFit"
          />
          <view v-else class="card-placeholder">
            <text class="card-placeholder-text">暂无展示卡</text>
          </view>
        </view>
        <view class="side">
          <view
            v-for="(btn, idx) in sideButtons"
            :key="idx"
            class="side-item"
            @tap="onSideButton(idx)"
          >
            <text class="side-icon">{{ btn.icon }}</text>
            <text class="side-label">{{ btn.label }}</text>
          </view>
        </view>
      </view>

      <view class="energy" v-if="energyInfo">
        <text v-if="vo && vo.moneyPrice" class="energy-price">¥{{ vo.moneyPrice }}/抽</text>
        <view class="energy-header">
          <text class="energy-label">能量值</text>
          <text class="energy-value">{{ energyInfo.current }}/{{ energyInfo.total }}</text>
        </view>
        <view class="energy-track">
          <view class="energy-fill" :style="{ width: energyPercent + '%' }" />
        </view>
        <text class="energy-guarantee">{{ energyInfo.guaranteeText }}</text>
      </view>
    </view>

    <view v-if="vo" class="bar">
      <view
        v-for="n in drawCounts"
        :key="n"
        class="bar-btn"
        :class="{ 'bar-btn-disabled': drawing }"
        @tap="onDraw(n)"
      >
        <text class="bar-btn-text">{{ drawing ? '抽奖中…' : n + '抽' }}</text>
      </view>
    </view>

    <!-- Draw Result Popup -->
    <view v-if="showDrawResult" class="popup-mask" @tap="showDrawResult = false">
      <view class="popup-sheet popup-result" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">抽卡结果（x{{ drawResultData?.totalDrawn || 0 }}）</text>
          <text class="popup-close" @tap="showDrawResult = false">×</text>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view :class="drawResultData?.totalDrawn === 1 ? 'result-single' : 'result-grid'">
            <view v-for="(card, idx) in (drawResultData?.results || [])" :key="idx" class="result-card">
              <image :src="card.skuImageUrl || ''" class="result-img" mode="aspectFit" />
              <text class="result-level">{{ card.rewardLevelTitle || '' }}</text>
              <text class="result-name">{{ card.skuName || '' }}</text>
            </view>
          </view>
          <text v-if="drawResultData?.stoppedEarly" class="result-warn">
            {{ drawResultData?.stopReason === 'POOL_EMPTY' ? '奖池已空' : '已达抽奖上限' }}
          </text>
        </scroll-view>
        <view class="popup-footer">
          <view class="popup-btn" @tap="onDrawAgain">
            <text class="popup-btn-text">再来一次</text>
          </view>
          <view class="popup-btn popup-btn-primary" @tap="showDrawResult = false">
            <text class="popup-btn-text">确认</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Draw Records Popup -->
    <view v-if="showDrawRecords" class="popup-mask" @tap="showDrawRecords = false">
      <view class="popup-sheet" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">中赏记录</text>
          <text class="popup-close" @tap="showDrawRecords = false">×</text>
        </view>
        <view class="tab-row">
          <text :class="['tab-item', drawRecordsTab === 'all' && 'tab-active']"
                @tap="onRecordsTabChange('all')">全部</text>
          <text :class="['tab-item', drawRecordsTab === 'mine' && 'tab-active']"
                @tap="onRecordsTabChange('mine')">我的</text>
        </view>
        <scroll-view scroll-y class="popup-body" @scrolltolower="loadDrawRecords()">
          <view v-for="(rec, idx) in drawRecordsList" :key="idx" class="record-item">
            <view class="record-left">
              <text class="record-nick">{{ rec.nickname || '用户' }}</text>
              <text class="record-time">{{ formatTime(rec.drawTime) }}</text>
            </view>
            <view class="record-right">
              <text class="record-sku">{{ rec.skuName }}</text>
              <text class="record-level">{{ rec.rewardLevelTitle }}</text>
            </view>
          </view>
          <text v-if="drawRecordsLoading" class="popup-loading">加载中…</text>
          <text v-else-if="drawRecordsList.length === 0" class="popup-empty">暂无记录</text>
        </scroll-view>
      </view>
    </view>

    <!-- Probability Popup -->
    <view v-if="showProbability" class="popup-mask" @tap="showProbability = false">
      <view class="popup-sheet" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">中赏概率</text>
          <text class="popup-close" @tap="showProbability = false">×</text>
        </view>
        <scroll-view scroll-y class="popup-body">
          <view v-if="probabilityLoading" style="text-align:center;padding:40rpx;">
            <text class="popup-loading">加载中…</text>
          </view>
          <view v-else v-for="level in probabilityData" :key="level.id" class="prob-level">
            <view class="prob-level-header">
              <text class="prob-level-title">{{ level.title }}</text>
              <text class="prob-level-pct">{{ level.totalProbabilityText }}</text>
            </view>
            <view class="result-grid">
              <view v-for="sku in level.skus" :key="sku.skuId" class="result-card">
                <image :src="sku.imageUrl || ''" class="result-img" mode="aspectFit" />
                <text class="result-name">{{ sku.skuName }}</text>
                <text class="prob-sku-pct">{{ sku.probabilityText }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchActivityDetail } from '@/utils/activityDetailApi.js'
import { ensureCanonicalActivityRoute } from '@/utils/activityRouteCanonical.js'
import { submitDraw, fetchPityState, fetchDrawRecords, fetchRewardLevelsDetail } from '@/utils/drawApi.js'

const drawCounts = [1, 5, 10, 20]

const loading = ref(true)
const loadError = ref('')
const vo = ref(null)
const drawing = ref(false)
const activityId = ref('')
const pityState = ref(null)

const showDrawResult = ref(false)
const drawResultData = ref(null)
const lastDrawCount = ref(1)

const showDrawRecords = ref(false)
const drawRecordsTab = ref('all')
const drawRecordsList = ref([])
const drawRecordsPage = ref(1)
const drawRecordsTotal = ref(0)
const drawRecordsLoading = ref(false)

const showProbability = ref(false)
const probabilityData = ref([])
const probabilityLoading = ref(false)

const displayImageUrl = computed(() => {
  const v = vo.value
  if (!v) return ''
  if (v.displayItemImageUrl) return v.displayItemImageUrl
  const levels = v.rewardLevels
  if (Array.isArray(levels) && levels.length > 0) {
    const icon = String(levels[0]?.icon ?? '').trim()
    if (icon) return icon
  }
  return ''
})

const energyInfo = computed(() => {
  const v = vo.value
  const ps = pityState.value
  if (!v || !v.pityEnabled) return null
  return {
    current: ps ? ps.currentCount : 0,
    total: v.pityThreshold || 0,
    guaranteeText: `单人每${v.pityThreshold}包必出${v.pityTargetLevelTitle || ''}`
  }
})

const energyPercent = computed(() => {
  if (!energyInfo.value) return 0
  const { current, total } = energyInfo.value
  if (!total || total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)))
})

const sideButtons = [
  { icon: '📋', label: '中赏记录' },
  { icon: '🎯', label: '中赏概率' },
  { icon: '❗', label: '购买说明' },
  { icon: '🏆', label: '图鉴奖励' }
]

watch(
  () => vo.value,
  (v) => {
    if (!v) return
    const t = String(v.title ?? '').trim()
    if (t) uni.setNavigationBarTitle({ title: t })
  },
  { immediate: true }
)

async function load(id) {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchActivityDetail(id)
    if (!data) return
    const at = String(data.activityType ?? '').trim()
    if (!ensureCanonicalActivityRoute(id, at)) return
    vo.value = data
    activityId.value = id
    const token = uni.getStorageSync('accessToken')
    if (token) {
      fetchPityState(id).then(data => {
        pityState.value = data
      }).catch(() => {})
    }
  } catch {
    loadError.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  const id = String(query?.activityId ?? '').trim()
  if (!id) {
    loading.value = false
    uni.showToast({ title: '缺少活动参数', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 400)
    return
  }
  load(id)
})

function onSideButton(idx) {
  if (idx === 0) {
    showDrawRecords.value = true
    loadDrawRecords(true)
  } else if (idx === 1) {
    showProbability.value = true
    loadProbability()
  } else {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  }
}

async function onDraw(count) {
  if (drawing.value) return
  if (!activityId.value) return

  drawing.value = true
  try {
    const data = await submitDraw(activityId.value, count)
    lastDrawCount.value = count
    drawResultData.value = data
    showDrawResult.value = true
    fetchPityState(activityId.value).then(d => { pityState.value = d }).catch(() => {})
  } catch (err) {
    const msg = err?.message || '抽奖失败，请稍后重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    drawing.value = false
  }
}

function onDrawAgain() {
  showDrawResult.value = false
  onDraw(lastDrawCount.value)
}

async function loadDrawRecords(reset = false) {
  if (drawRecordsLoading.value) return
  if (reset) {
    drawRecordsPage.value = 1
    drawRecordsList.value = []
  }
  drawRecordsLoading.value = true
  try {
    const data = await fetchDrawRecords(
      activityId.value, drawRecordsTab.value, drawRecordsPage.value, 20)
    drawRecordsTotal.value = data.total
    if (reset) {
      drawRecordsList.value = data.records
    } else {
      drawRecordsList.value = [...drawRecordsList.value, ...data.records]
    }
    drawRecordsPage.value++
  } catch (err) {
    if (err?.code === 4010) {
      uni.showToast({ title: '请先登录', icon: 'none' })
    }
  } finally {
    drawRecordsLoading.value = false
  }
}

function onRecordsTabChange(tab) {
  drawRecordsTab.value = tab
  loadDrawRecords(true)
}

async function loadProbability() {
  if (probabilityLoading.value) return
  probabilityLoading.value = true
  try {
    probabilityData.value = await fetchRewardLevelsDetail(activityId.value)
  } catch { }
  finally { probabilityLoading.value = false }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 60000)
  if (diff < 1) return '刚刚'
  if (diff < 60) return diff + '分钟前'
  if (diff < 1440) return Math.floor(diff / 60) + '小时前'
  return Math.floor(diff / 1440) + '天前'
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.state {
  padding: 120rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.state-text {
  font-size: 28rpx;
  color: #999;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 0;
}

.card-area {
  flex: 1;
  min-width: 0;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
}

.card-img {
  width: 100%;
  height: 100%;
}

.card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-placeholder-text {
  font-size: 28rpx;
  color: #666;
}

.side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20rpx;
  padding: 16rpx 12rpx;
}

.side-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.08);
}

.side-icon {
  font-size: 36rpx;
}

.side-label {
  font-size: 22rpx;
  color: #ccc;
}

.energy {
  padding: 24rpx 32rpx 16rpx;
}

.energy-price {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #d4a84b;
  margin-bottom: 16rpx;
}

.energy-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.energy-label {
  font-size: 26rpx;
  color: #fff;
}

.energy-value {
  font-size: 26rpx;
  color: #999;
}

.energy-track {
  height: 12rpx;
  border-radius: 6rpx;
  background: #333;
  overflow: hidden;
}

.energy-fill {
  height: 100%;
  border-radius: 6rpx;
  background: #d4a84b;
  transition: width 0.3s ease;
}

.energy-guarantee {
  display: block;
  text-align: center;
  margin-top: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #fff;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 12rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #111;
  box-shadow: 0 -2rpx 16rpx rgba(212, 168, 75, 0.15);
  box-sizing: border-box;
}

.bar-btn {
  flex: 1;
  border-radius: 999rpx;
  padding: 20rpx 8rpx;
  text-align: center;
  background: #2a2a2a;
}

.bar-btn-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #e0e0e0;
}

.bar-btn-disabled {
  opacity: 0.4;
}

.popup-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}
.popup-sheet {
  width: 100%;
  max-height: 80vh;
  background: #222;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #333;
}
.popup-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}
.popup-close {
  font-size: 40rpx;
  color: #999;
  padding: 8rpx;
}
.popup-body {
  flex: 1;
  min-height: 0;
  max-height: 55vh;
  padding: 24rpx 32rpx;
}
.popup-footer {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #333;
}
.popup-btn {
  flex: 1;
  padding: 20rpx;
  text-align: center;
  border-radius: 999rpx;
  background: #333;
}
.popup-btn-primary {
  background: #d4a84b;
}
.popup-btn-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}
.result-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.result-grid .result-card {
  width: calc(25% - 12rpx);
}
.result-single {
  display: flex;
  justify-content: center;
}
.result-single .result-card {
  width: 50%;
}
.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.result-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12rpx;
  background: #1a1a1a;
}
.result-level {
  font-size: 22rpx;
  color: #d4a84b;
  font-weight: 600;
}
.result-name {
  font-size: 20rpx;
  color: #ccc;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.result-warn {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #e85d5d;
}
.tab-row {
  display: flex;
  gap: 0;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #333;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #999;
}
.tab-active {
  color: #fff;
  font-weight: 600;
  border-bottom: 4rpx solid #d4a84b;
}
.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255,255,255,0.06);
}
.record-left { display: flex; flex-direction: column; gap: 6rpx; }
.record-nick { font-size: 26rpx; color: #ccc; }
.record-time { font-size: 22rpx; color: #666; }
.record-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6rpx; }
.record-sku { font-size: 26rpx; color: #fff; }
.record-level { font-size: 22rpx; color: #d4a84b; }
.popup-loading { font-size: 26rpx; color: #999; text-align: center; display: block; padding: 24rpx; }
.popup-empty { font-size: 26rpx; color: #666; text-align: center; display: block; padding: 40rpx; }
.prob-level { margin-bottom: 32rpx; }
.prob-level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.prob-level-title { font-size: 28rpx; font-weight: 600; color: #fff; }
.prob-level-pct { font-size: 24rpx; color: #d4a84b; }
.prob-sku-pct { font-size: 20rpx; color: #999; }
</style>

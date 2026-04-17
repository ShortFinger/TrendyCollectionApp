<template>
  <view class="login-root">
    <!-- 自定义导航：左上角返回与「暂不登录」一致，走 dismissLogin（系统默认返回无法在微信端可靠拦截） -->
    <view class="login-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="login-nav-inner">
        <view class="login-nav-back" @tap="dismissLogin">
          <text class="login-nav-back-icon">‹</text>
        </view>
        <text class="login-nav-title">登录</text>
        <view class="login-nav-placeholder" />
      </view>
    </view>
    <view class="mask" @tap="handleMaskTap" />
    <view class="sheet" @tap.stop>
      <view class="sheet-handle" />
      <text class="title">登录</text>
      <text class="desc">授权手机号并完成微信登录后，可使用「我的」等需要账号的功能。</text>

      <view class="legal-block">
        <view v-if="legalLoadState === 'loading'" class="legal-hint">正在加载协议…</view>
        <view v-else-if="legalLoadState === 'error'" class="legal-err-box">
          <text class="legal-err-text">{{ legalErrorText }}</text>
          <button class="legal-retry-btn" @tap="loadLegalBundle">重试</button>
          <text v-if="legalRetryCount >= 3" class="legal-help-text">若多次重试仍失败，请稍后再试或联系客服。</text>
        </view>
        <view v-else class="legal-ok">
          <checkbox-group
            :key="agreeGroupKey"
            class="legal-check-group"
            @change="onAgreeChange"
          >
            <label
              v-for="item in legalItems"
              :key="item.documentId"
              class="legal-row"
            >
              <checkbox :value="item.documentId" color="#02b282" />
              <view class="legal-row-text-wrap">
                <text class="legal-row-prefix">我已阅读并同意</text>
                <text class="legal-link" @tap.stop="openLegalDoc(item)">《{{ item.title }}》</text>
              </view>
            </label>
          </checkbox-group>
        </view>
      </view>

      <button
        class="primary-btn"
        type="primary"
        open-type="getPhoneNumber"
        :loading="loading"
        :disabled="primaryDisabled"
        @getphonenumber="handleGetPhoneNumber"
      >
        授权手机号并登录
      </button>
      <button class="ghost-btn" :disabled="loading" @tap="handleSkip">暂不登录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { loginWithPhone } from '../../utils/auth.js'
import { toastResultError } from '../../utils/api-error.js'
import { fetchRequiredLegalBundle } from '../../utils/legalPublishedApi.js'
import {
  completeLoginNavigation,
  getLoginRedirectNavMethod,
  normalizeLoginRedirectUrl
} from '../../utils/navigation.js'

const loading = ref(false)
const redirect = ref('')
const statusBarHeight = ref(20)

/** 'idle' | 'loading' | 'ok' | 'error' */
const legalLoadState = ref('loading')
const legalItems = ref([])
const legalErrorText = ref('')
const legalRetryCount = ref(0)
/** 已勾选的 documentId 列表（与 checkbox-group 的 value 一致） */
const agreedDocIds = ref([])
/** 勾选组强制重挂载，便于进入页面时清空勾选态 */
const agreeGroupKey = ref(0)

const legalGateOk = computed(
  () => legalLoadState.value === 'ok' && legalItems.value.length > 0
)
const allLegalChecked = computed(() => {
  const items = legalItems.value
  if (!items.length) return false
  const selected = new Set(agreedDocIds.value)
  return items.every((it) => it.documentId && selected.has(it.documentId))
})

const primaryDisabled = computed(
  () => loading.value || !legalGateOk.value || !allLegalChecked.value
)

async function loadLegalBundle() {
  legalLoadState.value = 'loading'
  legalErrorText.value = ''
  try {
    const list = await fetchRequiredLegalBundle()
    legalItems.value = Array.isArray(list) ? list : []
    agreedDocIds.value = []
    agreeGroupKey.value += 1
    legalLoadState.value = 'ok'
    legalRetryCount.value = 0
  } catch (err) {
    legalLoadState.value = 'error'
    legalRetryCount.value += 1
    legalErrorText.value = err?.message || '协议加载失败，请重试'
  }
}

function onAgreeChange(e) {
  agreedDocIds.value = e?.detail?.value ? [...e.detail.value] : []
}

function openLegalDoc(item) {
  const id = item?.documentId
  if (!id) return
  uni.navigateTo({
    url: `/pages/legal/document/index?id=${encodeURIComponent(id)}`
  })
}

onShow(() => {
  agreedDocIds.value = []
  agreeGroupKey.value += 1
})

function readRedirectFromQuery() {
  const pages = getCurrentPages()
  const current = pages?.[pages.length - 1]
  const options = current?.options || {}
  if (options.redirect) {
    try {
      redirect.value = decodeURIComponent(options.redirect)
    } catch (e) {
      redirect.value = options.redirect
    }
  }
}

function navigateAfterLogin() {
  const app = typeof getApp === 'function' ? getApp() : null
  completeLoginNavigation(redirect.value, app)
}

/** 关闭登录：navigateBack 回到「我的」且无 token 时，会再次触发我的 onShow → 反复打开登录页 */
function dismissLogin() {
  if (loading.value) return
  const app = typeof getApp === 'function' ? getApp() : null
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const prev = pages.length >= 2 ? pages[pages.length - 2] : null
  const prevRoute = prev?.route ? String(prev.route).replace(/^\//, '') : ''
  if (prevRoute === 'pages/mine/index') {
    uni.switchTab({ url: '/pages/index/index' })
    return
  }

  const method = getLoginRedirectNavMethod(redirect.value, app)
  const url = normalizeLoginRedirectUrl(redirect.value, method)

  if (method === 'switchTab') {
    if (url === '/pages/mine/index' || url.startsWith('/pages/mine/')) {
      uni.switchTab({ url: '/pages/index/index' })
      return
    }
    uni.switchTab({
      url,
      fail: () => {
        uni.switchTab({ url: '/pages/index/index' })
      }
    })
    return
  }

  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: '/pages/index/index' })
    }
  })
}

onMounted(() => {
  readRedirectFromQuery()
  loadLegalBundle()
  try {
    statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20
  } catch (e) {
    statusBarHeight.value = 20
  }
})

function handleMaskTap() {
  dismissLogin()
}

function handleSkip() {
  dismissLogin()
}

async function handleGetPhoneNumber(e) {
  if (loading.value) return
  if (!legalGateOk.value || !allLegalChecked.value) {
    uni.showToast({ title: '请逐项勾选全部协议', icon: 'none' })
    return
  }
  const detail = e?.detail || {}
  const errMsg = detail.errMsg || ''
  if (errMsg && !errMsg.includes('ok')) {
    uni.showToast({ title: '需要授权手机号才能登录', icon: 'none' })
    return
  }
  const phoneCode = detail.code
  if (!phoneCode) {
    uni.showToast({ title: '未获取到手机号凭证，请重试', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await loginWithPhone(phoneCode)
    navigateAfterLogin()
  } catch (err) {
    toastResultError(err, { fallback: '登录失败，请重试' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-root {
  min-height: 100vh;
  position: relative;
  background: transparent;
}

.login-nav {
  position: relative;
  z-index: 102;
  background: #ffffff;
}

.login-nav-inner {
  height: 88rpx;
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16rpx;
}

.login-nav-back {
  width: 80rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.login-nav-back-icon {
  font-size: 56rpx;
  color: #333333;
  line-height: 1;
  font-weight: 300;
}

.login-nav-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: #333333;
}

.login-nav-placeholder {
  width: 80rpx;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
}
.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 101;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 40rpx calc(32rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.08);
}
.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #e5e5e5;
  margin: 8rpx auto 28rpx;
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}
.desc {
  display: block;
  font-size: 26rpx;
  color: #999;
  line-height: 1.55;
  margin-bottom: 40rpx;
}
.primary-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #02b282 !important;
  color: #ffffff !important;
  border-radius: 44rpx;
  border: none;
  font-size: 30rpx;
}
.primary-btn::after {
  border: none;
}
.ghost-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  margin-top: 24rpx;
  background: transparent;
  color: #666;
  border-radius: 44rpx;
  border: none;
  font-size: 28rpx;
}
.ghost-btn::after {
  border: none;
}

.legal-block {
  margin-bottom: 32rpx;
}
.legal-hint {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}
.legal-err-box {
  padding: 16rpx 0;
}
.legal-err-text {
  display: block;
  font-size: 24rpx;
  color: #c45656;
  line-height: 1.5;
  margin-bottom: 16rpx;
}
.legal-retry-btn {
  display: inline-block;
  padding: 12rpx 32rpx;
  font-size: 26rpx;
  color: #02b282;
  background: #e8f8f3;
  border-radius: 8rpx;
  border: none;
  margin-bottom: 12rpx;
}
.legal-retry-btn::after {
  border: none;
}
.legal-help-text {
  display: block;
  font-size: 22rpx;
  color: #999;
  line-height: 1.5;
}
.legal-check-group {
  width: 100%;
}
.legal-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 20rpx;
}
.legal-row:last-child {
  margin-bottom: 0;
}
.legal-row-text-wrap {
  flex: 1;
  padding-left: 8rpx;
  padding-top: 2rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  line-height: 1.55;
}
.legal-row-prefix {
  font-size: 24rpx;
  color: #555;
  margin-right: 4rpx;
}
.legal-link {
  font-size: 24rpx;
  color: #02b282;
  text-decoration: underline;
}
.primary-btn[disabled] {
  opacity: 0.45;
}
</style>

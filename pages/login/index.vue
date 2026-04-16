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
      <button
        class="primary-btn"
        type="primary"
        open-type="getPhoneNumber"
        :loading="loading"
        :disabled="loading"
        @getphonenumber="handleGetPhoneNumber"
      >
        授权手机号并登录
      </button>
      <button class="ghost-btn" :disabled="loading" @tap="handleSkip">暂不登录</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { loginWithPhone } from '../../utils/auth.js'
import { toastResultError } from '../../utils/api-error.js'
import {
  completeLoginNavigation,
  getLoginRedirectNavMethod,
  normalizeLoginRedirectUrl
} from '../../utils/navigation.js'

const loading = ref(false)
const redirect = ref('')
const statusBarHeight = ref(20)

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
</style>

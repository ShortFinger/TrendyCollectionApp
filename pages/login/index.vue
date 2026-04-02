<template>
  <view class="login-page">
    <view class="card">
      <text class="title">登录</text>
      <text class="desc">请进行微信登录以继续使用“我的”等需要用户信息的功能。</text>
      <button class="login-btn" :loading="loading" @tap="handleLogin">
        微信登录
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { login } from '../../utils/auth.js'

const loading = ref(false)
const redirect = ref('/pages/mine/index')

function readRedirectFromQuery() {
  const pages = getCurrentPages()
  const current = pages?.[pages.length - 1]
  const options = current?.options || {}
  if (options.redirect) {
    // redirect 可能带 encodeURIComponent，做一次解码
    try {
      redirect.value = decodeURIComponent(options.redirect)
    } catch (e) {
      redirect.value = options.redirect
    }
  }
}

onMounted(() => {
  readRedirectFromQuery()
})

async function handleLogin() {
  if (loading.value) return
  loading.value = true
  try {
    await login()
    uni.redirectTo({ url: redirect.value })
  } catch (e) {
    const msg = e?.message || '登录失败，请重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}
.card {
  width: 100%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 20rpx;
}
.desc {
  display: block;
  font-size: 26rpx;
  color: #999;
  line-height: 1.5;
  margin-bottom: 40rpx;
}
.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #02b282;
  color: #ffffff;
  border-radius: 44rpx;
}
</style>

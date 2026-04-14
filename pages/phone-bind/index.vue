<template>
  <view class="container">
    <view class="content">
      <view class="icon">📱</view>
      <text class="title">绑定手机号</text>
      <text class="desc">为了保障您的账户安全，请授权手机号</text>
      <button class="bind-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhone">
        授权手机号
      </button>
      <text class="cancel" @tap="onCancel">暂不绑定</text>
    </view>
  </view>
</template>

<script setup>
import { bindPhone } from '../../utils/auth.js'
import { toastResultError } from '../../utils/api-error.js'

function getEventChannel() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  return current.getOpenerEventChannel()
}

async function onGetPhone(e) {
  const detail = e?.detail || {}
  const errMsg = detail.errMsg || ''
  if (errMsg && !errMsg.includes('ok')) {
    uni.showToast({ title: '授权已取消', icon: 'none' })
    return
  }
  const code = detail.code
  if (!code) {
    uni.showToast({ title: '未获取到手机号凭证，请重试', icon: 'none' })
    return
  }
  try {
    uni.showLoading({ title: '绑定中...' })
    await bindPhone(code)
    uni.hideLoading()
    uni.showToast({ title: '绑定成功', icon: 'success' })
    getEventChannel().emit('onBound')
    setTimeout(() => uni.navigateBack(), 500)
  } catch (err) {
    uni.hideLoading()
    toastResultError(err, { fallback: '绑定失败，请重试' })
  }
}

function onCancel() {
  getEventChannel().emit('onCancel')
  uni.navigateBack()
}
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f7f8fa;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  background: #fff;
  border-radius: 24rpx;
  width: 80%;
}
.icon { font-size: 80rpx; margin-bottom: 30rpx; }
.title { font-size: 36rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; }
.desc { font-size: 26rpx; color: #999; margin-bottom: 60rpx; text-align: center; }
.bind-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #02b282;
  color: #fff;
  font-size: 30rpx;
  border-radius: 44rpx;
  border: none;
}
.cancel { font-size: 26rpx; color: #999; margin-top: 30rpx; }
</style>

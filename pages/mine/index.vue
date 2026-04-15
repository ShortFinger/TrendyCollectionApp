<template>
  <view class="mine-page">
    <!-- 渐变头部 -->
    <view class="mine-header">
      <!-- 顶部系统栏占位 -->
      <view class="header-status-row">
        <text class="status-time">9:41</text>
        <view class="status-icons">
          <text>📶</text>
          <text>📡</text>
          <text>🔋</text>
        </view>
      </view>

      <!-- 头像 + 昵称 + 会员信息 -->
      <view class="profile-row">
        <view class="avatar-wrapper" @tap="onEditAvatar">
          <view class="avatar-circle">
            <image v-if="userAvatar" class="avatar-img" :src="userAvatar" mode="aspectFill" />
            <text v-else class="avatar-text">Avatar</text>
          </view>
        </view>

        <view class="profile-info">
          <view class="profile-name-row">
            <text class="profile-name">{{ userNickname }}</text>
            <view class="profile-icon-box">
              <text>🔔</text>
            </view>
          </view>
          <view class="vip-badge-row">
            <view v-if="!userState.user?.phone" class="bind-phone-btn" @tap="onBindPhone">
              <text class="bind-phone-text">绑定手机号</text>
            </view>
            <view v-else class="vip-badge">
              <text class="vip-tag">{{ maskedPhone }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 编辑资料弹窗 -->
    <view v-if="showEditProfile" class="edit-overlay" @tap="showEditProfile = false">
      <view class="edit-panel" @tap.stop>
        <text class="edit-title">编辑资料</text>
        <view class="edit-row">
          <text class="edit-label">头像</text>
          <button class="choose-avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            选择头像
          </button>
        </view>
        <view class="edit-row">
          <text class="edit-label">昵称</text>
          <input class="edit-input" v-model="editNickname" placeholder="请输入昵称" maxlength="32" />
        </view>
        <button class="edit-save-btn" @tap="onSaveProfile">保存</button>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="mine-scroll" scroll-y>
      <!-- 资产统计 -->
      <view class="asset-card">
        <view
          v-for="item in assetList"
          :key="item.key"
          class="asset-item"
        >
          <text class="asset-value">{{ item.value }}</text>
          <text class="asset-label">{{ item.label }}</text>
        </view>
      </view>

      <!-- 我的订单 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title">我的订单</text>
          <text class="section-action">查看全部</text>
        </view>

        <view class="order-row">
          <view
            v-for="item in orderList"
            :key="item.key"
            class="order-item"
          >
            <view class="order-icon-wrapper">
              <text class="order-icon">{{ item.icon }}</text>
              <view v-if="item.badge" class="order-badge">
                <text class="order-badge-text">{{ item.badge }}</text>
              </view>
            </view>
            <text class="order-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 功能入口 -->
      <view class="section-card">
        <view class="func-grid">
          <view
            v-for="item in funcList"
            :key="item.key"
            class="func-item"
            @tap="onFuncTap(item.key)"
          >
            <view
              class="func-icon-wrapper"
              :style="{ backgroundColor: item.bgColor }"
            >
              <text class="func-icon">{{ item.icon }}</text>
            </view>
            <text class="func-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view v-if="showLogout" class="section-card logout-card">
        <view class="logout-row" @tap="onLogoutTap">
          <text class="logout-text">退出登录</text>
        </view>
      </view>

      <!-- 底部预留空间 -->
      <view class="bottom-safe" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { state as userState } from '../../store/user.js'
import { updateProfile, requirePhone, fetchMe, logout } from '../../utils/auth.js'
import { getToken } from '../../utils/request.js'

const showEditProfile = ref(false)
const showLogout = ref(false)
const editNickname = ref('')
const editAvatarUrl = ref('')

const userNickname = computed(() => userState.user?.nickname || '微信用户')
const userAvatar = computed(() => userState.user?.avatar || '')
const maskedPhone = computed(() => {
  const phone = userState.user?.phone
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

const assetList = ref([
  { key: 'points', label: '积分', value: '0' },
  { key: 'coupon', label: '优惠券', value: '0' },
  { key: 'balance', label: '余额', value: '¥0' }
])

const orderList = [
  { key: 'pay', label: '待付款', icon: '💰' },
  { key: 'receive', label: '待收货', icon: '📦' },
  { key: 'comment', label: '待评价', icon: '📝' },
  { key: 'after', label: '退换/售后', icon: '♻️' }
]

const funcList = [
  { key: 'address', label: '收货地址', icon: '📍', bgColor: '#e7f8ed' },
  { key: 'cabinet', label: '盒柜', icon: '🗃️', bgColor: '#e9f0ff' },
  { key: 'favorite', label: '我的收藏', icon: '❤', bgColor: '#ffeef0' },
  { key: 'edit-profile', label: '编辑资料', icon: '✏️', bgColor: '#e8f4ff' },
  { key: 'service', label: '客服中心', icon: '🔒', bgColor: '#f0f1ff' }
]

onMounted(async () => {
  // 未登录：mine 不允许进入，直接跳登录页
  const token = getToken()
  if (!token) {
    uni.navigateTo({
      url: '/pages/login/index?redirect=' + encodeURIComponent('/pages/mine/index')
    })
    return
  }

  showLogout.value = true

  // 已有 token：尽量确保用户态可用（避免依赖 App.vue 的执行时序）
  if (!userState.user) {
    try {
      await fetchMe()
    } catch (e) {
      // request.js 在 401 refresh 失败时会导航登录页；这里吞掉即可
    }
  }
})

function onEditAvatar() {
  editNickname.value = userState.user?.nickname || ''
  editAvatarUrl.value = ''
  showEditProfile.value = true
}

function onChooseAvatar(e) {
  editAvatarUrl.value = e.detail.avatarUrl
}

async function onSaveProfile() {
  const nick = editNickname.value.trim()
  const avatar = editAvatarUrl.value
  if (!nick && !avatar) {
    uni.showToast({ title: '请填写要修改的内容', icon: 'none' })
    return
  }
  try {
    uni.showLoading({ title: '保存中...' })
    await updateProfile(nick || undefined, avatar || undefined)
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
    showEditProfile.value = false
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

async function onBindPhone() {
  try {
    await requirePhone()
  } catch (e) {
    // 用户取消
  }
}

function onFuncTap(key) {
  if (key === 'cabinet') {
    uni.navigateTo({ url: '/pages/cabinet/index' })
    return
  }
  if (key === 'edit-profile') {
    onEditAvatar()
  }
}

function onLogoutTap() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success: async (res) => {
      if (!res.confirm) return
      showLogout.value = false
      try {
        await logout()
        uni.switchTab({
          url: '/pages/index/index',
          fail: () => {
            uni.showToast({ title: '切换页面失败', icon: 'none' })
          }
        })
      } catch (e) {
        uni.switchTab({
          url: '/pages/index/index',
          fail: () => {
            uni.showToast({ title: '切换页面失败', icon: 'none' })
          }
        })
      }
    }
  })
}
</script>

<style lang="scss">
.mine-page {
  background-color: #f7f8fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 顶部渐变区域 */
.mine-header {
  padding: 0 32rpx 40rpx;
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
  background: linear-gradient(135deg, #0fd56a, #02b282);
}

.header-status-row {
  padding-top: 12rpx;
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-time {
  font-size: 22rpx;
  color: #ffffff;
}

.status-icons {
  flex-direction: row;
  display: flex;
  gap: 8rpx;
  color: #ffffff;
  font-size: 20rpx;
}

.profile-row {
  margin-top: 32rpx;
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  margin-right: 24rpx;
}

.avatar-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 120rpx;
  height: 120rpx;
}

.avatar-text {
  font-size: 26rpx;
  color: #02b282;
}

.profile-info {
  flex: 1;
}

.profile-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-name {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: 600;
}

.profile-icon-box {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vip-badge-row {
  margin-top: 16rpx;
}

.vip-badge {
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  background-color: rgba(0, 0, 0, 0.12);
  align-self: flex-start;
  display: inline-flex;
}

.vip-tag {
  font-size: 22rpx;
  color: #ffffff;
}

.bind-phone-btn {
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  background-color: rgba(255, 255, 255, 0.25);
  display: inline-flex;
}

.bind-phone-text {
  font-size: 22rpx;
  color: #ffffff;
}

/* 编辑资料弹窗 */
.edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.edit-panel {
  width: 80%;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.edit-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
  text-align: center;
}

.edit-row {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.edit-label {
  font-size: 28rpx;
  color: #666;
  width: 100rpx;
}

.choose-avatar-btn {
  flex: 1;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 26rpx;
  background: #f0f0f0;
  color: #333;
  border-radius: 12rpx;
  border: none;
}

.edit-input {
  flex: 1;
  height: 64rpx;
  padding: 0 16rpx;
  font-size: 28rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
}

.edit-save-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: #02b282;
  color: #fff;
  font-size: 30rpx;
  border-radius: 40rpx;
  border: none;
  margin-top: 16rpx;
}

/* 滚动内容 */
.mine-scroll {
  flex: 1;
  min-height: 0;
  margin-top: -40rpx;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.asset-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx 16rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
}

.asset-item {
  align-items: center;
  display: flex;
  flex-direction: column;
}

.asset-value {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.asset-label {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #999999;
}

.section-card {
  margin-top: 24rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx 24rpx 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.02);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 26rpx;
  color: #333333;
  font-weight: 600;
}

.section-action {
  font-size: 22rpx;
  color: #999999;
}

.order-row {
  margin-top: 24rpx;
  display: flex;
  justify-content: space-between;
}

.order-item {
  flex: 1;
  align-items: center;
  display: flex;
  flex-direction: column;
}

.order-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background-color: #f6f8fc;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.order-icon {
  font-size: 36rpx;
}

.order-badge {
  position: absolute;
  top: -8rpx;
  right: -4rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  border-radius: 14rpx;
  background-color: #ff4d4f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-badge-text {
  font-size: 18rpx;
  color: #ffffff;
}

.order-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #666666;
}

.func-grid {
  margin-top: 8rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.func-item {
  width: 25%;
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.func-icon-wrapper {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.func-icon {
  font-size: 32rpx;
}

.func-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #666666;
}

.bottom-safe {
  height: 32rpx;
}

.logout-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.logout-row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-text {
  font-size: 28rpx;
  color: #ff4d4f;
}
</style>

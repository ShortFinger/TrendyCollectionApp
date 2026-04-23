<template>
  <view class="address-list-page">
    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="!addressList.length" class="empty-wrap">
      <text class="empty-title">暂无收货地址</text>
      <text class="empty-desc">添加地址后可用于后续收货</text>
    </view>

    <scroll-view v-else class="list-scroll" scroll-y>
      <view
        v-for="item in addressList"
        :key="item.id"
        class="address-card"
      >
        <view class="card-header">
          <view class="name-row">
            <text class="receiver-name">{{ item.receiverName }}</text>
            <text class="receiver-phone">{{ item.receiverPhone }}</text>
          </view>
          <text v-if="item.isDefault" class="default-tag">默认</text>
        </view>
        <text class="address-detail">
          {{ item.provinceName }}{{ item.cityName }}{{ item.districtName }}{{ item.detailAddress }}
        </text>
        <view class="card-actions">
          <text
            class="action-text"
            :class="{ disabled: item.isDefault }"
            @tap="onDeleteTap(item)"
          >
            删除
          </text>
          <text class="action-text" @tap="goEdit(item.id)">编辑</text>
          <text
            class="action-text"
            :class="{ disabled: item.isDefault || actionLoading }"
            @tap="onSetDefaultTap(item)"
          >
            设为默认
          </text>
        </view>
      </view>
      <view class="bottom-safe" />
    </scroll-view>

    <view class="footer">
      <button
        class="add-btn"
        type="primary"
        :disabled="isAddressLimitReached"
        @tap="goCreate"
      >
        新增收货地址
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  deleteAddress,
  fetchAddressList,
  formatAddressApiError,
  setDefaultAddress
} from '../../utils/addressApi.js'

const ADDRESS_LIMIT = 10
const addressList = ref([])
const loading = ref(false)
const actionLoading = ref(false)

const isAddressLimitReached = computed(() => addressList.value.length >= ADDRESS_LIMIT)

onShow(() => {
  loadAddressList()
})

async function loadAddressList() {
  loading.value = true
  try {
    addressList.value = await fetchAddressList()
  } catch (err) {
    uni.showToast({ title: formatAddressApiError(err, '地址列表加载失败'), icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goCreate() {
  if (isAddressLimitReached.value) {
    uni.showToast({ title: '最多添加 10 个收货地址', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/address/edit' })
}

function goEdit(id) {
  uni.navigateTo({ url: `/pages/address/edit?id=${encodeURIComponent(id)}` })
}

function onDeleteTap(item) {
  if (!item?.id) return
  if (item.isDefault) {
    uni.showToast({ title: '默认地址不可删除，请先设置其他默认地址', icon: 'none' })
    return
  }
  uni.showModal({
    title: '提示',
    content: '确认删除该收货地址？',
    success: async (res) => {
      if (!res.confirm) return
      actionLoading.value = true
      try {
        await deleteAddress(item.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        await loadAddressList()
      } catch (err) {
        uni.showToast({ title: formatAddressApiError(err, '删除失败，请稍后重试'), icon: 'none' })
      } finally {
        actionLoading.value = false
      }
    }
  })
}

async function onSetDefaultTap(item) {
  if (!item?.id || item.isDefault || actionLoading.value) return
  actionLoading.value = true
  try {
    await setDefaultAddress(item.id)
    uni.showToast({ title: '设置成功', icon: 'success' })
    await loadAddressList()
  } catch (err) {
    uni.showToast({ title: formatAddressApiError(err, '设默认失败，请稍后重试'), icon: 'none' })
  } finally {
    actionLoading.value = false
  }
}
</script>

<style lang="scss">
.address-list-page {
  min-height: 100vh;
  background: #f6f7fb;
  display: flex;
  flex-direction: column;
}

.loading-wrap,
.empty-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}

.empty-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
}

.empty-desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #999;
}

.list-scroll {
  flex: 1;
  min-height: 0;
  padding: 24rpx;
  box-sizing: border-box;
}

.address-card {
  background: #fff;
  border-radius: 18rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.receiver-name {
  font-size: 30rpx;
  color: #111;
  font-weight: 600;
}

.receiver-phone {
  font-size: 26rpx;
  color: #666;
}

.default-tag {
  font-size: 22rpx;
  color: #02b282;
  border: 1rpx solid #02b282;
  border-radius: 20rpx;
  padding: 2rpx 12rpx;
}

.address-detail {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #444;
  line-height: 1.5;
}

.card-actions {
  margin-top: 20rpx;
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
}

.action-text {
  font-size: 24rpx;
  color: #02b282;
}

.action-text.disabled {
  color: #bbb;
}

.footer {
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
}

.add-btn {
  width: 100%;
  background: #02b282;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
}

.add-btn[disabled] {
  background: #b8d9d0;
}

.bottom-safe {
  height: 24rpx;
}
</style>

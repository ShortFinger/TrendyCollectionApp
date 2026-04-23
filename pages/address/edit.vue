<template>
  <view class="address-edit-page">
    <view class="form-card">
      <view class="form-item">
        <text class="label">收件人</text>
        <input
          v-model="form.receiverName"
          class="input"
          placeholder="请输入收件人姓名"
          maxlength="20"
        />
      </view>

      <view class="form-item">
        <text class="label">手机号</text>
        <input
          v-model="form.receiverPhone"
          class="input"
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <view class="form-item wechat-import">
        <button
          class="import-btn"
          type="default"
          :disabled="submitting"
          @tap="onImportFromWeChat"
        >
          从微信地址导入
        </button>
        <text class="import-hint">使用微信里已保存的收货人、手机与省市区，需你确认授权</text>
      </view>
      <!-- #endif -->

      <view class="form-item picker-item">
        <text class="label">省市区</text>
        <view class="picker-group">
          <picker
            class="picker"
            :range="provinceOptions"
            range-key="name"
            :value="provinceIndex"
            @change="onProvinceChange"
          >
            <view class="picker-value">{{ selectedProvinceName || '请选择省份' }}</view>
          </picker>

          <picker
            class="picker"
            :range="cityOptions"
            range-key="name"
            :value="cityIndex"
            @change="onCityChange"
          >
            <view class="picker-value">{{ selectedCityName || '请选择城市' }}</view>
          </picker>

          <picker
            class="picker"
            :range="districtOptions"
            range-key="name"
            :value="districtIndex"
            @change="onDistrictChange"
          >
            <view class="picker-value">{{ selectedDistrictName || '请选择区县' }}</view>
          </picker>
        </view>
      </view>

      <view class="form-item">
        <text class="label">详细地址</text>
        <textarea
          v-model="form.detailAddress"
          class="textarea"
          maxlength="200"
          placeholder="请输入详细地址（街道、门牌号等）"
        />
      </view>

      <view class="form-item switch-item">
        <text class="label">设为默认地址</text>
        <switch :checked="form.isDefault" color="#02b282" @change="onDefaultSwitchChange" />
      </view>
    </view>

    <view class="footer">
      <button class="submit-btn" type="primary" :disabled="submitting" @tap="onSubmit">
        {{ submitting ? '提交中...' : '保存地址' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  createAddress,
  fetchAddressList,
  formatAddressApiError,
  setDefaultAddress,
  updateAddress
} from '../../utils/addressApi.js'
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
  resolveRegionCodesByDistrict,
  resolveRegionCodesByNames
} from '../../utils/regionData.js'

const provinceOptions = getProvinceOptions()
const editingId = ref('')
const initialized = ref(false)
const submitting = ref(false)

const form = reactive({
  receiverName: '',
  receiverPhone: '',
  provinceCode: '',
  cityCode: '',
  districtCode: '',
  detailAddress: '',
  isDefault: false
})

const cityOptions = computed(() => getCityOptions(form.provinceCode))
const districtOptions = computed(() => getDistrictOptions(form.provinceCode, form.cityCode))

const provinceIndex = computed(() => {
  const idx = provinceOptions.findIndex(item => item.code === form.provinceCode)
  return idx >= 0 ? idx : 0
})
const cityIndex = computed(() => {
  const idx = cityOptions.value.findIndex(item => item.code === form.cityCode)
  return idx >= 0 ? idx : 0
})
const districtIndex = computed(() => {
  const idx = districtOptions.value.findIndex(item => item.code === form.districtCode)
  return idx >= 0 ? idx : 0
})

const selectedProvinceName = computed(() => {
  return provinceOptions.find(item => item.code === form.provinceCode)?.name || ''
})
const selectedCityName = computed(() => {
  return cityOptions.value.find(item => item.code === form.cityCode)?.name || ''
})
const selectedDistrictName = computed(() => {
  return districtOptions.value.find(item => item.code === form.districtCode)?.name || ''
})

onShow(() => {
  const nextId = getCurrentRouteId()
  if (initialized.value && nextId === editingId.value) return
  initialized.value = true
  editingId.value = nextId
  initializePage()
})

function getCurrentRouteId() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage?.options?.id || ''
}

async function initializePage() {
  resetForm()
  if (!editingId.value) return
  try {
    const list = await fetchAddressList()
    const target = list.find(item => String(item.id) === String(editingId.value))
    if (!target) {
      uni.showToast({ title: '未找到地址信息', icon: 'none' })
      return
    }
    form.receiverName = target.receiverName || ''
    form.receiverPhone = target.receiverPhone || ''
    const regionCodes = resolveRegionCodesByDistrict(target.districtCode)
    form.provinceCode = target.provinceCode || regionCodes.provinceCode || ''
    form.cityCode = target.cityCode || regionCodes.cityCode || ''
    form.districtCode = target.districtCode || regionCodes.districtCode || ''
    form.detailAddress = target.detailAddress || ''
    form.isDefault = Boolean(target.isDefault)
  } catch (err) {
    uni.showToast({ title: formatAddressApiError(err, '地址信息加载失败'), icon: 'none' })
  }
}

function resetForm() {
  form.receiverName = ''
  form.receiverPhone = ''
  form.provinceCode = ''
  form.cityCode = ''
  form.districtCode = ''
  form.detailAddress = ''
  form.isDefault = false
}

function onProvinceChange(event) {
  const idx = Number(event.detail.value)
  const province = provinceOptions[idx]
  form.provinceCode = province?.code || ''
  form.cityCode = ''
  form.districtCode = ''
}

function onCityChange(event) {
  const idx = Number(event.detail.value)
  const city = cityOptions.value[idx]
  form.cityCode = city?.code || ''
  form.districtCode = ''
}

function onDistrictChange(event) {
  const idx = Number(event.detail.value)
  const district = districtOptions.value[idx]
  form.districtCode = district?.code || ''
}

function onDefaultSwitchChange(event) {
  form.isDefault = Boolean(event?.detail?.value)
}

function onImportFromWeChat() {
  // #ifdef MP-WEIXIN
  if (submitting.value) return
  uni.chooseAddress({
    success: (res) => {
      form.receiverName = String(res.userName || '').trim()
      form.receiverPhone = String(res.telNumber || '')
        .replace(/\D/g, '')
        .slice(0, 11)
      form.detailAddress = String(res.detailInfo || '').trim()

      const rawNational = String(res.nationalCode || '').replace(/\D/g, '')
      let codes =
        rawNational.length === 6
          ? resolveRegionCodesByDistrict(rawNational)
          : { provinceCode: '', cityCode: '', districtCode: '' }
      if (!codes.districtCode) {
        codes = resolveRegionCodesByNames(
          res.provinceName,
          res.cityName,
          res.countyName
        )
      }
      if (codes.districtCode) {
        form.provinceCode = codes.provinceCode
        form.cityCode = codes.cityCode
        form.districtCode = codes.districtCode
        uni.showToast({ title: '已导入', icon: 'success' })
      } else {
        form.provinceCode = ''
        form.cityCode = ''
        form.districtCode = ''
        uni.showToast({
          title: '已填入信息，请手动选择省市区',
          icon: 'none'
        })
      }
    },
    fail: (err) => {
      const msg = (err && (err.errMsg || err.message)) || ''
      if (msg.includes('auth deny') || msg.includes('cancel')) return
      uni.showToast({ title: '未获取微信地址', icon: 'none' })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '仅微信小程序支持', icon: 'none' })
  // #endif
}

function validateForm() {
  const phoneReg = /^1[3-9]\d{9}$/
  if (!form.receiverName.trim()) {
    uni.showToast({ title: '请填写收件人', icon: 'none' })
    return false
  }
  if (!form.receiverPhone.trim()) {
    uni.showToast({ title: '请填写手机号', icon: 'none' })
    return false
  }
  if (!phoneReg.test(form.receiverPhone.trim())) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return false
  }
  if (!form.provinceCode || !form.cityCode || !form.districtCode) {
    uni.showToast({ title: '请选择省市区', icon: 'none' })
    return false
  }
  if (!form.detailAddress.trim()) {
    uni.showToast({ title: '请填写详细地址', icon: 'none' })
    return false
  }
  return true
}

function buildPayload() {
  return {
    receiverName: form.receiverName,
    receiverPhone: form.receiverPhone,
    provinceCode: form.provinceCode,
    provinceName: selectedProvinceName.value,
    cityCode: form.cityCode,
    cityName: selectedCityName.value,
    districtCode: form.districtCode,
    districtName: selectedDistrictName.value,
    detailAddress: form.detailAddress,
    isDefault: form.isDefault
  }
}

async function onSubmit() {
  if (submitting.value) return
  if (!validateForm()) return
  submitting.value = true
  try {
    const payload = buildPayload()
    let savedId = ''
    if (editingId.value) {
      const updated = await updateAddress(editingId.value, payload)
      savedId = updated?.id || editingId.value
    } else {
      const created = await createAddress(payload)
      savedId = created?.id || ''
    }
    if (form.isDefault && savedId) {
      await setDefaultAddress(savedId)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 400)
  } catch (err) {
    uni.showToast({
      title: formatAddressApiError(
        err,
        editingId.value ? '编辑失败，请重试' : '新增失败，请重试'
      ),
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss">
.address-edit-page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 24rpx;
  box-sizing: border-box;
}

.form-card {
  background: #fff;
  border-radius: 18rpx;
  padding: 0 24rpx;
}

.form-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f2f2f2;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 14rpx;
}

.input,
.textarea {
  width: 100%;
  font-size: 28rpx;
  color: #111;
}

.textarea {
  height: 130rpx;
}

.wechat-import {
  border-bottom: 1rpx solid #f2f2f2;
}

.import-btn {
  width: 100%;
  font-size: 28rpx;
  border-radius: 12rpx;
  background: #f0f9f6;
  color: #02b282;
  border: 1rpx solid #b8e6d6;
}

.import-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
  line-height: 1.4;
}

.picker-item .picker-group {
  display: flex;
  gap: 12rpx;
}

.picker {
  flex: 1;
  background: #f7f8fa;
  border-radius: 10rpx;
}

.picker-value {
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  font-size: 24rpx;
  color: #333;
  padding: 0 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-item .label {
  margin-bottom: 0;
}

.footer {
  margin-top: 32rpx;
}

.submit-btn {
  width: 100%;
  background: #02b282;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
}

.submit-btn[disabled] {
  background: #b8d9d0;
}
</style>

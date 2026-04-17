<template>
  <view class="page">
    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="errorMsg" class="state err">{{ errorMsg }}</view>
    <scroll-view v-else scroll-y class="scroll" :scroll-with-animation="true">
      <rich-text class="rich" :nodes="bodyNodes" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { fetchLegalDocumentBody } from '../../../utils/legalPublishedApi.js'
import { toastResultError } from '../../../utils/api-error.js'

const loading = ref(true)
const errorMsg = ref('')
const bodyNodes = ref('')

onLoad((options) => {
  const id = options?.id || ''
  if (!id) {
    errorMsg.value = '缺少文档参数'
    loading.value = false
    return
  }
  load(id)
})

async function load(documentId) {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchLegalDocumentBody(documentId)
    const title = data?.title || '协议'
    uni.setNavigationBarTitle({ title })
    bodyNodes.value = data?.body || ''
  } catch (err) {
    toastResultError(err, { fallback: '加载失败' })
    errorMsg.value = err?.message || '加载失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
}
.scroll {
  height: 100vh;
  padding: 24rpx 32rpx 48rpx;
  box-sizing: border-box;
}
.rich {
  font-size: 28rpx;
  line-height: 1.65;
  color: #333;
}
.state {
  padding: 80rpx 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
}
.state.err {
  color: #c00;
}
</style>

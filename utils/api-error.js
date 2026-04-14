/** 与后端 ErrorCode 对齐：微信 getPhoneNumber 前置条件不满足等 */
export const WX_PHONE_PRECONDITION_CODE = 1010

const WX_PHONE_PRECONDITION_HINT =
  '当前环境无法获取手机号，请在真机或满足微信前置条件后重试'

/**
 * @param {object} err - request 失败时 reject 的 Result 形态 { code, message }
 * @param {{ fallback?: string }} [options]
 */
export function toastResultError(err, options = {}) {
  const fallback = options.fallback || '操作失败，请重试'
  const code = err?.code
  const raw = err?.message || fallback
  if (code === WX_PHONE_PRECONDITION_CODE) {
    uni.showToast({
      title: WX_PHONE_PRECONDITION_HINT,
      icon: 'none',
      duration: 3500
    })
    return
  }
  uni.showToast({ title: raw, icon: 'none' })
}

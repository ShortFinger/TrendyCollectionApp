import { request, setTokens, clearTokens, API_BASE } from './request.js'
import { setUser, getUser, clearUser } from '../store/user.js'

/** 运维在服务端 wx.miniapp.apps 配置的 key，非微信 appId（请求头 X-Mini-App-Key） */
export const WX_MINI_APP_KEY = 'wxmini2f1e'

/**
 * 登录接口可能返回「需首登成套同意」：无 accessToken，仅 legalSessionToken。
 * 须再调 POST /auth/legal/accept 写入同意并换取双 Token，否则本地无 token，会再次被踢回登录页。
 */
async function applyLoginResponse(data) {
  if (data?.requiresLegalAcceptance && data?.legalSessionToken) {
    const next = await request({
      url: '/auth/legal/accept',
      method: 'POST',
      header: { 'X-Legal-Session': data.legalSessionToken }
    })
    if (!next?.accessToken || !next?.refreshToken) {
      throw new Error('协议同意后未返回令牌')
    }
    setTokens(next.accessToken, next.refreshToken)
    setUser(next.user)
    return next
  }
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error('登录未返回令牌')
  }
  setTokens(data.accessToken, data.refreshToken)
  setUser(data.user)
  return data
}

export async function login() {
  let loginRes
  try {
    loginRes = await uni.login({ provider: 'weixin' })
  } catch (e) {
    throw new Error('wx.login failed')
  }
  const data = await request({
    url: '/auth/login',
    method: 'POST',
    data: { code: loginRes.code },
    header: { 'X-Mini-App-Key': WX_MINI_APP_KEY }
  })
  const finalRes = await applyLoginResponse(data)
  return finalRes.user
}

/** 一步登录：需先通过 button open-type="getPhoneNumber" 取得 phoneCode，再调用本方法（内部会 wx.login） */
export async function loginWithPhone(phoneCode) {
  let loginRes
  try {
    loginRes = await uni.login({ provider: 'weixin' })
  } catch (e) {
    throw new Error('wx.login failed')
  }
  const data = await request({
    url: '/auth/loginWithPhone',
    method: 'POST',
    data: { loginCode: loginRes.code, phoneCode },
    header: { 'X-Mini-App-Key': WX_MINI_APP_KEY }
  })
  const finalRes = await applyLoginResponse(data)
  return finalRes.user
}

export async function fetchMe() {
  const data = await request({ url: '/auth/me' })
  setUser(data)
  return data
}

export async function logout() {
  const refreshToken = uni.getStorageSync('refreshToken')
  clearTokens()
  clearUser()
  if (refreshToken) {
    try {
      await uni.request({
        url: `${API_BASE.user}/auth/logout`,
        method: 'POST',
        data: { refreshToken },
        header: { 'Content-Type': 'application/json' }
      })
    } catch (e) { /* token will expire naturally */ }
  }
}

export async function bindPhone(code) {
  const data = await request({
    url: '/auth/bindPhone',
    method: 'POST',
    data: { code },
    header: { 'X-Mini-App-Key': WX_MINI_APP_KEY }
  })
  setUser(data)
  return data
}

export async function updateProfile(nickName, avatarUrl) {
  const data = await request({
    url: '/auth/profile',
    method: 'PUT',
    data: { nickName, avatarUrl }
  })
  setUser(data)
  return data
}

export function requirePhone() {
  const user = getUser()
  if (user && user.phone) return Promise.resolve()
  return new Promise((resolve, reject) => {
    uni.navigateTo({
      url: '/pages/phone-bind/index',
      events: {
        onBound: () => resolve(),
        onCancel: () => reject(new Error('用户取消授权'))
      }
    })
  })
}

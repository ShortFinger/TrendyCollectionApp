import { request, setTokens, clearTokens, API_BASE } from './request.js'
import { setUser, getUser, clearUser } from '../store/user.js'

/** 运维在服务端 wx.miniapp.apps 配置的 key，非微信 appId（请求头 X-Mini-App-Key） */
export const WX_MINI_APP_KEY = 'wxmini2f1e'

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
  setTokens(data.accessToken, data.refreshToken)
  setUser(data.user)
  return data.user
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

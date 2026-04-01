// 多服务 base URL 配置
const API_BASE = {
  user: 'http://localhost:8083/user-api',
  order: 'http://localhost:8081/client-api',
  app: 'http://localhost:8080/app-api'
}
const DEFAULT_BASE = API_BASE.user

let isRefreshing = false
let pendingRequests = []

function getToken() {
  return uni.getStorageSync('accessToken') || ''
}

function getRefreshToken() {
  return uni.getStorageSync('refreshToken') || ''
}

function setTokens(accessToken, refreshToken) {
  uni.setStorageSync('accessToken', accessToken)
  uni.setStorageSync('refreshToken', refreshToken)
}

function clearTokens() {
  uni.removeStorageSync('accessToken')
  uni.removeStorageSync('refreshToken')
}

async function refreshToken() {
  const rt = getRefreshToken()
  if (!rt) throw new Error('No refresh token')
  const res = await uni.request({
    url: `${API_BASE.user}/auth/refresh`,
    method: 'POST',
    data: { refreshToken: rt },
    header: { 'Content-Type': 'application/json' }
  })
  if (res.statusCode === 200 && res.data.code === 0) {
    const { accessToken, refreshToken } = res.data.data
    setTokens(accessToken, refreshToken)
    return accessToken
  }
  throw new Error('Refresh failed')
}

function retryPending(token) {
  pendingRequests.forEach(cb => cb(token))
  pendingRequests = []
}

function rejectPending(err) {
  pendingRequests.forEach(cb => cb(null, err))
  pendingRequests = []
}

export function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header = { 'Content-Type': 'application/json', ...options.header }
    if (token) header['Authorization'] = `Bearer ${token}`

    const fullUrl = options.url.startsWith('http') ? options.url : `${options.base || DEFAULT_BASE}${options.url}`

    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: async (res) => {
        if (res.statusCode === 401) {
          if (!isRefreshing) {
            isRefreshing = true
            try {
              const newToken = await refreshToken()
              isRefreshing = false
              retryPending(newToken)
              header['Authorization'] = `Bearer ${newToken}`
              uni.request({
                url: fullUrl, method: options.method || 'GET', data: options.data, header,
                success: (retryRes) => {
                  if (retryRes.data.code === 0) resolve(retryRes.data.data)
                  else reject(retryRes.data)
                },
                fail: reject
              })
            } catch (err) {
              isRefreshing = false
              rejectPending(err)
              clearTokens()
              const { login } = require('./auth.js')
              try {
                await login()
                const retryToken = getToken()
                header['Authorization'] = `Bearer ${retryToken}`
                uni.request({
                  url: fullUrl, method: options.method || 'GET', data: options.data, header,
                  success: (retryRes) => {
                    if (retryRes.data.code === 0) resolve(retryRes.data.data)
                    else reject(retryRes.data)
                  },
                  fail: reject
                })
              } catch (loginErr) { reject(loginErr) }
            }
          } else {
            pendingRequests.push((newToken, err) => {
              if (err) return reject(err)
              header['Authorization'] = `Bearer ${newToken}`
              uni.request({
                url: fullUrl, method: options.method || 'GET', data: options.data, header,
                success: (retryRes) => {
                  if (retryRes.data.code === 0) resolve(retryRes.data.data)
                  else reject(retryRes.data)
                },
                fail: reject
              })
            })
          }
        } else if (res.data.code === 0) {
          resolve(res.data.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}

export { API_BASE, DEFAULT_BASE, getToken, getRefreshToken, setTokens, clearTokens }

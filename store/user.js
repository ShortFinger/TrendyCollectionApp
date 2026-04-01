import { reactive } from 'vue'

const state = reactive({
  user: null,
  isLoggedIn: false
})

let _loginResolve = null
let _loginReady = null

function resetLoginReady() {
  _loginReady = new Promise((resolve) => { _loginResolve = resolve })
}

resetLoginReady()

function getLoginReady() { return _loginReady }

function setUser(user) {
  state.user = user
  state.isLoggedIn = true
  if (_loginResolve) { _loginResolve(); _loginResolve = null }
}

function getUser() { return state.user }

function clearUser() {
  state.user = null
  state.isLoggedIn = false
  resetLoginReady()
}

export { state, getLoginReady, setUser, getUser, clearUser }

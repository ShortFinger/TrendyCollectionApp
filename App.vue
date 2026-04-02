<script>
	import { fetchMe } from './utils/auth.js'
	import { getToken, clearTokens } from './utils/request.js'
	import { clearUser } from './store/user.js'

	export default {
		onLaunch: function() {
			console.log('App Launch')
			this.initAuth()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			async initAuth() {
				try {
					const token = getToken()
					if (token) {
						// token 存在：校验并拉取用户信息
						await fetchMe()
					} else {
						// 无 token：不静默登录（允许用户继续使用公共功能）
					}
				} catch (err) {
					// token 失效/无效：清理本地 token/user（但不强制导航登录页）
					clearTokens()
					clearUser()
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>

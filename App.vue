<script>
	import { login, fetchMe } from './utils/auth.js'
	import { getToken } from './utils/request.js'

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
					if (getToken()) {
						await fetchMe()
					} else {
						await login()
					}
				} catch (err) {
					console.error('Auth init failed:', err)
					try {
						await login()
					} catch (e) {
						console.error('Login failed:', e)
					}
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>

import { useLoginUserStore } from '@/stores/loginUser.ts'
import { message } from 'ant-design-vue'
import router from '@/router'

let firstFetchLoginUser = true;

router.beforeEach(async (to, from, next) => {
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser

  if (firstFetchLoginUser) {
    try {
      await loginUserStore.fetchLoginUser()
    } catch (e) {
      // 登录失效、请求失败都不影响进入主页
      console.warn('获取登录用户失败：', e)
    }
    loginUser = loginUserStore.loginUser
    firstFetchLoginUser = false
  }

  const toUrl = to.fullPath

  // 管理员权限校验
  if (toUrl.startsWith('/admin')) {
    if (!loginUser || loginUser.userRole !== 'admin') {
      message.error('没有权限')
      next(`/user/login?redirect=${to.fullPath}`)
      return
    }
  }

  next()
})

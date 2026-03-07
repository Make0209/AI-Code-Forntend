// useLoginUserStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
// @ts-ignore
import { getLoginUser, userLogout } from '@/api/UserController.ts'

export const useLoginUserStore = defineStore('loginUser', () => {
  const loginUser = ref<API.LoginUserVO>({
    userName: '未登录',
  })

  /**
   * 获取当前登录用户
   */
  async function fetchLoginUser() {
    const res = await getLoginUser()
    if (res.data.code === 0 && res.data.data) {
      loginUser.value = res.data.data
    }
  }

  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser
    // 保存 JWT token 到 localStorage
    if (newLoginUser.token) {
      localStorage.setItem('token', newLoginUser.token)
    }
    // 保存 Sa-Token 空间权限 token 到 localStorage
    // if (newLoginUser.spaceToken) {
    //   localStorage.setItem('spaceToken', newLoginUser.spaceToken)
    // }
  }

  /**
   * 退出登录
   */
  async function logout() {
    // 调用后端登出接口，清除后端登录状态
    try {
      await userLogout()
    } catch (e) {
      console.warn('后端登出接口调用失败:', e)
    }
    loginUser.value = { userName: '未登录' }
    localStorage.removeItem('token')
    localStorage.removeItem('spaceToken')
  }

  return { loginUser, setLoginUser, fetchLoginUser, logout }
})

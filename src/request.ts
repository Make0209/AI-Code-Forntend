import axios from 'axios'
import { message } from 'ant-design-vue'

// 区分开发和生产环境
const DEV_BASE_URL = 'http://localhost:8123/api'
const PROD_BASE_URL = '/api'

const myAxios = axios.create({
  baseURL: DEV_BASE_URL,
  timeout: 60000,
})

// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem('token')
    if (token) {
      // 将 JWT token 添加到请求头，用于身份认证
      config.headers['Authorization'] = `Bearer ${token}`
    } else {
      console.warn('⚠️ Token 不存在！')
    }
    // 将 Sa-Token 空间权限 token 添加到请求头，用于团队空间权限校验
    const spaceToken = localStorage.getItem('spaceToken')
    if (spaceToken) {
      config.headers['space-token'] = spaceToken
    }
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

// 全局响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    const { data } = response
    // 未登录
    if (data.code === 40100 && data.message === '未登录') {
      // 不是获取用户信息的请求，并且用户目前不是已经在用户登录页面，则跳转到登录页面
      if (
        !response.request.responseURL.includes('user/get/login') &&
        !window.location.pathname.includes('/user/login')
      ) {
        message
          .warning('请先登录')
          .then(() => (window.location.href = `/user/login?redirect=${window.location.href}`))
      }
    }
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)

export const request = myAxios

import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import UserLoginPage from '@/pages/user/UserLoginPage.vue'
import UserRegisterPage from '@/pages/user/UserRegisterPage.vue'
import UserManagePage from '@/pages/admin/UserManagePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '主页',
      component: HomePage,
    },
    {
      path: '/user/login',
      name: '用户登录',
      component: UserLoginPage,
      meta: { hideHeader: true }, // 隐藏 Header
    },
    {
      path: '/user/register',
      name: '用户注册',
      component: UserRegisterPage,
      meta: { hideHeader: true }, // 隐藏 Header
    },
    {
      path: '/admin/userManage',
      name: '用户管理',
      component: UserManagePage,
    },
  ],
})

export default router

<template>
  <a-layout-header class="header">
    <a-row :wrap="false" align="middle">
      <!-- 左侧：Logo和标题 -->
      <a-col flex="200px">
        <RouterLink to="/">
          <div class="header-left">
            <div class="logo-icon">/&gt;</div>
            <h1 class="site-title" :class="{ 'dark-text': isDark }">AI Code Generator</h1>
          </div>
        </RouterLink>
      </a-col>
      <!-- 中间：导航菜单 -->
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="horizontal"
          :items="menuItems"
          @click="handleMenuClick"
        />
      </a-col>
      <!-- 右侧：主题切换和登录状态 -->
      <a-col>
        <div class="header-right">
          <!-- 主题切换按钮 -->
          <div class="theme-switcher">
            <ThemeToggle />
          </div>
          <!-- 用户登录状态 -->
          <div class="user-login-status">
            <div v-if="loginUserStore.loginUser.id">
              <a-dropdown>
                <a-space>
                  <a-avatar :src="loginUserStore.loginUser.userAvatar" />
                  {{ loginUserStore.loginUser.userName ?? '无名' }}
                </a-space>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="doLogout">
                      <LogoutOutlined />
                      退出登录
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>

            <div v-else>
              <a-button type="primary" @click="goToLogin">登录</a-button>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>
  </a-layout-header>
</template>

<script setup lang="ts">
import { h, ref, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { type MenuProps, message } from 'ant-design-vue'
import { LogoutOutlined, HomeOutlined } from '@ant-design/icons-vue'
import { TeamOutlined, FolderOpenOutlined,  } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { userLogout } from '@/api/userController.ts'
import ThemeToggle from '@/components/ThemeToggle.vue'

const loginUserStore = useLoginUserStore()
const router = useRouter()

// 注入主题状态
const currentTheme = inject<any>('currentTheme', ref('light'))
const isDark = computed(() => currentTheme.value === 'dark')

// 当前选中菜单
const selectedKeys = ref<string[]>(['/'])
// 监听路由变化，更新当前选中菜单
router.afterEach((to) => {
  selectedKeys.value = [to.path]
})

// 用户注销
const doLogout = async () => {
  const res = await userLogout()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    // 使用 replace 替换当前历史记录，防止用户返回
    await router.replace('/')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/user/login')
}

// 菜单配置项
// 菜单配置项
const originItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/admin/userManage',
    icon: () => h(TeamOutlined),
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/appManage',
    icon: () => h(FolderOpenOutlined),
    label: '应用管理',
    title: '应用管理',
  },
]

// 过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    const menuKey = menu?.key as string
    if (menuKey?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const menuItems = computed<MenuProps['items']>(() => filterMenus(originItems))

// 处理菜单点击
const handleMenuClick: MenuProps['onClick'] = (e) => {
  const key = e.key as string
  selectedKeys.value = [key]
  // 跳转到对应页面
  if (key.startsWith('/')) {
    router.push(key)
  }
}
</script>

<style scoped>
/* 修复 Header 布局对齐 */
.header {
  line-height: 64px; /* 明确指定高度 */
  height: 64px;
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px; /* 与父级一致 */
}

.site-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
  line-height: 64px;
}

/* 核心修复：强制菜单项高度充满 Header */
:deep(.ant-menu-horizontal) {
  line-height: 64px !important;
  border-bottom: none !important;
}

:deep(.ant-menu-item),
:deep(.ant-menu-submenu) {
  height: 64px !important;
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center; /* 确保垂直居中 */
  gap: 20px;
  height: 64px;
}

/* 确保主题切换器也居中 */
.theme-switcher {
  display: flex;
  align-items: center;
  height: 100%;
}

.user-login-status {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo-icon {
  font-family: 'Courier New', Courier, monospace;
  font-size: 28px;
  color: #4096ff;
  font-weight: bold;
}
</style>

<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { theme as antdTheme } from 'ant-design-vue'
import BasicLayout from '@/layouts/BasicLayout.vue'
import { healthCheck } from '@/api/healthCheckController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'

// 健康检查
healthCheck().then((res) => {
  console.log(res)
})

// 获取登录用户
const loginUserStore = useLoginUserStore()
loginUserStore.fetchLoginUser()

// 主题状态管理
const currentTheme = ref<'light' | 'dark'>('light')

// 从 localStorage 读取主题
const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
if (savedTheme) {
  currentTheme.value = savedTheme
}

// 提供主题给所有子组件
provide('currentTheme', currentTheme)

// 监听主题变化，保存到 localStorage
watch(currentTheme, (newTheme) => {
  localStorage.setItem('theme', newTheme)
})

// 动态主题配置 - 使用 Ant Design Vue 的主题算法
const themeConfig = computed(() => ({
  algorithm: currentTheme.value === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
}))
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <div :class="['app-container', currentTheme === 'dark' ? 'dark-theme' : 'light-theme']">
      <BasicLayout />
    </div>
  </a-config-provider>
</template>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
}

.app-container {
  min-height: 100vh;
  transition:
    background-color 0.3s,
    color 0.3s;
}

/* 浅色主题 */
.light-theme {
  background-color: #f5f5f5;
  color: #000;
}

/* 深色主题 */
.dark-theme {
  background-color: #141414;
  color: #fff;
}

/* Header 深色模式适配 */
.dark-theme .ant-layout-header,
.dark-theme #globalHeader {
  background: #1f1f1f !important;
}

.dark-theme .header {
  background: #1f1f1f !important;
}

/* Menu 深色模式适配 */
.dark-theme .ant-menu-horizontal {
  background: #1f1f1f !important;
  border-bottom: 1px solid #303030;
}

.dark-theme .ant-menu-item {
  color: rgba(255, 255, 255, 0.85) !important;
}

.dark-theme .ant-menu-item:hover {
  color: #fff !important;
}

.dark-theme .ant-menu-item-selected {
  color: #1890ff !important;
}

/* Footer 深色模式适配 */
.dark-theme .ant-layout-footer {
  background: #1f1f1f !important;
  color: rgba(255, 255, 255, 0.85);
}

/* 通用文本颜色适配 */
.dark-theme .title,
.dark-theme .desc,
.dark-theme .tips {
  transition: color 0.3s;
}

.dark-theme .title {
  color: rgba(255, 255, 255, 0.85) !important;
}

.dark-theme .desc,
.dark-theme .tips {
  color: rgba(255, 255, 255, 0.65) !important;
}

/* HomePage 深色模式适配 */
.dark-theme .description {
  color: rgba(255, 255, 255, 0.65) !important;
}

.dark-theme .features h2 {
  color: rgba(255, 255, 255, 0.85) !important;
}

.dark-theme .feature-icon {
  color: #1890ff !important;
}
body,
*,
*::before,
*::after {
  font-family: 'HarmonyOS Sans SC', 'HarmonyOS Sans', sans-serif !important;
}
</style>

<template>
  <a-layout class="basic-layout">
    <!-- 顶部导航栏 - 根据路由 meta 信息控制显示 -->
    <GlobalHeader v-if="!hideHeader" />
    <!-- 主要内容区域 -->
    <a-layout-content class="main-content">
      <router-view />
    </a-layout-content>
    <!-- 底部版权信息 - 根据路由 meta 信息控制显示 -->
    <GlobalFooter v-if="!hideHeader" />
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'

const route = useRoute()

// 是否隐藏 Header 和 Footer
const hideHeader = computed(() => route.meta.hideHeader === true)
</script>

<style scoped>
.basic-layout {
  min-height: 100vh;
}

.main-content {
  width: 100%;
  padding: 0;
  margin: 0;
}
</style>

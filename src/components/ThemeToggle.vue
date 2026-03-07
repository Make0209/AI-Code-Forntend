<template>
  <a-switch
    class="theme-toggle"
    :checked-value="'dark'"
    :un-checked-value="'light'"
    v-model:checked="themeValue"
    checked-children="🌙"
    un-checked-children="☀️"
    :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'"
  />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'

// 注入主题状态
const currentTheme = inject<any>('currentTheme')

// 计算属性，用于双向绑定
const themeValue = computed({
  get: () => currentTheme.value,
  set: (value: string) => {
    currentTheme.value = value
  },
})

const isDarkMode = computed(() => currentTheme.value === 'dark')
</script>

<style scoped>
.theme-toggle {
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  transform: scale(1.05);
}

:deep(.ant-switch) {
  background: rgba(0, 0, 0, 0.25);
  transition: background 0.3s ease;
}

:deep(.ant-switch-checked) {
  background: #1890ff;
}
</style>

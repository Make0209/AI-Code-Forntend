<script setup lang="ts">
import { CheckCircleOutlined, ThunderboltOutlined, SkinOutlined } from '@ant-design/icons-vue'
import { inject, computed } from 'vue'

// 注入主题状态
const currentTheme = inject<any>('currentTheme')
const isDarkMode = computed(() => currentTheme?.value === 'dark')
</script>

<template>
  <div class="home-page">
    <a-card title="欢迎使用鱼皮 AI 应用生成平台" class="welcome-card">
      <p class="description">
        不写一行代码，生成完整应用。支持深色/浅色模式切换，点击右上角图标即可切换主题。
      </p>
      
      <a-divider />
      
      <div class="features">
        <h2>主要功能</h2>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-card size="small" class="feature-card">
              <template #title>
                <CheckCircleOutlined class="feature-icon" />
                快速生成
              </template>
              <p>输入需求描述，AI 自动生成完整的应用代码</p>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small" class="feature-card">
              <template #title>
                <ThunderboltOutlined class="feature-icon" />
                高效开发
              </template>
              <p>节省重复劳动时间，专注于核心业务逻辑</p>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small" class="feature-card">
              <template #title>
                <SkinOutlined class="feature-icon" />
                主题切换
              </template>
              <p>支持深色/浅色模式，当前模式：{{ isDarkMode ? '深色' : '浅色' }}</p>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 24px auto;
  padding: 0 24px;
}

.welcome-card {
  transition: background 0.3s ease;
}

.description {
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  line-height: 1.8;
  transition: color 0.3s ease;
}

.features {
  margin-top: 24px;
}

.features h2 {
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 16px;
  transition: color 0.3s ease;
}

.feature-card {
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  color: #1890ff;
  font-size: 20px;
  margin-right: 8px;
  transition: color 0.3s ease;
}
</style>

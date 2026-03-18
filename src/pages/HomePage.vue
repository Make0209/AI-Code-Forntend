<script setup lang="ts">
import { ref, reactive, onMounted, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  CheckCircleOutlined,
  ThunderboltOutlined,
  SkinOutlined,
  SendOutlined,
} from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import { addApp, listMyAppVoByPage, listGoodAppVoByPage } from '@/api/appController'
import { getDeployUrl } from '@/config/env'
import AppCard from '@/components/AppCard.vue'

// --- 1. 基础状态与主题注入 (来自旧文件) ---
const currentTheme = inject<any>('currentTheme')
const isDarkMode = computed(() => currentTheme?.value === 'dark')

const router = useRouter()
const loginUserStore = useLoginUserStore()

// --- 2. 核心业务逻辑 (来自新文件) ---
const userPrompt = ref('')
const creating = ref(false)

// 我的应用数据
const myApps = ref<API.AppVO[]>([])
const myAppsPage = reactive({
  current: 1,
  pageSize: 6,
  total: 0,
})

// 精选应用数据
const featuredApps = ref<API.AppVO[]>([])
const featuredAppsPage = reactive({
  current: 1,
  pageSize: 6,
  total: 0,
})

const setPrompt = (prompt: string) => {
  userPrompt.value = prompt
}

// 创建应用
const createApp = async () => {
  if (!userPrompt.value.trim()) {
    message.warning('请输入应用描述')
    return
  }
  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    await router.push('/user/login')
    return
  }

  creating.value = true
  try {
    const res = await addApp({ initPrompt: userPrompt.value.trim() })
    if (res.data.code === 0 && res.data.data) {
      message.success('应用创建成功')
      const appId = String(res.data.data)
      await router.push(`/app/chat/${appId}`)
    } else {
      message.error('创建失败：' + res.data.message)
    }
  } catch (error) {
    message.error('创建失败，请重试')
  } finally {
    creating.value = false
  }
}

// 加载数据
const loadMyApps = async () => {
  if (!loginUserStore.loginUser.id) return
  try {
    const res = await listMyAppVoByPage({
      pageNum: myAppsPage.current,
      pageSize: myAppsPage.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
    })
    if (res.data.code === 0 && res.data.data) {
      myApps.value = res.data.data.records || []
      myAppsPage.total = res.data.data.totalRow || 0
    }
  } catch (e) {}
}

const loadFeaturedApps = async () => {
  try {
    const res = await listGoodAppVoByPage({
      pageNum: featuredAppsPage.current,
      pageSize: featuredAppsPage.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
    })
    if (res.data.code === 0 && res.data.data) {
      featuredApps.value = res.data.data.records || []
      featuredAppsPage.total = res.data.data.totalRow || 0
    }
  } catch (e) {}
}

const viewChat = (appId: string | number | undefined) => {
  if (appId) router.push(`/app/chat/${appId}?view=1`)
}

const viewWork = (app: API.AppVO) => {
  if (app.deployKey) {
    const url = getDeployUrl(app.deployKey)
    window.open(url, '_blank')
  }
}

onMounted(() => {
  loadMyApps()
  loadFeaturedApps()

  // 鼠标跟随光效
  const handleMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    document.documentElement.style.setProperty('--mouse-x', `${(clientX / innerWidth) * 100}%`)
    document.documentElement.style.setProperty('--mouse-y', `${(clientY / innerHeight) * 100}%`)
  }
  document.addEventListener('mousemove', handleMouseMove)
  return () => document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div id="homePage" :class="{ 'is-dark': isDarkMode }">
    <div class="container">
      <div class="hero-section">
        <h1 class="hero-title"> AI 应用生成平台</h1>
        <p class="hero-description">
          {{ isDarkMode ? '正在使用深色模式 - 沉浸式开发体验' : '不写一行代码，生成完整应用' }}
        </p>
      </div>

      <div class="input-section">
        <a-textarea
          v-model:value="userPrompt"
          placeholder="输入您的需求，例如：帮我创建一个精美的个人博客网站"
          :rows="4"
          class="prompt-input"
        />
        <div class="input-actions">
          <a-button
            type="primary"
            size="large"
            @click="createApp"
            :loading="creating"
            shape="circle"
          >
            <template #icon><SendOutlined /></template>
          </a-button>
        </div>
      </div>

      <div class="quick-actions">
        <a-button
          @click="
            setPrompt(
              '创建一个现代化的个人博客网站，包含文章列表、详情页、分类标签、搜索功能、评论系统和个人简介页面。采用简洁的设计风格，支持响应式布局，文章支持Markdown格式，首页展示最新文章和热门推荐。',
            )
          "
          >个人博客</a-button
        >
        <a-button
          @click="
            setPrompt(
              '设计一个专业的企业官网，包含公司介绍、产品服务展示、新闻资讯、联系我们等页面。采用商务风格的设计，包含轮播图、产品展示卡片、团队介绍、客户案例展示，支持多语言切换和在线客服功能。',
            )
          "
          >企业官网</a-button
        >
        <a-button
          @click="
            setPrompt(
              '构建一个功能完整的在线商城，包含商品展示、购物车、用户注册登录、订单管理、支付结算等功能。设计现代化的商品卡片布局，支持商品搜索筛选、用户评价、优惠券系统和会员积分功能。',
            )
          "
          >在线商城</a-button
        >
        <a-button
          @click="
            setPrompt(
              '制作一个精美的作品展示网站，适合设计师、摄影师、艺术家等创作者。包含作品画廊、项目详情页、个人简历、联系方式等模块。采用瀑布流或网格布局展示作品，支持图片放大预览和作品分类筛选。',
            )
          "
          >作品展示</a-button
        >
      </div>

      <div class="section core-features">
        <a-row :gutter="16">
          <a-col :xs="24" :md="8">
            <div class="feature-item">
              <CheckCircleOutlined class="f-icon" />
              <h3>快速生成</h3>
              <p>输入描述，AI 自动完成代码编写</p>
            </div>
          </a-col>
          <a-col :xs="24" :md="8">
            <div class="feature-item">
              <ThunderboltOutlined class="f-icon" />
              <h3>高效开发</h3>
              <p>专注于业务逻辑，拒绝重复劳动</p>
            </div>
          </a-col>
          <a-col :xs="24" :md="8">
            <div class="feature-item">
              <SkinOutlined class="f-icon" />
              <h3>主题适配</h3>
              <p>支持深浅色模式切换，当前：{{ isDarkMode ? '深色' : '浅色' }}</p>
            </div>
          </a-col>
        </a-row>
      </div>

      <div class="section">
        <h2 class="section-title">我的作品</h2>
        <div class="app-grid">
          <AppCard
            v-for="app in myApps"
            :key="app.id"
            :app="app"
            @view-chat="viewChat"
            @view-work="viewWork"
          />
        </div>
        <div class="pagination-wrapper">
          <a-pagination
            v-model:current="myAppsPage.current"
            :total="myAppsPage.total"
            :page-size="myAppsPage.pageSize"
            @change="loadMyApps"
          />
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">精选案例</h2>
        <div class="featured-grid">
          <AppCard
            v-for="app in featuredApps"
            :key="app.id"
            :app="app"
            :featured="true"
            @view-chat="viewChat"
            @view-work="viewWork"
          />
        </div>
        <div class="pagination-wrapper">
          <a-pagination
            v-model:current="featuredAppsPage.current"
            :total="featuredAppsPage.total"
            :page-size="featuredAppsPage.pageSize"
            @change="loadFeaturedApps"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 基础背景 (浅色模式) --- */
#homePage {
  width: 100%;
  min-height: 100vh;
  transition: all 0.5s ease;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
  overflow: hidden;
}

/* --- 深色模式背景覆盖 --- */
#homePage.is-dark {
  background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
  color: #f8fafc;
}

/* 网格背景适配 */
#homePage::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}
#homePage.is-dark::before {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
}

/* 鼠标跟随动态光效 */
#homePage::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(59, 130, 246, 0.1),
    transparent 80%
  );
  pointer-events: none;
  z-index: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 60px; /* 底部留出足够空间避免被 footer 遮挡 */
  position: relative;
  z-index: 2;
}

/* 英雄区样式 */
.hero-section {
  text-align: center;
  padding: 60px 0;
}
.hero-title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}
.hero-description {
  font-size: 18px;
  color: #64748b;
}
.is-dark .hero-description {
  color: #94a3b8;
}

/* 输入框适配 */
.input-section {
  max-width: 800px;
  margin: 0 auto 32px;
  position: relative;
}
.prompt-input {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 16px 60px 16px 20px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}
.is-dark .prompt-input {
  background: rgba(30, 41, 59, 0.7);
  border-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.input-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
}

/* 快捷按钮 */
.quick-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 60px;
}
.quick-actions .ant-btn {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.is-dark .quick-actions .ant-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  border-color: rgba(255, 255, 255, 0.1);
}

/* 旧版功能卡片整合样式 */
.core-features {
  margin-bottom: 80px;
}
.feature-item {
  padding: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  transition: transform 0.3s;
}
.is-dark .feature-item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}
.feature-item:hover {
  transform: translateY(-5px);
}
.f-icon {
  font-size: 32px;
  color: #3b82f6;
  margin-bottom: 16px;
}
.feature-item h3 {
  margin-bottom: 8px;
  font-weight: 600;
}
.is-dark .feature-item h3 {
  color: #fff;
}

/* 列表区 */
.section-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  padding-left: 12px;
  border-left: 4px solid #3b82f6;
}
.is-dark .section-title {
  color: #f1f5f9;
}

.app-grid,
.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.pagination-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

/* 适配深色模式的分页器 */
:deep(.ant-pagination-item-active) {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}
.is-dark :deep(.ant-pagination-item a) {
  color: #94a3b8;
}
.is-dark :deep(.ant-pagination-item-active a) {
  color: #fff;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 28px;
  }
  .feature-item {
    margin-bottom: 16px;
  }
}
</style>

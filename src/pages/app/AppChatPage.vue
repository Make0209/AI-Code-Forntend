<template>
  <div id="appChatPage" :class="{ 'is-dark': isDarkMode }">
    <!-- 顶部栏 -->
    <div class="header-bar">
      <div class="header-left">
        <h1 class="app-name">{{ appInfo?.appName || '网站生成器' }}</h1>
        <a-tag v-if="appInfo?.codeGenType" color="blue" class="code-gen-type-tag">
          {{ formatCodeGenType(appInfo.codeGenType) }}
        </a-tag>
      </div>
      <div class="header-right" style="gap: 17px; display: flex">
        <a-button type="default" @click="showAppDetail">
          <template #icon>
            <InfoCircleOutlined />
          </template>
          应用详情
        </a-button>
        <a-button
          type="primary"
          ghost
          @click="downloadCode"
          :loading="downloading"
          :disabled="!isOwner"
        >
          <template #icon>
            <DownloadOutlined />
          </template>
          下载代码
        </a-button>
        <a-button type="primary" @click="deployApp" :loading="deploying">
          <template #icon>
            <CloudUploadOutlined />
          </template>
          部署按钮
        </a-button>
      </div>
    </div>

    <div class="main-content">
      <div class="chat-section">
        <div class="messages-container" ref="messagesContainer">
          <div v-if="hasMoreHistory" class="load-more-container">
            <a-button type="link" @click="loadMoreHistory" :loading="loadingHistory" size="small">
              加载更多历史消息
            </a-button>
          </div>

          <div v-for="(message, index) in messages" :key="index" class="message-item">
            <div v-if="message.type === 'user'" class="user-message">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-avatar">
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
              </div>
            </div>
            <div v-else class="ai-message">
              <div class="message-avatar">
                <a-avatar :src="currentAiAvatar" />
              </div>
              <div class="message-content">
                <MarkdownRenderer v-if="message.content" :content="message.content" />
                <div v-if="message.loading" class="loading-indicator">
                  <a-spin size="small" />
                  <span>AI 正在思考...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="input-container">
          <div class="input-wrapper">
            <a-textarea
              v-model:value="userInput"
              placeholder="请描述你想生成的网站..."
              :rows="4"
              :maxlength="1000"
              @keydown.enter.prevent="sendMessage"
              :disabled="isGenerating || (!isOwner && !isAdmin)"
            />
            <div class="input-actions">
              <a-button
                type="primary"
                @click="sendMessage"
                :loading="isGenerating"
                :disabled="!isOwner && !isAdmin"
              >
                <template #icon>
                  <SendOutlined />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <div class="preview-section">
        <div class="preview-header">
          <h3>生成后的网页展示</h3>
          <div class="preview-actions">
            <a-button v-if="previewUrl" type="link" @click="openInNewTab">
              <template #icon>
                <ExportOutlined />
              </template>
              新窗口打开
            </a-button>
          </div>
        </div>
        <div class="preview-content">
          <div v-if="!previewUrl && !isGenerating" class="preview-placeholder">
            <div class="placeholder-icon">🌐</div>
            <p>网站文件生成完成后将在这里展示</p>
          </div>
          <div v-else-if="isGenerating" class="preview-loading">
            <a-spin size="large" />
            <p>正在生成网站...</p>
          </div>
          <iframe
            v-else
            :src="previewUrl"
            class="preview-iframe"
            frameborder="0"
            @load="onIframeLoad"
          ></iframe>
        </div>
      </div>
    </div>

    <AppDetailModal
      v-model:open="appDetailVisible"
      :app="appInfo"
      :show-actions="isOwner || isAdmin"
      @edit="editApp"
      @delete="deleteApp"
    />

    <DeploySuccessModal
      v-model:open="deployModalVisible"
      :deploy-url="deployUrl"
      @open-site="openDeployedSite"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/loginUser'
import {
  deleteApp as deleteAppApi,
  deployApp as deployAppApi,
  getAppVoById,
} from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { CodeGenTypeEnum, formatCodeGenType } from '@/utils/codeGenTypes'
import { request } from '@/request'

import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import AppDetailModal from '@/components/AppDetailModal.vue'
import DeploySuccessModal from '@/components/DeploySuccessModal.vue'
import aiAvatar from '@/assets/aiAvatar.png'
import deepseekAvatar from '@/assets/deepseek-color.png'
import { API_BASE_URL, getStaticPreviewUrl } from '@/config/env'

import {
  CloudUploadOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  SendOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue'
import message from 'ant-design-vue/es/message'

const currentTheme = inject<any>('currentTheme')
const isDarkMode = computed(() => currentTheme?.value === 'dark')
const currentAiAvatar = computed(() => (isDarkMode.value ? deepseekAvatar : aiAvatar))

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const appInfo = ref<API.AppVO>()
const appId = ref<string>()

interface Message {
  type: 'user' | 'ai'
  content: string
  loading?: boolean
  createTime?: string
}

const messages = ref<Message[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement>()

const loadingHistory = ref(false)
const hasMoreHistory = ref(false)
const lastCreateTime = ref<string>()
const historyLoaded = ref(false)

const previewUrl = ref('')
const previewReady = ref(false)
const deploying = ref(false)
const deployModalVisible = ref(false)
const deployUrl = ref('')

const isOwner = computed(() => appInfo.value?.userId === loginUserStore.loginUser.id)
const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')
const appDetailVisible = ref(false)

const showAppDetail = () => {
  appDetailVisible.value = true
}

const loadChatHistory = async (isLoadMore = false) => {
  if (!appId.value || loadingHistory.value) return
  loadingHistory.value = true
  try {
    const params: any = { appId: appId.value, pageSize: 10 }
    if (isLoadMore && lastCreateTime.value) params.lastCreateTime = lastCreateTime.value
    const res = await listAppChatHistory(params)
    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records || []
      const historyMessages: Message[] = records
        .map((chat: any) => ({
          type: chat.messageType === 'user' ? 'user' : 'ai',
          content: chat.message || '',
          createTime: chat.createTime,
        }))
        .reverse()
      if (isLoadMore) messages.value.unshift(...historyMessages)
      else messages.value = historyMessages
      lastCreateTime.value = records[records.length - 1]?.createTime
      hasMoreHistory.value = records.length === 10
      historyLoaded.value = true
    }
  } finally {
    loadingHistory.value = false
  }
}

const loadMoreHistory = () => loadChatHistory(true)

const fetchAppInfo = async () => {
  const id = route.params.id as string
  if (!id) return router.push('/')
  appId.value = id
  try {
    const res = await getAppVoById({ id: id as any })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data
      await loadChatHistory()
      if (messages.value.length >= 2) updatePreview()
      if (
        appInfo.value.initPrompt &&
        isOwner.value &&
        messages.value.length === 0 &&
        historyLoaded.value
      ) {
        await sendInitialMessage(appInfo.value.initPrompt)
      }
    }
  } catch (e) {
    await router.push('/')
  }
}

const sendInitialMessage = async (prompt: string) => {
  messages.value.push({ type: 'user', content: prompt })
  const idx = messages.value.length
  messages.value.push({ type: 'ai', content: '', loading: true })
  await nextTick()
  scrollToBottom()
  isGenerating.value = true
  await generateCode(prompt, idx)
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isGenerating.value) return
  const msg = userInput.value.trim()
  userInput.value = ''
  messages.value.push({ type: 'user', content: msg })
  const idx = messages.value.length
  messages.value.push({ type: 'ai', content: '', loading: true })
  await nextTick()
  scrollToBottom()
  isGenerating.value = true
  await generateCode(msg, idx)
}

const generateCode = async (userMessage: string, idx: number) => {
  let eventSource: EventSource | null = null
  let completed = false
  try {
    const baseURL = request.defaults.baseURL || API_BASE_URL
    const params = new URLSearchParams({
      appId: appId.value!,
      message: userMessage,
      token: localStorage.getItem('token') || '',
    })
    eventSource = new EventSource(`${baseURL}/app/chat/gen/code?${params}`, {
      withCredentials: true,
    })
    let full = ''
    eventSource.onmessage = (e) => {
      if (completed) return
      const content = JSON.parse(e.data).d
      if (content) {
        full += content
        messages.value[idx].content = full
        messages.value[idx].loading = false
        scrollToBottom()
      }
    }
    const finish = () => {
      if (completed) return
      completed = true
      isGenerating.value = false
      eventSource?.close()
      setTimeout(() => {
        fetchAppInfo()
        updatePreview()
      }, 1000)
    }
    eventSource.addEventListener('done', finish)
    eventSource.onerror = () => {
      if (!completed) finish()
    }
  } catch (e) {
    isGenerating.value = false
  }
}

const updatePreview = () => {
  if (appId.value)
    previewUrl.value = getStaticPreviewUrl(
      appInfo.value?.codeGenType || CodeGenTypeEnum.HTML,
      appId.value,
    )
}

const scrollToBottom = () => {
  if (messagesContainer.value)
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

const deployApp = async () => {
  deploying.value = true
  try {
    const res = await deployAppApi({ appId: appId.value as any })
    if (res.data.code === 0) {
      deployUrl.value = res.data.data
      deployModalVisible.value = true
    }
  } finally {
    deploying.value = false
  }
}

const openInNewTab = () => {
  if (previewUrl.value) window.open(previewUrl.value, '_blank')
}
const openDeployedSite = () => {
  if (deployUrl.value) window.open(deployUrl.value, '_blank')
}
const onIframeLoad = () => {
  previewReady.value = true
}
const editApp = () => {
  if (appInfo.value?.id) router.push(`/app/edit/${appInfo.value.id}`)
}

const deleteApp = async () => {
  const res = await deleteAppApi({ id: appInfo.value!.id! })
  if (res.data.code === 0) router.push('/')
}

onMounted(() => fetchAppInfo())

// 下载相关
const downloading = ref(false)

// 下载代码
const downloadCode = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }
  downloading.value = true
  try {
    // ✅ 用 request (axios)，自动携带 token
    const response = await request.get(`/app/download/${appId.value}`, {
      responseType: 'blob', // ✅ 关键：告诉 axios 响应是二进制
    })
    const contentDisposition = response.headers['content-disposition']
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] || `app-${appId.value}.zip`
    const blob = new Blob([response.data], { type: 'application/zip' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    link.click()
    URL.revokeObjectURL(downloadUrl)
    message.success('代码下载成功')
  } catch (error) {
    console.error('下载失败：', error)
    message.error('下载失败，请重试')
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
/* 基础布局 */
#appChatPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #fdfdfd;
  transition: 0.3s;
}
#appChatPage.is-dark {
  background: #141414;
  color: #f0f0f0;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}
/* 在 .header-bar 下面加 */
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0; /* ← 这行是关键，h1 默认有上下 margin 会撑开 */
}
.is-dark .app-name {
  color: rgba(255, 255, 255, 0.85);
}

.main-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 8px;
  overflow: hidden;
}
.chat-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.is-dark .chat-section {
  background: #1f1f1f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.message-item {
  margin-bottom: 12px;
}
.user-message {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.ai-message {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
}

.message-content {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}
.user-message .message-content {
  background: #1890ff;
  color: white;
}

.code-gen-type-tag {
  font-size: 12px;
}

/* AI 消息文字移除特定颜色，继承主题色 */
.ai-message .message-content {
  background: #f5f5f5;
}
.is-dark .ai-message .message-content {
  background: #2a2a2a;
}

.input-container {
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
}
.is-dark .input-container {
  background: #1f1f1f;
  border-top-color: #303030;
}
.input-wrapper {
  position: relative;
}
.input-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.preview-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}
.is-dark .preview-section {
  background: #1f1f1f;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}
.is-dark .preview-header {
  border-bottom-color: #303030;
}
.preview-content {
  flex: 1;
  position: relative;
  display: flex; /* 加这行 */
  align-items: center; /* 加这行 */
  justify-content: center; /* 加这行 */
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #888;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #888;
}
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute; /* 加这行，脱离 flex 流 */
  top: 0;
  left: 0;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}
.messages-container::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}
.is-dark .messages-container::-webkit-scrollbar-thumb {
  background: #3a3a3a;
}
</style>

<style>
/* 全局样式 - 深度优化 AI 渲染效果 */
/* 5. 修复 Markdown 内容颜色，确保适配深色模式 (新增) */
.markdown-content {
  color: inherit !important;
}

/* 1. 正在调用工具状态 (TOOL_REQUEST) */
.ai-message .message-content .tool-status-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin: 16px 0;
  border-radius: 8px;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  animation: pulse-bg 2s infinite;
}

.is-dark .ai-message .message-content .tool-status-loading {
  background-color: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.ai-message .message-content .spin-icon {
  display: inline-block;
  animation: spin 2s linear infinite;
  font-size: 16px;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes pulse-bg {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* 2. 折叠代码块效果 (TOOL_EXECUTED) */
.ai-message .message-content .tool-call-block {
  margin: 16px 0;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  background: #fafafa;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-dark .ai-message .message-content .tool-call-block {
  border-color: #30363d;
  background-color: #161b22;
}

.ai-message .message-content .tool-call-block summary {
  padding: 10px 16px;
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  background: #f6f8fa;
  transition: background 0.2s;
}

.ai-message .message-content .tool-call-block summary::-webkit-details-marker {
  display: none;
}

.is-dark .ai-message .message-content .tool-call-block summary {
  background: #21262d;
  color: #c9d1d9;
}

.ai-message .message-content .chevron-icon {
  font-size: 10px;
  color: #888;
  transition: transform 0.3s;
}

.ai-message .message-content .tool-call-block[open] .chevron-icon {
  transform: rotate(90deg);
}

.ai-message .message-content .tool-call-block[open] pre {
  margin: 0 !important;
  border-radius: 0 0 8px 8px !important;
  border: none !important;
  border-top: 1px solid #e8e8e8 !important;
}

.is-dark .ai-message .message-content .tool-call-block[open] pre {
  border-top-color: #30363d !important;
}

/* 3. Markdown 代码块适配深色模式 */
.is-dark .message-content pre,
.is-dark .message-content code {
  background-color: #1e1e1e !important;
  color: #d4d4d4 !important;
}

/* 代码内的高亮 token 适配 */
.is-dark .hljs-keyword {
  color: #569cd6 !important;
}
.is-dark .hljs-string {
  color: #ce9178 !important;
}
.is-dark .hljs-title {
  color: #dcdcaa !important;
}
.is-dark .hljs-comment {
  color: #6a9955 !important;
}

/* 4. 引用块 (Thinking) */
.ai-message .message-content blockquote {
  border-left: 4px solid #ddd;
  padding: 8px 16px;
  margin: 12px 0;
  background: rgba(0, 0, 0, 0.02);
  color: #666;
}

.is-dark .ai-message .message-content blockquote {
  border-left-color: #444;
  background: rgba(255, 255, 255, 0.03);
  color: #aaa;
}
</style>

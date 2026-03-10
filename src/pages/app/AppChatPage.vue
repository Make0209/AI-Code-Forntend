<template>
  <div id="appChatPage" :class="{ 'is-dark': isDarkMode }">
    <!-- 顶部栏 -->
    <div class="header-bar">
      <div class="header-left">
        <h1 class="app-name">{{ appInfo?.appName || '网站生成器' }}</h1>
      </div>
      <div class="header-right">
        <a-button type="default" @click="showAppDetail">
          <template #icon>
            <InfoCircleOutlined />
          </template>
          应用详情
        </a-button>
        <a-button type="primary" @click="deployApp" :loading="deploying">
          <template #icon>
            <CloudUploadOutlined />
          </template>
          部署按钮
        </a-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧对话区域 -->
      <div class="chat-section">
        <!-- 消息区域 -->
        <div class="messages-container" ref="messagesContainer">
          <div v-for="(message, index) in messages" :key="index" class="message-item">
            <div v-if="message.type === 'user'" class="user-message">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-avatar">
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
              </div>
            </div>
            <div v-else class="ai-message">
              <div class="message-avatar">
                <a-avatar :src="aiAvatar" />
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

        <!-- 用户消息输入框 -->
        <div class="input-container">
          <div class="input-wrapper">
            <a-tooltip v-if="!isOwner" title="无法在别人的作品下对话哦~" placement="top">
              <a-textarea
                v-model:value="userInput"
                placeholder="请描述你想生成的网站，越详细效果越好哦"
                :rows="4"
                :maxlength="1000"
                @keydown.enter.prevent="sendMessage"
                :disabled="isGenerating || !isOwner"
              />
            </a-tooltip>
            <a-textarea
              v-else
              v-model:value="userInput"
              placeholder="请描述你想生成的网站，越详细效果越好哦"
              :rows="4"
              :maxlength="1000"
              @keydown.enter.prevent="sendMessage"
              :disabled="isGenerating"
            />
            <div class="input-actions">
              <a-button
                type="primary"
                @click="sendMessage"
                :loading="isGenerating"
                :disabled="!isOwner"
              >
                <template #icon>
                  <SendOutlined />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧网页展示区域 -->
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

    <!-- 应用详情弹窗 -->
    <AppDetailModal
      v-model:open="appDetailVisible"
      :app="appInfo"
      :show-actions="isOwner || isAdmin"
      @edit="editApp"
      @delete="deleteApp"
    />

    <!-- 部署成功弹窗 -->
    <DeploySuccessModal
      v-model:open="deployModalVisible"
      :deploy-url="deployUrl"
      @open-site="openDeployedSite"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import {
  deleteApp as deleteAppApi,
  deployApp as deployAppApi,
  getAppVoById,
} from '@/api/appController'
import { CodeGenTypeEnum } from '@/utils/codeGenTypes'
import { request } from '@/request'

import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import AppDetailModal from '@/components/AppDetailModal.vue'
import DeploySuccessModal from '@/components/DeploySuccessModal.vue'
import aiAvatar from '@/assets/aiAvatar.png'
import { API_BASE_URL, getStaticPreviewUrl } from '@/config/env'

import {
  CloudUploadOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  SendOutlined,
} from '@ant-design/icons-vue'

// 注入主题
const currentTheme = inject<any>('currentTheme')
const isDarkMode = computed(() => currentTheme?.value === 'dark')

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 应用信息
const appInfo = ref<API.AppVO>()
const appId = ref<string>()

// 对话相关
interface Message {
  type: 'user' | 'ai'
  content: string
  loading?: boolean
}

const messages = ref<Message[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement>()
const hasInitialConversation = ref(false)

// 预览相关
const previewUrl = ref('')
const previewReady = ref(false)

// 部署相关
const deploying = ref(false)
const deployModalVisible = ref(false)
const deployUrl = ref('')

// 权限相关
const isOwner = computed(() => {
  return appInfo.value?.userId === loginUserStore.loginUser.id
})

const isAdmin = computed(() => {
  return loginUserStore.loginUser.userRole === 'admin'
})

// 应用详情相关
const appDetailVisible = ref(false)

const showAppDetail = () => {
  appDetailVisible.value = true
}

// 获取应用信息
const fetchAppInfo = async () => {
  const id = route.params.id as string
  if (!id) {
    message.error('应用ID不存在')
    await router.push('/')
    return
  }

  appId.value = id

  try {
    const res = await getAppVoById({ id: id as unknown as number })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data

      const isViewMode = route.query.view === '1'

      if (appInfo.value.initPrompt && !isViewMode && !hasInitialConversation.value) {
        hasInitialConversation.value = true
        await sendInitialMessage(appInfo.value.initPrompt)
      }
    } else {
      message.error('获取应用信息失败')
      await router.push('/')
    }
  } catch (error) {
    console.error('获取应用信息失败：', error)
    message.error('获取应用信息失败')
    await router.push('/')
  }
}

// 发送初始消息
const sendInitialMessage = async (prompt: string) => {
  messages.value.push({ type: 'user', content: prompt })

  const aiMessageIndex = messages.value.length
  messages.value.push({ type: 'ai', content: '', loading: true })

  await nextTick()
  scrollToBottom()

  isGenerating.value = true
  await generateCode(prompt, aiMessageIndex)
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isGenerating.value) return

  const msg = userInput.value.trim()
  userInput.value = ''

  messages.value.push({ type: 'user', content: msg })

  const aiMessageIndex = messages.value.length
  messages.value.push({ type: 'ai', content: '', loading: true })

  await nextTick()
  scrollToBottom()

  isGenerating.value = true
  await generateCode(msg, aiMessageIndex)
}

// 生成代码 - 使用 EventSource 处理流式响应
const generateCode = async (userMessage: string, aiMessageIndex: number) => {
  let eventSource: EventSource | null = null
  let streamCompleted = false

  try {
    const baseURL = request.defaults.baseURL || API_BASE_URL
    const token = localStorage.getItem('token')
    const params = new URLSearchParams({
      appId: appId.value || '',
      message: userMessage,
      token: token || '',
    })

    const url = `${baseURL}/app/chat/gen/code?${params}`

    eventSource = new EventSource(url, { withCredentials: true })

    let fullContent = ''

    eventSource.onmessage = function (event) {
      if (streamCompleted) return
      try {
        const parsed = JSON.parse(event.data)
        const content = parsed.d
        if (content !== undefined && content !== null) {
          fullContent += content
          messages.value[aiMessageIndex].content = fullContent
          messages.value[aiMessageIndex].loading = false
          scrollToBottom()
        }
      } catch (error) {
        console.error('解析消息失败:', error)
        handleError(error, aiMessageIndex)
      }
    }

    eventSource.addEventListener('done', function () {
      if (streamCompleted) return
      streamCompleted = true
      isGenerating.value = false
      eventSource?.close()
      setTimeout(async () => {
        await fetchAppInfo()
        updatePreview()
      }, 1000)
    })

    eventSource.onerror = function () {
      if (streamCompleted || !isGenerating.value) return
      if (eventSource?.readyState === EventSource.CONNECTING) {
        streamCompleted = true
        isGenerating.value = false
        eventSource?.close()
        setTimeout(async () => {
          await fetchAppInfo()
          updatePreview()
        }, 1000)
      } else {
        handleError(new Error('SSE连接错误'), aiMessageIndex)
      }
    }
  } catch (error) {
    console.error('创建 EventSource 失败：', error)
    handleError(error, aiMessageIndex)
  }
}

const handleError = (error: unknown, aiMessageIndex: number) => {
  console.error('生成代码失败：', error)
  messages.value[aiMessageIndex].content = '抱歉，生成过程中出现了错误，请重试。'
  messages.value[aiMessageIndex].loading = false
  message.error('生成失败，请重试')
  isGenerating.value = false
}

const updatePreview = () => {
  if (appId.value) {
    const codeGenType = appInfo.value?.codeGenType || CodeGenTypeEnum.HTML
    previewUrl.value = getStaticPreviewUrl(codeGenType, appId.value)
    previewReady.value = true
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const deployApp = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }
  deploying.value = true
  try {
    const res = await deployAppApi({ appId: appId.value as unknown as number })
    if (res.data.code === 0 && res.data.data) {
      deployUrl.value = res.data.data
      deployModalVisible.value = true
      message.success('部署成功')
    } else {
      message.error('部署失败：' + res.data.message)
    }
  } catch (error) {
    console.error('部署失败：', error)
    message.error('部署失败，请重试')
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
  if (!appInfo.value?.id) return
  try {
    const res = await deleteAppApi({ id: appInfo.value.id })
    if (res.data.code === 0) {
      message.success('删除成功')
      appDetailVisible.value = false
      await router.push('/')
    } else {
      message.error('删除失败：' + res.data.message)
    }
  } catch (error) {
    console.error('删除失败：', error)
    message.error('删除失败')
  }
}

onMounted(() => {
  fetchAppInfo()
})

onUnmounted(() => {
  // EventSource 会在组件卸载时自动清理
})
</script>

<style scoped>
/* ===== 基础布局 ===== */
#appChatPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #fdfdfd;
  transition: background 0.3s, color 0.3s;
}

/* ===== 深色模式 - 页面背景 ===== */
#appChatPage.is-dark {
  background: #141414;
  color: #f0f0f0;
}

/* 顶部栏 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  transition: color 0.3s;
}

.is-dark .app-name {
  color: rgba(255, 255, 255, 0.85);
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 8px;
  overflow: hidden;
}

/* ===== 左侧对话区域 ===== */
.chat-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: background 0.3s, box-shadow 0.3s;
}

.is-dark .chat-section {
  background: #1f1f1f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.message-item {
  margin-bottom: 12px;
}

.user-message {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 8px;
}

.ai-message {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  word-wrap: break-word;
  transition: background 0.3s, color 0.3s;
}

.user-message .message-content {
  background: #1890ff;
  color: white;
}

.ai-message .message-content {
  background: #f5f5f5;
  color: #1a1a1a;
  padding: 8px 12px;
}

/* 深色模式 - AI 消息气泡 */
.is-dark .ai-message .message-content {
  background: #2a2a2a;
  color: rgba(255, 255, 255, 0.85);
}

/* ===== Markdown 内容深色适配 ===== */
.is-dark .ai-message .message-content :deep(p),
.is-dark .ai-message .message-content :deep(li),
.is-dark .ai-message .message-content :deep(td),
.is-dark .ai-message .message-content :deep(th),
.is-dark .ai-message .message-content :deep(blockquote) {
  color: rgba(255, 255, 255, 0.82);
}

.is-dark .ai-message .message-content :deep(h1),
.is-dark .ai-message .message-content :deep(h2),
.is-dark .ai-message .message-content :deep(h3),
.is-dark .ai-message .message-content :deep(h4),
.is-dark .ai-message .message-content :deep(h5),
.is-dark .ai-message .message-content :deep(h6) {
  color: rgba(255, 255, 255, 0.92);
}

.is-dark .ai-message .message-content :deep(a) {
  color: #4ea3ff;
}

.is-dark .ai-message .message-content :deep(code) {
  background: #3a3a3a;
  color: #e07b53;
  border-radius: 4px;
  padding: 1px 5px;
}

.is-dark .ai-message .message-content :deep(pre) {
  background: #0d1117 !important;
  border: 1px solid #30363d;
  border-radius: 6px;
  overflow-x: auto;
}

/* 覆盖 highlight.js / prism 注入的浅色主题背景 */
.is-dark .ai-message .message-content :deep(pre code),
.is-dark .ai-message .message-content :deep(pre code.hljs),
.is-dark .ai-message .message-content :deep(pre .hljs),
.is-dark .ai-message .message-content :deep(pre [class*="language-"]) {
  background: transparent !important;
  color: #e6edf3 !important;
  padding: 0 !important;
  text-shadow: none !important;
}

/* highlight.js token 颜色覆盖（GitHub Dark 风格） */
.is-dark .ai-message .message-content :deep(.hljs-keyword),
.is-dark .ai-message .message-content :deep(.hljs-selector-tag),
.is-dark .ai-message .message-content :deep(.hljs-literal) {
  color: #ff7b72 !important;
}
.is-dark .ai-message .message-content :deep(.hljs-string),
.is-dark .ai-message .message-content :deep(.hljs-attr) {
  color: #a5d6ff !important;
}
.is-dark .ai-message .message-content :deep(.hljs-number) {
  color: #79c0ff !important;
}
.is-dark .ai-message .message-content :deep(.hljs-title),
.is-dark .ai-message .message-content :deep(.hljs-section),
.is-dark .ai-message .message-content :deep(.hljs-name) {
  color: #d2a8ff !important;
}
.is-dark .ai-message .message-content :deep(.hljs-comment),
.is-dark .ai-message .message-content :deep(.hljs-quote) {
  color: #8b949e !important;
}
.is-dark .ai-message .message-content :deep(.hljs-built_in),
.is-dark .ai-message .message-content :deep(.hljs-type) {
  color: #ffa657 !important;
}
.is-dark .ai-message .message-content :deep(.hljs-variable),
.is-dark .ai-message .message-content :deep(.hljs-template-variable) {
  color: #ffa198 !important;
}
.is-dark .ai-message .message-content :deep(.hljs-tag) {
  color: #7ee787 !important;
}
.is-dark .ai-message .message-content :deep(.hljs-addition) {
  color: #aff5b4 !important;
  background: #033a16 !important;
}
.is-dark .ai-message .message-content :deep(.hljs-deletion) {
  color: #ffdcd7 !important;
  background: #67060c !important;
}

/* 代码块内滚动条深色适配 */
.is-dark .ai-message .message-content :deep(pre)::-webkit-scrollbar {
  height: 6px;
}
.is-dark .ai-message .message-content :deep(pre)::-webkit-scrollbar-track {
  background: #161b22;
}
.is-dark .ai-message .message-content :deep(pre)::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 3px;
}
.is-dark .ai-message .message-content :deep(pre)::-webkit-scrollbar-thumb:hover {
  background: #484f58;
}

.is-dark .ai-message .message-content :deep(blockquote) {
  border-left: 4px solid #404040;
  background: #2f2f2f;
  padding: 8px 12px;
  margin: 8px 0;
}

.is-dark .ai-message .message-content :deep(table) {
  border-color: #404040;
}

.is-dark .ai-message .message-content :deep(th) {
  background: #2f2f2f;
  border-color: #404040;
}

.is-dark .ai-message .message-content :deep(td) {
  border-color: #404040;
}

.is-dark .ai-message .message-content :deep(hr) {
  border-color: #404040;
}

.message-avatar {
  flex-shrink: 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  transition: color 0.3s;
}

.is-dark .loading-indicator {
  color: rgba(255, 255, 255, 0.45);
}

/* ===== 输入区域 ===== */
.input-container {
  padding: 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
  transition: background 0.3s, border-color 0.3s;
}

.is-dark .input-container {
  background: #1f1f1f;
  border-top-color: #303030;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .ant-input {
  padding-right: 50px;
}

.input-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

/* ===== 右侧预览区域 ===== */
.preview-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: background 0.3s, box-shadow 0.3s;
}

.is-dark .preview-section {
  background: #1f1f1f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  transition: border-color 0.3s;
}

.is-dark .preview-header {
  border-bottom-color: #303030;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  transition: color 0.3s;
}

.is-dark .preview-header h3 {
  color: rgba(255, 255, 255, 0.85);
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  transition: color 0.3s;
}

.is-dark .preview-placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  transition: color 0.3s;
}

.is-dark .preview-loading {
  color: rgba(255, 255, 255, 0.45);
}

.preview-loading p {
  margin-top: 16px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .chat-section,
  .preview-section {
    flex: none;
    height: 50vh;
  }
}

@media (max-width: 768px) {
  .header-bar {
    padding: 12px 16px;
  }

  .app-name {
    font-size: 16px;
  }

  .main-content {
    padding: 8px;
    gap: 8px;
  }

  .message-content {
    max-width: 85%;
  }
}

/* ===== 消息区域滚动条深色适配 ===== */
.messages-container::-webkit-scrollbar {
  width: 6px;
}
.messages-container::-webkit-scrollbar-track {
  background: transparent;
}
.messages-container::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}
.messages-container::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
.is-dark .messages-container::-webkit-scrollbar-thumb {
  background: #3a3a3a;
}
.is-dark .messages-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

<!-- 非 scoped：全局覆盖 highlight.js 注入的浅色主题，必须在全局才能生效 -->
<style>
/* 仅在深色模式下的代码块背景、文字全面覆盖 */
#appChatPage.is-dark pre,
#appChatPage.is-dark pre.hljs,
#appChatPage.is-dark pre code,
#appChatPage.is-dark pre code.hljs,
#appChatPage.is-dark .hljs {
  background: #0d1117 !important;
  color: #e6edf3 !important;
  text-shadow: none !important;
}

/* 关键 token 颜色（GitHub Dark 风格）*/
#appChatPage.is-dark .hljs-keyword,
#appChatPage.is-dark .hljs-selector-tag,
#appChatPage.is-dark .hljs-deletion {
  color: #ff7b72 !important;
}
#appChatPage.is-dark .hljs-string,
#appChatPage.is-dark .hljs-attr,
#appChatPage.is-dark .hljs-addition {
  color: #a5d6ff !important;
}
#appChatPage.is-dark .hljs-number,
#appChatPage.is-dark .hljs-literal {
  color: #79c0ff !important;
}
#appChatPage.is-dark .hljs-title,
#appChatPage.is-dark .hljs-section,
#appChatPage.is-dark .hljs-name,
#appChatPage.is-dark .hljs-function {
  color: #d2a8ff !important;
}
#appChatPage.is-dark .hljs-comment,
#appChatPage.is-dark .hljs-quote {
  color: #8b949e !important;
  font-style: italic;
}
#appChatPage.is-dark .hljs-built_in,
#appChatPage.is-dark .hljs-type,
#appChatPage.is-dark .hljs-class,
#appChatPage.is-dark .hljs-variable,
#appChatPage.is-dark .hljs-template-variable {
  color: #ffa657 !important;
}
#appChatPage.is-dark .hljs-tag {
  color: #7ee787 !important;
}
#appChatPage.is-dark .hljs-regexp {
  color: #a5d6ff !important;
}
#appChatPage.is-dark .hljs-symbol,
#appChatPage.is-dark .hljs-bullet,
#appChatPage.is-dark .hljs-link {
  color: #79c0ff !important;
}
</style>

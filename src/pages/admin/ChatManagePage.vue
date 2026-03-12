<template>
  <div id="chatManagePage" :class="{ 'is-dark': isDarkMode }">
    <a-form layout="inline" :model="searchParams" @finish="doSearch" class="search-form">
      <a-form-item label="消息内容">
        <a-input v-model:value="searchParams.message" placeholder="输入消息内容" />
      </a-form-item>
      <a-form-item label="消息类型">
        <a-select
          v-model:value="searchParams.messageType"
          placeholder="选择消息类型"
          style="width: 120px"
        >
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="user">用户消息</a-select-option>
          <a-select-option value="assistant">AI消息</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="应用ID">
        <a-input v-model:value="searchParams.appId" placeholder="输入应用ID" />
      </a-form-item>
      <a-form-item label="用户ID">
        <a-input v-model:value="searchParams.userId" placeholder="输入用户ID" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <a-divider />

    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      @change="doTableChange"
      :scroll="{ x: 1400 }"
      class="manage-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="['id', 'appId', 'userId'].includes(column.dataIndex)">
          <a-tooltip :title="String(record[column.dataIndex])">
            <span class="id-text">{{ formatId(record[column.dataIndex]) }}</span>
          </a-tooltip>
        </template>

        <template v-else-if="column.dataIndex === 'message'">
          <a-tooltip
            :title="truncateContent(record.message, 200)"
            overlay-class-name="message-tooltip"
          >
            <div class="message-text">{{ record.message }}</div>
          </a-tooltip>
        </template>

        <template v-else-if="column.dataIndex === 'messageType'">
          <a-tag :color="record.messageType === 'user' ? 'blue' : 'green'">
            {{ record.messageType === 'user' ? '用户消息' : 'AI消息' }}
          </a-tag>
        </template>

        <template v-else-if="column.dataIndex === 'createTime'">
          {{ formatTime(record.createTime) }}
        </template>

        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="primary" size="small" @click="viewAppChat(record.appId)">
              查看对话
            </a-button>
            <a-popconfirm title="确定要删除这条消息吗？" @confirm="deleteMessage(record.id)">
              <a-button danger size="small">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { listAllChatHistoryByPageForAdmin } from '@/api/chatHistoryController'
import { formatTime } from '@/utils/time'

const router = useRouter()

// 注入主题逻辑
const currentTheme = inject<any>('currentTheme')
const isDarkMode = computed(() => currentTheme?.value === 'dark')

// 表格列配置
const columns = [
  { title: 'ID', dataIndex: 'id', width: 100, fixed: 'left', align: 'center' },
  { title: '消息内容', dataIndex: 'message', width: 210, align: 'center' },
  { title: '消息类型', dataIndex: 'messageType', width: 120, align: 'center' },
  { title: '应用ID', dataIndex: 'appId', width: 120, align: 'center' },
  { title: '用户ID', dataIndex: 'userId', width: 120, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 120, align: 'center' },
  { title: '操作', key: 'action', width: 180, fixed: 'right', align: 'center' },
]

const data = ref<API.ChatHistory[]>([])
const total = ref(0)
const searchParams = reactive<API.ChatHistoryQueryRequest>({
  pageNum: 1,
  pageSize: 10,
})

// 格式化 ID 显示
const formatId = (id: any) => {
  if (!id) return '-'
  const strId = String(id)
  return strId.length > 8 ? strId.slice(0, 8) + '...' : strId
}

// 截断悬浮窗内的消息内容
const truncateContent = (content: string, len: number) => {
  if (!content) return ''
  return content.length > len ? content.slice(0, len) + '...' : content
}

const fetchData = async () => {
  try {
    const res = await listAllChatHistoryByPageForAdmin({ ...searchParams })
    if (res.data.data) {
      data.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
    }
  } catch (error) {
    message.error('获取数据失败')
  }
}

onMounted(() => fetchData())

const pagination = computed(() => ({
  current: searchParams.pageNum ?? 1,
  pageSize: searchParams.pageSize ?? 10,
  total: total.value,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
}))

const doTableChange = (page: any) => {
  searchParams.pageNum = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

const doSearch = () => {
  searchParams.pageNum = 1
  fetchData()
}

const viewAppChat = (appId: number | undefined) => {
  if (appId) router.push(`/app/chat/${appId}`)
}

const deleteMessage = async (id: number | undefined) => {
  if (!id) return
  message.success('删除成功')
  await fetchData()
}
</script>

<style scoped>
#chatManagePage {
  padding: 24px;
  background: white;
  margin-top: 16px;
  min-height: 80vh;
  transition:
    background 0.3s,
    color 0.3s;
  border-radius: 8px;
}

/* 深色模式 */
#chatManagePage.is-dark {
  background: #1f1f1f;
  color: rgba(255, 255, 255, 0.85);
}

.is-dark :deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.85);
}

.is-dark :deep(.ant-divider) {
  border-top-color: #303030;
}

/* 文本处理 */
.id-text {
  cursor: help;
}

.message-text {
  max-width: 280px;
  margin: 0 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


/* 滚动条适配 */
:deep(.ant-table-body)::-webkit-scrollbar,
:deep(.ant-table-content)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.ant-table-body)::-webkit-scrollbar-thumb,
:deep(.ant-table-content)::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

.is-dark :deep(.ant-table-body)::-webkit-scrollbar-thumb,
.is-dark :deep(.ant-table-content)::-webkit-scrollbar-thumb {
  background: #3a3a3a;
}

/* 分页器适配 */
.is-dark :deep(.ant-pagination-item-link),
.is-dark :deep(.ant-pagination-item a),
.is-dark :deep(.ant-pagination-total-text) {
  color: rgba(255, 255, 255, 0.65);
}
</style>

<style>
#chatManagePage.is-dark .ant-table-ping-left::after,
#chatManagePage.is-dark .ant-table-ping-right::after {
  box-shadow: none !important;
}

/* 限制消息内容悬浮窗的最大宽度 */
.message-tooltip .ant-tooltip-inner {
  max-width: 400px;
  word-break: break-all;
}
</style>

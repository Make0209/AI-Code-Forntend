<template>
  <div id="userManagePage" :class="{ 'dark-mode': isDark }">
    <div class="search-wrapper">
      <a-form layout="inline" :model="searchParams" @finish="doSearch">
        <a-form-item label="账号">
          <a-input v-model:value="searchParams.userAccount" placeholder="输入账号" allow-clear />
        </a-form-item>
        <a-form-item label="用户名">
          <a-input v-model:value="searchParams.userName" placeholder="输入用户名" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-divider />

    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      @change="doTableChange"
      :scroll="{ x: 1000 }"
      class="custom-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'id'">
          <a-tooltip placement="top">
            <template #title>{{ record.id }}</template>
            <div class="id-cell">{{ record.id }}</div>
          </a-tooltip>
        </template>

        <template v-else-if="column.dataIndex === 'userAvatar'">
          <a-image :src="record.userAvatar" :width="44" class="circular-avatar" :preview="true" />
        </template>

        <template v-else-if="column.dataIndex === 'userRole'">
          <a-tag :color="record.userRole === 'admin' ? 'gold' : 'blue'">
            {{ record.userRole === 'admin' ? '管理员' : '普通用户' }}
          </a-tag>
        </template>

        <template v-else-if="column.dataIndex === 'createTime'">
          <span class="time-text">{{
            dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss')
          }}</span>
        </template>

        <template v-else-if="column.key === 'action'">
          <a-popconfirm
            title="确定要删除该用户吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="doDelete(record.id)"
          >
            <a-button type="link" danger size="small">删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, inject } from 'vue'
import { deleteUser, listUserVoByPage } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

// 注入主题状态
const currentTheme = inject<any>('currentTheme', ref('light'))
const isDark = computed(() => currentTheme.value === 'dark')

// 定义列：增加 align: 'center'
const columns = [
  { title: 'id', dataIndex: 'id', width: 100, align: 'center' },
  { title: '账号', dataIndex: 'userAccount', width: 140, align: 'center' },
  { title: '用户名', dataIndex: 'userName', width: 140, align: 'center' },
  { title: '头像', dataIndex: 'userAvatar', width: 100, align: 'center' },
  { title: '简介', dataIndex: 'userProfile', ellipsis: true, align: 'center' },
  { title: '角色', dataIndex: 'userRole', width: 120, align: 'center' },
  { title: '创建时间', dataIndex: 'createTime', width: 180, align: 'center' },
  { title: '操作', key: 'action', width: 100, align: 'center', fixed: 'right' },
]

const data = ref<API.UserVO[]>([])
const total = ref(0)
const searchParams = reactive<API.UserQueryRequest>({ pageNum: 1, pageSize: 10 })

const fetchData = async () => {
  const res = await listUserVoByPage({ ...searchParams })
  if (res.data.code === 0 && res.data.data) {
    data.value = res.data.data.records ?? []
    total.value = res.data.data.totalRow ?? 0
  }
}

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

const doDelete = async (id: string) => {
  const res = await deleteUser({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    await fetchData()
  }
}

onMounted(() => fetchData())
</script>

<style scoped>
#userManagePage {
  padding: 24px;
  margin-top: 16px;
  background: #ffffff;
  border-radius: 8px;
  transition: all 0.3s;
}

/* 深色模式适配 */
.dark-mode#userManagePage {
  background: #1f1f1f;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* ID 单元格省略号样式 */
.id-cell {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 auto;
  cursor: help;
}

/* 圆形头像样式 */
:deep(.circular-avatar) {
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.dark-mode :deep(.circular-avatar) {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.time-text {
  font-family: monospace;
  opacity: 0.8;
}

/* 强制表头居中 */
:deep(.ant-table-thead > tr > th) {
  text-align: center !important;
}
</style>

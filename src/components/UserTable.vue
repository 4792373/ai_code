<template>
  <div class="user-table">
    <a-table
      :columns="columns"
      :data-source="users"
      :loading="loading"
      :pagination="paginationConfig"
      :locale="locale"
      row-key="id"
      size="middle"
      @change="handleTableChange"
    >
      <!-- 角色列自定义渲染 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="getRoleColor(record.role)">
            {{ getRoleText(record.role) }}
          </a-tag>
        </template>
        
        <!-- 状态列自定义渲染 -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        
        <!-- 创建时间列自定义渲染 -->
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>
        
        <!-- 操作列自定义渲染 -->
        <template v-else-if="column.key === 'actions'">
          <a-space>
            <a-button 
              type="link" 
              size="small" 
              @click="handleEdit(record as User)"
            >
              编辑
            </a-button>
            <a-button 
              type="link" 
              size="small" 
              danger
              @click="handleDelete(record.id)"
            >
              删除
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Table, Tag, Button, Space } from 'ant-design-vue'
import type { User } from '@/types/user'
import { UserRole, UserStatus } from '@/types/user'
import type { TableColumnsType, TableProps } from 'ant-design-vue'

// Ant Design Vue 组件
const ATable = Table
const ATag = Tag
const AButton = Button
const ASpace = Space

// Props 定义
interface Props {
  users: User[]
  loading: boolean
}

// Emits 定义
interface Emits {
  edit: [user: User]
  delete: [userId: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 120,
    ellipsis: true
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 200,
    ellipsis: true
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 100,
    align: 'center'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center'
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 150,
    sorter: (a: User, b: User) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center'
  }
]

// 分页配置
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: props.users.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
  // 只有超过10条记录时才显示分页
  hideOnSinglePage: props.users.length <= 10
}))

// 空数据时的本地化配置
const locale = {
  emptyText: '暂无数据'
}

// 角色颜色映射
const getRoleColor = (role: UserRole): string => {
  const colorMap = {
    [UserRole.ADMIN]: 'red',
    [UserRole.MODERATOR]: 'orange',
    [UserRole.USER]: 'blue'
  }
  return colorMap[role] || 'default'
}

// 角色文本映射
const getRoleText = (role: UserRole): string => {
  const textMap = {
    [UserRole.ADMIN]: '管理员',
    [UserRole.MODERATOR]: '版主',
    [UserRole.USER]: '用户'
  }
  return textMap[role] || role
}

// 状态颜色映射
const getStatusColor = (status: UserStatus): string => {
  const colorMap = {
    [UserStatus.ACTIVE]: 'green',
    [UserStatus.INACTIVE]: 'red',
    [UserStatus.PENDING]: 'orange'
  }
  return colorMap[status] || 'default'
}

// 状态文本映射
const getStatusText = (status: UserStatus): string => {
  const textMap = {
    [UserStatus.ACTIVE]: '激活',
    [UserStatus.INACTIVE]: '禁用',
    [UserStatus.PENDING]: '待审核'
  }
  return textMap[status] || status
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 处理表格变化（分页、排序等）
const handleTableChange: TableProps['onChange'] = (pagination, filters, sorter) => {
  console.log('Table change:', { pagination, filters, sorter })
  
  // 更新分页状态
  if (pagination) {
    if (pagination.current) {
      currentPage.value = pagination.current
    }
    if (pagination.pageSize) {
      pageSize.value = pagination.pageSize
      // 如果改变了每页条数，重置到第一页
      if (pagination.pageSize !== pageSize.value) {
        currentPage.value = 1
      }
    }
  }
}

// 处理编辑操作
const handleEdit = (user: User) => {
  emit('edit', user)
}

// 处理删除操作
const handleDelete = (userId: string) => {
  emit('delete', userId)
}
</script>

<style scoped>
.user-table {
  background: #fff;
  border-radius: 6px;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f5f5;
}

:deep(.ant-tag) {
  margin: 0;
}
</style>
<template>
  <div class="search-filter">
    <a-row :gutter="16" align="middle">
      <!-- 搜索输入框 -->
      <a-col :xs="24" :sm="8" :md="6">
        <a-input
          v-model:value="searchKeyword"
          placeholder="搜索用户姓名或邮箱"
          allow-clear
          :disabled="loading"
          @input="handleSearch"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
      </a-col>
      
      <!-- 角色筛选 -->
      <a-col :xs="12" :sm="6" :md="4">
        <a-select
          v-model:value="selectedRole"
          placeholder="选择角色"
          allow-clear
          :disabled="loading"
          :loading="loading"
          style="width: 100%"
          @change="handleRoleFilter"
        >
          <a-select-option value="">全部角色</a-select-option>
          <a-select-option 
            v-for="role in roleOptions" 
            :key="role.value" 
            :value="role.value"
          >
            {{ role.label }}
          </a-select-option>
        </a-select>
      </a-col>
      
      <!-- 状态筛选 -->
      <a-col :xs="12" :sm="6" :md="4">
        <a-select
          v-model:value="selectedStatus"
          placeholder="选择状态"
          allow-clear
          :disabled="loading"
          :loading="loading"
          style="width: 100%"
          @change="handleStatusFilter"
        >
          <a-select-option value="">全部状态</a-select-option>
          <a-select-option 
            v-for="status in statusOptions" 
            :key="status.value" 
            :value="status.value"
          >
            <a-tag :color="status.color">{{ status.label }}</a-tag>
          </a-select-option>
        </a-select>
      </a-col>
      
      <!-- 重置按钮 -->
      <a-col :xs="24" :sm="4" :md="3">
        <a-button 
          @click="handleReset" 
          :loading="loading"
          :disabled="loading"
          style="width: 100%"
        >
          <template #icon>
            <ReloadOutlined />
          </template>
          重置
        </a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Row, Col, Input, Select, Button, Tag } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { UserRole, UserStatus } from '@/types/user'
import type { SelectValue } from 'ant-design-vue/es/select'

// Ant Design Vue 组件
const ARow = Row
const ACol = Col
const AInput = Input
const ASelect = Select
const ASelectOption = Select.Option
const AButton = Button
const ATag = Tag

// 使用 store
const userStore = useUserStore()
const uiStore = useUIStore()

// 响应式数据
const searchKeyword = ref('')
const selectedRole = ref<string>('')
const selectedStatus = ref<string>('')

// 计算属性 - 加载状态
const loading = computed(() => uiStore.loading)

// 角色选项配置
const roleOptions = [
  { value: UserRole.ADMIN, label: '管理员' },
  { value: UserRole.MODERATOR, label: '版主' },
  { value: UserRole.USER, label: '普通用户' }
]

// 状态选项配置
const statusOptions = [
  { value: UserStatus.ACTIVE, label: '活跃', color: 'green' },
  { value: UserStatus.INACTIVE, label: '非活跃', color: 'red' },
  { value: UserStatus.PENDING, label: '待审核', color: 'orange' }
]

// 计算属性 - 从 store 获取当前搜索关键词和筛选条件
const currentSearchKeyword = computed(() => userStore.searchKeyword)
const currentFilters = computed(() => userStore.filters)

// 初始化组件状态
const initializeState = () => {
  searchKeyword.value = currentSearchKeyword.value
  selectedRole.value = currentFilters.value.role || ''
  selectedStatus.value = currentFilters.value.status || ''
}

// 处理搜索输入
const handleSearch = async () => {
  await userStore.setSearchKeyword(searchKeyword.value)
}

// 处理角色筛选
const handleRoleFilter = async (value: SelectValue) => {
  const filters = { ...currentFilters.value }
  if (value && typeof value === 'string') {
    filters.role = value
  } else {
    delete filters.role
  }
  await userStore.setFilters(filters)
}

// 处理状态筛选
const handleStatusFilter = async (value: SelectValue) => {
  const filters = { ...currentFilters.value }
  if (value && typeof value === 'string') {
    filters.status = value
  } else {
    delete filters.status
  }
  await userStore.setFilters(filters)
}

// 重置所有筛选条件
const handleReset = async () => {
  // 先更新本地状态
  searchKeyword.value = ''
  selectedRole.value = ''
  selectedStatus.value = ''
  
  // 使用 store 的 resetFilters 方法
  await userStore.resetFilters()
}

// 监听 store 状态变化，同步组件状态
watch(currentSearchKeyword, (newValue) => {
  if (searchKeyword.value !== newValue) {
    searchKeyword.value = newValue
  }
})

watch(currentFilters, (newFilters) => {
  if (selectedRole.value !== (newFilters.role || '')) {
    selectedRole.value = newFilters.role || ''
  }
  if (selectedStatus.value !== (newFilters.status || '')) {
    selectedStatus.value = newFilters.status || ''
  }
}, { deep: true })

// 组件挂载时初始化状态
initializeState()
</script>

<style scoped>
.search-filter {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.search-filter .ant-row {
  align-items: center;
}

.search-filter .ant-col {
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .search-filter .ant-col {
    margin-bottom: 0;
  }
}

/* 确保在小屏幕上重置按钮有合适的间距 */
@media (max-width: 575px) {
  .search-filter .ant-col:last-child {
    margin-top: 8px;
  }
}
</style>
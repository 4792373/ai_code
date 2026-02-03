<template>
  <div class="user-management">
    <a-card title="用户管理系统" :bordered="false">
      <template #extra>
        <a-space>
          <!-- 批量删除按钮 -->
          <BatchDeleteButton
            v-if="hasSelectedUsers"
            :selected-count="selectedCount"
            :loading="isDeleting"
            @click="showBatchDeleteDialog"
          />
          
          <a-button type="primary" @click="handleAddUser">
            <template #icon>
              <PlusOutlined />
            </template>
            添加用户
          </a-button>
        </a-space>
      </template>
      
      <div class="content">
        <!-- 搜索筛选组件 -->
        <SearchFilter />
        
        <!-- 用户表格组件 - 添加 key 强制重新渲染 -->
        <UserTable
          :key="tableKey"
          :users="filteredUsers"
          :loading="loading"
          :selected-row-keys="selectedUserIds"
          @edit="handleEditUser"
          @delete="handleDeleteUser"
          @selection-change="handleSelectionChange"
        />
      </div>
    </a-card>

    <!-- 用户表单模态框 -->
    <UserForm
      :visible="showUserModal"
      :user="currentUser"
      :mode="userModalMode"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible="showDeleteConfirm"
      :loading="loading"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />

    <!-- 批量删除确认对话框 -->
    <a-modal
      v-model:open="showBatchDeleteConfirm"
      title="确认批量删除"
      :width="modalWidth"
      :confirm-loading="isDeleting"
      @ok="handleBatchDelete"
      @cancel="cancelBatchDelete"
    >
      <div class="batch-delete-content">
        <p class="warning-text">
          <ExclamationCircleOutlined style="color: #faad14; margin-right: 8px;" />
          您确定要删除选中的 <strong>{{ selectedCount }}</strong> 个用户吗？此操作不可恢复。
        </p>
        
        <div v-if="selectedUsers.length > 0" class="selected-users-list">
          <p class="list-title">选中的用户：</p>
          <ul>
            <li v-for="user in selectedUsers" :key="user.id" class="user-item">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">({{ user.email }})</span>
            </li>
          </ul>
        </div>
      </div>
      
      <template #footer>
        <a-button @click="cancelBatchDelete">取消</a-button>
        <a-button 
          type="primary" 
          danger 
          :loading="isDeleting"
          @click="handleBatchDelete"
        >
          确认删除
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Card, Button, Modal, Space, message, Grid } from 'ant-design-vue'
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import UserTable from './UserTable.vue'
import SearchFilter from './SearchFilter.vue'
import UserForm from './UserForm.vue'
import DeleteConfirmDialog from './DeleteConfirmDialog.vue'
import BatchDeleteButton from './BatchDeleteButton.vue'
import type { User, CreateUserData, UpdateUserData } from '@/types/user'

// Ant Design Vue 组件
const ACard = Card
const AButton = Button
const AModal = Modal
const ASpace = Space

// 使用 stores 和 composables
const userStore = useUserStore()
const uiStore = useUIStore()
const { showSuccess, withErrorHandling } = useErrorHandler()

// 响应式断点检测
const screens = Grid.useBreakpoint()

// 表格 key，用于强制重新渲染
const tableKey = ref(0)

// 批量删除相关状态
const selectedUserIds = ref<string[]>([])
const isDeleting = ref<boolean>(false)
const showBatchDeleteConfirm = ref<boolean>(false)

// 计算属性
const filteredUsers = computed(() => userStore.filteredUsers)
const loading = computed(() => uiStore.loading)
const showUserModal = computed(() => uiStore.showUserModal)
const userModalMode = computed(() => uiStore.userModalMode)
const currentUser = computed(() => userStore.currentUser)
const showDeleteConfirm = computed(() => uiStore.showDeleteConfirm)
const deleteUserId = computed(() => uiStore.deleteUserId)

// 批量删除相关计算属性
const hasSelectedUsers = computed(() => selectedUserIds.value.length > 0)
const selectedCount = computed(() => selectedUserIds.value.length)
const selectedUsers = computed(() => {
  return userStore.users.filter(user => 
    selectedUserIds.value.includes(user.id)
  )
})

// 响应式布局计算属性
/**
 * 确认对话框宽度
 * 桌面：600px，平板：500px，手机：自适应屏幕宽度
 */
const modalWidth = computed(() => {
  if (screens.value.xs) {
    return '100%'  // 手机：全屏
  } else if (screens.value.sm || screens.value.md) {
    return 500  // 平板：500px
  }
  return 600  // 桌面：600px
})

// 事件处理方法
const handleAddUser = () => {
  userStore.setCurrentUser(null)
  uiStore.openUserModal('create')
}

const handleEditUser = (user: User) => {
  userStore.setCurrentUser(user)
  uiStore.openUserModal('edit')
}

const handleDeleteUser = (userId: string) => {
  uiStore.openDeleteConfirm(userId)
}

const handleConfirmDelete = async () => {
  if (!deleteUserId.value) return
  
  console.log('[UserManagement] 开始删除用户:', deleteUserId.value)
  console.log('[UserManagement] 删除前 filteredUsers 数量:', filteredUsers.value.length)
  
  await withErrorHandling(async () => {
    // 执行删除操作（异步）
    console.log('[UserManagement] 调用 deleteUser...')
    await userStore.deleteUser(deleteUserId.value!)
    console.log('[UserManagement] deleteUser 完成')
    
    // 关闭确认对话框
    uiStore.closeDeleteConfirm()
    
    // 显示成功提示
    showSuccess('用户删除成功')
    
    // 刷新用户列表以确保数据同步
    console.log('[UserManagement] 调用 refreshUsers...')
    await userStore.refreshUsers()
    console.log('[UserManagement] refreshUsers 完成')
    console.log('[UserManagement] 当前 userStore.users 数量:', userStore.users.length)
    console.log('[UserManagement] 当前 filteredUsers 数量:', filteredUsers.value.length)
    
    // 强制重新渲染表格组件
    tableKey.value++
    console.log('[UserManagement] 表格 key 更新为:', tableKey.value)
    
    // 等待下一个 tick 后再次检查
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('[UserManagement] 100ms 后 filteredUsers 数量:', filteredUsers.value.length)
  }, '删除用户失败，请重试')
  
  console.log('[UserManagement] 删除流程结束')
}

const handleCancelDelete = () => {
  uiStore.closeDeleteConfirm()
}

const handleFormSubmit = async (userData: CreateUserData | UpdateUserData) => {
  await withErrorHandling(async () => {
    if (userModalMode.value === 'create') {
      // 创建新用户（异步）
      await userStore.addUser(userData as CreateUserData)
      showSuccess('用户创建成功')
    } else {
      // 更新用户（异步）
      await userStore.updateUser(userData as UpdateUserData)
      showSuccess('用户更新成功')
    }
    
    // 关闭模态框
    uiStore.closeUserModal()
    
    // 强制重新渲染表格组件
    tableKey.value++
  }, '操作失败，请重试')
}

const handleFormCancel = () => {
  uiStore.closeUserModal()
}

/**
 * 处理行选择变化
 * @param selectedRowKeys - 选中的行键数组
 */
const handleSelectionChange = (selectedRowKeys: string[]) => {
  selectedUserIds.value = selectedRowKeys
}

/**
 * 显示批量删除确认对话框
 */
const showBatchDeleteDialog = () => {
  if (!hasSelectedUsers.value) return
  showBatchDeleteConfirm.value = true
}

/**
 * 执行批量删除操作
 */
const handleBatchDelete = async () => {
  if (!hasSelectedUsers.value) return
  
  isDeleting.value = true
  showBatchDeleteConfirm.value = false
  
  try {
    await userStore.batchDeleteUsers(selectedUserIds.value)
    message.success(`成功删除 ${selectedCount.value} 个用户`)
    selectedUserIds.value = []
    
    // 刷新用户列表
    await userStore.refreshUsers()
    
    // 强制重新渲染表格组件
    tableKey.value++
  } catch (error: any) {
    console.error('[UserManagement] 批量删除失败:', error)
    
    // 显示详细的错误信息
    let errorMessage = '批量删除失败，请稍后重试'
    if (error.message) {
      errorMessage = error.message
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }
    
    message.error(errorMessage)
    // 保持选中状态以便重试
  } finally {
    isDeleting.value = false
  }
}

/**
 * 取消批量删除
 */
const cancelBatchDelete = () => {
  showBatchDeleteConfirm.value = false
}

// 生命周期
onMounted(() => {
  // 注意：初始化已经在 main.ts 中完成，这里不需要任何操作
  // Mock API 服务会自动提供测试数据
})
</script>

<style scoped>
.user-management {
  padding: 24px;
  min-height: 100vh;
  background-color: #f0f2f5;
}

/* 移动设备适配 */
@media (max-width: 767px) {
  .user-management {
    padding: 16px;
  }
}

.content {
  padding: 20px 0;
}

.content p {
  margin: 8px 0;
  font-size: 16px;
}

/* 批量删除确认对话框样式 */
.batch-delete-content {
  padding: 16px 0;
}

.warning-text {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.warning-text strong {
  color: #ff4d4f;
  margin: 0 4px;
}

.selected-users-list {
  background-color: #fafafa;
  border-radius: 4px;
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
}

/* 移动设备上的用户列表样式 */
@media (max-width: 767px) {
  .selected-users-list {
    max-height: 200px;
  }
  
  .warning-text {
    font-size: 14px;
  }
}

.list-title {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
}

.selected-users-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-item {
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-name {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-right: 8px;
}

.user-email {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

/* 移动设备上的用户项样式 */
@media (max-width: 767px) {
  .user-item {
    padding: 8px 0;
  }
  
  .user-name {
    display: block;
    margin-bottom: 4px;
  }
  
  .user-email {
    display: block;
    font-size: 12px;
  }
}
</style>
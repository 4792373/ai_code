<template>
  <div class="user-management">
    <a-card title="用户管理系统" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="handleAddUser">
          <template #icon>
            <PlusOutlined />
          </template>
          添加用户
        </a-button>
      </template>
      
      <div class="content">
        <!-- 搜索筛选组件 -->
        <SearchFilter />
        
        <!-- 用户表格组件 - 添加 key 强制重新渲染 -->
        <UserTable
          :key="tableKey"
          :users="filteredUsers"
          :loading="loading"
          @edit="handleEditUser"
          @delete="handleDeleteUser"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Card, Button } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import UserTable from './UserTable.vue'
import SearchFilter from './SearchFilter.vue'
import UserForm from './UserForm.vue'
import DeleteConfirmDialog from './DeleteConfirmDialog.vue'
import type { User, CreateUserData, UpdateUserData } from '@/types/user'

// Ant Design Vue 组件
const ACard = Card
const AButton = Button

// 使用 stores 和 composables
const userStore = useUserStore()
const uiStore = useUIStore()
const { showSuccess, withErrorHandling } = useErrorHandler()

// 表格 key，用于强制重新渲染
const tableKey = ref(0)

// 计算属性
const filteredUsers = computed(() => userStore.filteredUsers)
const loading = computed(() => uiStore.loading)
const showUserModal = computed(() => uiStore.showUserModal)
const userModalMode = computed(() => uiStore.userModalMode)
const currentUser = computed(() => userStore.currentUser)
const showDeleteConfirm = computed(() => uiStore.showDeleteConfirm)
const deleteUserId = computed(() => uiStore.deleteUserId)

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

.content {
  padding: 20px 0;
}

.content p {
  margin: 8px 0;
  font-size: 16px;
}
</style>
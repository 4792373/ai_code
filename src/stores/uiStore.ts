import { defineStore } from 'pinia'
import { reactive, computed, onUnmounted } from 'vue'
import { useDelayedLoading } from '@/composables/useDelayedLoading'

interface UIState {
  showUserModal: boolean
  userModalMode: 'create' | 'edit'
  showDeleteConfirm: boolean
  deleteUserId: string | null
}

export const useUIStore = defineStore('ui', () => {
  const state = reactive<UIState>({
    showUserModal: false,
    userModalMode: 'create',
    showDeleteConfirm: false,
    deleteUserId: null
  })

  // 使用延迟加载功能
  const delayedLoading = useDelayedLoading(300)

  // 设置加载状态
  const setLoading = (loading: boolean) => {
    delayedLoading.setLoading(loading)
  }

  // 打开用户模态框
  const openUserModal = (mode: 'create' | 'edit') => {
    state.showUserModal = true
    state.userModalMode = mode
  }

  // 关闭用户模态框
  const closeUserModal = () => {
    state.showUserModal = false
  }

  // 打开删除确认对话框
  const openDeleteConfirm = (userId: string) => {
    state.showDeleteConfirm = true
    state.deleteUserId = userId
  }

  // 关闭删除确认对话框
  const closeDeleteConfirm = () => {
    state.showDeleteConfirm = false
    state.deleteUserId = null
  }

  // 清理资源（当 store 被销毁时）
  const cleanup = () => {
    delayedLoading.cleanup()
  }

  // 在组件卸载时清理资源
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态（只读）
    loading: delayedLoading.loading,
    showUserModal: computed(() => state.showUserModal),
    userModalMode: computed(() => state.userModalMode),
    showDeleteConfirm: computed(() => state.showDeleteConfirm),
    deleteUserId: computed(() => state.deleteUserId),
    
    // 方法
    setLoading,
    openUserModal,
    closeUserModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    cleanup
  }
})
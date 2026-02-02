import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useErrorHandler } from '@/composables/useErrorHandler'

/**
 * 应用初始化 composable
 * 处理应用启动时的数据加载和初始化逻辑
 */
export const useAppInitialization = () => {
  const isInitialized = ref(false)
  const initializationError = ref<string | null>(null)
  const { handleError } = useErrorHandler()

  /**
   * 初始化应用
   * 从本地存储加载用户数据，设置初始状态
   */
  const initializeApp = async (): Promise<void> => {
    try {
      console.log('开始应用初始化...')
      
      // 获取 stores
      const userStore = useUserStore()
      
      // 初始化用户数据
      await userStore.initialize()
      
      // UI store 保持默认状态，不需要特殊初始化
      
      // 标记初始化完成
      isInitialized.value = true
      initializationError.value = null
      
      console.log('应用初始化完成')
      console.log(`已加载 ${userStore.users.length} 个用户`)
      
    } catch (error) {
      console.error('应用初始化失败:', error)
      
      // 记录错误但不阻止应用启动
      initializationError.value = error instanceof Error ? error.message : '未知错误'
      isInitialized.value = true // 即使失败也标记为已初始化，允许应用继续运行
      
      // 使用错误处理器显示用户友好的错误信息
      handleError({
        type: 'STORAGE_ERROR' as any,
        message: '应用初始化时加载数据失败，将使用默认设置',
        details: error
      })
    }
  }

  /**
   * 重新初始化应用
   * 用于错误恢复或手动重新加载
   */
  const reinitializeApp = async (): Promise<void> => {
    isInitialized.value = false
    initializationError.value = null
    await initializeApp()
  }

  return {
    isInitialized,
    initializationError,
    initializeApp,
    reinitializeApp
  }
}
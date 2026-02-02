import { ref, computed, watch } from 'vue'

/**
 * 延迟加载指示器组合式函数
 * 实现延迟显示加载指示器，避免短时间请求造成的闪烁
 */
export function useDelayedLoading(delay: number = 300) {
  // 实际的加载状态
  const actualLoading = ref(false)
  
  // 显示的加载状态（延迟显示）
  const displayLoading = ref(false)
  
  // 延迟定时器
  let delayTimer: number | null = null
  
  // 监听实际加载状态的变化
  watch(actualLoading, (newValue) => {
    if (newValue) {
      // 开始加载：设置延迟定时器
      delayTimer = window.setTimeout(() => {
        displayLoading.value = true
        delayTimer = null
      }, delay)
    } else {
      // 停止加载：立即隐藏加载指示器
      if (delayTimer) {
        clearTimeout(delayTimer)
        delayTimer = null
      }
      displayLoading.value = false
    }
  })
  
  /**
   * 设置加载状态
   * @param loading 是否正在加载
   */
  const setLoading = (loading: boolean) => {
    actualLoading.value = loading
  }
  
  /**
   * 清理定时器（组件卸载时调用）
   */
  const cleanup = () => {
    if (delayTimer) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
    actualLoading.value = false
    displayLoading.value = false
  }
  
  return {
    // 实际的加载状态（用于内部逻辑）
    actualLoading: computed(() => actualLoading.value),
    
    // 显示的加载状态（用于 UI 显示）
    loading: computed(() => displayLoading.value),
    
    // 方法
    setLoading,
    cleanup
  }
}

/**
 * 全局延迟加载状态管理
 * 用于管理整个应用的加载状态
 */
export function useGlobalDelayedLoading() {
  // 活跃的加载操作计数
  const activeLoadingCount = ref(0)
  
  // 延迟加载管理器
  const delayedLoading = useDelayedLoading(300)
  
  // 监听活跃加载计数的变化
  watch(activeLoadingCount, (count) => {
    delayedLoading.setLoading(count > 0)
  })
  
  /**
   * 开始一个加载操作
   */
  const startLoading = () => {
    activeLoadingCount.value++
  }
  
  /**
   * 结束一个加载操作
   */
  const stopLoading = () => {
    if (activeLoadingCount.value > 0) {
      activeLoadingCount.value--
    }
  }
  
  /**
   * 强制停止所有加载操作
   */
  const stopAllLoading = () => {
    activeLoadingCount.value = 0
  }
  
  /**
   * 清理资源
   */
  const cleanup = () => {
    activeLoadingCount.value = 0
    delayedLoading.cleanup()
  }
  
  return {
    // 状态
    loading: delayedLoading.loading,
    activeCount: computed(() => activeLoadingCount.value),
    
    // 方法
    startLoading,
    stopLoading,
    stopAllLoading,
    cleanup
  }
}
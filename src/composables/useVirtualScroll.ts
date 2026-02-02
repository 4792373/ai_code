import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

/**
 * 虚拟滚动配置
 */
interface VirtualScrollConfig {
  /** 每项的高度（像素） */
  itemHeight: number
  /** 缓冲区大小（额外渲染的项数） */
  bufferSize?: number
  /** 容器高度（像素），默认使用窗口高度 */
  containerHeight?: number
}

/**
 * 虚拟滚动 Composable
 * 
 * 实现虚拟滚动功能，优化大数据量列表的渲染性能
 * 
 * **工作原理**：
 * - 只渲染可见区域的数据项
 * - 使用缓冲区提前渲染即将进入视口的项
 * - 动态计算滚动位置和可见范围
 * 
 * **性能优势**：
 * - 减少 DOM 节点数量
 * - 降低内存占用
 * - 提高滚动流畅度
 * 
 * **使用场景**：
 * - 品牌列表（1000+ 条数据）
 * - 用户列表（大量用户）
 * - 任何需要展示大量数据的列表
 * 
 * @param items 数据项数组
 * @param config 虚拟滚动配置
 * @returns 虚拟滚动状态和方法
 */
export function useVirtualScroll<T>(
  items: T[],
  config: VirtualScrollConfig
) {
  const {
    itemHeight,
    bufferSize = 5,
    containerHeight = window.innerHeight
  } = config

  /**
   * 滚动位置
   */
  const scrollTop = ref(0)

  /**
   * 容器引用
   */
  const containerRef = ref<HTMLElement | null>(null)

  /**
   * 可见区域的起始索引
   */
  const startIndex = computed(() => {
    const index = Math.floor(scrollTop.value / itemHeight) - bufferSize
    return Math.max(0, index)
  })

  /**
   * 可见区域的结束索引
   */
  const endIndex = computed(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const index = startIndex.value + visibleCount + bufferSize * 2
    return Math.min(items.length, index)
  })

  /**
   * 可见的数据项
   */
  const visibleItems = computed(() => {
    return items.slice(startIndex.value, endIndex.value)
  })

  /**
   * 总高度（用于滚动条）
   */
  const totalHeight = computed(() => {
    return items.length * itemHeight
  })

  /**
   * 偏移量（用于定位可见项）
   */
  const offsetY = computed(() => {
    return startIndex.value * itemHeight
  })

  /**
   * 处理滚动事件
   */
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  /**
   * 滚动到指定索引
   * 
   * @param index 目标索引
   */
  const scrollToIndex = (index: number) => {
    if (containerRef.value) {
      const targetScrollTop = index * itemHeight
      containerRef.value.scrollTop = targetScrollTop
      scrollTop.value = targetScrollTop
    }
  }

  /**
   * 滚动到顶部
   */
  const scrollToTop = () => {
    scrollToIndex(0)
  }

  /**
   * 滚动到底部
   */
  const scrollToBottom = () => {
    scrollToIndex(items.length - 1)
  }

  /**
   * 监听数据变化，重置滚动位置
   */
  watch(() => items.length, () => {
    // 如果数据长度变化，可能需要调整滚动位置
    if (scrollTop.value > totalHeight.value) {
      scrollTop.value = totalHeight.value
    }
  })

  /**
   * 组件挂载时绑定滚动事件
   */
  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll)
    }
  })

  /**
   * 组件卸载时解绑滚动事件
   */
  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    // 容器引用
    containerRef,

    // 虚拟滚动状态
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    scrollTop,

    // 滚动方法
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    handleScroll
  }
}

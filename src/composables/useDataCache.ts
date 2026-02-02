import { ref, computed, type Ref } from 'vue'

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  /** 缓存的数据 */
  data: T
  /** 缓存时间戳 */
  timestamp: number
  /** 缓存键 */
  key: string
}

/**
 * 数据缓存配置
 */
interface CacheConfig {
  /** 缓存过期时间（毫秒），默认 5 分钟 */
  ttl?: number
  /** 最大缓存数量，默认 50 */
  maxSize?: number
}

/**
 * 数据缓存 Composable
 * 
 * 提供数据缓存功能，减少不必要的 API 请求
 * 
 * **功能特性**：
 * - 基于时间的缓存过期（TTL）
 * - 最大缓存数量限制（LRU 策略）
 * - 缓存键生成和管理
 * - 缓存统计信息
 * 
 * **使用场景**：
 * - 品牌列表数据缓存
 * - 搜索结果缓存
 * - 用户数据缓存
 * 
 * @param config 缓存配置
 * @returns 缓存操作方法和状态
 */
export function useDataCache<T>(config: CacheConfig = {}) {
  const {
    ttl = 5 * 60 * 1000, // 默认 5 分钟
    maxSize = 50 // 默认最大 50 个缓存项
  } = config

  /**
   * 缓存存储
   * 使用 Map 保持插入顺序，便于实现 LRU
   */
  const cache: Ref<Map<string, CacheItem<T>>> = ref(new Map())

  /**
   * 缓存命中次数
   */
  const hits = ref(0)

  /**
   * 缓存未命中次数
   */
  const misses = ref(0)

  /**
   * 缓存命中率
   */
  const hitRate = computed(() => {
    const total = hits.value + misses.value
    return total > 0 ? (hits.value / total) * 100 : 0
  })

  /**
   * 缓存大小
   */
  const size = computed(() => cache.value.size)

  /**
   * 生成缓存键
   * 
   * @param prefix 键前缀
   * @param params 参数对象
   * @returns 缓存键字符串
   */
  const generateKey = (prefix: string, params?: Record<string, any>): string => {
    if (!params || Object.keys(params).length === 0) {
      return prefix
    }

    // 将参数对象转换为排序后的字符串
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')

    return `${prefix}:${sortedParams}`
  }

  /**
   * 检查缓存项是否过期
   * 
   * @param item 缓存项
   * @returns 是否过期
   */
  const isExpired = (item: CacheItem<T>): boolean => {
    return Date.now() - item.timestamp > ttl
  }

  /**
   * 清理过期的缓存项
   */
  const cleanExpired = (): void => {
    const now = Date.now()
    const keysToDelete: string[] = []

    cache.value.forEach((item, key) => {
      if (now - item.timestamp > ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => cache.value.delete(key))

    if (keysToDelete.length > 0) {
      console.log(`[DataCache] 清理了 ${keysToDelete.length} 个过期缓存项`)
    }
  }

  /**
   * 实现 LRU 策略：删除最旧的缓存项
   */
  const evictOldest = (): void => {
    if (cache.value.size >= maxSize) {
      // Map 的迭代器按插入顺序返回，第一个就是最旧的
      const firstKey = cache.value.keys().next().value
      if (firstKey) {
        cache.value.delete(firstKey)
        console.log(`[DataCache] LRU 淘汰缓存项: ${firstKey}`)
      }
    }
  }

  /**
   * 获取缓存数据
   * 
   * @param key 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回 null
   */
  const get = (key: string): T | null => {
    const item = cache.value.get(key)

    if (!item) {
      misses.value++
      return null
    }

    // 检查是否过期
    if (isExpired(item)) {
      cache.value.delete(key)
      misses.value++
      return null
    }

    hits.value++

    // LRU 策略：将访问的项移到最后（删除后重新插入）
    cache.value.delete(key)
    cache.value.set(key, item)

    return item.data as T
  }

  /**
   * 设置缓存数据
   * 
   * @param key 缓存键
   * @param data 要缓存的数据
   */
  const set = (key: string, data: T): void => {
    // 先清理过期项
    cleanExpired()

    // 如果缓存已满，淘汰最旧的项
    evictOldest()

    // 添加新缓存项
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      key
    }

    cache.value.set(key, item)
    console.log(`[DataCache] 缓存数据: ${key}`)
  }

  /**
   * 删除指定的缓存项
   * 
   * @param key 缓存键
   * @returns 是否成功删除
   */
  const remove = (key: string): boolean => {
    const deleted = cache.value.delete(key)
    if (deleted) {
      console.log(`[DataCache] 删除缓存: ${key}`)
    }
    return deleted
  }

  /**
   * 清空所有缓存
   */
  const clear = (): void => {
    cache.value.clear()
    hits.value = 0
    misses.value = 0
    console.log('[DataCache] 清空所有缓存')
  }

  /**
   * 检查缓存是否存在且未过期
   * 
   * @param key 缓存键
   * @returns 是否存在有效缓存
   */
  const has = (key: string): boolean => {
    const item = cache.value.get(key)
    if (!item) {
      return false
    }
    if (isExpired(item)) {
      cache.value.delete(key)
      return false
    }
    return true
  }

  /**
   * 获取缓存统计信息
   */
  const getStats = () => {
    return {
      size: size.value,
      hits: hits.value,
      misses: misses.value,
      hitRate: hitRate.value.toFixed(2) + '%',
      maxSize,
      ttl
    }
  }

  /**
   * 打印缓存统计信息
   */
  const printStats = (): void => {
    const stats = getStats()
    console.log('[DataCache] 缓存统计:', stats)
  }

  return {
    // 缓存操作方法
    get,
    set,
    remove,
    clear,
    has,
    generateKey,

    // 缓存状态
    size,
    hits,
    misses,
    hitRate,

    // 工具方法
    getStats,
    printStats,
    cleanExpired
  }
}

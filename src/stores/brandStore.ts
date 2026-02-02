import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import type { Brand, CreateBrandDto, UpdateBrandDto, BrandFilters, BatchImportResult } from '@/types/brand'
import type { BrandQueryParams } from '@/types/brand'
import { BrandStatus } from '@/types/brand'
import { createStorageError, createValidationError, createNetworkError } from '@/types/error'
import { getApiClient } from '@/services/apiClient'
import { initializeMockApiService } from '@/services/mockApiService'
import { brandService } from '@/services/brandService'
import { useUIStore } from './uiStore'
import { useDataCache } from '@/composables/useDataCache'

/**
 * 品牌 Store 状态接口
 */
interface BrandState {
  /** 品牌列表 */
  brands: Brand[]
  /** 当前品牌（用于编辑） */
  currentBrand: Brand | null
  /** 搜索关键词 */
  searchKeyword: string
  /** 筛选条件 */
  filters: BrandFilters
  /** 分页信息 */
  pagination: {
    current: number
    pageSize: number
    total: number
  }
}

/**
 * 品牌 Pinia Store
 * 
 * 管理品牌数据状态和业务逻辑，提供品牌 CRUD 操作、搜索筛选等功能
 * 
 * **架构模式**：
 * - 使用 Setup Store 语法（Composition API 风格）
 * - 通过 API 客户端与后端通信
 * - 使用 UI Store 管理加载状态
 * - 使用品牌服务进行数据验证
 * 
 * **验证需求：1.1, 2.1, 2.4, 3.1, 4.1, 5.1, 5.2, 7.6, 8.1**
 */
export const useBrandStore = defineStore('brand', () => {
  // ==================== 状态定义 ====================
  
  /**
   * 品牌状态
   */
  const state = reactive<BrandState>({
    brands: [],
    currentBrand: null,
    searchKeyword: '',
    filters: {},
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    }
  })

  /**
   * API 错误状态
   */
  const apiError = ref<string | null>(null)

  /**
   * 请求取消管理
   * 存储操作类型到请求ID的映射，用于取消正在进行的请求
   */
  const activeRequests = new Map<string, string>()

  // ==================== 依赖注入 ====================
  
  /**
   * 获取 API 客户端实例
   */
  const apiClient = getApiClient()

  /**
   * 获取 UI Store 实例（用于管理加载状态）
   */
  const uiStore = useUIStore()

  /**
   * 初始化模拟 API 服务
   */
  initializeMockApiService()

  /**
   * 数据缓存实例
   * 
   * 配置：
   * - TTL: 5 分钟（品牌数据变化不频繁）
   * - 最大缓存数: 20（限制内存使用）
   */
  const dataCache = useDataCache<Brand[]>({
    ttl: 5 * 60 * 1000, // 5 分钟
    maxSize: 20
  })

  // ==================== 计算属性 ====================
  
  /**
   * 加载状态（从 UI Store 获取）
   */
  const isLoading = computed(() => uiStore.loading)

  /**
   * 过滤后的品牌列表
   * 
   * 根据搜索关键词和筛选条件过滤品牌列表
   * 
   * **验证需求：5.1, 5.2, 5.3**
   */
  const filteredBrands = computed(() => {
    let result = state.brands

    // 应用搜索关键词（需求 5.1）
    if (state.searchKeyword) {
      const keyword = state.searchKeyword.toLowerCase()
      result = result.filter(brand =>
        brand.name.toLowerCase().includes(keyword) ||
        brand.code.toLowerCase().includes(keyword)
      )
    }

    // 应用状态筛选（需求 5.2）
    if (state.filters.status) {
      result = result.filter(brand => brand.status === state.filters.status)
    }

    return result
  })

  /**
   * 品牌数量
   */
  const brandCount = computed(() => state.brands.length)

  /**
   * 是否有品牌
   */
  const hasBrands = computed(() => state.brands.length > 0)

  // ==================== 辅助函数 ====================
  
  /**
   * 错误处理辅助函数
   * 
   * 统一处理 API 错误，提取错误消息并创建相应的错误对象
   * 
   * @param error 错误对象
   * @param defaultMessage 默认错误消息
   * @throws {AppError} 抛出格式化的应用错误
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('[BrandStore] API 错误:', error)
    
    if (error.response?.data?.errors) {
      // 服务器返回的验证错误
      apiError.value = error.response.data.errors.join(', ')
    } else if (error.userMessage) {
      // API 客户端处理的错误消息
      apiError.value = error.userMessage
    } else if (error.message) {
      // 通用错误消息
      apiError.value = error.message
    } else {
      // 默认错误消息
      apiError.value = defaultMessage
    }
    
    // 根据错误类型创建相应的错误对象
    if (error.errorType === 'NETWORK_ERROR') {
      throw createNetworkError(apiError.value || defaultMessage, error)
    } else if (error.response?.status === 422) {
      throw createValidationError(apiError.value || defaultMessage, error.response.data.errors || [])
    } else {
      throw createStorageError(apiError.value || defaultMessage, error)
    }
  }

  /**
   * 取消之前的同类型请求
   * 
   * @param operationType 操作类型
   */
  const cancelPreviousRequest = (operationType: string) => {
    const previousRequestId = activeRequests.get(operationType)
    if (previousRequestId) {
      console.log(`[BrandStore] 取消之前的 ${operationType} 请求:`, previousRequestId)
      apiClient.cancelRequest(previousRequestId)
      activeRequests.delete(operationType)
    }
  }

  /**
   * 跟踪请求
   * 
   * @param operationType 操作类型
   * @param requestId 请求ID
   */
  const trackRequest = (operationType: string, requestId: string) => {
    activeRequests.set(operationType, requestId)
  }

  /**
   * 取消跟踪请求
   * 
   * @param operationType 操作类型
   */
  const untrackRequest = (operationType: string) => {
    activeRequests.delete(operationType)
  }

  // ==================== 公共方法 ====================
  
  /**
   * 取消指定类型的请求
   * 
   * @param operationType 操作类型
   */
  const cancelRequest = (operationType: string) => {
    cancelPreviousRequest(operationType)
  }

  /**
   * 取消所有正在进行的请求
   */
  const cancelAllRequests = () => {
    console.log('[BrandStore] 取消所有正在进行的请求')
    apiClient.cancelAllRequests()
    activeRequests.clear()
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    apiError.value = null
  }

  // ==================== API 方法 ====================
  
  /**
   * 获取品牌列表（通过 API）
   * 
   * 从后端获取品牌列表数据，支持搜索和筛选参数
   * 
   * **性能优化**：
   * - 使用数据缓存减少 API 请求
   * - 支持请求取消避免竞态条件
   * 
   * @param params 查询参数（搜索、筛选、分页）
   * 
   * **验证需求：1.1, 8.1**
   */
  const fetchBrands = async (params?: BrandQueryParams) => {
    const operationType = 'fetchBrands'
    
    // 生成缓存键
    const cacheKey = dataCache.generateKey('brands', params)
    
    // 检查缓存
    const cachedData = dataCache.get(cacheKey)
    if (cachedData) {
      console.log(`[BrandStore] 使用缓存数据: ${cacheKey}`)
      state.brands.splice(0, state.brands.length, ...cachedData)
      state.pagination.total = state.brands.length
      return
    }
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      const response = await apiClient.getBrands(params, requestId)
      
      // 清空数组并添加新数据，保持响应性
      state.brands.splice(0, state.brands.length, ...response.data)
      state.pagination.total = state.brands.length
      
      // 缓存数据
      dataCache.set(cacheKey, response.data)
      
      console.log(`[BrandStore] 成功获取 ${response.data.length} 个品牌`)
      console.log(`[BrandStore] state.brands.length =`, state.brands.length)
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[BrandStore] ${operationType} 请求被取消`)
        return
      }
      handleApiError(error, '获取品牌列表失败')
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  /**
   * 根据搜索和筛选条件刷新品牌列表
   * 
   * 根据当前的搜索关键词和筛选条件重新获取品牌列表
   * 
   * **验证需求：5.1, 5.2, 5.3**
   */
  const refreshBrands = async () => {
    console.log('[BrandStore] refreshBrands 被调用')
    console.log('[BrandStore] 当前搜索关键词:', state.searchKeyword)
    console.log('[BrandStore] 当前筛选条件:', state.filters)
    
    const params: BrandQueryParams = {}
    
    if (state.searchKeyword) {
      params.search = state.searchKeyword
    }
    
    if (state.filters.status) {
      params.status = state.filters.status
    }
    
    console.log('[BrandStore] 调用 fetchBrands，参数:', params)
    await fetchBrands(params)
    console.log('[BrandStore] fetchBrands 完成，品牌数量:', state.brands.length)
  }

  /**
   * 根据 ID 获取品牌（同步，仅查找本地缓存）
   * 
   * @param brandId 品牌ID
   * @returns 品牌对象，如果不存在则返回 undefined
   * 
   * **验证需求：3.2**
   */
  const getBrandById = (brandId: string): Brand | undefined => {
    return state.brands.find(brand => brand.id === brandId)
  }

  /**
   * 创建品牌（通过 API）
   * 
   * 创建新品牌，包含客户端验证和唯一性检查
   * 
   * @param brandData 品牌数据
   * @returns 创建的品牌对象
   * @throws {AppError} 验证失败或创建失败时抛出错误
   * 
   * **验证需求：2.1, 2.2, 2.3, 2.4, 8.1**
   */
  const createBrand = async (brandData: CreateBrandDto): Promise<Brand> => {
    const operationType = 'createBrand'
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      // 客户端验证 - 在 API 调用前执行（需求 2.2, 2.3）
      console.log('[BrandStore] 执行客户端验证...')
      await brandService.validateBrandDataWithError(brandData)
      console.log('[BrandStore] 客户端验证通过')
      
      // 检查品牌编码唯一性（需求 2.4）
      const isUnique = brandService.isBrandCodeUnique(brandData.code, state.brands)
      if (!isUnique) {
        throw createValidationError('品牌编码已存在', ['品牌编码必须唯一'])
      }
      
      // 格式化品牌数据
      const formattedData = brandService.formatBrandData(brandData)
      
      // 验证通过后发送 API 请求
      const response = await apiClient.createBrand(formattedData, requestId)
      const newBrand = response.data
      
      // 更新本地状态
      state.brands.push(newBrand)
      state.pagination.total = state.brands.length
      
      // 清除缓存，确保下次获取最新数据
      clearCache()
      
      console.log('[BrandStore] 品牌创建成功:', newBrand.id)
      return newBrand
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[BrandStore] ${operationType} 请求被取消`)
        throw error
      }
      
      // 如果是验证错误，直接抛出，不发送 API 请求
      if (error.type === 'VALIDATION_ERROR') {
        console.log('[BrandStore] 客户端验证失败，阻止 API 请求')
        throw error
      }
      
      // 其他错误通过统一错误处理
      handleApiError(error, '创建品牌失败')
      throw error // 重新抛出错误供组件处理
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  /**
   * 更新品牌（通过 API）
   * 
   * 更新现有品牌信息，包含客户端验证和唯一性检查
   * 
   * @param brandId 品牌ID
   * @param brandData 更新的品牌数据
   * @returns 更新后的品牌对象
   * @throws {AppError} 验证失败或更新失败时抛出错误
   * 
   * **验证需求：3.1, 3.3, 3.4, 8.1**
   */
  const updateBrand = async (brandId: string, brandData: UpdateBrandDto): Promise<Brand> => {
    if (!brandId) {
      throw createValidationError('品牌ID不能为空', ['品牌ID是必需的'])
    }
    
    const operationType = `updateBrand_${brandId}`
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      // 客户端验证 - 在 API 调用前执行（需求 3.3）
      console.log('[BrandStore] 执行客户端验证...')
      await brandService.validateBrandDataWithError(brandData)
      console.log('[BrandStore] 客户端验证通过')
      
      // 如果更新了品牌编码，检查唯一性（需求 3.4）
      if (brandData.code) {
        const isUnique = brandService.isBrandCodeUnique(brandData.code, state.brands, brandId)
        if (!isUnique) {
          throw createValidationError('品牌编码已存在', ['品牌编码必须唯一'])
        }
      }
      
      // 验证通过后发送 API 请求
      const response = await apiClient.updateBrand(brandId, brandData, requestId)
      const updatedBrand = response.data
      
      // 更新本地状态
      const index = state.brands.findIndex(brand => brand.id === brandId)
      if (index !== -1) {
        state.brands[index] = updatedBrand
      }
      
      // 如果更新的是当前品牌，也更新当前品牌状态
      if (state.currentBrand && state.currentBrand.id === brandId) {
        state.currentBrand = updatedBrand
      }
      
      // 清除缓存，确保下次获取最新数据
      clearCache()
      
      console.log('[BrandStore] 品牌更新成功:', updatedBrand.id)
      return updatedBrand
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[BrandStore] ${operationType} 请求被取消`)
        throw error
      }
      
      // 如果是验证错误，直接抛出，不发送 API 请求
      if (error.type === 'VALIDATION_ERROR') {
        console.log('[BrandStore] 客户端验证失败，阻止 API 请求')
        throw error
      }
      
      // 其他错误通过统一错误处理
      handleApiError(error, '更新品牌失败')
      throw error // 重新抛出错误供组件处理
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  /**
   * 删除品牌（通过 API）
   * 
   * 从系统中删除指定的品牌
   * 
   * @param brandId 品牌ID
   * @throws {AppError} 删除失败时抛出错误
   * 
   * **验证需求：4.1, 4.2, 8.1**
   */
  const deleteBrand = async (brandId: string): Promise<void> => {
    if (!brandId) {
      throw createValidationError('品牌ID不能为空', ['品牌ID是必需的'])
    }
    
    const operationType = `deleteBrand_${brandId}`
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      await apiClient.deleteBrand(brandId, requestId)
      
      // 更新本地状态（需求 4.2）
      const index = state.brands.findIndex(brand => brand.id === brandId)
      if (index !== -1) {
        state.brands.splice(index, 1)
        state.pagination.total = state.brands.length
      }
      
      // 如果删除的是当前品牌，清空当前品牌
      if (state.currentBrand && state.currentBrand.id === brandId) {
        state.currentBrand = null
      }
      
      // 清除缓存，确保下次获取最新数据
      clearCache()
      
      console.log('[BrandStore] 品牌删除成功:', brandId)
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[BrandStore] ${operationType} 请求被取消`)
        throw error
      }
      
      handleApiError(error, '删除品牌失败')
      throw error // 重新抛出错误供组件处理
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  /**
   * 批量导入品牌（通过 API）
   * 
   * 批量创建多个品牌，返回导入结果统计
   * 
   * @param brandsData 品牌数据数组
   * @returns 批量导入结果，包含成功数量、失败数量和错误详情
   * @throws {AppError} 导入失败时抛出错误
   * 
   * **验证需求：7.6, 7.7, 7.8, 8.1**
   */
  const batchImportBrands = async (brandsData: CreateBrandDto[]): Promise<BatchImportResult> => {
    const operationType = 'batchImportBrands'
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      // 发送批量导入请求
      const response = await apiClient.batchCreateBrands(brandsData, requestId)
      const result = response.data
      
      // 清除缓存，确保下次获取最新数据
      clearCache()
      
      // 刷新品牌列表以获取最新数据（需求 7.8）
      await fetchBrands()
      
      console.log('[BrandStore] 批量导入完成:', result)
      return result
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[BrandStore] ${operationType} 请求被取消`)
        throw error
      }
      
      handleApiError(error, '批量导入品牌失败')
      throw error // 重新抛出错误供组件处理
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  // ==================== 状态管理方法 ====================
  
  /**
   * 设置搜索关键词并刷新数据
   * 
   * @param keyword 搜索关键词
   * 
   * **验证需求：5.1**
   */
  const setSearchKeyword = async (keyword: string) => {
    state.searchKeyword = keyword
    // 自动刷新品牌列表以应用搜索
    try {
      await refreshBrands()
    } catch (error: any) {
      // 忽略请求取消错误，其他错误继续抛出
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        throw error
      }
    }
  }

  /**
   * 设置筛选状态并刷新数据
   * 
   * @param status 品牌状态筛选条件
   * 
   * **验证需求：5.2**
   */
  const setFilterStatus = async (status: BrandStatus | undefined) => {
    state.filters.status = status
    // 自动刷新品牌列表以应用筛选
    try {
      await refreshBrands()
    } catch (error: any) {
      // 忽略请求取消错误，其他错误继续抛出
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        throw error
      }
    }
  }

  /**
   * 设置当前品牌（用于编辑）
   * 
   * @param brand 品牌对象或 null
   */
  const setCurrentBrand = (brand: Brand | null) => {
    state.currentBrand = brand
  }

  /**
   * 初始化 Store
   * 
   * 从后端加载初始品牌数据
   */
  const initialize = async () => {
    console.log('[BrandStore] 正在初始化...')
    await fetchBrands()
  }

  /**
   * 清除所有缓存
   * 
   * 在数据变更操作（创建、更新、删除）后调用，确保数据一致性
   */
  const clearCache = () => {
    dataCache.clear()
    console.log('[BrandStore] 缓存已清除')
  }

  /**
   * 打印缓存统计信息
   */
  const printCacheStats = () => {
    dataCache.printStats()
  }

  /**
   * 清空所有数据
   */
  const clearAll = () => {
    state.brands = []
    state.currentBrand = null
    state.searchKeyword = ''
    state.filters = {}
    state.pagination = {
      current: 1,
      pageSize: 10,
      total: 0
    }
    clearError()
    clearCache()
    console.log('[BrandStore] 所有数据已清空')
  }

  /**
   * 重置搜索和筛选条件
   * 
   * **验证需求：5.5**
   */
  const resetFilters = async () => {
    console.log('[BrandStore] 重置筛选条件')
    state.searchKeyword = ''
    state.filters = {}
    await refreshBrands()
  }

  /**
   * 重置 Store（Pinia 内置方法）
   * 
   * 将 Store 重置为初始状态
   */
  const $reset = () => {
    clearAll()
  }

  // ==================== 返回公开的状态和方法 ====================
  
  return {
    // 状态（只读）
    brands: computed(() => state.brands),
    currentBrand: computed(() => state.currentBrand),
    searchKeyword: computed(() => state.searchKeyword),
    filterStatus: computed(() => state.filters.status),
    pagination: computed(() => state.pagination),
    
    // 加载状态和错误状态
    isLoading,
    apiError: computed(() => apiError.value),
    
    // 计算属性
    filteredBrands,
    brandCount,
    hasBrands,
    
    // API 方法（异步）
    initialize,
    fetchBrands,
    refreshBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    batchImportBrands,
    
    // 状态管理方法
    setSearchKeyword,
    setFilterStatus,
    setCurrentBrand,
    clearError,
    clearAll,
    resetFilters,
    $reset,
    
    // 请求取消方法
    cancelRequest,
    cancelAllRequests,
    
    // 缓存管理方法
    clearCache,
    printCacheStats
  }
})

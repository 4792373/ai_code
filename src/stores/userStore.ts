import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import type { User, CreateUserData, UpdateUserData, UserFilters } from '@/types/user'
import type { UserQueryParams } from '@/types/api'
import { createStorageError, createUserNotFoundError, createNetworkError, createValidationError } from '@/types/error'
import { getApiClient } from '@/services/apiClient'
import { initializeMockApiService } from '@/services/mockApiService'
import { userService } from '@/services/userService'
import { useUIStore } from './uiStore'

interface UserState {
  users: User[]
  currentUser: User | null
  searchKeyword: string
  filters: UserFilters
  pagination: {
    current: number
    pageSize: number
    total: number
  }
}

export const useUserStore = defineStore('user', () => {
  const state = reactive<UserState>({
    users: [],
    currentUser: null,
    searchKeyword: '',
    filters: {},
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    }
  })

  // API 错误状态
  const apiError = ref<string | null>(null)

  // 请求取消管理
  const activeRequests = new Map<string, string>() // 操作类型 -> 请求ID

  // 获取 API 客户端实例
  const apiClient = getApiClient()

  // 获取 UI Store 实例（用于管理加载状态）
  const uiStore = useUIStore()

  // 初始化模拟 API 服务
  initializeMockApiService()

  // 计算属性 - 加载状态（从 UI Store 获取）
  const isLoading = computed(() => uiStore.loading)

  // 计算属性 - 过滤后的用户列表
  const filteredUsers = computed(() => {
    return state.users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(state.searchKeyword.toLowerCase()) || 
                           user.email.toLowerCase().includes(state.searchKeyword.toLowerCase())
      const matchesRole = !state.filters.role || user.role === state.filters.role
      const matchesStatus = !state.filters.status || user.status === state.filters.status
      
      return matchesSearch && matchesRole && matchesStatus
    })
  })

  // 错误处理辅助函数
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('[UserStore] API 错误:', error)
    
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
    } else if (error.response?.status === 404) {
      throw createUserNotFoundError(error.response.data.message || '用户不存在')
    } else {
      throw createStorageError(apiError.value || defaultMessage, error)
    }
  }

  // 请求管理辅助函数
  const cancelPreviousRequest = (operationType: string) => {
    const previousRequestId = activeRequests.get(operationType)
    if (previousRequestId) {
      console.log(`[UserStore] 取消之前的 ${operationType} 请求:`, previousRequestId)
      apiClient.cancelRequest(previousRequestId)
      activeRequests.delete(operationType)
    }
  }

  const trackRequest = (operationType: string, requestId: string) => {
    activeRequests.set(operationType, requestId)
  }

  const untrackRequest = (operationType: string) => {
    activeRequests.delete(operationType)
  }

  // 取消指定类型的请求
  const cancelRequest = (operationType: string) => {
    cancelPreviousRequest(operationType)
  }

  // 取消所有正在进行的请求
  const cancelAllRequests = () => {
    console.log('[UserStore] 取消所有正在进行的请求')
    apiClient.cancelAllRequests()
    activeRequests.clear()
  }

  // 清除错误状态
  const clearError = () => {
    apiError.value = null
  }

  // 获取用户列表（通过 API）
  const fetchUsers = async (params?: UserQueryParams) => {
    const operationType = 'fetchUsers'
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      const response = await apiClient.getUsers(params, requestId)
      
      // 清空数组并添加新数据，保持响应性
      state.users.splice(0, state.users.length, ...response.data)
      state.pagination.total = state.users.length
      
      console.log(`[UserStore] 成功获取 ${response.data.length} 个用户`)
      console.log(`[UserStore] state.users.length =`, state.users.length)
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[UserStore] ${operationType} 请求被取消`)
        return
      }
      handleApiError(error, '获取用户列表失败')
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  // 根据搜索和筛选条件刷新用户列表
  const refreshUsers = async () => {
    console.log('[UserStore] refreshUsers 被调用')
    console.log('[UserStore] 当前搜索关键词:', state.searchKeyword)
    console.log('[UserStore] 当前筛选条件:', state.filters)
    
    const params: UserQueryParams = {}
    
    if (state.searchKeyword) {
      params.search = state.searchKeyword
    }
    
    if (state.filters.role) {
      params.role = state.filters.role
    }
    
    if (state.filters.status) {
      params.status = state.filters.status
    }
    
    console.log('[UserStore] 调用 fetchUsers，参数:', params)
    await fetchUsers(params)
    console.log('[UserStore] fetchUsers 完成，用户数量:', state.users.length)
  }

  // 添加用户（通过 API）
  const addUser = async (userData: CreateUserData): Promise<User> => {
    const operationType = 'addUser'
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      // 客户端验证 - 在 API 调用前执行
      console.log('[UserStore] 执行客户端验证...')
      await userService.validateUserWithError(userData)
      console.log('[UserStore] 客户端验证通过')
      
      // 验证通过后发送 API 请求
      const response = await apiClient.createUser(userData, requestId)
      const newUser = response.data
      
      // 更新本地状态
      state.users.push(newUser)
      state.pagination.total = state.users.length
      
      console.log('[UserStore] 用户创建成功:', newUser.id)
      return newUser
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[UserStore] ${operationType} 请求被取消`)
        throw error
      }
      
      // 如果是验证错误，直接抛出，不发送 API 请求
      if (error.type === 'VALIDATION_ERROR') {
        console.log('[UserStore] 客户端验证失败，阻止 API 请求')
        throw error
      }
      
      // 其他错误通过统一错误处理
      handleApiError(error, '添加用户失败')
      throw error // 重新抛出错误供组件处理
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  // 更新用户（通过 API）
  const updateUser = async (userData: UpdateUserData): Promise<User> => {
    if (!userData.id) {
      throw createValidationError('用户ID不能为空', ['用户ID是必需的'])
    }
    
    const operationType = `updateUser_${userData.id}`
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      // 客户端验证 - 在 API 调用前执行
      console.log('[UserStore] 执行客户端验证...')
      await userService.validateUserWithError(userData)
      console.log('[UserStore] 客户端验证通过')
      
      // 验证通过后发送 API 请求
      const response = await apiClient.updateUser(userData.id, userData, requestId)
      const updatedUser = response.data
      
      // 更新本地状态
      const index = state.users.findIndex(user => user.id === userData.id)
      if (index !== -1) {
        state.users[index] = updatedUser
      }
      
      // 如果更新的是当前用户，也更新当前用户状态
      if (state.currentUser && state.currentUser.id === userData.id) {
        state.currentUser = updatedUser
      }
      
      console.log('[UserStore] 用户更新成功:', updatedUser.id)
      return updatedUser
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[UserStore] ${operationType} 请求被取消`)
        throw error
      }
      
      // 如果是验证错误，直接抛出，不发送 API 请求
      if (error.type === 'VALIDATION_ERROR') {
        console.log('[UserStore] 客户端验证失败，阻止 API 请求')
        throw error
      }
      
      // 其他错误通过统一错误处理
      handleApiError(error, '更新用户失败')
      throw error // 重新抛出错误供组件处理
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  // 删除用户（通过 API）
  const deleteUser = async (userId: string): Promise<void> => {
    if (!userId) {
      throw createValidationError('用户ID不能为空', ['用户ID是必需的'])
    }
    
    const operationType = `deleteUser_${userId}`
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      await apiClient.deleteUser(userId, requestId)
      
      // 更新本地状态
      const index = state.users.findIndex(user => user.id === userId)
      if (index !== -1) {
        state.users.splice(index, 1)
        state.pagination.total = state.users.length
      }
      
      // 如果删除的是当前用户，清空当前用户
      if (state.currentUser && state.currentUser.id === userId) {
        state.currentUser = null
      }
      
      console.log('[UserStore] 用户删除成功:', userId)
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[UserStore] ${operationType} 请求被取消`)
        throw error
      }
      
      handleApiError(error, '删除用户失败')
      throw error // 重新抛出错误供组件处理
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  // 设置搜索关键词并刷新数据
  const setSearchKeyword = async (keyword: string) => {
    state.searchKeyword = keyword
    // 自动刷新用户列表以应用搜索
    try {
      await refreshUsers()
    } catch (error: any) {
      // 忽略请求取消错误，其他错误继续抛出
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        throw error
      }
    }
  }

  // 设置筛选条件并刷新数据
  const setFilters = async (filters: UserFilters) => {
    state.filters = { ...filters }
    // 自动刷新用户列表以应用筛选
    try {
      await refreshUsers()
    } catch (error: any) {
      // 忽略请求取消错误，其他错误继续抛出
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        throw error
      }
    }
  }

  // 设置当前用户（用于编辑）
  const setCurrentUser = (user: User | null) => {
    state.currentUser = user
  }

  // 根据ID获取用户（同步，仅查找本地缓存）
  const getUserById = (userId: string): User | undefined => {
    return state.users.find(user => user.id === userId)
  }

  // 根据ID获取用户（通过 API）
  const fetchUserById = async (userId: string): Promise<User | null> => {
    if (!userId) {
      return null
    }
    
    // 首先检查本地缓存
    const cachedUser = state.users.find(user => user.id === userId)
    if (cachedUser) {
      return cachedUser
    }
    
    const operationType = `fetchUserById_${userId}`
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    // 如果本地没有，通过 API 获取
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      const response = await apiClient.getUserById(userId, requestId)
      const user = response.data
      
      // 更新本地缓存
      const existingIndex = state.users.findIndex(u => u.id === userId)
      if (existingIndex !== -1) {
        state.users[existingIndex] = user
      } else {
        state.users.push(user)
        state.pagination.total = state.users.length
      }
      
      return user
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[UserStore] ${operationType} 请求被取消`)
        return null
      }
      
      if (error.response?.status === 404) {
        // 用户不存在，返回 null 而不是抛出错误
        return null
      }
      handleApiError(error, '获取用户信息失败')
      throw error
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  // 刷新指定用户的信息
  const refreshUser = async (userId: string): Promise<User | null> => {
    if (!userId) {
      return null
    }
    
    const operationType = `refreshUser_${userId}`
    
    // 取消之前的同类型请求
    cancelPreviousRequest(operationType)
    
    uiStore.setLoading(true)
    clearError()
    
    // 生成请求ID并跟踪
    const requestId = `${operationType}_${Date.now()}`
    trackRequest(operationType, requestId)
    
    try {
      const response = await apiClient.getUserById(userId, requestId)
      const user = response.data
      
      // 更新本地状态
      const index = state.users.findIndex(u => u.id === userId)
      if (index !== -1) {
        state.users[index] = user
      } else {
        state.users.push(user)
        state.pagination.total = state.users.length
      }
      
      // 如果是当前用户，也更新当前用户状态
      if (state.currentUser && state.currentUser.id === userId) {
        state.currentUser = user
      }
      
      return user
    } catch (error: any) {
      // 如果是请求被取消，不处理错误
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(`[UserStore] ${operationType} 请求被取消`)
        return null
      }
      
      if (error.response?.status === 404) {
        // 用户不存在，从本地状态中移除
        const index = state.users.findIndex(u => u.id === userId)
        if (index !== -1) {
          state.users.splice(index, 1)
          state.pagination.total = state.users.length
        }
        
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser = null
        }
        
        return null
      }
      handleApiError(error, '刷新用户信息失败')
      throw error
    } finally {
      untrackRequest(operationType)
      uiStore.setLoading(false)
    }
  }

  // 初始化 Store（替代 loadFromLocalStorage）
  const initialize = async () => {
    console.log('[UserStore] 正在初始化...')
    await fetchUsers()
  }

  // 清空所有数据
  const clearAll = () => {
    state.users = []
    state.currentUser = null
    state.searchKeyword = ''
    state.filters = {}
    state.pagination = {
      current: 1,
      pageSize: 10,
      total: 0
    }
    clearError()
    console.log('[UserStore] 所有数据已清空')
  }

  // 重置搜索和筛选条件
  const resetFilters = async () => {
    console.log('[UserStore] 重置筛选条件')
    state.searchKeyword = ''
    state.filters = {}
    await refreshUsers()
  }

  return {
    // 状态（只读）
    users: computed(() => state.users),
    currentUser: computed(() => state.currentUser),
    searchKeyword: computed(() => state.searchKeyword),
    filters: computed(() => state.filters),
    pagination: computed(() => state.pagination),
    
    // 新增：加载状态和错误状态
    isLoading,
    apiError: computed(() => apiError.value),
    
    // 计算属性
    filteredUsers,
    
    // API 方法（异步）
    initialize,
    fetchUsers,
    refreshUsers,
    addUser,
    updateUser,
    deleteUser,
    fetchUserById,
    refreshUser,
    
    // 状态管理方法
    setSearchKeyword,
    setFilters,
    setCurrentUser,
    getUserById,
    clearError,
    clearAll,
    resetFilters,
    
    // 请求取消方法
    cancelRequest,
    cancelAllRequests
  }
})
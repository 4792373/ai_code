import axios, { type AxiosInstance, type AxiosResponse, type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { 
  ApiResponse, 
  ApiClientConfig, 
  UserQueryParams
} from '@/types/api'
import type { User, CreateUserData, UpdateUserData } from '@/types/user'
import type { 
  Brand, 
  CreateBrandDto, 
  UpdateBrandDto, 
  BrandQueryParams,
  BatchImportResult
} from '@/types/brand'
import { getAppConfig, isApiLoggingEnabled, useMockApi } from '@/services/configService'
import { getErrorHandler } from '@/services/errorHandler'
import { getMockApiService } from '@/services/mockApiService'

/**
 * 模拟API适配器
 * 拦截axios请求并使用模拟API服务处理
 */
const mockApiAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const mockService = getMockApiService()
  const { method = 'get', url = '', params } = config
  
  // 解析请求数据（axios会将data序列化为JSON字符串）
  let data = config.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (e) {
      // 如果解析失败，保持原样
    }
  }
  
  try {
    let response: ApiResponse<any>
    
    // 根据请求方法和URL路由到相应的模拟API处理器
    
    // ==================== 用户管理端点 ====================
    if (method.toLowerCase() === 'get' && url.includes('/users')) {
      if (url.match(/\/users\/[^/]+$/)) {
        // GET /api/users/:id
        const id = url.split('/').pop()!
        response = await mockService.handleGetUserById(id)
      } else {
        // GET /api/users
        response = await mockService.handleGetUsers(params)
      }
    } else if (method.toLowerCase() === 'post' && url.includes('/users')) {
      // POST /api/users
      response = await mockService.handleCreateUser(data)
    } else if (method.toLowerCase() === 'put' && url.match(/\/users\/[^/]+$/)) {
      // PUT /api/users/:id
      const id = url.split('/').pop()!
      response = await mockService.handleUpdateUser(id, data)
    } else if (method.toLowerCase() === 'delete' && url.includes('/users/batch')) {
      // DELETE /api/users/batch
      response = await mockService.handleBatchDeleteUsers(data.userIds)
    } else if (method.toLowerCase() === 'delete' && url.match(/\/users\/[^/]+$/)) {
      // DELETE /api/users/:id
      const id = url.split('/').pop()!
      response = await mockService.handleDeleteUser(id)
    }
    
    // ==================== 品牌管理端点 ====================
    else if (method.toLowerCase() === 'get' && url.includes('/brands')) {
      if (url.match(/\/brands\/[^/]+$/)) {
        // GET /api/brands/:id
        const id = url.split('/').pop()!
        response = await mockService.handleGetBrandById(id)
      } else {
        // GET /api/brands
        response = await mockService.handleGetBrands(params)
      }
    } else if (method.toLowerCase() === 'post' && url.includes('/brands/batch')) {
      // POST /api/brands/batch
      response = await mockService.handleBatchCreateBrands(data)
    } else if (method.toLowerCase() === 'post' && url.includes('/brands')) {
      // POST /api/brands
      response = await mockService.handleCreateBrand(data)
    } else if (method.toLowerCase() === 'put' && url.match(/\/brands\/[^/]+$/)) {
      // PUT /api/brands/:id
      const id = url.split('/').pop()!
      response = await mockService.handleUpdateBrand(id, data)
    } else if (method.toLowerCase() === 'delete' && url.match(/\/brands\/[^/]+$/)) {
      // DELETE /api/brands/:id
      const id = url.split('/').pop()!
      response = await mockService.handleDeleteBrand(id)
    }
    
    else {
      throw new Error(`未处理的模拟API请求: ${method.toUpperCase()} ${url}`)
    }
    
    // 返回符合axios格式的响应
    return {
      data: response,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config as any,
      request: {}
    }
  } catch (error: any) {
    // 将模拟API错误转换为axios错误格式
    const axiosError: any = new Error(error.message)
    axiosError.config = config
    axiosError.response = error.response || {
      data: {
        success: false,
        message: error.message,
        errors: [error.message]
      },
      status: error.response?.status || 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: config as any
    }
    axiosError.isAxiosError = true
    throw axiosError
  }
}

/**
 * API 客户端类
 * 提供统一的 HTTP 请求接口，包含请求/响应拦截器和错误处理
 */
class ApiClient {
  private axiosInstance: AxiosInstance
  private cancelTokens: Map<string, AbortController> = new Map()
  private errorHandler = getErrorHandler()

  constructor(config: ApiClientConfig) {
    // 创建 axios 实例
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      // 如果启用了模拟API，使用自定义适配器
      ...(useMockApi() ? { adapter: mockApiAdapter as any } : {})
    })

    // 设置请求拦截器
    this.setupRequestInterceptor()
    
    // 设置响应拦截器
    this.setupResponseInterceptor()
  }

  /**
   * 设置请求拦截器
   * 添加通用配置和请求日志
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 添加时间戳到请求头
        config.headers['X-Request-Time'] = new Date().toISOString()
        
        // 开发环境下记录请求日志
        if (import.meta.env.DEV && isApiLoggingEnabled()) {
          console.log(`[API 请求] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data
          })
        }
        
        return config
      },
      (error) => {
        console.error('[API 请求错误]', error)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 设置响应拦截器
   * 统一处理响应和错误
   */
  private setupResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 开发环境下记录响应日志
        if (import.meta.env.DEV && isApiLoggingEnabled()) {
          console.log(`[API 响应] ${response.status} ${response.config.url}`, response.data)
        }
        
        return response
      },
      (error: AxiosError) => {
        // 使用统一错误处理器处理错误
        const processedError = this.errorHandler.processApiError(error)
        
        // 将处理结果附加到错误对象中，保持向后兼容性
        ;(error as any).errorType = processedError.type
        ;(error as any).userMessage = processedError.userMessage
        ;(error as any).statusCode = processedError.statusCode
        ;(error as any).errorDetails = processedError.details
        
        return Promise.reject(error)
      }
    )
  }

  /**
   * 生成请求的唯一标识符
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * 取消指定的请求
   */
  public cancelRequest(requestId: string): void {
    const controller = this.cancelTokens.get(requestId)
    if (controller) {
      controller.abort()
      this.cancelTokens.delete(requestId)
    }
  }

  /**
   * 取消所有正在进行的请求
   */
  public cancelAllRequests(): void {
    this.cancelTokens.forEach((controller) => {
      controller.abort()
    })
    this.cancelTokens.clear()
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    config: AxiosRequestConfig,
    requestId?: string
  ): Promise<ApiResponse<T>> {
    // 生成请求ID
    const id = requestId || this.generateRequestId()
    
    // 创建取消控制器
    const controller = new AbortController()
    this.cancelTokens.set(id, controller)
    
    try {
      const response = await this.axiosInstance.request<ApiResponse<T>>({
        ...config,
        signal: controller.signal
      })
      
      // 请求完成后清理取消控制器
      this.cancelTokens.delete(id)
      
      return response.data
    } catch (error) {
      // 请求失败后清理取消控制器
      this.cancelTokens.delete(id)
      throw error
    }
  }

  // ==================== 用户相关 API 方法 ====================

  /**
   * 获取用户列表
   */
  public async getUsers(params?: UserQueryParams, requestId?: string): Promise<ApiResponse<User[]>> {
    return this.request<User[]>({
      method: 'GET',
      url: '/api/users',
      params
    }, requestId)
  }

  /**
   * 根据ID获取用户
   */
  public async getUserById(id: string, requestId?: string): Promise<ApiResponse<User>> {
    return this.request<User>({
      method: 'GET',
      url: `/api/users/${id}`
    }, requestId)
  }

  /**
   * 创建新用户
   */
  public async createUser(userData: CreateUserData, requestId?: string): Promise<ApiResponse<User>> {
    return this.request<User>({
      method: 'POST',
      url: '/api/users',
      data: userData
    }, requestId)
  }

  /**
   * 更新用户信息
   */
  public async updateUser(id: string, userData: UpdateUserData, requestId?: string): Promise<ApiResponse<User>> {
    return this.request<User>({
      method: 'PUT',
      url: `/api/users/${id}`,
      data: userData
    }, requestId)
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: string, requestId?: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/users/${id}`
    }, requestId)
  }

  /**
   * 批量删除用户
   * @param userIds 要删除的用户 ID 数组
   * @param requestId 请求ID（可选，用于取消请求）
   * @returns 批量删除结果响应
   */
  public async batchDeleteUsers(userIds: string[], requestId?: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: '/api/users/batch',
      data: { userIds },
      timeout: 5000
    }, requestId)
  }

  // ==================== 品牌相关 API 方法 ====================

  /**
   * 获取品牌列表
   * @param params 查询参数（搜索、筛选、分页）
   * @param requestId 请求ID（可选，用于取消请求）
   * @returns 品牌列表响应
   */
  public async getBrands(params?: BrandQueryParams, requestId?: string): Promise<ApiResponse<Brand[]>> {
    return this.request<Brand[]>({
      method: 'GET',
      url: '/api/brands',
      params
    }, requestId)
  }

  /**
   * 根据ID获取品牌
   * @param id 品牌ID
   * @param requestId 请求ID（可选，用于取消请求）
   * @returns 品牌详情响应
   */
  public async getBrandById(id: string, requestId?: string): Promise<ApiResponse<Brand>> {
    return this.request<Brand>({
      method: 'GET',
      url: `/api/brands/${id}`
    }, requestId)
  }

  /**
   * 创建新品牌
   * @param brandData 品牌数据
   * @param requestId 请求ID（可选，用于取消请求）
   * @returns 创建的品牌响应
   */
  public async createBrand(brandData: CreateBrandDto, requestId?: string): Promise<ApiResponse<Brand>> {
    return this.request<Brand>({
      method: 'POST',
      url: '/api/brands',
      data: brandData
    }, requestId)
  }

  /**
   * 更新品牌信息
   * @param id 品牌ID
   * @param brandData 更新的品牌数据
   * @param requestId 请求ID（可选，用于取消请求）
   * @returns 更新后的品牌响应
   */
  public async updateBrand(id: string, brandData: UpdateBrandDto, requestId?: string): Promise<ApiResponse<Brand>> {
    return this.request<Brand>({
      method: 'PUT',
      url: `/api/brands/${id}`,
      data: brandData
    }, requestId)
  }

  /**
   * 删除品牌
   * @param id 品牌ID
   * @param requestId 请求ID（可选，用于取消请求）
   * @returns 删除结果响应
   */
  public async deleteBrand(id: string, requestId?: string): Promise<ApiResponse<void>> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/brands/${id}`
    }, requestId)
  }

  /**
   * 批量创建品牌
   * @param brandsData 品牌数据数组
   * @param requestId 请求ID（可选，用于取消请求）
   * @returns 批量导入结果响应
   */
  public async batchCreateBrands(brandsData: CreateBrandDto[], requestId?: string): Promise<ApiResponse<BatchImportResult>> {
    return this.request<BatchImportResult>({
      method: 'POST',
      url: '/api/brands/batch',
      data: brandsData
    }, requestId)
  }

  /**
   * 获取 axios 实例（用于高级用法）
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance
  }
}

// 创建默认配置
const getDefaultConfig = (): ApiClientConfig => {
  const appConfig = getAppConfig()
  return {
    baseURL: appConfig.api.baseURL,
    timeout: appConfig.api.timeout,
    headers: {
      'Accept': 'application/json'
    }
  }
}

// 延迟创建 API 客户端实例
let apiClientInstance: ApiClient | null = null

/**
 * 获取 API 客户端实例（单例模式）
 */
export const getApiClient = (): ApiClient => {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient(getDefaultConfig())
  }
  return apiClientInstance
}

// 为了向后兼容，导出默认实例
export const apiClient = getApiClient()

// 导出类型和类
export type { ApiClient }
export { ApiClient as ApiClientClass }
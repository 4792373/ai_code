// API 响应接口
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: string
  errors?: string[]
}

// 分页响应接口
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    current: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// API 错误响应接口
export interface ApiErrorResponse {
  success: false
  message: string
  errors: string[]
  code: string
  timestamp: string
}

// HTTP 错误类型枚举
export enum HttpErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// 用户查询参数接口
export interface UserQueryParams {
  search?: string
  role?: string
  status?: string
  page?: number
  pageSize?: number
}

// API 客户端配置接口
export interface ApiClientConfig {
  baseURL: string
  timeout: number
  headers?: Record<string, string>
}

// 请求拦截器配置接口
export interface RequestInterceptorConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// 响应拦截器处理器接口
export interface ResponseInterceptorHandler {
  onSuccess(response: any): any
  onError(error: any): Promise<never>
}

// 测试数据配置接口
export interface TestDataConfig {
  userCount: number
  roles: string[]
  statuses: string[]
  locales: string[]
}
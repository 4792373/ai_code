// 错误处理类型
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  // 新增 HTTP 相关错误类型
  HTTP_CLIENT_ERROR = 'HTTP_CLIENT_ERROR',
  HTTP_SERVER_ERROR = 'HTTP_SERVER_ERROR',
  HTTP_TIMEOUT_ERROR = 'HTTP_TIMEOUT_ERROR',
  API_RESPONSE_ERROR = 'API_RESPONSE_ERROR'
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// 错误工厂函数
export const createValidationError = (message: string, errors?: string[]): AppError => ({
  type: ErrorType.VALIDATION_ERROR,
  message,
  details: { errors: errors || [] }
})

export const createStorageError = (message: string, details?: any): AppError => ({
  type: ErrorType.STORAGE_ERROR,
  message,
  details
})

export const createNetworkError = (message: string, details?: any): AppError => ({
  type: ErrorType.NETWORK_ERROR,
  message,
  details
})

export const createUserNotFoundError = (userId?: string): AppError => ({
  type: ErrorType.USER_NOT_FOUND,
  message: '用户不存在',
  details: { userId }
})

export const createDuplicateEmailError = (email: string): AppError => ({
  type: ErrorType.DUPLICATE_EMAIL,
  message: '邮箱已存在',
  details: { email }
})

// 新增 HTTP 错误创建器函数
export const createHttpClientError = (message: string, statusCode?: number, details?: any): AppError => ({
  type: ErrorType.HTTP_CLIENT_ERROR,
  message,
  details: { statusCode, ...details }
})

export const createHttpServerError = (message: string, statusCode?: number, details?: any): AppError => ({
  type: ErrorType.HTTP_SERVER_ERROR,
  message,
  details: { statusCode, ...details }
})

export const createHttpTimeoutError = (message: string, details?: any): AppError => ({
  type: ErrorType.HTTP_TIMEOUT_ERROR,
  message,
  details
})

export const createApiResponseError = (message: string, response?: any): AppError => ({
  type: ErrorType.API_RESPONSE_ERROR,
  message,
  details: { response }
})
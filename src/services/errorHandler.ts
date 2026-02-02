/**
 * 统一错误处理器服务
 * 提供不同错误类型的分类处理、控制台日志记录和用户友好的错误提示
 */

import type { AxiosError } from 'axios'
import { message } from 'ant-design-vue'
import type { AppError } from '@/types/error'
import { ErrorType } from '@/types/error'
import { HttpErrorType } from '@/types/api'
import { isErrorLoggingEnabled } from '@/services/configService'

/**
 * 错误处理器接口
 */
export interface ApiErrorHandler {
  handleNetworkError(error: AxiosError): void
  handleTimeoutError(error: AxiosError): void
  handleClientError(error: AxiosError): void
  handleServerError(error: AxiosError): void
  handleValidationError(error: AxiosError): void
  logError(error: Error, context: string): void
  processApiError(error: AxiosError): ProcessedError
}

/**
 * 处理后的错误信息
 */
export interface ProcessedError {
  type: HttpErrorType
  userMessage: string
  logMessage: string
  statusCode?: number
  details?: any
}

/**
 * 错误恢复策略接口
 */
export interface ErrorRecoveryStrategy {
  shouldRetry(error: AxiosError): boolean
  getRetryDelay(attemptNumber: number): number
  getMaxRetries(): number
}

/**
 * 统一错误处理器实现类
 */
class ErrorHandlerService implements ApiErrorHandler {
  private readonly recoveryStrategy: ErrorRecoveryStrategy

  constructor(recoveryStrategy?: ErrorRecoveryStrategy) {
    this.recoveryStrategy = recoveryStrategy || new DefaultErrorRecoveryStrategy()
  }

  /**
   * 处理网络连接错误
   * @param error Axios 错误对象
   */
  handleNetworkError(error: AxiosError): void {
    const userMessage = '网络连接失败，请检查网络设置'
    
    this.logError(error, '网络连接')
    this.showUserError(userMessage)
    
    // 将处理结果添加到错误对象中
    this.attachErrorInfo(error, HttpErrorType.NETWORK_ERROR, userMessage)
  }

  /**
   * 处理请求超时错误
   * @param error Axios 错误对象
   */
  handleTimeoutError(error: AxiosError): void {
    const userMessage = '请求超时，请检查网络连接或稍后重试'
    
    this.logError(error, '请求超时')
    this.showUserError(userMessage)
    
    this.attachErrorInfo(error, HttpErrorType.TIMEOUT_ERROR, userMessage)
  }

  /**
   * 处理客户端错误 (4xx)
   * @param error Axios 错误对象
   */
  handleClientError(error: AxiosError): void {
    const status = error.response?.status || 400
    const userMessage = this.getClientErrorMessage(status)
    
    this.logError(error, '客户端错误')
    
    // 对于验证错误，显示详细信息
    if (status === 422 && error.response?.data) {
      this.handleValidationError(error)
    } else {
      this.showUserError(userMessage)
    }
    
    this.attachErrorInfo(error, HttpErrorType.CLIENT_ERROR, userMessage, status)
  }

  /**
   * 处理服务器错误 (5xx)
   * @param error Axios 错误对象
   */
  handleServerError(error: AxiosError): void {
    const status = error.response?.status || 500
    const userMessage = this.getServerErrorMessage(status)
    
    this.logError(error, '服务器错误')
    this.showUserError(userMessage)
    
    this.attachErrorInfo(error, HttpErrorType.SERVER_ERROR, userMessage, status)
  }

  /**
   * 处理数据验证错误
   * @param error Axios 错误对象
   */
  handleValidationError(error: AxiosError): void {
    const responseData = error.response?.data as any
    const userMessage = '数据验证失败，请检查输入'
    
    this.logError(error, '数据验证')
    
    // 显示主要错误消息
    this.showUserError(userMessage)
    
    // 如果有详细的验证错误，逐个显示
    if (responseData?.errors && Array.isArray(responseData.errors)) {
      responseData.errors.slice(0, 3).forEach((errorMsg: string, index: number) => {
        setTimeout(() => {
          message.error(errorMsg)
        }, (index + 1) * 200)
      })
    }
    
    this.attachErrorInfo(error, HttpErrorType.VALIDATION_ERROR, userMessage, 422, responseData?.errors)
  }

  /**
   * 记录错误日志到控制台
   * @param error 错误对象
   * @param context 错误上下文
   */
  logError(error: Error, context: string): void {
    if (!isErrorLoggingEnabled()) {
      return
    }

    const timestamp = new Date().toISOString()
    const axiosError = error as AxiosError

    console.group(`🚨 [错误处理器] ${context} - ${timestamp}`)
    
    // 基本错误信息
    console.error('错误消息:', error.message)
    console.error('错误类型:', error.name)
    
    // Axios 特定信息
    if (axiosError.config) {
      console.error('请求配置:', {
        method: axiosError.config.method?.toUpperCase(),
        url: axiosError.config.url,
        baseURL: axiosError.config.baseURL,
        timeout: axiosError.config.timeout,
        headers: axiosError.config.headers
      })
    }
    
    // 响应信息
    if (axiosError.response) {
      console.error('响应信息:', {
        status: axiosError.response.status,
        statusText: axiosError.response.statusText,
        data: axiosError.response.data,
        headers: axiosError.response.headers
      })
    }
    
    // 错误代码和堆栈
    if (axiosError.code) {
      console.error('错误代码:', axiosError.code)
    }
    
    if (error.stack) {
      console.error('错误堆栈:', error.stack)
    }
    
    console.groupEnd()
  }

  /**
   * 处理 API 错误的主要入口点
   * @param error Axios 错误对象
   * @returns 处理后的错误信息
   */
  processApiError(error: AxiosError): ProcessedError {
    let processedError: ProcessedError

    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      // 超时错误
      this.handleTimeoutError(error)
      processedError = {
        type: HttpErrorType.TIMEOUT_ERROR,
        userMessage: '请求超时，请检查网络连接或稍后重试',
        logMessage: `请求超时: ${error.config?.url}`,
        details: { timeout: error.config?.timeout }
      }
    } else if (!error.response) {
      // 网络错误
      this.handleNetworkError(error)
      processedError = {
        type: HttpErrorType.NETWORK_ERROR,
        userMessage: '网络连接失败，请检查网络设置',
        logMessage: `网络错误: ${error.message}`,
        details: { code: error.code }
      }
    } else {
      // HTTP 状态码错误
      const status = error.response.status
      if (status >= 400 && status < 500) {
        this.handleClientError(error)
        processedError = {
          type: HttpErrorType.CLIENT_ERROR,
          userMessage: this.getClientErrorMessage(status),
          logMessage: `客户端错误 ${status}: ${error.config?.url}`,
          statusCode: status,
          details: error.response.data
        }
      } else if (status >= 500) {
        this.handleServerError(error)
        processedError = {
          type: HttpErrorType.SERVER_ERROR,
          userMessage: this.getServerErrorMessage(status),
          logMessage: `服务器错误 ${status}: ${error.config?.url}`,
          statusCode: status,
          details: error.response.data
        }
      } else {
        // 其他状态码
        this.logError(error, '未知HTTP状态码')
        processedError = {
          type: HttpErrorType.NETWORK_ERROR,
          userMessage: '未知错误，请稍后重试',
          logMessage: `未知状态码 ${status}: ${error.config?.url}`,
          statusCode: status,
          details: error.response.data
        }
      }
    }

    return processedError
  }

  /**
   * 获取客户端错误消息
   * @param status HTTP 状态码
   * @returns 用户友好的错误消息
   */
  private getClientErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return '请求参数错误，请检查输入数据'
      case 401:
        return '身份验证失败，请重新登录'
      case 403:
        return '没有权限执行此操作'
      case 404:
        return '请求的资源不存在'
      case 409:
        return '数据冲突，请刷新后重试'
      case 422:
        return '数据验证失败，请检查输入'
      case 429:
        return '请求过于频繁，请稍后重试'
      default:
        return '客户端请求错误，请检查输入'
    }
  }

  /**
   * 获取服务器错误消息
   * @param status HTTP 状态码
   * @returns 用户友好的错误消息
   */
  private getServerErrorMessage(status: number): string {
    switch (status) {
      case 500:
        return '服务器内部错误，请稍后重试'
      case 502:
        return '网关错误，服务暂时不可用'
      case 503:
        return '服务暂时不可用，请稍后重试'
      case 504:
        return '网关超时，请稍后重试'
      default:
        return '服务器错误，请稍后重试'
    }
  }

  /**
   * 显示用户错误消息
   * @param userMessage 用户友好的错误消息
   */
  private showUserError(userMessage: string): void {
    message.error(userMessage)
  }

  /**
   * 将错误处理信息附加到错误对象
   * @param error 原始错误对象
   * @param type 错误类型
   * @param userMessage 用户消息
   * @param statusCode 状态码（可选）
   * @param details 详细信息（可选）
   */
  private attachErrorInfo(
    error: AxiosError,
    type: HttpErrorType,
    userMessage: string,
    statusCode?: number,
    details?: any
  ): void {
    (error as any).errorType = type
    ;(error as any).userMessage = userMessage
    if (statusCode) {
      (error as any).statusCode = statusCode
    }
    if (details) {
      (error as any).errorDetails = details
    }
  }

  /**
   * 检查是否应该重试请求
   * @param error Axios 错误对象
   * @returns 是否应该重试
   */
  shouldRetry(error: AxiosError): boolean {
    return this.recoveryStrategy.shouldRetry(error)
  }

  /**
   * 获取重试延迟时间
   * @param attemptNumber 重试次数
   * @returns 延迟时间（毫秒）
   */
  getRetryDelay(attemptNumber: number): number {
    return this.recoveryStrategy.getRetryDelay(attemptNumber)
  }

  /**
   * 获取最大重试次数
   * @returns 最大重试次数
   */
  getMaxRetries(): number {
    return this.recoveryStrategy.getMaxRetries()
  }
}

/**
 * 默认错误恢复策略实现
 */
class DefaultErrorRecoveryStrategy implements ErrorRecoveryStrategy {
  /**
   * 判断是否应该重试请求
   * @param error Axios 错误对象
   * @returns 是否应该重试
   */
  shouldRetry(error: AxiosError): boolean {
    // 网络错误或5xx服务器错误可以重试
    if (!error.response) {
      return true // 网络错误
    }
    
    const status = error.response.status
    if (status >= 500 && status < 600) {
      return true // 5xx 服务器错误
    }
    
    // 特定的客户端错误可以重试
    if (status === 408 || status === 429) {
      return true // 请求超时或请求过于频繁
    }
    
    return false // 4xx 客户端错误通常不应重试
  }

  /**
   * 获取重试延迟时间（指数退避）
   * @param attemptNumber 重试次数（从1开始）
   * @returns 延迟时间（毫秒）
   */
  getRetryDelay(attemptNumber: number): number {
    // 指数退避：1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 4000)
  }

  /**
   * 获取最大重试次数
   * @returns 最大重试次数
   */
  getMaxRetries(): number {
    return 3
  }
}

// 单例实例
let errorHandlerInstance: ErrorHandlerService | null = null

/**
 * 获取错误处理器实例（单例模式）
 * @param recoveryStrategy 可选的错误恢复策略
 * @returns 错误处理器实例
 */
export const getErrorHandler = (recoveryStrategy?: ErrorRecoveryStrategy): ErrorHandlerService => {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandlerService(recoveryStrategy)
  }
  return errorHandlerInstance
}

/**
 * 处理 API 错误的便捷函数
 * @param error Axios 错误对象
 * @returns 处理后的错误信息
 */
export const handleApiError = (error: AxiosError): ProcessedError => {
  return getErrorHandler().processApiError(error)
}

/**
 * 创建与现有错误处理兼容的 AppError
 * @param processedError 处理后的错误信息
 * @returns AppError 对象
 */
export const createCompatibleAppError = (processedError: ProcessedError): AppError => {
  // 将 HttpErrorType 映射到 ErrorType
  let errorType: ErrorType
  
  switch (processedError.type) {
    case HttpErrorType.NETWORK_ERROR:
      errorType = ErrorType.NETWORK_ERROR
      break
    case HttpErrorType.TIMEOUT_ERROR:
      errorType = ErrorType.HTTP_TIMEOUT_ERROR
      break
    case HttpErrorType.CLIENT_ERROR:
      errorType = ErrorType.HTTP_CLIENT_ERROR
      break
    case HttpErrorType.SERVER_ERROR:
      errorType = ErrorType.HTTP_SERVER_ERROR
      break
    case HttpErrorType.VALIDATION_ERROR:
      errorType = ErrorType.VALIDATION_ERROR
      break
    default:
      errorType = ErrorType.UNKNOWN_ERROR
  }

  return {
    type: errorType,
    message: processedError.userMessage,
    details: {
      statusCode: processedError.statusCode,
      logMessage: processedError.logMessage,
      ...processedError.details
    }
  }
}

// 导出类型和默认实例
export { ErrorHandlerService, DefaultErrorRecoveryStrategy }
export const errorHandler = getErrorHandler()
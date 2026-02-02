import { message } from 'ant-design-vue'
import type { AppError } from '@/types/error'
import { ErrorType } from '@/types/error'

export const useErrorHandler = () => {
  /**
   * 处理应用程序错误
   * @param error 应用程序错误对象
   */
  const handleError = (error: AppError | Error | string) => {
    // 如果是字符串，转换为通用错误
    if (typeof error === 'string') {
      message.error(error)
      return
    }

    // 如果是普通 Error 对象，转换为 UNKNOWN_ERROR
    if (error instanceof Error && !('type' in error)) {
      console.error('Unexpected error:', error)
      message.error(error.message || '操作失败，请重试')
      return
    }

    // 处理 AppError
    const appError = error as AppError
    
    switch (appError.type) {
      case ErrorType.VALIDATION_ERROR:
        // 表单验证错误，显示具体错误信息
        message.error(appError.message || '输入数据验证失败')
        if (appError.details?.errors && Array.isArray(appError.details.errors)) {
          // 如果有多个验证错误，显示第一个
          appError.details.errors.forEach((err: string, index: number) => {
            if (index < 3) { // 最多显示3个错误
              setTimeout(() => message.error(err), index * 100)
            }
          })
        }
        break
        
      case ErrorType.NETWORK_ERROR:
        message.error('网络连接失败，请检查网络设置')
        console.error('Network error:', appError.details)
        break
        
      case ErrorType.STORAGE_ERROR:
        message.error('数据保存失败，请重试')
        console.error('Storage error:', appError.details)
        break
        
      case ErrorType.UNKNOWN_ERROR:
      default:
        message.error(appError.message || '操作失败，请重试')
        console.error('Unknown error:', appError.details)
    }
  }

  /**
   * 显示成功消息
   * @param msg 成功消息
   * @param duration 显示时长（秒），默认3秒
   */
  const showSuccess = (msg: string, duration = 3) => {
    message.success(msg, duration)
  }

  /**
   * 显示警告消息
   * @param msg 警告消息
   * @param duration 显示时长（秒），默认3秒
   */
  const showWarning = (msg: string, duration = 3) => {
    message.warning(msg, duration)
  }

  /**
   * 显示信息消息
   * @param msg 信息消息
   * @param duration 显示时长（秒），默认3秒
   */
  const showInfo = (msg: string, duration = 3) => {
    message.info(msg, duration)
  }

  /**
   * 显示加载消息
   * @param msg 加载消息
   * @param duration 显示时长（秒），默认0（不自动关闭）
   */
  const showLoading = (msg: string, duration = 0) => {
    return message.loading(msg, duration)
  }

  /**
   * 创建错误对象的辅助函数
   */
  const createError = (type: ErrorType, message: string, details?: any): AppError => {
    return {
      type,
      message,
      details
    }
  }

  /**
   * 包装异步操作，自动处理错误
   * @param operation 异步操作函数
   * @param errorMessage 自定义错误消息（可选，如果不提供则使用错误对象的消息）
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (error) {
      // 如果错误是 AppError 类型，优先使用其详细信息
      if (error && typeof error === 'object' && 'type' in error) {
        handleError(error as AppError)
      } else if (errorMessage) {
        // 如果提供了自定义错误消息，使用它
        handleError(errorMessage)
      } else {
        // 否则使用错误对象本身
        handleError(error as Error)
      }
      return null
    }
  }

  /**
   * 包装同步操作，自动处理错误
   * @param operation 同步操作函数
   * @param errorMessage 自定义错误消息
   */
  const withSyncErrorHandling = <T>(
    operation: () => T,
    errorMessage?: string
  ): T | null => {
    try {
      return operation()
    } catch (error) {
      if (errorMessage) {
        handleError(errorMessage)
      } else {
        handleError(error as Error)
      }
      return null
    }
  }

  return { 
    handleError,
    showSuccess,
    showWarning,
    showInfo,
    showLoading,
    createError,
    withErrorHandling,
    withSyncErrorHandling
  }
}
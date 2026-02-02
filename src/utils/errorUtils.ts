import { ErrorType, type AppError } from '@/types/error'

/**
 * 错误处理工具函数
 */

/**
 * 判断是否为 AppError
 */
export const isAppError = (error: any): error is AppError => {
  return !!(error && typeof error === 'object' && 'type' in error && 'message' in error)
}

/**
 * 将普通错误转换为 AppError
 */
export const toAppError = (error: unknown, defaultType: ErrorType = ErrorType.UNKNOWN_ERROR): AppError => {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    // 根据错误消息判断错误类型
    if (error.message.includes('localStorage') || error.message.includes('sessionStorage')) {
      return {
        type: ErrorType.STORAGE_ERROR,
        message: error.message,
        details: error
      }
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: error.message,
        details: error
      }
    }

    return {
      type: defaultType,
      message: error.message,
      details: error
    }
  }

  if (typeof error === 'string') {
    return {
      type: defaultType,
      message: error,
      details: null
    }
  }

  return {
    type: defaultType,
    message: '未知错误',
    details: error
  }
}

/**
 * 错误重试装饰器
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw toAppError(error)
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw toAppError(lastError)
}

/**
 * 安全执行函数，捕获所有错误
 */
export const safeExecute = <T>(
  operation: () => T,
  fallback?: T
): T | null => {
  try {
    return operation()
  } catch (error) {
    console.error('Safe execute error:', error)
    return fallback ?? null
  }
}

/**
 * 异步安全执行函数
 */
export const safeExecuteAsync = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    console.error('Safe execute async error:', error)
    return fallback ?? null
  }
}

/**
 * 创建错误边界函数
 */
export const createErrorBoundary = (
  onError: (error: AppError) => void
) => {
  return <T extends any[], R>(
    fn: (...args: T) => R
  ) => {
    return (...args: T): R | null => {
      try {
        const result = fn(...args)
        
        // 如果结果是 Promise，处理异步错误
        if (result instanceof Promise) {
          return result.catch((error) => {
            onError(toAppError(error))
            return null
          }) as R
        }
        
        return result
      } catch (error) {
        onError(toAppError(error))
        return null
      }
    }
  }
}

/**
 * 验证操作结果
 */
export const validateResult = <T>(
  result: T | null | undefined,
  errorMessage: string = '操作失败'
): T => {
  if (result === null || result === undefined) {
    throw {
      type: ErrorType.UNKNOWN_ERROR,
      message: errorMessage,
      details: null
    } as AppError
  }
  return result
}

/**
 * 批量操作错误处理
 */
export const batchOperation = async <T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  onItemError?: (item: T, error: AppError) => void
): Promise<{ results: R[], errors: { item: T, error: AppError }[] }> => {
  const results: R[] = []
  const errors: { item: T, error: AppError }[] = []

  for (const item of items) {
    try {
      const result = await operation(item)
      results.push(result)
    } catch (error) {
      const appError = toAppError(error)
      errors.push({ item, error: appError })
      
      if (onItemError) {
        onItemError(item, appError)
      }
    }
  }

  return { results, errors }
}
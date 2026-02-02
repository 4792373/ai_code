/**
 * 统一错误处理器测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AxiosError } from 'axios'
import { message } from 'ant-design-vue'
import { 
  getErrorHandler, 
  handleApiError, 
  createCompatibleAppError,
  DefaultErrorRecoveryStrategy
} from '../errorHandler'
import { HttpErrorType } from '@/types/api'
import { ErrorType } from '@/types/error'

// 模拟 ant-design-vue 的 message
vi.mock('ant-design-vue', () => ({
  message: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn()
  }
}))

// 模拟配置服务
vi.mock('@/services/configService', () => ({
  isErrorLoggingEnabled: vi.fn(() => true)
}))

describe('统一错误处理器', () => {
  let errorHandler: ReturnType<typeof getErrorHandler>
  let mockConsoleError: any
  let mockConsoleGroup: any
  let mockConsoleGroupEnd: any

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks()
    
    // 模拟控制台方法
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockConsoleGroup = vi.spyOn(console, 'group').mockImplementation(() => {})
    mockConsoleGroupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    
    // 获取错误处理器实例
    errorHandler = getErrorHandler()
  })

  afterEach(() => {
    // 恢复控制台方法
    mockConsoleError.mockRestore()
    mockConsoleGroup.mockRestore()
    mockConsoleGroupEnd.mockRestore()
  })

  describe('网络错误处理', () => {
    it('应该正确处理网络连接错误', () => {
      const mockError = {
        message: 'Network Error',
        config: { url: '/api/users' }
      } as AxiosError

      errorHandler.handleNetworkError(mockError)

      expect(message.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置')
      expect(mockConsoleGroup).toHaveBeenCalled()
      expect(mockConsoleError).toHaveBeenCalled()
      expect((mockError as any).errorType).toBe(HttpErrorType.NETWORK_ERROR)
      expect((mockError as any).userMessage).toBe('网络连接失败，请检查网络设置')
    })

    it('应该记录详细的网络错误日志', () => {
      const mockError = {
        message: 'Network Error',
        name: 'NetworkError',
        config: {
          method: 'GET',
          url: '/api/users',
          baseURL: 'http://localhost:3000',
          timeout: 5000
        }
      } as AxiosError

      errorHandler.logError(mockError, '网络连接')

      expect(mockConsoleGroup).toHaveBeenCalledWith(
        expect.stringContaining('🚨 [错误处理器] 网络连接')
      )
      expect(mockConsoleError).toHaveBeenCalledWith('错误消息:', 'Network Error')
      expect(mockConsoleError).toHaveBeenCalledWith('错误类型:', 'NetworkError')
      expect(mockConsoleGroupEnd).toHaveBeenCalled()
    })
  })

  describe('超时错误处理', () => {
    it('应该正确处理请求超时错误', () => {
      const mockError = {
        message: 'timeout of 5000ms exceeded',
        config: { 
          url: '/api/users',
          timeout: 5000
        }
      } as AxiosError

      errorHandler.handleTimeoutError(mockError)

      expect(message.error).toHaveBeenCalledWith('请求超时，请检查网络连接或稍后重试')
      expect((mockError as any).errorType).toBe(HttpErrorType.TIMEOUT_ERROR)
      expect((mockError as any).userMessage).toBe('请求超时，请检查网络连接或稍后重试')
    })
  })

  describe('客户端错误处理', () => {
    it('应该正确处理400错误', () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad Request' }
        },
        config: { url: '/api/users' }
      } as AxiosError

      errorHandler.handleClientError(mockError)

      expect(message.error).toHaveBeenCalledWith('请求参数错误，请检查输入数据')
      expect((mockError as any).errorType).toBe(HttpErrorType.CLIENT_ERROR)
      expect((mockError as any).statusCode).toBe(400)
    })

    it('应该正确处理404错误', () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        },
        config: { url: '/api/users/123' }
      } as AxiosError

      errorHandler.handleClientError(mockError)

      expect(message.error).toHaveBeenCalledWith('请求的资源不存在')
      expect((mockError as any).statusCode).toBe(404)
    })

    it('应该正确处理422验证错误', () => {
      const mockError = {
        response: {
          status: 422,
          data: { 
            message: 'Validation failed',
            errors: ['邮箱格式不正确', '姓名不能为空']
          }
        },
        config: { url: '/api/users' }
      } as AxiosError

      errorHandler.handleClientError(mockError)

      // 应该显示主要错误消息
      expect(message.error).toHaveBeenCalledWith('数据验证失败，请检查输入')
      
      // 应该异步显示详细错误
      setTimeout(() => {
        expect(message.error).toHaveBeenCalledWith('邮箱格式不正确')
        expect(message.error).toHaveBeenCalledWith('姓名不能为空')
      }, 500)
    })
  })

  describe('服务器错误处理', () => {
    it('应该正确处理500错误', () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        },
        config: { url: '/api/users' }
      } as AxiosError

      errorHandler.handleServerError(mockError)

      expect(message.error).toHaveBeenCalledWith('服务器内部错误，请稍后重试')
      expect((mockError as any).errorType).toBe(HttpErrorType.SERVER_ERROR)
      expect((mockError as any).statusCode).toBe(500)
    })

    it('应该正确处理502网关错误', () => {
      const mockError = {
        response: {
          status: 502,
          data: { message: 'Bad Gateway' }
        },
        config: { url: '/api/users' }
      } as AxiosError

      errorHandler.handleServerError(mockError)

      expect(message.error).toHaveBeenCalledWith('网关错误，服务暂时不可用')
      expect((mockError as any).statusCode).toBe(502)
    })
  })

  describe('API错误处理主入口', () => {
    it('应该正确识别并处理超时错误', () => {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        config: { url: '/api/users', timeout: 5000 }
      } as AxiosError

      const result = errorHandler.processApiError(mockError)

      expect(result.type).toBe(HttpErrorType.TIMEOUT_ERROR)
      expect(result.userMessage).toBe('请求超时，请检查网络连接或稍后重试')
      expect(result.details).toEqual({ timeout: 5000 })
    })

    it('应该正确识别并处理网络错误', () => {
      const mockError = {
        message: 'Network Error',
        config: { url: '/api/users' }
      } as AxiosError

      const result = errorHandler.processApiError(mockError)

      expect(result.type).toBe(HttpErrorType.NETWORK_ERROR)
      expect(result.userMessage).toBe('网络连接失败，请检查网络设置')
      expect(result.details).toEqual({ code: undefined })
    })

    it('应该正确识别并处理HTTP状态码错误', () => {
      const mockError = {
        message: 'Request failed with status code 422',
        response: {
          status: 422,
          data: { errors: ['验证失败'] }
        },
        config: { url: '/api/users' }
      } as AxiosError

      const result = errorHandler.processApiError(mockError)

      expect(result.type).toBe(HttpErrorType.CLIENT_ERROR)
      expect(result.statusCode).toBe(422)
      expect(result.details).toEqual({ errors: ['验证失败'] })
    })
  })

  describe('错误恢复策略', () => {
    let recoveryStrategy: DefaultErrorRecoveryStrategy

    beforeEach(() => {
      recoveryStrategy = new DefaultErrorRecoveryStrategy()
    })

    it('应该对网络错误建议重试', () => {
      const mockError = {
        message: 'Network Error'
      } as AxiosError

      expect(recoveryStrategy.shouldRetry(mockError)).toBe(true)
    })

    it('应该对5xx服务器错误建议重试', () => {
      const mockError = {
        response: { status: 500 }
      } as AxiosError

      expect(recoveryStrategy.shouldRetry(mockError)).toBe(true)
    })

    it('应该对4xx客户端错误不建议重试', () => {
      const mockError = {
        response: { status: 400 }
      } as AxiosError

      expect(recoveryStrategy.shouldRetry(mockError)).toBe(false)
    })

    it('应该对408和429错误建议重试', () => {
      const timeoutError = {
        response: { status: 408 }
      } as AxiosError

      const rateLimitError = {
        response: { status: 429 }
      } as AxiosError

      expect(recoveryStrategy.shouldRetry(timeoutError)).toBe(true)
      expect(recoveryStrategy.shouldRetry(rateLimitError)).toBe(true)
    })

    it('应该使用指数退避计算重试延迟', () => {
      expect(recoveryStrategy.getRetryDelay(1)).toBe(1000) // 1s
      expect(recoveryStrategy.getRetryDelay(2)).toBe(2000) // 2s
      expect(recoveryStrategy.getRetryDelay(3)).toBe(4000) // 4s
      expect(recoveryStrategy.getRetryDelay(4)).toBe(4000) // 最大4s
    })

    it('应该返回正确的最大重试次数', () => {
      expect(recoveryStrategy.getMaxRetries()).toBe(3)
    })
  })

  describe('兼容性功能', () => {
    it('应该创建与现有错误处理兼容的AppError', () => {
      const processedError = {
        type: HttpErrorType.CLIENT_ERROR,
        userMessage: '请求参数错误',
        logMessage: '客户端错误 400: /api/users',
        statusCode: 400,
        details: { field: 'email' }
      }

      const appError = createCompatibleAppError(processedError)

      expect(appError.type).toBe(ErrorType.HTTP_CLIENT_ERROR)
      expect(appError.message).toBe('请求参数错误')
      expect(appError.details).toEqual({
        statusCode: 400,
        logMessage: '客户端错误 400: /api/users',
        field: 'email'
      })
    })

    it('应该正确映射所有HttpErrorType到ErrorType', () => {
      const mappings = [
        { http: HttpErrorType.NETWORK_ERROR, app: ErrorType.NETWORK_ERROR },
        { http: HttpErrorType.TIMEOUT_ERROR, app: ErrorType.HTTP_TIMEOUT_ERROR },
        { http: HttpErrorType.CLIENT_ERROR, app: ErrorType.HTTP_CLIENT_ERROR },
        { http: HttpErrorType.SERVER_ERROR, app: ErrorType.HTTP_SERVER_ERROR },
        { http: HttpErrorType.VALIDATION_ERROR, app: ErrorType.VALIDATION_ERROR }
      ]

      mappings.forEach(({ http, app }) => {
        const processedError = {
          type: http,
          userMessage: '测试消息',
          logMessage: '测试日志'
        }

        const appError = createCompatibleAppError(processedError)
        expect(appError.type).toBe(app)
      })
    })
  })

  describe('单例模式', () => {
    it('应该返回相同的错误处理器实例', () => {
      const instance1 = getErrorHandler()
      const instance2 = getErrorHandler()

      expect(instance1).toBe(instance2)
    })

    it('便捷函数应该使用默认实例', () => {
      const mockError = {
        message: 'Test Error',
        config: { url: '/test' }
      } as AxiosError

      const result = handleApiError(mockError)

      expect(result.type).toBe(HttpErrorType.NETWORK_ERROR)
      expect(result.userMessage).toBe('网络连接失败，请检查网络设置')
    })
  })
})
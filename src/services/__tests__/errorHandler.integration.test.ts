/**
 * 错误处理器集成测试
 * 测试错误处理器的核心功能和与其他组件的集成
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { message } from 'ant-design-vue'
import { getErrorHandler, handleApiError, createCompatibleAppError } from '../errorHandler'
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

describe('错误处理器集成测试', () => {
  let errorHandler: ReturnType<typeof getErrorHandler>
  let mockConsoleError: any
  let mockConsoleGroup: any
  let mockConsoleGroupEnd: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockConsoleGroup = vi.spyOn(console, 'group').mockImplementation(() => {})
    mockConsoleGroupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    
    errorHandler = getErrorHandler()
  })

  afterEach(() => {
    mockConsoleError.mockRestore()
    mockConsoleGroup.mockRestore()
    mockConsoleGroupEnd.mockRestore()
  })

  describe('便捷函数集成', () => {
    it('应该通过便捷函数正确处理API错误', () => {
      const mockError = {
        message: 'Network Error',
        config: { url: '/api/users' }
      } as any

      const result = handleApiError(mockError)

      expect(result.type).toBe(HttpErrorType.NETWORK_ERROR)
      expect(result.userMessage).toBe('网络连接失败，请检查网络设置')
      expect(message.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置')
    })

    it('应该创建与现有错误处理兼容的AppError', () => {
      const mockError = {
        response: {
          status: 422,
          data: { errors: ['验证失败'] }
        },
        config: { url: '/api/users' }
      } as any

      const processedError = handleApiError(mockError)
      const appError = createCompatibleAppError(processedError)

      expect(appError.type).toBe(ErrorType.HTTP_CLIENT_ERROR)
      expect(appError.message).toBe('数据验证失败，请检查输入')
      expect(appError.details.statusCode).toBe(422)
      expect(appError.details.errors).toEqual(['验证失败'])
    })
  })

  describe('错误恢复策略集成', () => {
    it('应该为不同类型的错误提供正确的重试建议', () => {
      // 网络错误 - 应该重试
      const networkError = { message: 'Network Error' } as any
      expect(errorHandler.shouldRetry(networkError)).toBe(true)

      // 5xx服务器错误 - 应该重试
      const serverError = { response: { status: 500 } } as any
      expect(errorHandler.shouldRetry(serverError)).toBe(true)

      // 4xx客户端错误 - 不应该重试
      const clientError = { response: { status: 400 } } as any
      expect(errorHandler.shouldRetry(clientError)).toBe(false)

      // 特定错误码 - 应该重试
      const timeoutError = { response: { status: 408 } } as any
      const rateLimitError = { response: { status: 429 } } as any
      expect(errorHandler.shouldRetry(timeoutError)).toBe(true)
      expect(errorHandler.shouldRetry(rateLimitError)).toBe(true)
    })

    it('应该提供指数退避的重试延迟', () => {
      expect(errorHandler.getRetryDelay(1)).toBe(1000) // 1s
      expect(errorHandler.getRetryDelay(2)).toBe(2000) // 2s
      expect(errorHandler.getRetryDelay(3)).toBe(4000) // 4s
      expect(errorHandler.getRetryDelay(4)).toBe(4000) // 最大4s
      expect(errorHandler.getMaxRetries()).toBe(3)
    })
  })

  describe('完整错误处理流程', () => {
    it('应该完整处理网络错误流程', () => {
      const mockError = {
        message: 'Network Error',
        name: 'NetworkError',
        config: {
          method: 'GET',
          url: '/api/users',
          baseURL: 'http://localhost:3000',
          timeout: 5000
        }
      } as any

      const result = errorHandler.processApiError(mockError)

      // 验证处理结果
      expect(result.type).toBe(HttpErrorType.NETWORK_ERROR)
      expect(result.userMessage).toBe('网络连接失败，请检查网络设置')
      expect(result.logMessage).toContain('网络错误')

      // 验证用户消息显示
      expect(message.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置')

      // 验证日志记录
      expect(mockConsoleGroup).toHaveBeenCalled()
      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockConsoleGroupEnd).toHaveBeenCalled()
    })

    it('应该完整处理验证错误流程', () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: ['邮箱格式不正确', '姓名不能为空']
          }
        },
        config: { url: '/api/users' }
      } as any

      const result = errorHandler.processApiError(mockError)

      // 验证处理结果
      expect(result.type).toBe(HttpErrorType.CLIENT_ERROR)
      expect(result.statusCode).toBe(422)
      expect(result.details.errors).toEqual(['邮箱格式不正确', '姓名不能为空'])

      // 验证主要错误消息显示
      expect(message.error).toHaveBeenCalledWith('数据验证失败，请检查输入')

      // 验证详细错误消息会异步显示
      setTimeout(() => {
        expect(message.error).toHaveBeenCalledWith('邮箱格式不正确')
        expect(message.error).toHaveBeenCalledWith('姓名不能为空')
      }, 500)
    })
  })

  describe('单例模式和实例管理', () => {
    it('应该返回相同的错误处理器实例', () => {
      const instance1 = getErrorHandler()
      const instance2 = getErrorHandler()

      expect(instance1).toBe(instance2)
    })

    it('应该在不同调用间保持状态一致', () => {
      const instance1 = getErrorHandler()
      const instance2 = getErrorHandler()

      // 两个实例应该有相同的配置
      expect(instance1.getMaxRetries()).toBe(instance2.getMaxRetries())
      expect(instance1.getRetryDelay(1)).toBe(instance2.getRetryDelay(1))
    })
  })

  describe('错误类型映射', () => {
    it('应该正确映射所有HttpErrorType到ErrorType', () => {
      const mappings = [
        { 
          httpError: { message: 'Network Error' },
          expectedHttpType: HttpErrorType.NETWORK_ERROR,
          expectedAppType: ErrorType.NETWORK_ERROR
        },
        {
          httpError: { code: 'ECONNABORTED', message: 'timeout' },
          expectedHttpType: HttpErrorType.TIMEOUT_ERROR,
          expectedAppType: ErrorType.HTTP_TIMEOUT_ERROR
        },
        {
          httpError: { response: { status: 400 } },
          expectedHttpType: HttpErrorType.CLIENT_ERROR,
          expectedAppType: ErrorType.HTTP_CLIENT_ERROR
        },
        {
          httpError: { response: { status: 500 } },
          expectedHttpType: HttpErrorType.SERVER_ERROR,
          expectedAppType: ErrorType.HTTP_SERVER_ERROR
        }
      ]

      mappings.forEach(({ httpError, expectedHttpType, expectedAppType }) => {
        const processedError = errorHandler.processApiError(httpError as any)
        const appError = createCompatibleAppError(processedError)

        expect(processedError.type).toBe(expectedHttpType)
        expect(appError.type).toBe(expectedAppType)
      })
    })
  })
})
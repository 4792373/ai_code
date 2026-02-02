import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorHandler } from '../useErrorHandler'
import { ErrorType } from '@/types/error'
import type { AppError } from '@/types/error'

// Mock ant-design-vue message
vi.mock('ant-design-vue', () => ({
  message: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn()
  }
}))

describe('useErrorHandler', () => {
  let errorHandler: ReturnType<typeof useErrorHandler>
  let mockMessage: any

  beforeEach(async () => {
    vi.clearAllMocks()
    errorHandler = useErrorHandler()
    const antd = await import('ant-design-vue')
    mockMessage = vi.mocked(antd).message
  })

  describe('handleError', () => {
    it('should handle validation errors', () => {
      const error: AppError = {
        type: ErrorType.VALIDATION_ERROR,
        message: '验证失败',
        details: { errors: ['字段1错误', '字段2错误'] }
      }

      errorHandler.handleError(error)

      expect(mockMessage.error).toHaveBeenCalledWith('验证失败')
    })

    it('should handle network errors', () => {
      const error: AppError = {
        type: ErrorType.NETWORK_ERROR,
        message: '网络错误'
      }

      errorHandler.handleError(error)

      expect(mockMessage.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置')
    })

    it('should handle storage errors', () => {
      const error: AppError = {
        type: ErrorType.STORAGE_ERROR,
        message: '存储错误'
      }

      errorHandler.handleError(error)

      expect(mockMessage.error).toHaveBeenCalledWith('数据保存失败，请重试')
    })

    it('should handle string errors', () => {
      errorHandler.handleError('简单错误消息')

      expect(mockMessage.error).toHaveBeenCalledWith('简单错误消息')
    })

    it('should handle Error objects', () => {
      const error = new Error('普通错误')

      errorHandler.handleError(error)

      expect(mockMessage.error).toHaveBeenCalledWith('普通错误')
    })

    it('should handle unknown errors', () => {
      const error: AppError = {
        type: ErrorType.UNKNOWN_ERROR,
        message: '未知错误'
      }

      errorHandler.handleError(error)

      expect(mockMessage.error).toHaveBeenCalledWith('未知错误')
    })
  })

  describe('success messages', () => {
    it('should show success message', () => {
      errorHandler.showSuccess('操作成功')

      expect(mockMessage.success).toHaveBeenCalledWith('操作成功', 3)
    })

    it('should show success message with custom duration', () => {
      errorHandler.showSuccess('操作成功', 5)

      expect(mockMessage.success).toHaveBeenCalledWith('操作成功', 5)
    })
  })

  describe('warning messages', () => {
    it('should show warning message', () => {
      errorHandler.showWarning('警告消息')

      expect(mockMessage.warning).toHaveBeenCalledWith('警告消息', 3)
    })
  })

  describe('info messages', () => {
    it('should show info message', () => {
      errorHandler.showInfo('信息消息')

      expect(mockMessage.info).toHaveBeenCalledWith('信息消息', 3)
    })
  })

  describe('loading messages', () => {
    it('should show loading message', () => {
      errorHandler.showLoading('加载中...')

      expect(mockMessage.loading).toHaveBeenCalledWith('加载中...', 0)
    })
  })

  describe('createError', () => {
    it('should create error object', () => {
      const error = errorHandler.createError(ErrorType.VALIDATION_ERROR, '验证错误', { field: 'name' })

      expect(error).toEqual({
        type: ErrorType.VALIDATION_ERROR,
        message: '验证错误',
        details: { field: 'name' }
      })
    })
  })

  describe('withErrorHandling', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('成功结果')

      const result = await errorHandler.withErrorHandling(operation)

      expect(result).toBe('成功结果')
      expect(operation).toHaveBeenCalled()
      expect(mockMessage.error).not.toHaveBeenCalled()
    })

    it('should handle operation errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('操作失败'))

      const result = await errorHandler.withErrorHandling(operation)

      expect(result).toBeNull()
      expect(operation).toHaveBeenCalled()
      expect(mockMessage.error).toHaveBeenCalledWith('操作失败')
    })

    it('should use custom error message', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('操作失败'))

      const result = await errorHandler.withErrorHandling(operation, '自定义错误消息')

      expect(result).toBeNull()
      expect(mockMessage.error).toHaveBeenCalledWith('自定义错误消息')
    })
  })

  describe('withSyncErrorHandling', () => {
    it('should execute sync operation successfully', () => {
      const operation = vi.fn().mockReturnValue('同步结果')

      const result = errorHandler.withSyncErrorHandling(operation)

      expect(result).toBe('同步结果')
      expect(operation).toHaveBeenCalled()
      expect(mockMessage.error).not.toHaveBeenCalled()
    })

    it('should handle sync operation errors', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('同步操作失败')
      })

      const result = errorHandler.withSyncErrorHandling(operation)

      expect(result).toBeNull()
      expect(operation).toHaveBeenCalled()
      expect(mockMessage.error).toHaveBeenCalledWith('同步操作失败')
    })
  })
})
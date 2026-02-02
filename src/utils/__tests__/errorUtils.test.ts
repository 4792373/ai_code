import { describe, it, expect, vi } from 'vitest'
import {
  isAppError,
  toAppError,
  withRetry,
  safeExecute,
  safeExecuteAsync,
  createErrorBoundary,
  validateResult,
  batchOperation
} from '../errorUtils'
import { ErrorType } from '@/types/error'
import type { AppError } from '@/types/error'

describe('errorUtils', () => {
  describe('isAppError', () => {
    it('should identify AppError correctly', () => {
      const appError: AppError = {
        type: ErrorType.VALIDATION_ERROR,
        message: '验证错误'
      }

      expect(isAppError(appError)).toBe(true)
      expect(isAppError(new Error('普通错误'))).toBe(false)
      expect(isAppError('字符串错误')).toBe(false)
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
    })
  })

  describe('toAppError', () => {
    it('should convert Error to AppError', () => {
      const error = new Error('测试错误')
      const appError = toAppError(error)

      expect(appError.type).toBe(ErrorType.UNKNOWN_ERROR)
      expect(appError.message).toBe('测试错误')
      expect(appError.details).toBe(error)
    })

    it('should convert string to AppError', () => {
      const appError = toAppError('字符串错误')

      expect(appError.type).toBe(ErrorType.UNKNOWN_ERROR)
      expect(appError.message).toBe('字符串错误')
      expect(appError.details).toBeNull()
    })

    it('should return AppError as is', () => {
      const originalError: AppError = {
        type: ErrorType.VALIDATION_ERROR,
        message: '验证错误'
      }

      const result = toAppError(originalError)

      expect(result).toBe(originalError)
    })

    it('should detect storage errors', () => {
      const error = new Error('localStorage access failed')
      const appError = toAppError(error)

      expect(appError.type).toBe(ErrorType.STORAGE_ERROR)
    })

    it('should detect network errors', () => {
      const error = new Error('network request failed')
      const appError = toAppError(error)

      expect(appError.type).toBe(ErrorType.NETWORK_ERROR)
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('成功')

      const result = await withRetry(operation, 3)

      expect(result).toBe('成功')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('失败1'))
        .mockRejectedValueOnce(new Error('失败2'))
        .mockResolvedValue('成功')

      const result = await withRetry(operation, 3, 10) // 短延迟用于测试

      expect(result).toBe('成功')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('持续失败'))

      await expect(withRetry(operation, 2, 10)).rejects.toThrow()
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('safeExecute', () => {
    it('should execute successfully', () => {
      const operation = vi.fn().mockReturnValue('成功结果')

      const result = safeExecute(operation)

      expect(result).toBe('成功结果')
      expect(operation).toHaveBeenCalled()
    })

    it('should return null on error', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('操作失败')
      })

      const result = safeExecute(operation)

      expect(result).toBeNull()
      expect(operation).toHaveBeenCalled()
    })

    it('should return fallback on error', () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error('操作失败')
      })

      const result = safeExecute(operation, '默认值')

      expect(result).toBe('默认值')
    })
  })

  describe('safeExecuteAsync', () => {
    it('should execute async operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('异步成功')

      const result = await safeExecuteAsync(operation)

      expect(result).toBe('异步成功')
      expect(operation).toHaveBeenCalled()
    })

    it('should return null on async error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('异步失败'))

      const result = await safeExecuteAsync(operation)

      expect(result).toBeNull()
      expect(operation).toHaveBeenCalled()
    })
  })

  describe('createErrorBoundary', () => {
    it('should create error boundary that catches errors', () => {
      const onError = vi.fn()
      const boundary = createErrorBoundary(onError)

      const faultyFunction = boundary(() => {
        throw new Error('边界错误')
      })

      const result = faultyFunction()

      expect(result).toBeNull()
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        type: ErrorType.UNKNOWN_ERROR,
        message: '边界错误'
      }))
    })

    it('should handle successful operations', () => {
      const onError = vi.fn()
      const boundary = createErrorBoundary(onError)

      const successFunction = boundary(() => '成功')

      const result = successFunction()

      expect(result).toBe('成功')
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('validateResult', () => {
    it('should return valid result', () => {
      const result = validateResult('有效结果')

      expect(result).toBe('有效结果')
    })

    it('should throw on null result', () => {
      expect(() => validateResult(null)).toThrow()
    })

    it('should throw on undefined result', () => {
      expect(() => validateResult(undefined)).toThrow()
    })

    it('should throw with custom message', () => {
      expect(() => validateResult(null, '自定义错误')).toThrow('自定义错误')
    })
  })

  describe('batchOperation', () => {
    it('should process all items successfully', async () => {
      const items = [1, 2, 3]
      const operation = vi.fn().mockImplementation((item: number) => Promise.resolve(item * 2))

      const { results, errors } = await batchOperation(items, operation)

      expect(results).toEqual([2, 4, 6])
      expect(errors).toEqual([])
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should handle mixed success and failure', async () => {
      const items = [1, 2, 3]
      const operation = vi.fn()
        .mockResolvedValueOnce(2)
        .mockRejectedValueOnce(new Error('项目2失败'))
        .mockResolvedValueOnce(6)

      const onItemError = vi.fn()

      const { results, errors } = await batchOperation(items, operation, onItemError)

      expect(results).toEqual([2, 6])
      expect(errors).toHaveLength(1)
      expect(errors[0].item).toBe(2)
      expect(onItemError).toHaveBeenCalledTimes(1)
    })
  })
})
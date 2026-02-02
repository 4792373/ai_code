import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppInitialization } from '../useAppInitialization'
import { useUserStore } from '@/stores/userStore'
import { useErrorHandler } from '@/composables/useErrorHandler'

// Mock the stores and composables
vi.mock('@/stores/userStore')
vi.mock('@/composables/useErrorHandler')

describe('useAppInitialization', () => {
  const mockInitialize = vi.fn()
  const mockHandleError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useUserStore
    vi.mocked(useUserStore).mockReturnValue({
      initialize: mockInitialize,
      users: []
    } as any)
    
    // Mock useErrorHandler
    vi.mocked(useErrorHandler).mockReturnValue({
      handleError: mockHandleError
    } as any)
  })

  it('should initialize successfully', async () => {
    const { initializeApp, isInitialized, initializationError } = useAppInitialization()
    
    expect(isInitialized.value).toBe(false)
    expect(initializationError.value).toBe(null)
    
    await initializeApp()
    
    expect(mockInitialize).toHaveBeenCalledOnce()
    expect(isInitialized.value).toBe(true)
    expect(initializationError.value).toBe(null)
    expect(mockHandleError).not.toHaveBeenCalled()
  })

  it('should handle initialization errors gracefully', async () => {
    const error = new Error('localStorage access denied')
    mockInitialize.mockImplementation(() => {
      throw error
    })
    
    const { initializeApp, isInitialized, initializationError } = useAppInitialization()
    
    await initializeApp()
    
    expect(mockInitialize).toHaveBeenCalledOnce()
    expect(isInitialized.value).toBe(true) // Should still be true to allow app to continue
    expect(initializationError.value).toBe('localStorage access denied')
    expect(mockHandleError).toHaveBeenCalledWith({
      type: 'STORAGE_ERROR',
      message: '应用初始化时加载数据失败，将使用默认设置',
      details: error
    })
  })

  it('should handle non-Error exceptions', async () => {
    const error = 'String error'
    mockInitialize.mockImplementation(() => {
      throw error
    })
    
    const { initializeApp, isInitialized, initializationError } = useAppInitialization()
    
    await initializeApp()
    
    expect(isInitialized.value).toBe(true)
    expect(initializationError.value).toBe('未知错误')
    expect(mockHandleError).toHaveBeenCalledWith({
      type: 'STORAGE_ERROR',
      message: '应用初始化时加载数据失败，将使用默认设置',
      details: error
    })
  })

  it('should reinitialize app correctly', async () => {
    const { initializeApp, reinitializeApp, isInitialized, initializationError } = useAppInitialization()
    
    // First initialization with error
    const error = new Error('First error')
    mockInitialize.mockImplementationOnce(() => {
      throw error
    })
    
    await initializeApp()
    expect(isInitialized.value).toBe(true)
    expect(initializationError.value).toBe('First error')
    
    // Reinitialize successfully
    mockInitialize.mockImplementationOnce(() => {
      // Success
    })
    
    await reinitializeApp()
    expect(isInitialized.value).toBe(true)
    expect(initializationError.value).toBe(null)
    expect(mockInitialize).toHaveBeenCalledTimes(2)
  })

  it('should log initialization progress', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Mock successful initialization
    vi.mocked(useUserStore).mockReturnValue({
      initialize: vi.fn(),
      users: []
    } as any)
    
    const { initializeApp } = useAppInitialization()
    
    await initializeApp()
    
    expect(consoleSpy).toHaveBeenCalledWith('开始应用初始化...')
    expect(consoleSpy).toHaveBeenCalledWith('应用初始化完成')
    expect(consoleSpy).toHaveBeenCalledWith('已加载 0 个用户')
    
    consoleSpy.mockRestore()
  })

  it('should log initialization errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Test error')
    mockInitialize.mockImplementation(() => {
      throw error
    })
    
    const { initializeApp } = useAppInitialization()
    
    await initializeApp()
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('应用初始化失败:', error)
    
    consoleErrorSpy.mockRestore()
  })
})
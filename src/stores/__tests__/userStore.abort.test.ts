import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../userStore'

describe('UserStore - 请求取消处理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('连续调用 setSearchKeyword 不应显示取消错误', async () => {
    const userStore = useUserStore()
    
    // 模拟控制台错误，确保没有错误被抛出
    const consoleErrorSpy = vi.spyOn(console, 'error')
    
    // 连续调用多次 setSearchKeyword
    const promises = [
      userStore.setSearchKeyword('test1'),
      userStore.setSearchKeyword('test2'),
      userStore.setSearchKeyword('test3'),
      userStore.setSearchKeyword('test4'),
      userStore.setSearchKeyword('test5')
    ]
    
    // 等待所有请求完成
    await Promise.all(promises)
    
    // 验证没有错误被抛出（AbortError 应该被忽略）
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('AbortError')
    )
    
    consoleErrorSpy.mockRestore()
  })

  it('连续调用 setFilters 不应显示取消错误', async () => {
    const userStore = useUserStore()
    
    // 模拟控制台错误，确保没有错误被抛出
    const consoleErrorSpy = vi.spyOn(console, 'error')
    
    // 连续调用多次 setFilters
    const promises = [
      userStore.setFilters({ role: 'admin' }),
      userStore.setFilters({ role: 'user' }),
      userStore.setFilters({ status: 'active' }),
      userStore.setFilters({}),
      userStore.setFilters({ role: 'moderator' })
    ]
    
    // 等待所有请求完成
    await Promise.all(promises)
    
    // 验证没有错误被抛出（AbortError 应该被忽略）
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('AbortError')
    )
    
    consoleErrorSpy.mockRestore()
  })

  it('连续点击重置按钮（模拟）不应显示取消错误', async () => {
    const userStore = useUserStore()
    
    // 模拟控制台错误，确保没有错误被抛出
    const consoleErrorSpy = vi.spyOn(console, 'error')
    
    // 模拟连续点击重置按钮的行为
    const resetActions = async () => {
      await userStore.setSearchKeyword('')
      await userStore.setFilters({})
    }
    
    // 连续执行多次重置操作
    const promises = [
      resetActions(),
      resetActions(),
      resetActions(),
      resetActions(),
      resetActions()
    ]
    
    // 等待所有操作完成
    await Promise.all(promises)
    
    // 验证没有错误被抛出（AbortError 应该被忽略）
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('AbortError')
    )
    
    consoleErrorSpy.mockRestore()
  })
})

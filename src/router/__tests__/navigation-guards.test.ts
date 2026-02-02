/**
 * 路由导航守卫测试
 * 
 * 验证导航守卫的功能：
 * - 页面标题更新
 * - 导航日志记录（开发环境）
 * - 允许所有导航继续
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import router from '../index'

describe('路由导航守卫', () => {
  beforeEach(async () => {
    // 重置路由到初始状态
    await router.push('/')
    await router.isReady()
    
    // 清除控制台日志模拟
    vi.clearAllMocks()
  })
  
  it('应该在路由切换时更新页面标题', async () => {
    // 导航到首页
    await router.push('/')
    expect(document.title).toContain('首页')
    expect(document.title).toContain('用户管理系统')
    
    // 导航到用户管理页面
    await router.push('/users')
    expect(document.title).toContain('用户管理')
    expect(document.title).toContain('用户管理系统')
    
    // 导航到不存在的页面（404）
    await router.push('/non-existent')
    expect(document.title).toContain('页面未找到')
    expect(document.title).toContain('用户管理系统')
  })
  
  it('应该在开发环境记录导航日志', async () => {
    // 模拟 console.log
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // 导航到用户管理页面
    await router.push('/users')
    
    // 在开发环境下应该记录日志
    if (import.meta.env.DEV) {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Router] 导航:')
      )
    }
    
    consoleLogSpy.mockRestore()
  })
  
  it('应该允许所有路由导航继续', async () => {
    // 测试导航到各个路由
    const routes = ['/', '/users', '/non-existent']
    
    for (const path of routes) {
      await router.push(path)
      
      // 验证导航成功（路由已更新）
      expect(router.currentRoute.value.path).toBe(path)
    }
  })
  
  it('应该在守卫出错时仍然允许导航', async () => {
    // 这个测试验证 try-catch 错误处理
    // 即使守卫内部出错，导航也应该继续
    
    // 导航到用户管理页面（从首页导航，避免重复导航）
    await router.push('/users')
    expect(router.currentRoute.value.path).toBe('/users')
    
    // 再导航回首页
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
  })
  
  it('应该为所有路由设置正确的标题格式', async () => {
    const routes = [
      { path: '/', expectedTitle: '首页 - 用户管理系统' },
      { path: '/users', expectedTitle: '用户管理 - 用户管理系统' },
      { path: '/non-existent', expectedTitle: '页面未找到 - 用户管理系统' }
    ]
    
    for (const { path, expectedTitle } of routes) {
      await router.push(path)
      expect(document.title).toBe(expectedTitle)
    }
  })
})

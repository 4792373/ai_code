import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../userStore'
import { UserRole, UserStatus } from '@/types/user'

describe('UserStore 验证功能测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // 清理 localStorage
    localStorage.clear()
  })

  it('应该在 API 调用前执行客户端验证 - addUser', async () => {
    const userStore = useUserStore()
    
    // 测试无效数据 - 空姓名
    try {
      await userStore.addUser({
        name: '', // 空姓名，应该失败
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      })
      expect.fail('应该抛出验证错误')
    } catch (error: any) {
      expect(error.type).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('用户数据验证失败')
      expect(error.details).toContain('用户姓名不能为空')
    }
    
    // 验证没有发送 API 请求（用户列表应该为空）
    expect(userStore.users).toHaveLength(0)
  })

  it('应该在 API 调用前执行客户端验证 - updateUser', async () => {
    const userStore = useUserStore()
    
    // 测试无效数据 - 无效邮箱
    try {
      await userStore.updateUser({
        id: 'test-id',
        name: '测试用户',
        email: 'invalid-email', // 无效邮箱格式
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      })
      expect.fail('应该抛出验证错误')
    } catch (error: any) {
      expect(error.type).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('用户数据验证失败')
      expect(error.details).toContain('邮箱格式不正确')
    }
  })

  it('应该在验证通过后正常发送 API 请求', async () => {
    const userStore = useUserStore()
    
    // 测试有效数据
    const userData = {
      name: '测试用户',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const user = await userStore.addUser(userData)
    
    // 验证用户被成功创建
    expect(user).toBeDefined()
    expect(user.name).toBe(userData.name)
    expect(user.email).toBe(userData.email)
    expect(userStore.users).toHaveLength(1)
  })

  it('应该正确处理验证错误和 API 错误的区别', async () => {
    const userStore = useUserStore()
    
    // 首先添加一个用户
    await userStore.addUser({
      name: '第一个用户',
      email: 'first@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    
    // 尝试添加重复邮箱的用户 - 这应该通过客户端验证但在服务端失败
    try {
      await userStore.addUser({
        name: '第二个用户',
        email: 'first@example.com', // 重复邮箱
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      })
      expect.fail('应该抛出服务端验证错误')
    } catch (error: any) {
      // 这应该是服务端返回的错误，不是客户端验证错误
      expect(error.type).not.toBe('VALIDATION_ERROR')
    }
  })
})
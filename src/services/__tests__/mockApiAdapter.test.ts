import { describe, it, expect, beforeEach } from 'vitest'
import { getApiClient } from '../apiClient'
import { initializeMockApiService, cleanupMockApiService } from '../mockApiService'
import { UserRole, UserStatus } from '@/types/user'

describe('模拟API适配器测试', () => {
  beforeEach(() => {
    // 清理并重新初始化模拟API服务
    cleanupMockApiService()
    initializeMockApiService()
    localStorage.clear()
  })

  it('应该能够通过API客户端获取用户列表', async () => {
    const apiClient = getApiClient()
    
    const response = await apiClient.getUsers()
    
    expect(response).toBeDefined()
    expect(response.success).toBe(true)
    expect(response.data).toBeInstanceOf(Array)
    expect(response.data.length).toBeGreaterThan(0)
  })

  it('应该能够通过API客户端创建用户', async () => {
    const apiClient = getApiClient()
    
    const userData = {
      name: '测试用户',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const response = await apiClient.createUser(userData)
    
    expect(response).toBeDefined()
    expect(response.success).toBe(true)
    expect(response.data).toBeDefined()
    expect(response.data.name).toBe(userData.name)
    expect(response.data.email).toBe(userData.email)
  })

  it('应该能够通过API客户端更新用户', async () => {
    const apiClient = getApiClient()
    
    // 首先创建一个用户
    const createResponse = await apiClient.createUser({
      name: '原始用户',
      email: 'original@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    
    const userId = createResponse.data.id
    
    // 更新用户
    const updateResponse = await apiClient.updateUser(userId, {
      id: userId,
      name: '更新后的用户',
      email: 'updated@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })
    
    expect(updateResponse).toBeDefined()
    expect(updateResponse.success).toBe(true)
    expect(updateResponse.data.name).toBe('更新后的用户')
    expect(updateResponse.data.email).toBe('updated@example.com')
    expect(updateResponse.data.role).toBe(UserRole.ADMIN)
  })

  it('应该能够通过API客户端删除用户', async () => {
    const apiClient = getApiClient()
    
    // 首先创建一个用户
    const createResponse = await apiClient.createUser({
      name: '待删除用户',
      email: 'todelete@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    
    const userId = createResponse.data.id
    
    // 删除用户
    const deleteResponse = await apiClient.deleteUser(userId)
    
    expect(deleteResponse).toBeDefined()
    expect(deleteResponse.success).toBe(true)
    
    // 验证用户已被删除
    try {
      await apiClient.getUserById(userId)
      expect.fail('应该抛出404错误')
    } catch (error: any) {
      expect(error.response?.status).toBe(404)
    }
  })

  it('应该能够根据ID获取用户', async () => {
    const apiClient = getApiClient()
    
    // 首先创建一个用户
    const createResponse = await apiClient.createUser({
      name: '测试用户',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    
    const userId = createResponse.data.id
    
    // 根据ID获取用户
    const getResponse = await apiClient.getUserById(userId)
    
    expect(getResponse).toBeDefined()
    expect(getResponse.success).toBe(true)
    expect(getResponse.data.id).toBe(userId)
    expect(getResponse.data.name).toBe('测试用户')
  })

  it('应该支持搜索和筛选功能', async () => {
    const apiClient = getApiClient()
    
    // 创建几个测试用户
    await apiClient.createUser({
      name: '张三',
      email: 'zhangsan@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })
    
    await apiClient.createUser({
      name: '李四',
      email: 'lisi@example.com',
      role: UserRole.USER,
      status: UserStatus.INACTIVE
    })
    
    // 测试搜索
    const searchResponse = await apiClient.getUsers({ search: '张三' })
    expect(searchResponse.data.some(u => u.name === '张三')).toBe(true)
    
    // 测试角色筛选
    const roleResponse = await apiClient.getUsers({ role: UserRole.ADMIN })
    expect(roleResponse.data.every(u => u.role === UserRole.ADMIN)).toBe(true)
    
    // 测试状态筛选
    const statusResponse = await apiClient.getUsers({ status: UserStatus.INACTIVE })
    expect(statusResponse.data.every(u => u.status === UserStatus.INACTIVE)).toBe(true)
  })
})

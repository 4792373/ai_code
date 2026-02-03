import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MockApiServiceImpl } from '../mockApiService'
import { UserRole, UserStatus } from '../../types/user'
import type { CreateUserData } from '../../types/user'

// 模拟配置服务
vi.mock('../configService', () => ({
  getAppConfig: () => ({
    api: {
      mockApiDelay: 0 // 测试时不需要延迟
    }
  })
}))

describe('批量删除用户功能测试', () => {
  let service: MockApiServiceImpl
  
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear()
    
    // 创建新的服务实例
    service = new MockApiServiceImpl()
    service.initialize()
  })

  afterEach(() => {
    // 清理服务
    service.cleanup()
    localStorage.clear()
  })

  it('应该成功批量删除多个用户', async () => {
    // 1. 创建测试用户
    const user1: CreateUserData = {
      name: '测试用户1',
      email: 'test1@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const user2: CreateUserData = {
      name: '测试用户2',
      email: 'test2@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const user3: CreateUserData = {
      name: '测试用户3',
      email: 'test3@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const createdUser1 = await service.handleCreateUser(user1)
    const createdUser2 = await service.handleCreateUser(user2)
    const createdUser3 = await service.handleCreateUser(user3)
    
    // 2. 获取初始用户列表
    const beforeDelete = await service.handleGetUsers()
    const initialCount = beforeDelete.data.length
    
    // 3. 批量删除前两个用户
    const userIdsToDelete = [createdUser1.data.id, createdUser2.data.id]
    const deleteResponse = await service.handleBatchDeleteUsers(userIdsToDelete)
    
    // 4. 验证删除响应
    expect(deleteResponse.success).toBe(true)
    expect(deleteResponse.message).toContain('成功删除 2 个用户')
    
    // 5. 验证用户列表已更新
    const afterDelete = await service.handleGetUsers()
    expect(afterDelete.data.length).toBe(initialCount - 2)
    
    // 6. 验证被删除的用户不在列表中
    const remainingUserIds = afterDelete.data.map(u => u.id)
    expect(remainingUserIds).not.toContain(createdUser1.data.id)
    expect(remainingUserIds).not.toContain(createdUser2.data.id)
    expect(remainingUserIds).toContain(createdUser3.data.id)
  })

  it('应该在用户不存在时返回 404 错误', async () => {
    const nonExistentIds = ['non-existent-id-1', 'non-existent-id-2']
    
    await expect(
      service.handleBatchDeleteUsers(nonExistentIds)
    ).rejects.toThrow('部分用户不存在')
  })

  it('应该在部分用户不存在时返回 404 错误', async () => {
    // 创建一个真实用户
    const user: CreateUserData = {
      name: '测试用户',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const createdUser = await service.handleCreateUser(user)
    
    // 尝试删除一个存在的用户和一个不存在的用户
    const mixedIds = [createdUser.data.id, 'non-existent-id']
    
    await expect(
      service.handleBatchDeleteUsers(mixedIds)
    ).rejects.toThrow('部分用户不存在')
  })

  it('应该在传入空数组时返回错误', async () => {
    await expect(
      service.handleBatchDeleteUsers([])
    ).rejects.toThrow('请提供要删除的用户 ID 数组')
  })

  it('应该在传入非数组参数时返回错误', async () => {
    await expect(
      service.handleBatchDeleteUsers(null as any)
    ).rejects.toThrow('请提供要删除的用户 ID 数组')
  })

  it('批量删除后数据应该持久化到 localStorage', async () => {
    // 创建测试用户
    const user1: CreateUserData = {
      name: '测试用户1',
      email: 'test1@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const user2: CreateUserData = {
      name: '测试用户2',
      email: 'test2@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    const createdUser1 = await service.handleCreateUser(user1)
    const createdUser2 = await service.handleCreateUser(user2)
    
    // 批量删除
    await service.handleBatchDeleteUsers([createdUser1.data.id])
    
    // 创建新服务实例并加载数据
    const newService = new MockApiServiceImpl()
    newService.loadFromStorage()
    
    const users = await newService.handleGetUsers()
    const userIds = users.data.map(u => u.id)
    
    // 验证删除的用户不在新服务实例中
    expect(userIds).not.toContain(createdUser1.data.id)
    expect(userIds).toContain(createdUser2.data.id)
  })
})

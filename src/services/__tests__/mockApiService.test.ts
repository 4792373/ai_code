import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MockApiServiceImpl, getMockApiService, cleanupMockApiService } from '../mockApiService'
import { UserRole, UserStatus } from '@/types/user'
import type { CreateUserData, UpdateUserData } from '@/types/user'

// 模拟配置服务
vi.mock('../configService', () => ({
  getAppConfig: () => ({
    api: {
      mockApiDelay: 0 // 测试时不需要延迟
    }
  })
}))

describe('MockApiService', () => {
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
    cleanupMockApiService()
    localStorage.clear()
  })

  describe('初始化和数据管理', () => {
    it('应该正确初始化服务', () => {
      const newService = new MockApiServiceImpl()
      newService.initialize()
      
      // 服务应该生成默认测试数据
      expect(newService).toBeDefined()
    })

    it('应该能够保存和加载数据到 localStorage', async () => {
      // 创建测试用户
      const userData: CreateUserData = {
        name: '测试用户',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await service.handleCreateUser(userData)
      
      // 保存到 localStorage
      service.saveToStorage()
      
      // 创建新服务实例并加载数据
      const newService = new MockApiServiceImpl()
      newService.loadFromStorage()
      
      const users = await newService.handleGetUsers()
      const testUser = users.data.find(u => u.email === 'test@example.com')
      
      expect(testUser).toBeDefined()
      expect(testUser?.name).toBe('测试用户')
    })

    it('应该在 localStorage 数据损坏时生成默认数据', () => {
      // 设置损坏的数据
      localStorage.setItem('mock_api_users', 'invalid json')
      
      const newService = new MockApiServiceImpl()
      newService.initialize()
      
      // 应该成功初始化而不抛出错误
      expect(newService).toBeDefined()
    })
  })

  describe('获取用户列表', () => {
    it('应该返回用户列表', async () => {
      const response = await service.handleGetUsers()
      
      expect(response.success).toBe(true)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.message).toContain('成功获取')
      expect(response.timestamp).toBeDefined()
    })

    it('应该支持按姓名搜索用户', async () => {
      // 创建测试用户
      const userData: CreateUserData = {
        name: '张三',
        email: 'zhangsan@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await service.handleCreateUser(userData)
      
      // 搜索用户
      const response = await service.handleGetUsers({ search: '张三' })
      
      expect(response.success).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.data.some(u => u.name === '张三')).toBe(true)
    })

    it('应该支持按邮箱搜索用户', async () => {
      // 创建测试用户
      const userData: CreateUserData = {
        name: '李四',
        email: 'lisi@test.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await service.handleCreateUser(userData)
      
      // 搜索用户
      const response = await service.handleGetUsers({ search: 'lisi@test.com' })
      
      expect(response.success).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.data.some(u => u.email === 'lisi@test.com')).toBe(true)
    })

    it('应该支持按角色筛选用户', async () => {
      const response = await service.handleGetUsers({ role: UserRole.ADMIN })
      
      expect(response.success).toBe(true)
      expect(response.data.every(u => u.role === UserRole.ADMIN)).toBe(true)
    })

    it('应该支持按状态筛选用户', async () => {
      const response = await service.handleGetUsers({ status: UserStatus.ACTIVE })
      
      expect(response.success).toBe(true)
      expect(response.data.every(u => u.status === UserStatus.ACTIVE)).toBe(true)
    })

    it('应该支持分页功能', async () => {
      const response = await service.handleGetUsers({ page: 1, pageSize: 5 })
      
      expect(response.success).toBe(true)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('根据ID获取用户', () => {
    it('应该能够根据ID获取用户', async () => {
      // 先创建一个用户
      const userData: CreateUserData = {
        name: '王五',
        email: 'wangwu@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const createResponse = await service.handleCreateUser(userData)
      const userId = createResponse.data.id
      
      // 根据ID获取用户
      const response = await service.handleGetUserById(userId)
      
      expect(response.success).toBe(true)
      expect(response.data.id).toBe(userId)
      expect(response.data.name).toBe('王五')
      expect(response.data.email).toBe('wangwu@example.com')
    })

    it('应该在用户不存在时抛出404错误', async () => {
      await expect(service.handleGetUserById('nonexistent-id')).rejects.toThrow()
      
      try {
        await service.handleGetUserById('nonexistent-id')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.message).toBe('用户不存在')
      }
    })

    it('应该在ID为空时抛出错误', async () => {
      await expect(service.handleGetUserById('')).rejects.toThrow()
      await expect(service.handleGetUserById('   ')).rejects.toThrow()
    })
  })

  describe('创建用户', () => {
    it('应该能够创建新用户', async () => {
      const userData: CreateUserData = {
        name: '新用户',
        email: 'newuser@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const response = await service.handleCreateUser(userData)
      
      expect(response.success).toBe(true)
      expect(response.data.name).toBe('新用户')
      expect(response.data.email).toBe('newuser@example.com')
      expect(response.data.role).toBe(UserRole.USER)
      expect(response.data.status).toBe(UserStatus.ACTIVE)
      expect(response.data.id).toBeDefined()
      expect(response.data.createdAt).toBeDefined()
      expect(response.data.updatedAt).toBeDefined()
      expect(response.message).toBe('用户创建成功')
    })

    it('应该在姓名为空时抛出验证错误', async () => {
      const userData: CreateUserData = {
        name: '',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await expect(service.handleCreateUser(userData)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData)
      } catch (error: any) {
        expect(error.response.status).toBe(422)
        expect(error.response.data.errors).toContain('用户姓名不能为空')
      }
    })

    it('应该在姓名过短时抛出验证错误', async () => {
      const userData: CreateUserData = {
        name: '一',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await expect(service.handleCreateUser(userData)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData)
      } catch (error: any) {
        expect(error.response.data.errors).toContain('姓名长度应在2-50个字符之间')
      }
    })

    it('应该在姓名过长时抛出验证错误', async () => {
      const userData: CreateUserData = {
        name: 'a'.repeat(51),
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await expect(service.handleCreateUser(userData)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData)
      } catch (error: any) {
        expect(error.response.data.errors).toContain('姓名长度应在2-50个字符之间')
      }
    })

    it('应该在邮箱为空时抛出验证错误', async () => {
      const userData: CreateUserData = {
        name: '测试用户',
        email: '',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await expect(service.handleCreateUser(userData)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData)
      } catch (error: any) {
        expect(error.response.data.errors).toContain('邮箱地址不能为空')
      }
    })

    it('应该在邮箱格式不正确时抛出验证错误', async () => {
      const userData: CreateUserData = {
        name: '测试用户',
        email: 'invalid-email',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await expect(service.handleCreateUser(userData)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData)
      } catch (error: any) {
        expect(error.response.data.errors).toContain('邮箱格式不正确')
      }
    })

    it('应该在邮箱重复时抛出错误', async () => {
      const userData1: CreateUserData = {
        name: '用户1',
        email: 'duplicate@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const userData2: CreateUserData = {
        name: '用户2',
        email: 'duplicate@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.PENDING
      }
      
      // 创建第一个用户
      await service.handleCreateUser(userData1)
      
      // 尝试创建重复邮箱的用户
      await expect(service.handleCreateUser(userData2)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData2)
      } catch (error: any) {
        expect(error.response.status).toBe(422)
        expect(error.response.data.message).toBe('数据验证失败')
        expect(error.response.data.errors).toContain('邮箱已存在')
      }
    })

    it('应该在角色无效时抛出验证错误', async () => {
      const userData = {
        name: '测试用户',
        email: 'test@example.com',
        role: 'invalid-role' as any,
        status: UserStatus.ACTIVE
      }
      
      await expect(service.handleCreateUser(userData)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData)
      } catch (error: any) {
        expect(error.response.data.errors).toContain('无效的用户角色')
      }
    })

    it('应该在状态无效时抛出验证错误', async () => {
      const userData = {
        name: '测试用户',
        email: 'test@example.com',
        role: UserRole.USER,
        status: 'invalid-status' as any
      }
      
      await expect(service.handleCreateUser(userData)).rejects.toThrow()
      
      try {
        await service.handleCreateUser(userData)
      } catch (error: any) {
        expect(error.response.data.errors).toContain('无效的用户状态')
      }
    })
  })

  describe('更新用户', () => {
    let userId: string

    beforeEach(async () => {
      // 创建测试用户
      const userData: CreateUserData = {
        name: '原始用户',
        email: 'original@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const response = await service.handleCreateUser(userData)
      userId = response.data.id
    })

    it('应该能够更新用户信息', async () => {
      // 等待一毫秒确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 1))
      
      const updateData: UpdateUserData = {
        id: userId,
        name: '更新后的用户',
        email: 'updated@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.PENDING
      }
      
      const response = await service.handleUpdateUser(userId, updateData)
      
      expect(response.success).toBe(true)
      expect(response.data.name).toBe('更新后的用户')
      expect(response.data.email).toBe('updated@example.com')
      expect(response.data.role).toBe(UserRole.ADMIN)
      expect(response.data.status).toBe(UserStatus.PENDING)
      expect(response.data.updatedAt).not.toBe(response.data.createdAt)
      expect(response.message).toBe('用户信息更新成功')
    })

    it('应该能够部分更新用户信息', async () => {
      const updateData: UpdateUserData = {
        id: userId,
        name: '部分更新的用户'
      }
      
      const response = await service.handleUpdateUser(userId, updateData)
      
      expect(response.success).toBe(true)
      expect(response.data.name).toBe('部分更新的用户')
      expect(response.data.email).toBe('original@example.com') // 保持原值
    })

    it('应该在用户不存在时抛出404错误', async () => {
      const updateData: UpdateUserData = {
        id: 'nonexistent-id',
        name: '不存在的用户'
      }
      
      await expect(service.handleUpdateUser('nonexistent-id', updateData)).rejects.toThrow()
      
      try {
        await service.handleUpdateUser('nonexistent-id', updateData)
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.message).toBe('用户不存在')
      }
    })

    it('应该在更新数据验证失败时抛出错误', async () => {
      const updateData: UpdateUserData = {
        id: userId,
        name: '', // 空姓名
        email: 'invalid-email' // 无效邮箱
      }
      
      await expect(service.handleUpdateUser(userId, updateData)).rejects.toThrow()
      
      try {
        await service.handleUpdateUser(userId, updateData)
      } catch (error: any) {
        expect(error.response.status).toBe(422)
        expect(error.response.data.errors).toContain('用户姓名不能为空')
        expect(error.response.data.errors).toContain('邮箱格式不正确')
      }
    })

    it('应该在更新邮箱重复时抛出错误', async () => {
      // 创建另一个用户
      const anotherUser: CreateUserData = {
        name: '另一个用户',
        email: 'another@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      await service.handleCreateUser(anotherUser)
      
      // 尝试将第一个用户的邮箱更新为重复邮箱
      const updateData: UpdateUserData = {
        id: userId,
        email: 'another@example.com'
      }
      
      await expect(service.handleUpdateUser(userId, updateData)).rejects.toThrow()
      
      try {
        await service.handleUpdateUser(userId, updateData)
      } catch (error: any) {
        expect(error.response.status).toBe(422)
        expect(error.response.data.message).toBe('数据验证失败')
        expect(error.response.data.errors).toContain('邮箱已存在')
      }
    })
  })

  describe('删除用户', () => {
    let userId: string

    beforeEach(async () => {
      // 创建测试用户
      const userData: CreateUserData = {
        name: '待删除用户',
        email: 'todelete@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const response = await service.handleCreateUser(userData)
      userId = response.data.id
    })

    it('应该能够删除用户', async () => {
      const response = await service.handleDeleteUser(userId)
      
      expect(response.success).toBe(true)
      expect(response.message).toBe('用户删除成功')
      
      // 验证用户已被删除
      await expect(service.handleGetUserById(userId)).rejects.toThrow()
    })

    it('应该在用户不存在时抛出404错误', async () => {
      await expect(service.handleDeleteUser('nonexistent-id')).rejects.toThrow()
      
      try {
        await service.handleDeleteUser('nonexistent-id')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.message).toBe('用户不存在')
      }
    })

    it('应该在ID为空时抛出错误', async () => {
      await expect(service.handleDeleteUser('')).rejects.toThrow()
      await expect(service.handleDeleteUser('   ')).rejects.toThrow()
    })
  })

  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = getMockApiService()
      const instance2 = getMockApiService()
      
      expect(instance1).toBe(instance2)
    })

    it('应该能够清理实例', () => {
      const instance1 = getMockApiService()
      cleanupMockApiService()
      const instance2 = getMockApiService()
      
      // 清理后应该创建新实例
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('响应格式', () => {
    it('所有成功响应应该符合 ApiResponse 格式', async () => {
      const userData: CreateUserData = {
        name: '格式测试用户',
        email: 'format@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const response = await service.handleCreateUser(userData)
      
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('message')
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('timestamp')
      expect(response.success).toBe(true)
      expect(typeof response.message).toBe('string')
      expect(typeof response.timestamp).toBe('string')
    })

    it('所有错误响应应该符合错误格式', async () => {
      try {
        await service.handleGetUserById('nonexistent-id')
      } catch (error: any) {
        expect(error.response.data).toHaveProperty('success')
        expect(error.response.data).toHaveProperty('message')
        expect(error.response.data).toHaveProperty('errors')
        expect(error.response.data).toHaveProperty('timestamp')
        expect(error.response.data.success).toBe(false)
        expect(typeof error.response.data.message).toBe('string')
        expect(Array.isArray(error.response.data.errors)).toBe(true)
        expect(typeof error.response.data.timestamp).toBe('string')
      }
    })
  })
})
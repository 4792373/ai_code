/**
 * 基础服务集成测试
 * 验证API客户端、模拟API服务和测试数据生成器的协同工作
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getApiClient } from '../apiClient'
import { getMockApiService, initializeMockApiService, cleanupMockApiService } from '../mockApiService'
import { TestDataGenerator } from '../testDataGenerator'
import { UserRole, UserStatus } from '@/types/user'
import type { CreateUserData } from '@/types/user'

// 模拟配置服务
vi.mock('../configService', () => ({
  getAppConfig: () => ({
    api: {
      baseURL: 'http://localhost:3000',
      timeout: 5000,
      useMockApi: true,
      mockApiDelay: 0 // 测试时不需要延迟
    },
    logging: {
      enableApiLogging: false,
      enableErrorLogging: false
    },
    development: {
      enableDevtools: false
    },
    mode: 'development'
  }),
  isApiLoggingEnabled: () => false,
  isErrorLoggingEnabled: () => false
}))

describe('基础服务集成测试', () => {
  beforeEach(() => {
    // 清理环境
    localStorage.clear()
    cleanupMockApiService()
    
    // 初始化模拟API服务
    initializeMockApiService()
  })

  afterEach(() => {
    // 清理环境
    cleanupMockApiService()
    localStorage.clear()
  })

  describe('服务初始化', () => {
    it('应该能够正确初始化所有基础服务', () => {
      // 验证API客户端可以创建
      const apiClient = getApiClient()
      expect(apiClient).toBeDefined()
      expect(apiClient.getAxiosInstance).toBeDefined()

      // 验证模拟API服务可以创建
      const mockService = getMockApiService()
      expect(mockService).toBeDefined()

      // 验证测试数据生成器可以工作
      const generator = new TestDataGenerator()
      expect(generator).toBeDefined()
    })

    it('应该能够生成和验证测试数据', () => {
      const testUsers = TestDataGenerator.generateDefaultUsers()
      
      expect(testUsers.length).toBeGreaterThanOrEqual(20)
      
      // 验证数据完整性
      const config = TestDataGenerator.getDefaultConfig()
      const validation = TestDataGenerator.validateGeneratedData(testUsers, config)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('API客户端与模拟服务集成', () => {
    it('应该能够通过API客户端获取用户列表', async () => {
      // 模拟API客户端请求（实际上会被模拟服务处理）
      // 注意：这里我们直接调用模拟服务，因为还没有完整的HTTP拦截设置
      const mockService = getMockApiService()
      const response = await mockService.handleGetUsers()
      
      expect(response.success).toBe(true)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.timestamp).toBeDefined()
    })

    it('应该能够通过API客户端创建用户', async () => {
      const mockService = getMockApiService()
      
      const userData: CreateUserData = {
        name: '集成测试用户',
        email: 'integration@test.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const response = await mockService.handleCreateUser(userData)
      
      expect(response.success).toBe(true)
      expect(response.data.name).toBe('集成测试用户')
      expect(response.data.email).toBe('integration@test.com')
      expect(response.data.id).toBeDefined()
    })

    it('应该能够处理完整的CRUD操作流程', async () => {
      const mockService = getMockApiService()
      
      // 1. 创建用户
      const createData: CreateUserData = {
        name: 'CRUD测试用户',
        email: 'crud@test.com',
        role: UserRole.MODERATOR,
        status: UserStatus.PENDING
      }
      
      const createResponse = await mockService.handleCreateUser(createData)
      expect(createResponse.success).toBe(true)
      const userId = createResponse.data.id
      
      // 2. 读取用户
      const readResponse = await mockService.handleGetUserById(userId)
      expect(readResponse.success).toBe(true)
      expect(readResponse.data.name).toBe('CRUD测试用户')
      
      // 3. 更新用户
      const updateResponse = await mockService.handleUpdateUser(userId, {
        id: userId,
        name: '更新后的用户',
        status: UserStatus.ACTIVE
      })
      expect(updateResponse.success).toBe(true)
      expect(updateResponse.data.name).toBe('更新后的用户')
      expect(updateResponse.data.status).toBe(UserStatus.ACTIVE)
      
      // 4. 删除用户
      const deleteResponse = await mockService.handleDeleteUser(userId)
      expect(deleteResponse.success).toBe(true)
      
      // 5. 验证用户已删除
      await expect(mockService.handleGetUserById(userId)).rejects.toThrow()
    })
  })

  describe('数据持久化集成', () => {
    it('应该能够在localStorage中持久化数据', async () => {
      const mockService = getMockApiService()
      
      // 创建测试用户
      const userData: CreateUserData = {
        name: '持久化测试用户',
        email: 'persistence@test.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      }
      
      await mockService.handleCreateUser(userData)
      
      // 验证数据已保存到localStorage
      const stored = localStorage.getItem('mock_api_users')
      expect(stored).toBeTruthy()
      
      const data = JSON.parse(stored!)
      expect(data.users).toBeInstanceOf(Array)
      expect(data.users.some((u: any) => u.email === 'persistence@test.com')).toBe(true)
    })

    it('应该能够从localStorage恢复数据', async () => {
      const mockService1 = getMockApiService()
      
      // 创建测试用户
      const userData: CreateUserData = {
        name: '恢复测试用户',
        email: 'recovery@test.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await mockService1.handleCreateUser(userData)
      
      // 清理服务实例
      cleanupMockApiService()
      
      // 创建新的服务实例并初始化
      initializeMockApiService()
      const mockService2 = getMockApiService()
      
      // 验证数据已恢复
      const users = await mockService2.handleGetUsers()
      expect(users.data.some(u => u.email === 'recovery@test.com')).toBe(true)
    })
  })

  describe('错误处理集成', () => {
    it('应该能够正确处理验证错误', async () => {
      const mockService = getMockApiService()
      
      const invalidData: CreateUserData = {
        name: '', // 无效姓名
        email: 'invalid-email', // 无效邮箱
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      await expect(mockService.handleCreateUser(invalidData)).rejects.toThrow()
      
      try {
        await mockService.handleCreateUser(invalidData)
      } catch (error: any) {
        expect(error.response.status).toBe(422)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.errors).toBeInstanceOf(Array)
        expect(error.response.data.errors.length).toBeGreaterThan(0)
      }
    })

    it('应该能够正确处理资源不存在错误', async () => {
      const mockService = getMockApiService()
      
      await expect(mockService.handleGetUserById('nonexistent-id')).rejects.toThrow()
      
      try {
        await mockService.handleGetUserById('nonexistent-id')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.message).toBe('用户不存在')
      }
    })
  })

  describe('搜索和筛选集成', () => {
    it('应该能够正确执行搜索和筛选操作', async () => {
      const mockService = getMockApiService()
      
      // 创建特定的测试用户
      const testUsers: CreateUserData[] = [
        {
          name: '张三',
          email: 'zhangsan@search.com',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE
        },
        {
          name: '李四',
          email: 'lisi@search.com',
          role: UserRole.USER,
          status: UserStatus.PENDING
        }
      ]
      
      for (const userData of testUsers) {
        await mockService.handleCreateUser(userData)
      }
      
      // 测试按姓名搜索
      const nameSearchResult = await mockService.handleGetUsers({ search: '张三' })
      expect(nameSearchResult.data.some(u => u.name === '张三')).toBe(true)
      
      // 测试按邮箱搜索
      const emailSearchResult = await mockService.handleGetUsers({ search: 'lisi@search.com' })
      expect(emailSearchResult.data.some(u => u.email === 'lisi@search.com')).toBe(true)
      
      // 测试按角色筛选
      const roleFilterResult = await mockService.handleGetUsers({ role: UserRole.ADMIN })
      expect(roleFilterResult.data.every(u => u.role === UserRole.ADMIN)).toBe(true)
      
      // 测试按状态筛选
      const statusFilterResult = await mockService.handleGetUsers({ status: UserStatus.PENDING })
      expect(statusFilterResult.data.every(u => u.status === UserStatus.PENDING)).toBe(true)
    })
  })

  describe('性能和边界情况', () => {
    it('应该能够处理大量数据', async () => {
      // 生成大量测试数据
      const generator = new TestDataGenerator()
      const largeDataset = generator.generateUsers({
        userCount: 100,
        roles: [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR],
        statuses: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING],
        locales: ['zh-CN']
      })
      
      expect(largeDataset.length).toBe(100)
      
      // 验证数据质量
      const validation = TestDataGenerator.validateGeneratedData(largeDataset, {
        userCount: 100,
        roles: [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR],
        statuses: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING],
        locales: ['zh-CN']
      })
      
      expect(validation.isValid).toBe(true)
    })

    it('应该能够处理分页请求', async () => {
      const mockService = getMockApiService()
      
      // 测试分页功能
      const page1 = await mockService.handleGetUsers({ page: 1, pageSize: 5 })
      expect(page1.data.length).toBeLessThanOrEqual(5)
      
      const page2 = await mockService.handleGetUsers({ page: 2, pageSize: 5 })
      expect(page2.data.length).toBeLessThanOrEqual(5)
      
      // 验证不同页面的数据不重复（如果有足够数据）
      if (page1.data.length > 0 && page2.data.length > 0) {
        const page1Ids = new Set(page1.data.map(u => u.id))
        const page2Ids = new Set(page2.data.map(u => u.id))
        const intersection = new Set([...page1Ids].filter(id => page2Ids.has(id)))
        expect(intersection.size).toBe(0)
      }
    })
  })
})
import { describe, it, expect, beforeEach } from 'vitest'
import { TestDataGenerator, generateTestUsers } from '../testDataGenerator'
import { UserRole, UserStatus } from '@/types/user'
import type { TestDataConfig } from '../testDataGenerator'

describe('TestDataGenerator', () => {
  let generator: TestDataGenerator

  beforeEach(() => {
    generator = new TestDataGenerator()
  })

  describe('基本功能测试', () => {
    it('应该生成指定数量的用户', () => {
      const config: TestDataConfig = {
        userCount: 10,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      expect(users).toHaveLength(10)
    })

    it('应该生成包含所有必需字段的用户', () => {
      const config: TestDataConfig = {
        userCount: 1,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      const user = users[0]

      expect(user.id).toBeDefined()
      expect(user.name).toBeDefined()
      expect(user.email).toBeDefined()
      expect(user.role).toBeDefined()
      expect(user.status).toBeDefined()
      expect(user.createdAt).toBeDefined()
      expect(user.updatedAt).toBeDefined()
    })

    it('应该生成中文姓名', () => {
      const config: TestDataConfig = {
        userCount: 5,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      
      users.forEach(user => {
        expect(user.name).toMatch(/^[\u4e00-\u9fa5]+$/) // 匹配中文字符
        expect(user.name.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('应该生成有效的邮箱地址', () => {
      const config: TestDataConfig = {
        userCount: 5,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      users.forEach(user => {
        expect(user.email).toMatch(emailRegex)
      })
    })
  })

  describe('唯一性测试', () => {
    it('应该确保邮箱地址唯一', () => {
      const config: TestDataConfig = {
        userCount: 20,
        roles: [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR],
        statuses: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      const emails = users.map(u => u.email)
      const uniqueEmails = new Set(emails)

      expect(emails.length).toBe(uniqueEmails.size)
    })

    it('应该确保用户ID唯一', () => {
      const config: TestDataConfig = {
        userCount: 20,
        roles: [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR],
        statuses: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      const ids = users.map(u => u.id)
      const uniqueIds = new Set(ids)

      expect(ids.length).toBe(uniqueIds.size)
    })
  })

  describe('角色和状态分布测试', () => {
    it('应该包含所有指定的用户角色', () => {
      const config: TestDataConfig = {
        userCount: 30,
        roles: [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      const userRoles = new Set(users.map(u => u.role))

      expect(userRoles.has(UserRole.USER)).toBe(true)
      expect(userRoles.has(UserRole.ADMIN)).toBe(true)
      expect(userRoles.has(UserRole.MODERATOR)).toBe(true)
    })

    it('应该包含所有指定的用户状态', () => {
      const config: TestDataConfig = {
        userCount: 30,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      const userStatuses = new Set(users.map(u => u.status))

      expect(userStatuses.has(UserStatus.ACTIVE)).toBe(true)
      expect(userStatuses.has(UserStatus.INACTIVE)).toBe(true)
      expect(userStatuses.has(UserStatus.PENDING)).toBe(true)
    })
  })

  describe('时间戳测试', () => {
    it('应该生成有效的ISO时间戳', () => {
      const config: TestDataConfig = {
        userCount: 5,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)

      users.forEach(user => {
        expect(() => new Date(user.createdAt)).not.toThrow()
        expect(() => new Date(user.updatedAt)).not.toThrow()
        expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt)
        expect(new Date(user.updatedAt).toISOString()).toBe(user.updatedAt)
      })
    })

    it('更新时间应该晚于或等于创建时间', () => {
      const config: TestDataConfig = {
        userCount: 10,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)

      users.forEach(user => {
        const createdAt = new Date(user.createdAt)
        const updatedAt = new Date(user.updatedAt)
        expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime())
      })
    })
  })

  describe('静态方法测试', () => {
    it('getDefaultConfig 应该返回有效的默认配置', () => {
      const config = TestDataGenerator.getDefaultConfig()

      expect(config.userCount).toBeGreaterThanOrEqual(20)
      expect(config.roles).toContain(UserRole.ADMIN)
      expect(config.roles).toContain(UserRole.MODERATOR)
      expect(config.roles).toContain(UserRole.USER)
      expect(config.statuses).toContain(UserStatus.ACTIVE)
      expect(config.statuses).toContain(UserStatus.INACTIVE)
      expect(config.statuses).toContain(UserStatus.PENDING)
      expect(config.locales).toContain('zh-CN')
    })

    it('generateDefaultUsers 应该生成符合要求的用户数据', () => {
      const users = TestDataGenerator.generateDefaultUsers()

      expect(users.length).toBeGreaterThanOrEqual(20)
      
      // 验证包含所有角色
      const roles = new Set(users.map(u => u.role))
      expect(roles.has(UserRole.ADMIN)).toBe(true)
      expect(roles.has(UserRole.MODERATOR)).toBe(true)
      expect(roles.has(UserRole.USER)).toBe(true)

      // 验证包含所有状态
      const statuses = new Set(users.map(u => u.status))
      expect(statuses.has(UserStatus.ACTIVE)).toBe(true)
      expect(statuses.has(UserStatus.INACTIVE)).toBe(true)
      expect(statuses.has(UserStatus.PENDING)).toBe(true)
    })

    it('validateGeneratedData 应该正确验证数据', () => {
      const config = TestDataGenerator.getDefaultConfig()
      const users = generator.generateUsers(config)
      const validation = TestDataGenerator.validateGeneratedData(users, config)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('validateGeneratedData 应该检测到数据问题', () => {
      const config: TestDataConfig = {
        userCount: 10,
        roles: [UserRole.ADMIN, UserRole.USER],
        statuses: [UserStatus.ACTIVE, UserStatus.PENDING],
        locales: ['zh-CN']
      }

      // 创建有问题的数据
      const users = [
        {
          id: '1',
          name: '张三',
          email: 'test@example.com',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      const validation = TestDataGenerator.validateGeneratedData(users, config)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors.some(e => e.includes('用户数量不足'))).toBe(true)
    })
  })

  describe('便捷函数测试', () => {
    it('generateTestUsers 应该生成指定数量的用户', () => {
      const users = generateTestUsers(15)
      expect(users).toHaveLength(15)
    })

    it('generateTestUsers 不指定数量时应该使用默认配置', () => {
      const users = generateTestUsers()
      expect(users.length).toBeGreaterThanOrEqual(20)
    })
  })

  describe('边界情况测试', () => {
    it('应该处理最小用户数量', () => {
      const config: TestDataConfig = {
        userCount: 1,
        roles: [UserRole.USER],
        statuses: [UserStatus.ACTIVE],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      expect(users).toHaveLength(1)
      expect(users[0]).toBeDefined()
    })

    it('应该处理大量用户生成', () => {
      const config: TestDataConfig = {
        userCount: 100,
        roles: [UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR],
        statuses: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING],
        locales: ['zh-CN']
      }

      const users = generator.generateUsers(config)
      expect(users).toHaveLength(100)
      
      // 验证唯一性
      const emails = users.map(u => u.email)
      const uniqueEmails = new Set(emails)
      expect(emails.length).toBe(uniqueEmails.size)
    })
  })
})
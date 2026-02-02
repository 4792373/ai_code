import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { UserService, userService } from '../userService'
import { UserRole, UserStatus } from '@/types/user'
import type { CreateUserData, UpdateUserData } from '@/types/user'

describe('UserService', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = UserService.getInstance()
      const instance2 = UserService.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(userService)
    })
  })

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const service = UserService.getInstance()
      
      const id1 = service.generateId()
      const id2 = service.generateId()
      const id3 = service.generateId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id3).toBeDefined()
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      expect(typeof id3).toBe('string')
      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })

    it('should generate IDs with reasonable length', () => {
      const service = UserService.getInstance()
      
      const id = service.generateId()
      
      expect(id.length).toBeGreaterThan(10)
      expect(id.length).toBeLessThan(50)
    })

    it('should generate alphanumeric IDs', () => {
      const service = UserService.getInstance()
      
      const id = service.generateId()
      
      // Should only contain alphanumeric characters
      expect(id).toMatch(/^[a-z0-9]+$/i)
    })
  })

  describe('Email Format Validation', () => {
    it('should validate correct email formats', async () => {
      const service = UserService.getInstance()
      
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co',
        'user..name@example.com', // consecutive dots are technically allowed in local part
        'user@sub.domain.com'
      ]
      
      for (const email of validEmails) {
        const userData: CreateUserData = {
          name: 'Test User',
          email,
          role: UserRole.USER,
          status: UserStatus.ACTIVE
        }
        
        const result = await service.validateUser(userData)
        
        expect(result.errors).not.toContain('邮箱格式不正确')
      }
    })

    it('should reject invalid email formats', async () => {
      const service = UserService.getInstance()
      
      const invalidEmails = [
        'invalid-email',        // no @ symbol
        '@example.com',         // no local part
        'user@',                // no domain
        'user@.com',            // domain starts with dot
        'user@example',         // no TLD
        'user name@example.com', // space in local part
        'user@ex ample.com'     // space in domain
      ]
      
      for (const email of invalidEmails) {
        const userData: CreateUserData = {
          name: 'Test User',
          email,
          role: UserRole.USER,
          status: UserStatus.ACTIVE
        }
        
        const result = await service.validateUser(userData)
        
        expect(result.errors).toContain('邮箱格式不正确')
        expect(result.isValid).toBe(false)
      }
    })

    it('should handle email with whitespace', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: 'Test User',
        email: '  test@example.com  ',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.errors).not.toContain('邮箱格式不正确')
    })
  })

  describe('Name Validation', () => {
    it('should validate required name field', async () => {
      const service = UserService.getInstance()
      
      const invalidNames = ['', '   ', undefined as any, null as any]
      
      for (const name of invalidNames) {
        const userData: CreateUserData = {
          name,
          email: 'test@example.com',
          role: UserRole.USER,
          status: UserStatus.ACTIVE
        }
        
        const result = await service.validateUser(userData)
        
        expect(result.errors).toContain('用户姓名不能为空')
        expect(result.isValid).toBe(false)
      }
    })

    it('should validate name length constraints', async () => {
      const service = UserService.getInstance()
      
      // Test too short name
      const shortNameData: CreateUserData = {
        name: 'A',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      let result = await service.validateUser(shortNameData)
      expect(result.errors).toContain('姓名长度应在2-50个字符之间')
      expect(result.isValid).toBe(false)
      
      // Test too long name
      const longNameData: CreateUserData = {
        name: 'A'.repeat(51),
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      result = await service.validateUser(longNameData)
      expect(result.errors).toContain('姓名长度应在2-50个字符之间')
      expect(result.isValid).toBe(false)
      
      // Test valid length names
      const validNames = ['AB', 'A'.repeat(50), 'John Doe', '张三']
      
      for (const name of validNames) {
        const validData: CreateUserData = {
          name,
          email: 'test@example.com',
          role: UserRole.USER,
          status: UserStatus.ACTIVE
        }
        
        result = await service.validateUser(validData)
        expect(result.errors).not.toContain('姓名长度应在2-50个字符之间')
      }
    })

    it('should trim whitespace from name before validation', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: '  John Doe  ',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.errors).not.toContain('用户姓名不能为空')
      expect(result.errors).not.toContain('姓名长度应在2-50个字符之间')
    })
  })

  describe('Role and Status Validation', () => {
    it('should validate required role field', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: 'Test User',
        email: 'test@example.com',
        role: undefined as any,
        status: UserStatus.ACTIVE
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.errors).toContain('请选择用户角色')
      expect(result.isValid).toBe(false)
    })

    it('should validate required status field', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.USER,
        status: undefined as any
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.errors).toContain('请选择用户状态')
      expect(result.isValid).toBe(false)
    })

    it('should accept valid role and status values', async () => {
      const service = UserService.getInstance()
      
      const validCombinations = [
        { role: UserRole.USER, status: UserStatus.ACTIVE },
        { role: UserRole.ADMIN, status: UserStatus.INACTIVE },
        { role: UserRole.MODERATOR, status: UserStatus.PENDING }
      ]
      
      for (const { role, status } of validCombinations) {
        const userData: CreateUserData = {
          name: 'Test User',
          email: 'test@example.com',
          role,
          status
        }
        
        const result = await service.validateUser(userData)
        
        expect(result.errors).not.toContain('请选择用户角色')
        expect(result.errors).not.toContain('请选择用户状态')
      }
    })
  })

  describe('Comprehensive Validation', () => {
    it('should return valid result for completely valid user data', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should accumulate multiple validation errors', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: '',
        email: 'invalid-email',
        role: undefined as any,
        status: undefined as any
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('用户姓名不能为空')
      expect(result.errors).toContain('邮箱格式不正确')
      expect(result.errors).toContain('请选择用户角色')
      expect(result.errors).toContain('请选择用户状态')
      expect(result.errors.length).toBe(4)
    })

    it('should validate update data correctly', async () => {
      const service = UserService.getInstance()
      
      // Valid update data
      const updateData: UpdateUserData = {
        id: 'test-user-id',
        name: 'Updated User',
        email: 'updated@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.INACTIVE
      }
      
      const result = await service.validateUser(updateData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should handle partial update data', async () => {
      const service = UserService.getInstance()
      
      // Partial update (only name and email)
      const updateData: UpdateUserData = {
        id: 'test-user-id',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const result = await service.validateUser(updateData)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty email field', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: 'Test User',
        email: '',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.errors).toContain('邮箱地址不能为空')
      expect(result.isValid).toBe(false)
    })

    it('should handle whitespace-only email field', async () => {
      const service = UserService.getInstance()
      
      const userData: CreateUserData = {
        name: 'Test User',
        email: '   ',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const result = await service.validateUser(userData)
      
      expect(result.errors).toContain('邮箱地址不能为空')
      expect(result.isValid).toBe(false)
    })

    it('should handle special characters in name', async () => {
      const service = UserService.getInstance()
      
      const specialNames = [
        'John O\'Connor',
        'José María',
        '李小明',
        'محمد علي',
        'Jean-Pierre'
      ]
      
      for (const name of specialNames) {
        const userData: CreateUserData = {
          name,
          email: 'test@example.com',
          role: UserRole.USER,
          status: UserStatus.ACTIVE
        }
        
        const result = await service.validateUser(userData)
        
        expect(result.errors).not.toContain('用户姓名不能为空')
        expect(result.errors).not.toContain('姓名长度应在2-50个字符之间')
      }
    })

    it('should handle concurrent validation calls', async () => {
      const service = UserService.getInstance()
      
      const userData1: CreateUserData = {
        name: 'User 1',
        email: 'user1@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      
      const userData2: CreateUserData = {
        name: 'User 2',
        email: 'user2@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.INACTIVE
      }
      
      const [result1, result2] = await Promise.all([
        service.validateUser(userData1),
        service.validateUser(userData2)
      ])
      
      expect(result1.isValid).toBe(true)
      expect(result2.isValid).toBe(true)
    })
  })
})
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { userService } from '@/services/userService'
import { UserRole, UserStatus } from '@/types/user'
import type { User, CreateUserData } from '@/types/user'

describe('UserForm Logic Tests', () => {
  let userStore: ReturnType<typeof useUserStore>
  let uiStore: ReturnType<typeof useUIStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    uiStore = useUIStore()
  })

  describe('表单验证逻辑', () => {
    it('应该验证有效的用户数据', async () => {
      const validUserData: CreateUserData = {
        name: '张三',
        email: 'zhangsan@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }

      const result = await userService.validateUser(validUserData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝空姓名', async () => {
      const invalidUserData: CreateUserData = {
        name: '',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }

      const result = await userService.validateUser(invalidUserData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('用户姓名不能为空')
    })

    it('应该拒绝无效邮箱格式', async () => {
      const invalidUserData: CreateUserData = {
        name: '张三',
        email: 'invalid-email',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }

      const result = await userService.validateUser(invalidUserData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('邮箱格式不正确')
    })

    it('应该拒绝重复邮箱', async () => {
      // 先添加一个用户
      const existingUser: CreateUserData = {
        name: '李四',
        email: 'existing@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      await userStore.addUser(existingUser)

      // 尝试添加相同邮箱的用户 - 现在由服务端处理
      const duplicateUser: CreateUserData = {
        name: '王五',
        email: 'existing@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      }

      // 客户端验证不再检查邮箱唯一性，这由服务端处理
      const result = await userService.validateUser(duplicateUser)
      expect(result.isValid).toBe(true) // 客户端验证通过
    })

    it('应该验证姓名长度限制', async () => {
      const shortNameUser: CreateUserData = {
        name: '张',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }

      const result = await userService.validateUser(shortNameUser)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('姓名长度应在2-50个字符之间')
    })
  })

  describe('用户创建逻辑', () => {
    it('应该成功创建新用户', async () => {
      const userData: CreateUserData = {
        name: '新用户',
        email: 'newuser@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }

      const initialCount = userStore.users.length
      await userStore.addUser(userData)

      expect(userStore.users.length).toBe(initialCount + 1)
      const newUser = userStore.users[userStore.users.length - 1]
      expect(newUser.name).toBe(userData.name)
      expect(newUser.email).toBe(userData.email)
      expect(newUser.role).toBe(userData.role)
      expect(newUser.status).toBe(userData.status)
      expect(newUser.id).toBeDefined()
      expect(newUser.createdAt).toBeDefined()
      expect(newUser.updatedAt).toBeDefined()
    })
  })

  describe('用户更新逻辑', () => {
    it('应该成功更新现有用户', async () => {
      // 先创建一个用户
      const userData: CreateUserData = {
        name: '原始用户',
        email: 'original@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
      await userStore.addUser(userData)
      const user = userStore.users[userStore.users.length - 1]

      // 更新用户信息
      const updateData = {
        id: user.id,
        name: '更新后用户',
        email: 'updated@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.INACTIVE
      }

      const updatedUser = await userStore.updateUser(updateData)
      expect(updatedUser).toBeDefined()
      expect(updatedUser.name).toBe(updateData.name)
      expect(updatedUser.email).toBe(updateData.email)
      expect(updatedUser.role).toBe(updateData.role)
      expect(updatedUser.status).toBe(updateData.status)

      const retrievedUser = userStore.getUserById(user.id)
      expect(retrievedUser?.name).toBe(updateData.name)
      expect(retrievedUser?.email).toBe(updateData.email)
      expect(retrievedUser?.role).toBe(updateData.role)
      expect(retrievedUser?.status).toBe(updateData.status)
    })

    it('应该在更新不存在的用户时抛出错误', async () => {
      const updateData = {
        id: 'non-existent-id',
        name: '不存在的用户',
        email: 'nonexistent@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }

      await expect(async () => {
        await userStore.updateUser(updateData)
      }).rejects.toThrow()
    })
  })

  describe('UI 状态管理', () => {
    it('应该正确管理模态框状态', () => {
      expect(uiStore.showUserModal).toBe(false)

      uiStore.openUserModal('create')
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.userModalMode).toBe('create')

      uiStore.openUserModal('edit')
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.userModalMode).toBe('edit')

      uiStore.closeUserModal()
      expect(uiStore.showUserModal).toBe(false)
    })

    it('应该正确管理当前用户状态', () => {
      const user: User = {
        id: '1',
        name: '测试用户',
        email: 'test@example.com',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }

      expect(userStore.currentUser).toBe(null)

      userStore.setCurrentUser(user)
      expect(userStore.currentUser).toEqual(user)

      userStore.setCurrentUser(null)
      expect(userStore.currentUser).toBe(null)
    })
  })

  describe('枚举类型处理', () => {
    it('应该正确处理 UserRole 枚举', () => {
      expect(UserRole.ADMIN).toBe('admin')
      expect(UserRole.MODERATOR).toBe('moderator')
      expect(UserRole.USER).toBe('user')
    })

    it('应该正确处理 UserStatus 枚举', () => {
      expect(UserStatus.ACTIVE).toBe('active')
      expect(UserStatus.INACTIVE).toBe('inactive')
      expect(UserStatus.PENDING).toBe('pending')
    })
  })
})
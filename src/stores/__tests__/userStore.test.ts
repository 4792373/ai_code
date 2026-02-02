import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../userStore'
import { UserRole, UserStatus } from '@/types/user'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('UserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const userStore = useUserStore()
    
    expect(userStore.users).toEqual([])
    expect(userStore.currentUser).toBeNull()
    expect(userStore.searchKeyword).toBe('')
    expect(userStore.filters).toEqual({})
    expect(userStore.pagination.current).toBe(1)
    expect(userStore.pagination.pageSize).toBe(10)
    expect(userStore.pagination.total).toBe(0)
  })

  it('should add a new user', async () => {
    const userStore = useUserStore()
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    
    await userStore.addUser(userData)
    
    expect(userStore.users).toHaveLength(1)
    expect(userStore.users[0].name).toBe('Test User')
    expect(userStore.users[0].email).toBe('test@example.com')
    expect(userStore.users[0].id).toBeDefined()
    expect(userStore.users[0].createdAt).toBeDefined()
    expect(userStore.users[0].updatedAt).toBeDefined()
    expect(userStore.pagination.total).toBe(1)
  })

  it('should update an existing user', async () => {
    const userStore = useUserStore()
    
    // Add a user first
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    await userStore.addUser(userData)
    
    const userId = userStore.users[0].id
    const originalUpdatedAt = userStore.users[0].updatedAt
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1))
    
    // Update the user
    await userStore.updateUser({
      id: userId,
      name: 'Updated User',
      role: UserRole.ADMIN
    })
    
    expect(userStore.users[0].name).toBe('Updated User')
    expect(userStore.users[0].role).toBe(UserRole.ADMIN)
    expect(userStore.users[0].email).toBe('test@example.com') // Should remain unchanged
    expect(userStore.users[0].updatedAt).not.toBe(originalUpdatedAt)
  })

  it('should delete a user', async () => {
    const userStore = useUserStore()
    
    // Add users
    await userStore.addUser({
      name: 'User 1',
      email: 'user1@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    await userStore.addUser({
      name: 'User 2',
      email: 'user2@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    
    expect(userStore.users).toHaveLength(2)
    
    const userIdToDelete = userStore.users[0].id
    await userStore.deleteUser(userIdToDelete)
    
    expect(userStore.users).toHaveLength(1)
    expect(userStore.users[0].name).toBe('User 2')
    expect(userStore.pagination.total).toBe(1)
  })

  it('should filter users by search keyword', async () => {
    const userStore = useUserStore()
    
    // Add test users
    await userStore.addUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    
    await userStore.addUser({
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })
    
    // Test search by name
    await userStore.setSearchKeyword('john')
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].name).toBe('John Doe')
    
    // Test search by email
    await userStore.setSearchKeyword('jane@')
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].name).toBe('Jane Smith')
    
    // Test case insensitive search
    await userStore.setSearchKeyword('JOHN')
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].name).toBe('John Doe')
  })

  it('should filter users by role and status', async () => {
    const userStore = useUserStore()
    
    // Add test users with different roles and statuses
    await userStore.addUser({
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })
    
    await userStore.addUser({
      name: 'Regular User',
      email: 'user@example.com',
      role: UserRole.USER,
      status: UserStatus.INACTIVE
    })
    
    await userStore.addUser({
      name: 'Moderator User',
      email: 'mod@example.com',
      role: UserRole.MODERATOR,
      status: UserStatus.ACTIVE
    })
    
    // Filter by role
    await userStore.setFilters({ role: UserRole.ADMIN })
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].name).toBe('Admin User')
    
    // Filter by status
    await userStore.setFilters({ status: UserStatus.ACTIVE })
    expect(userStore.filteredUsers).toHaveLength(2)
    
    // Filter by both role and status
    await userStore.setFilters({ role: UserRole.USER, status: UserStatus.INACTIVE })
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].name).toBe('Regular User')
  })

  it('should set and get current user', async () => {
    const userStore = useUserStore()
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    await userStore.addUser(userData)
    
    const user = userStore.users[0]
    userStore.setCurrentUser(user)
    
    expect(userStore.currentUser).toEqual(user)
    
    userStore.setCurrentUser(null)
    expect(userStore.currentUser).toBeNull()
  })

  it('should load data from localStorage', async () => {
    const mockData = {
      users: [
        {
          id: '1',
          name: 'Saved User',
          email: 'saved@example.com',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ]
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))
    
    const userStore = useUserStore()
    await userStore.initialize()
    
    expect(userStore.users).toHaveLength(1)
    expect(userStore.users[0].name).toBe('Saved User')
    expect(userStore.pagination.total).toBe(1)
    expect(localStorageMock.getItem).toHaveBeenCalledWith('user-management-data')
  })

  it('should handle localStorage errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const userStore = useUserStore()
    
    // 应该抛出错误
    await expect(async () => {
      await userStore.initialize()
    }).rejects.toThrow()
    
    consoleSpy.mockRestore()
  })

  it('should clear all data', async () => {
    const userStore = useUserStore()
    
    // 添加一些数据
    await userStore.addUser({
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    })
    await userStore.setSearchKeyword('test')
    await userStore.setFilters({ role: UserRole.USER })
    
    // 清空所有数据
    userStore.clearAll()
    
    expect(userStore.users).toEqual([])
    expect(userStore.currentUser).toBeNull()
    expect(userStore.searchKeyword).toBe('')
    expect(userStore.filters).toEqual({})
    expect(userStore.pagination.current).toBe(1)
    expect(userStore.pagination.pageSize).toBe(10)
    expect(userStore.pagination.total).toBe(0)
  })

  it('should get user by ID', async () => {
    const userStore = useUserStore()
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    await userStore.addUser(userData)
    
    const userId = userStore.users[0].id
    const foundUser = userStore.getUserById(userId)
    
    expect(foundUser).toBeDefined()
    expect(foundUser?.name).toBe('Test User')
    
    const notFoundUser = userStore.getUserById('nonexistent-id')
    expect(notFoundUser).toBeUndefined()
  })

  it('should clear current user when deleting current user', async () => {
    const userStore = useUserStore()
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE
    }
    await userStore.addUser(userData)
    
    const user = userStore.users[0]
    userStore.setCurrentUser(user)
    
    expect(userStore.currentUser).toEqual(user)
    
    await userStore.deleteUser(user.id)
    
    expect(userStore.currentUser).toBeNull()
    expect(userStore.users).toHaveLength(0)
  })
})
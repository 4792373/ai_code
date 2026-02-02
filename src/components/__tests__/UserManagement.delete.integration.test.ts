import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'

// Mock message from ant-design-vue
vi.mock('ant-design-vue', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('Delete Functionality Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should manage delete confirmation state correctly', async () => {
    const userStore = useUserStore()
    const uiStore = useUIStore()

    // Add a test user
    await userStore.addUser({
      name: '测试用户',
      email: 'test@example.com',
      role: 'user' as any,
      status: 'active' as any
    })

    const testUser = userStore.users[0]
    
    // Open delete confirmation
    uiStore.openDeleteConfirm(testUser.id)

    // Check if delete confirmation dialog is open
    expect(uiStore.showDeleteConfirm).toBe(true)
    expect(uiStore.deleteUserId).toBe(testUser.id)
  })

  it('should delete user and close dialog when confirmed', async () => {
    const userStore = useUserStore()
    const uiStore = useUIStore()

    // Add a test user
    await userStore.addUser({
      name: '测试用户',
      email: 'test@example.com',
      role: 'user' as any,
      status: 'active' as any
    })

    const initialUserCount = userStore.users.length
    const testUser = userStore.users[0]

    // Open delete confirmation
    uiStore.openDeleteConfirm(testUser.id)

    // Delete the user
    const deleteResult = await userStore.deleteUser(testUser.id)

    // Close the dialog
    uiStore.closeDeleteConfirm()

    // Check results
    expect(deleteResult).toBeDefined()
    expect(deleteResult.id).toBe(testUser.id)
    expect(userStore.users.length).toBe(initialUserCount - 1)
    expect(userStore.getUserById(testUser.id)).toBeUndefined()
    expect(uiStore.showDeleteConfirm).toBe(false)
    expect(uiStore.deleteUserId).toBeNull()
  })

  it('should close dialog when delete is cancelled', async () => {
    const userStore = useUserStore()
    const uiStore = useUIStore()

    // Add a test user
    await userStore.addUser({
      name: '测试用户',
      email: 'test@example.com',
      role: 'user' as any,
      status: 'active' as any
    })

    const initialUserCount = userStore.users.length
    const testUser = userStore.users[0]

    // Open delete confirmation
    uiStore.openDeleteConfirm(testUser.id)

    // Cancel delete (just close dialog without deleting)
    uiStore.closeDeleteConfirm()

    // Check if user is not deleted and dialog is closed
    expect(userStore.users.length).toBe(initialUserCount)
    expect(userStore.getUserById(testUser.id)).toBeDefined()
    expect(uiStore.showDeleteConfirm).toBe(false)
    expect(uiStore.deleteUserId).toBeNull()
  })

  it('should handle delete of non-existent user gracefully', async () => {
    const userStore = useUserStore()

    // Try to delete non-existent user - should throw error
    await expect(async () => {
      await userStore.deleteUser('non-existent-id')
    }).rejects.toThrow()
  })

  it('should clear current user if deleted user is the current user', async () => {
    const userStore = useUserStore()

    // Add a test user
    await userStore.addUser({
      name: '测试用户',
      email: 'test@example.com',
      role: 'user' as any,
      status: 'active' as any
    })

    const testUser = userStore.users[0]
    
    // Set as current user
    userStore.setCurrentUser(testUser)
    expect(userStore.currentUser).toBe(testUser)

    // Delete the user
    await userStore.deleteUser(testUser.id)

    // Current user should be cleared
    expect(userStore.currentUser).toBeNull()
  })
})
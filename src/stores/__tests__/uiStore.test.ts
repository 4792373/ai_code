import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from '../uiStore'

describe('UIStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default state', () => {
    const uiStore = useUIStore()
    
    expect(uiStore.loading).toBe(false)
    expect(uiStore.showUserModal).toBe(false)
    expect(uiStore.userModalMode).toBe('create')
    expect(uiStore.showDeleteConfirm).toBe(false)
    expect(uiStore.deleteUserId).toBeNull()
  })

  describe('Loading State Management', () => {
    it('should set loading state to true', async () => {
      const uiStore = useUIStore()
      
      uiStore.setLoading(true)
      
      // 等待延迟加载（300ms）
      await new Promise(resolve => setTimeout(resolve, 350))
      
      expect(uiStore.loading).toBe(true)
    })

    it('should set loading state to false', async () => {
      const uiStore = useUIStore()
      
      // First set to true
      uiStore.setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(uiStore.loading).toBe(true)
      
      // Then set to false - 应该立即生效
      uiStore.setLoading(false)
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(uiStore.loading).toBe(false)
    })

    it('should toggle loading state multiple times', async () => {
      const uiStore = useUIStore()
      
      expect(uiStore.loading).toBe(false)
      
      uiStore.setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(uiStore.loading).toBe(true)
      
      uiStore.setLoading(false)
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(uiStore.loading).toBe(false)
      
      uiStore.setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(uiStore.loading).toBe(true)
    })
  })

  describe('User Modal Management', () => {
    it('should open user modal in create mode', () => {
      const uiStore = useUIStore()
      
      uiStore.openUserModal('create')
      
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.userModalMode).toBe('create')
    })

    it('should open user modal in edit mode', () => {
      const uiStore = useUIStore()
      
      uiStore.openUserModal('edit')
      
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.userModalMode).toBe('edit')
    })

    it('should close user modal', () => {
      const uiStore = useUIStore()
      
      // First open the modal
      uiStore.openUserModal('create')
      expect(uiStore.showUserModal).toBe(true)
      
      // Then close it
      uiStore.closeUserModal()
      expect(uiStore.showUserModal).toBe(false)
    })

    it('should maintain modal mode when closing', () => {
      const uiStore = useUIStore()
      
      uiStore.openUserModal('edit')
      expect(uiStore.userModalMode).toBe('edit')
      
      uiStore.closeUserModal()
      expect(uiStore.showUserModal).toBe(false)
      expect(uiStore.userModalMode).toBe('edit') // Mode should remain
    })

    it('should switch between create and edit modes', () => {
      const uiStore = useUIStore()
      
      uiStore.openUserModal('create')
      expect(uiStore.userModalMode).toBe('create')
      
      uiStore.openUserModal('edit')
      expect(uiStore.userModalMode).toBe('edit')
      
      uiStore.openUserModal('create')
      expect(uiStore.userModalMode).toBe('create')
    })
  })

  describe('Delete Confirmation Management', () => {
    it('should open delete confirmation with user ID', () => {
      const uiStore = useUIStore()
      const userId = 'test-user-123'
      
      uiStore.openDeleteConfirm(userId)
      
      expect(uiStore.showDeleteConfirm).toBe(true)
      expect(uiStore.deleteUserId).toBe(userId)
    })

    it('should close delete confirmation and clear user ID', () => {
      const uiStore = useUIStore()
      const userId = 'test-user-123'
      
      // First open the confirmation
      uiStore.openDeleteConfirm(userId)
      expect(uiStore.showDeleteConfirm).toBe(true)
      expect(uiStore.deleteUserId).toBe(userId)
      
      // Then close it
      uiStore.closeDeleteConfirm()
      expect(uiStore.showDeleteConfirm).toBe(false)
      expect(uiStore.deleteUserId).toBeNull()
    })

    it('should handle multiple delete confirmations', () => {
      const uiStore = useUIStore()
      
      const userId1 = 'user-1'
      const userId2 = 'user-2'
      
      // Open for first user
      uiStore.openDeleteConfirm(userId1)
      expect(uiStore.deleteUserId).toBe(userId1)
      
      // Open for second user (should replace first)
      uiStore.openDeleteConfirm(userId2)
      expect(uiStore.deleteUserId).toBe(userId2)
      
      // Close confirmation
      uiStore.closeDeleteConfirm()
      expect(uiStore.deleteUserId).toBeNull()
    })

    it('should handle empty string user ID', () => {
      const uiStore = useUIStore()
      
      uiStore.openDeleteConfirm('')
      
      expect(uiStore.showDeleteConfirm).toBe(true)
      expect(uiStore.deleteUserId).toBe('')
    })
  })

  describe('State Independence', () => {
    it('should manage modal and delete confirmation states independently', () => {
      const uiStore = useUIStore()
      
      // Open user modal
      uiStore.openUserModal('create')
      expect(uiStore.showUserModal).toBe(true)
      
      // Open delete confirmation
      uiStore.openDeleteConfirm('user-123')
      expect(uiStore.showDeleteConfirm).toBe(true)
      expect(uiStore.deleteUserId).toBe('user-123')
      
      // Both should be open
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.showDeleteConfirm).toBe(true)
      
      // Close modal, delete confirmation should remain
      uiStore.closeUserModal()
      expect(uiStore.showUserModal).toBe(false)
      expect(uiStore.showDeleteConfirm).toBe(true)
      
      // Close delete confirmation, modal should remain closed
      uiStore.closeDeleteConfirm()
      expect(uiStore.showDeleteConfirm).toBe(false)
      expect(uiStore.showUserModal).toBe(false)
    })

    it('should manage loading state independently from modals', async () => {
      const uiStore = useUIStore()
      
      // Set loading
      uiStore.setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(uiStore.loading).toBe(true)
      
      // Open modal
      uiStore.openUserModal('edit')
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.loading).toBe(true) // Loading should remain
      
      // Close modal
      uiStore.closeUserModal()
      expect(uiStore.showUserModal).toBe(false)
      expect(uiStore.loading).toBe(true) // Loading should remain
      
      // Turn off loading
      uiStore.setLoading(false)
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(uiStore.loading).toBe(false)
    })
  })

  describe('Computed Properties Reactivity', () => {
    it('should have reactive computed properties', async () => {
      const uiStore = useUIStore()
      
      // Test loading reactivity
      expect(uiStore.loading).toBe(false)
      uiStore.setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(uiStore.loading).toBe(true)
      
      // Test modal reactivity
      expect(uiStore.showUserModal).toBe(false)
      uiStore.openUserModal('create')
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.userModalMode).toBe('create')
      
      // Test delete confirmation reactivity
      expect(uiStore.showDeleteConfirm).toBe(false)
      expect(uiStore.deleteUserId).toBeNull()
      uiStore.openDeleteConfirm('test-id')
      expect(uiStore.showDeleteConfirm).toBe(true)
      expect(uiStore.deleteUserId).toBe('test-id')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid state changes', async () => {
      const uiStore = useUIStore()
      
      // Rapid loading changes
      uiStore.setLoading(true)
      uiStore.setLoading(false)
      uiStore.setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 350))
      expect(uiStore.loading).toBe(true)
      
      // Rapid modal changes
      uiStore.openUserModal('create')
      uiStore.closeUserModal()
      uiStore.openUserModal('edit')
      expect(uiStore.showUserModal).toBe(true)
      expect(uiStore.userModalMode).toBe('edit')
      
      // Rapid delete confirmation changes
      uiStore.openDeleteConfirm('user1')
      uiStore.closeDeleteConfirm()
      uiStore.openDeleteConfirm('user2')
      expect(uiStore.showDeleteConfirm).toBe(true)
      expect(uiStore.deleteUserId).toBe('user2')
    })

    it('should handle closing modals that are already closed', () => {
      const uiStore = useUIStore()
      
      // Close modal when already closed
      expect(uiStore.showUserModal).toBe(false)
      uiStore.closeUserModal()
      expect(uiStore.showUserModal).toBe(false)
      
      // Close delete confirmation when already closed
      expect(uiStore.showDeleteConfirm).toBe(false)
      uiStore.closeDeleteConfirm()
      expect(uiStore.showDeleteConfirm).toBe(false)
      expect(uiStore.deleteUserId).toBeNull()
    })

    it('should handle special characters in user ID', () => {
      const uiStore = useUIStore()
      const specialUserId = 'user-123!@#$%^&*()_+-=[]{}|;:,.<>?'
      
      uiStore.openDeleteConfirm(specialUserId)
      
      expect(uiStore.showDeleteConfirm).toBe(true)
      expect(uiStore.deleteUserId).toBe(specialUserId)
      
      uiStore.closeDeleteConfirm()
      expect(uiStore.deleteUserId).toBeNull()
    })
  })
})
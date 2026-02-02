import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchFilter from '../SearchFilter.vue'
import { useUserStore } from '@/stores/userStore'
import { UserRole, UserStatus } from '@/types/user'

// 简化的组件测试，专注于功能而非UI细节
describe('SearchFilter', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    
    // 重置 store 状态
    userStore.setSearchKeyword('')
    userStore.setFilters({})
  })

  it('应该正确初始化组件', () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.search-filter').exists()).toBe(true)
  })

  it('应该正确处理搜索关键词更新', async () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    // 直接调用组件方法
    const vm = wrapper.vm as any
    vm.searchKeyword = '张三'
    await vm.handleSearch()
    
    expect(userStore.searchKeyword).toBe('张三')
  })

  it('应该正确处理角色筛选', async () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    const vm = wrapper.vm as any
    vm.selectedRole = UserRole.ADMIN
    await vm.handleRoleFilter(UserRole.ADMIN)
    
    expect(userStore.filters.role).toBe(UserRole.ADMIN)
  })

  it('应该正确处理状态筛选', async () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    const vm = wrapper.vm as any
    vm.selectedStatus = UserStatus.ACTIVE
    await vm.handleStatusFilter(UserStatus.ACTIVE)
    
    expect(userStore.filters.status).toBe(UserStatus.ACTIVE)
  })

  it('应该正确处理重置功能', async () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    // 先设置一些筛选条件
    await userStore.setSearchKeyword('测试')
    await userStore.setFilters({ role: UserRole.ADMIN, status: UserStatus.ACTIVE })
    
    // 调用重置方法
    const vm = wrapper.vm as any
    await vm.handleReset()
    
    // 验证所有筛选条件是否被清空
    expect(userStore.searchKeyword).toBe('')
    expect(userStore.filters).toEqual({})
  })

  it('应该正确清空角色筛选', async () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    // 设置初始筛选条件
    await userStore.setFilters({ role: UserRole.ADMIN, status: UserStatus.ACTIVE })
    
    // 清空角色筛选
    const vm = wrapper.vm as any
    await vm.handleRoleFilter(undefined)
    
    // 验证角色筛选被清空，状态筛选保持
    expect(userStore.filters.role).toBeUndefined()
    expect(userStore.filters.status).toBe(UserStatus.ACTIVE)
  })

  it('应该正确清空状态筛选', async () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    // 设置初始筛选条件
    await userStore.setFilters({ role: UserRole.ADMIN, status: UserStatus.ACTIVE })
    
    // 清空状态筛选
    const vm = wrapper.vm as any
    await vm.handleStatusFilter(undefined)
    
    // 验证状态筛选被清空，角色筛选保持
    expect(userStore.filters.status).toBeUndefined()
    expect(userStore.filters.role).toBe(UserRole.ADMIN)
  })

  it('应该同步 store 状态到组件', async () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    // 直接更新 store 状态
    await userStore.setSearchKeyword('同步测试')
    await userStore.setFilters({ role: UserRole.MODERATOR, status: UserStatus.PENDING })
    
    // 等待组件状态同步
    await wrapper.vm.$nextTick()
    
    // 验证组件状态是否同步
    const vm = wrapper.vm as any
    expect(vm.searchKeyword).toBe('同步测试')
    expect(vm.selectedRole).toBe(UserRole.MODERATOR)
    expect(vm.selectedStatus).toBe(UserStatus.PENDING)
  })

  it('应该正确配置角色选项', () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    const vm = wrapper.vm as any
    expect(vm.roleOptions).toEqual([
      { value: UserRole.ADMIN, label: '管理员' },
      { value: UserRole.MODERATOR, label: '版主' },
      { value: UserRole.USER, label: '普通用户' }
    ])
  })

  it('应该正确配置状态选项', () => {
    const wrapper = mount(SearchFilter, {
      global: {
        stubs: {
          'a-row': true,
          'a-col': true,
          'a-input': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-tag': true,
          'SearchOutlined': true,
          'ReloadOutlined': true
        }
      }
    })
    
    const vm = wrapper.vm as any
    expect(vm.statusOptions).toEqual([
      { value: UserStatus.ACTIVE, label: '活跃', color: 'green' },
      { value: UserStatus.INACTIVE, label: '非活跃', color: 'red' },
      { value: UserStatus.PENDING, label: '待审核', color: 'orange' }
    ])
  })
})
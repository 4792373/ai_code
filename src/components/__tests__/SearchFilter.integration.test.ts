import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchFilter from '../SearchFilter.vue'
import { useUserStore } from '@/stores/userStore'
import { UserRole, UserStatus } from '@/types/user'

describe('SearchFilter Integration', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(async () => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    
    // 添加测试数据
    await userStore.addUser({
      name: '张三',
      email: 'zhangsan@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })
    
    await userStore.addUser({
      name: '李四',
      email: 'lisi@example.com',
      role: UserRole.USER,
      status: UserStatus.INACTIVE
    })
    
    await userStore.addUser({
      name: '王五',
      email: 'wangwu@example.com',
      role: UserRole.MODERATOR,
      status: UserStatus.PENDING
    })
  })

  it('应该正确筛选用户数据', async () => {
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
    
    // 验证初始状态 - 应该显示所有用户
    expect(userStore.filteredUsers).toHaveLength(3)
    
    // 测试搜索功能
    const vm = wrapper.vm as any
    vm.searchKeyword = '张三'
    await vm.handleSearch()
    
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].name).toBe('张三')
    
    // 测试角色筛选
    vm.searchKeyword = ''
    await vm.handleSearch()
    await vm.handleRoleFilter(UserRole.ADMIN)
    
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].role).toBe(UserRole.ADMIN)
    
    // 测试状态筛选
    await vm.handleRoleFilter(undefined) // 清空角色筛选
    await vm.handleStatusFilter(UserStatus.ACTIVE)
    
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].status).toBe(UserStatus.ACTIVE)
    
    // 测试组合筛选
    await vm.handleRoleFilter(UserRole.USER)
    await vm.handleStatusFilter(UserStatus.INACTIVE)
    
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].name).toBe('李四')
    
    // 测试重置功能
    await vm.handleReset()
    
    expect(userStore.filteredUsers).toHaveLength(3)
    expect(userStore.searchKeyword).toBe('')
    expect(userStore.filters).toEqual({})
  })

  it('应该正确处理邮箱搜索', async () => {
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
    
    // 搜索邮箱
    vm.searchKeyword = 'lisi@example.com'
    await vm.handleSearch()
    
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].email).toBe('lisi@example.com')
    
    // 部分邮箱搜索
    vm.searchKeyword = '@example.com'
    await vm.handleSearch()
    
    expect(userStore.filteredUsers).toHaveLength(3) // 所有用户都有这个邮箱后缀
  })

  it('应该正确处理无匹配结果的情况', async () => {
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
    
    // 搜索不存在的用户
    vm.searchKeyword = '不存在的用户'
    await vm.handleSearch()
    
    expect(userStore.filteredUsers).toHaveLength(0)
    
    // 筛选不存在的组合
    vm.searchKeyword = ''
    await vm.handleSearch()
    await vm.handleRoleFilter(UserRole.ADMIN)
    await vm.handleStatusFilter(UserStatus.INACTIVE)
    
    expect(userStore.filteredUsers).toHaveLength(0) // 没有管理员是非活跃状态的
  })

  it('应该正确处理大小写不敏感的搜索', async () => {
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
    
    // 测试大小写不敏感搜索
    vm.searchKeyword = 'ZHANGSAN'
    await vm.handleSearch()
    
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].email).toBe('zhangsan@example.com')
    
    // 测试混合大小写
    vm.searchKeyword = 'ZhangSan@Example.COM'
    await vm.handleSearch()
    
    expect(userStore.filteredUsers).toHaveLength(1)
    expect(userStore.filteredUsers[0].email).toBe('zhangsan@example.com')
  })
})
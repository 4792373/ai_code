import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserTable from '../UserTable.vue'
import { UserRole, UserStatus } from '@/types/user'
import type { User } from '@/types/user'

// Mock Ant Design Vue components
vi.mock('ant-design-vue', () => ({
  Table: {
    name: 'ATable',
    template: '<div class="mock-table"><slot /></div>',
    props: ['columns', 'dataSource', 'loading', 'pagination', 'locale', 'rowKey', 'size', 'onChange']
  },
  Tag: {
    name: 'ATag',
    template: '<span class="mock-tag" :style="{ color }"><slot /></span>',
    props: ['color']
  },
  Button: {
    name: 'AButton',
    template: '<button class="mock-button" :class="{ danger }" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'size', 'danger']
  },
  Space: {
    name: 'ASpace',
    template: '<div class="mock-space"><slot /></div>'
  }
}))

describe('UserTable', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      name: '李四',
      email: 'lisi@example.com',
      role: UserRole.USER,
      status: UserStatus.PENDING,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ]

  it('renders user table with correct props', () => {
    const wrapper = mount(UserTable, {
      props: {
        users: mockUsers,
        loading: false
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.user-table').exists()).toBe(true)
  })

  it('shows loading state when loading prop is true', () => {
    const wrapper = mount(UserTable, {
      props: {
        users: [],
        loading: true
      }
    })

    const table = wrapper.findComponent({ name: 'ATable' })
    expect(table.props('loading')).toBe(true)
  })

  it('displays empty state when no users provided', () => {
    const wrapper = mount(UserTable, {
      props: {
        users: [],
        loading: false
      }
    })

    const table = wrapper.findComponent({ name: 'ATable' })
    expect(table.props('dataSource')).toEqual([])
    expect(table.props('locale')).toEqual({ emptyText: '暂无数据' })
  })

  it('configures pagination correctly for users over 10', () => {
    // Create 15 mock users
    const manyUsers = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `用户${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }))

    const wrapper = mount(UserTable, {
      props: {
        users: manyUsers,
        loading: false
      }
    })

    const table = wrapper.findComponent({ name: 'ATable' })
    const pagination = table.props('pagination')
    
    expect(pagination.total).toBe(15)
    expect(pagination.pageSize).toBe(10)
    expect(pagination.hideOnSinglePage).toBe(false)
  })

  it('hides pagination for 10 or fewer users', () => {
    const wrapper = mount(UserTable, {
      props: {
        users: mockUsers, // 2 users
        loading: false
      }
    })

    const table = wrapper.findComponent({ name: 'ATable' })
    const pagination = table.props('pagination')
    
    expect(pagination.hideOnSinglePage).toBe(true)
  })

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(UserTable, {
      props: {
        users: mockUsers,
        loading: false
      }
    })

    // Simulate edit button click by calling the method directly
    const component = wrapper.vm as any
    component.handleEdit(mockUsers[0])

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockUsers[0]])
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(UserTable, {
      props: {
        users: mockUsers,
        loading: false
      }
    })

    // Simulate delete button click by calling the method directly
    const component = wrapper.vm as any
    component.handleDelete(mockUsers[0].id)

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockUsers[0].id])
  })

  it('formats date correctly', () => {
    const wrapper = mount(UserTable, {
      props: {
        users: mockUsers,
        loading: false
      }
    })

    const component = wrapper.vm as any
    const formattedDate = component.formatDate('2024-01-01T12:30:00.000Z')
    
    // Check that the date is formatted (exact format may vary by locale)
    expect(formattedDate).toMatch(/2024/)
    expect(formattedDate).toMatch(/01/)
  })

  it('returns correct role colors and text', () => {
    const wrapper = mount(UserTable, {
      props: {
        users: mockUsers,
        loading: false
      }
    })

    const component = wrapper.vm as any
    
    expect(component.getRoleColor(UserRole.ADMIN)).toBe('red')
    expect(component.getRoleColor(UserRole.USER)).toBe('blue')
    expect(component.getRoleColor(UserRole.MODERATOR)).toBe('orange')
    
    expect(component.getRoleText(UserRole.ADMIN)).toBe('管理员')
    expect(component.getRoleText(UserRole.USER)).toBe('用户')
    expect(component.getRoleText(UserRole.MODERATOR)).toBe('版主')
  })

  it('returns correct status colors and text', () => {
    const wrapper = mount(UserTable, {
      props: {
        users: mockUsers,
        loading: false
      }
    })

    const component = wrapper.vm as any
    
    expect(component.getStatusColor(UserStatus.ACTIVE)).toBe('green')
    expect(component.getStatusColor(UserStatus.INACTIVE)).toBe('red')
    expect(component.getStatusColor(UserStatus.PENDING)).toBe('orange')
    
    expect(component.getStatusText(UserStatus.ACTIVE)).toBe('激活')
    expect(component.getStatusText(UserStatus.INACTIVE)).toBe('禁用')
    expect(component.getStatusText(UserStatus.PENDING)).toBe('待审核')
  })
})
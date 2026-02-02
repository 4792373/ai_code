# 测试规范和最佳实践

## 测试策略概述

本项目采用三层测试策略：
1. **单元测试**：验证特定示例和边界情况
2. **集成测试**：测试完整的用户操作流程
3. **属性测试**：验证跨所有输入的通用属性

## 测试框架和工具

- **测试运行器**：Vitest
- **组件测试**：@vue/test-utils
- **属性测试**：fast-check（最少 100 次迭代）
- **HTTP 模拟**：axios-mock-adapter
- **DOM 环境**：jsdom

## 单元测试规范

### 测试文件组织
```
src/
├── components/
│   ├── UserForm.vue
│   └── __tests__/
│       ├── UserForm.test.ts           # 单元测试
│       └── UserForm.integration.test.ts  # 集成测试
```

### 测试命名规范
```typescript
// ✅ 推荐：描述性测试名称
describe('UserForm 组件', () => {
  it('应该在提交时验证必填字段', async () => {
    // 测试逻辑
  })
  
  it('应该在邮箱格式错误时显示错误消息', async () => {
    // 测试逻辑
  })
})

// ❌ 避免：模糊的测试名称
it('测试表单', () => {
  // 不清楚测试什么
})
```

### 测试结构（AAA 模式）
```typescript
it('应该成功创建用户', async () => {
  // Arrange（准备）
  const userData = {
    name: '张三',
    email: 'zhangsan@example.com',
    role: UserRole.User
  }
  
  // Act（执行）
  const result = await userStore.createUser(userData)
  
  // Assert（断言）
  expect(result.success).toBe(true)
  expect(userStore.users).toHaveLength(1)
  expect(userStore.users[0].name).toBe('张三')
})
```

### 组件测试示例
```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import UserForm from '@/components/UserForm.vue'

describe('UserForm 组件', () => {
  let wrapper: any
  
  beforeEach(() => {
    wrapper = mount(UserForm, {
      props: {
        visible: true
      }
    })
  })
  
  it('应该渲染表单字段', () => {
    expect(wrapper.find('input[name="name"]').exists()).toBe(true)
    expect(wrapper.find('input[name="email"]').exists()).toBe(true)
  })
  
  it('应该在提交时触发事件', async () => {
    await wrapper.find('input[name="name"]').setValue('张三')
    await wrapper.find('input[name="email"]').setValue('zhangsan@example.com')
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('submit')).toBeTruthy()
  })
})
```

## 属性测试规范

### 属性测试基本原则
- 每个属性测试必须引用设计文档中的正确性属性
- 最少运行 100 次迭代
- 测试名称必须包含"Property"关键字
- 使用标签格式：**功能：{feature}，属性 {编号}：{属性文本}**

### 属性测试示例
```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('API 响应格式属性测试', () => {
  it('Property: API 响应格式一致性 - 验证需求 2.7', () => {
    // **功能：api-integration，属性 4：API 响应格式一致性**
    
    fc.assert(
      fc.asyncProperty(
        // 生成任意用户数据
        fc.array(fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          role: fc.constantFrom('admin', 'moderator', 'user'),
          status: fc.constantFrom('active', 'inactive', 'pending')
        })),
        async (users) => {
          // 模拟 API 响应
          const response = {
            data: users,
            message: '获取成功',
            success: true,
            timestamp: new Date().toISOString()
          }
          
          // 验证响应格式
          expect(response).toHaveProperty('data')
          expect(response).toHaveProperty('message')
          expect(response).toHaveProperty('success')
          expect(response).toHaveProperty('timestamp')
          expect(typeof response.message).toBe('string')
          expect(typeof response.success).toBe('boolean')
          expect(typeof response.timestamp).toBe('string')
        }
      ),
      { numRuns: 100 }  // 最少 100 次迭代
    )
  })
})
```

### 常用属性测试生成器
```typescript
// 用户数据生成器
const userArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: fc.constantFrom(UserRole.Admin, UserRole.Moderator, UserRole.User),
  status: fc.constantFrom(UserStatus.Active, UserStatus.Inactive, UserStatus.Pending),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString())
})

// 查询参数生成器
const queryParamsArbitrary = fc.record({
  search: fc.option(fc.string(), { nil: undefined }),
  role: fc.option(fc.constantFrom('admin', 'moderator', 'user'), { nil: undefined }),
  status: fc.option(fc.constantFrom('active', 'inactive', 'pending'), { nil: undefined }),
  page: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
  pageSize: fc.option(fc.nat({ min: 10, max: 100 }), { nil: undefined })
})
```

## 集成测试规范

### 集成测试场景
- 完整的用户操作流程（创建 → 编辑 → 删除）
- 组件与 Store 的交互
- API 客户端与模拟服务的交互
- 错误处理的端到端流程

### 集成测试示例
```typescript
describe('用户管理集成测试', () => {
  it('应该完成完整的用户生命周期', async () => {
    const userStore = useUserStore()
    
    // 1. 创建用户
    const createData = {
      name: '张三',
      email: 'zhangsan@example.com',
      role: UserRole.User,
      status: UserStatus.Active
    }
    
    await userStore.createUser(createData)
    expect(userStore.users).toHaveLength(1)
    
    const userId = userStore.users[0].id
    
    // 2. 更新用户
    const updateData = {
      name: '李四',
      email: 'lisi@example.com'
    }
    
    await userStore.updateUser(userId, updateData)
    expect(userStore.users[0].name).toBe('李四')
    
    // 3. 删除用户
    await userStore.deleteUser(userId)
    expect(userStore.users).toHaveLength(0)
  })
})
```

## 测试覆盖率目标

- **代码覆盖率**：90% 以上
- **分支覆盖率**：85% 以上
- **函数覆盖率**：95% 以上
- **属性测试覆盖**：所有核心业务逻辑

## 测试运行命令

```bash
# 运行所有测试（监听模式）
npm test

# 运行所有测试（一次）
npm run test:unit

# 仅运行属性测试
npm run test:prop

# 运行特定测试文件
npm test -- UserForm.test.ts

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

## Mock 和 Stub 规范

### API Mock
```typescript
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

describe('API 客户端测试', () => {
  let mock: MockAdapter
  
  beforeEach(() => {
    mock = new MockAdapter(axios)
  })
  
  afterEach(() => {
    mock.restore()
  })
  
  it('应该成功获取用户列表', async () => {
    const mockUsers = [
      { id: '1', name: '张三', email: 'zhangsan@example.com' }
    ]
    
    mock.onGet('/users').reply(200, {
      data: mockUsers,
      success: true,
      message: '获取成功',
      timestamp: new Date().toISOString()
    })
    
    const response = await apiClient.getUsers()
    expect(response.data).toEqual(mockUsers)
  })
})
```

### Store Mock
```typescript
import { setActivePinia, createPinia } from 'pinia'

describe('组件测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('应该使用 Store 数据', () => {
    const userStore = useUserStore()
    userStore.users = [
      { id: '1', name: '张三', email: 'zhangsan@example.com' }
    ]
    
    const wrapper = mount(UserList)
    expect(wrapper.text()).toContain('张三')
  })
})
```

## 测试最佳实践

### 1. 测试独立性
```typescript
// ✅ 推荐：每个测试独立
describe('用户 Store', () => {
  beforeEach(() => {
    // 每个测试前重置状态
    const userStore = useUserStore()
    userStore.$reset()
  })
  
  it('测试 1', () => {
    // 独立的测试逻辑
  })
  
  it('测试 2', () => {
    // 不依赖测试 1 的结果
  })
})

// ❌ 避免：测试之间有依赖
it('创建用户', () => {
  userStore.createUser(userData)
})

it('更新用户', () => {
  // 依赖上一个测试创建的用户
  userStore.updateUser(userId, updateData)
})
```

### 2. 测试可读性
```typescript
// ✅ 推荐：清晰的测试逻辑
it('应该在邮箱重复时返回错误', async () => {
  // 准备：创建第一个用户
  await userStore.createUser({
    name: '张三',
    email: 'test@example.com'
  })
  
  // 执行：尝试创建相同邮箱的用户
  const result = await userStore.createUser({
    name: '李四',
    email: 'test@example.com'
  })
  
  // 断言：应该返回错误
  expect(result.success).toBe(false)
  expect(result.error).toContain('邮箱已存在')
})
```

### 3. 测试边界情况
```typescript
describe('用户验证', () => {
  it('应该拒绝空姓名', () => {
    expect(() => validateUser({ name: '', email: 'test@example.com' }))
      .toThrow('姓名不能为空')
  })
  
  it('应该拒绝无效邮箱', () => {
    expect(() => validateUser({ name: '张三', email: 'invalid' }))
      .toThrow('邮箱格式不正确')
  })
  
  it('应该接受最小长度姓名', () => {
    expect(() => validateUser({ name: '张', email: 'test@example.com' }))
      .not.toThrow()
  })
  
  it('应该接受最大长度姓名', () => {
    const longName = '张'.repeat(50)
    expect(() => validateUser({ name: longName, email: 'test@example.com' }))
      .not.toThrow()
  })
})
```

### 4. 异步测试
```typescript
// ✅ 推荐：使用 async/await
it('应该异步加载用户', async () => {
  await userStore.fetchUsers()
  expect(userStore.users.length).toBeGreaterThan(0)
})

// ❌ 避免：忘记等待异步操作
it('应该异步加载用户', () => {
  userStore.fetchUsers()  // 没有 await
  expect(userStore.users.length).toBeGreaterThan(0)  // 可能失败
})
```

## 常见测试问题

### 问题 1：测试不稳定（Flaky Tests）
**原因**：
- 依赖外部状态
- 异步操作未正确等待
- 测试之间有依赖

**解决方案**：
- 使用 beforeEach 重置状态
- 正确使用 async/await
- 确保测试独立性

### 问题 2：测试运行缓慢
**原因**：
- 过多的集成测试
- 未使用 Mock
- 测试数据量过大

**解决方案**：
- 平衡单元测试和集成测试
- 使用 Mock 隔离依赖
- 减少测试数据量

### 问题 3：属性测试失败难以调试
**原因**：
- 随机生成的数据难以重现
- 错误消息不清晰

**解决方案**：
- 使用 fast-check 的 seed 参数重现失败
- 添加详细的错误消息
- 使用 fc.pre() 过滤无效输入

```typescript
it('Property: 用户验证', () => {
  fc.assert(
    fc.property(
      userArbitrary,
      (user) => {
        // 过滤无效输入
        fc.pre(user.name.length > 0)
        
        // 添加详细错误消息
        expect(validateUser(user), `验证失败: ${JSON.stringify(user)}`)
          .toBe(true)
      }
    ),
    { 
      numRuns: 100,
      seed: 42  // 使用固定 seed 重现失败
    }
  )
})
```

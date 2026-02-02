# API 集成最佳实践

## API 客户端使用规范

### 基本原则
- 所有 HTTP 请求必须通过 `apiClient.ts` 进行
- 不要在组件中直接使用 Axios
- 使用 Pinia Store 作为组件和 API 客户端之间的中间层
- 始终处理加载状态和错误状态

### 请求流程
```
Vue 组件 → Pinia Store 方法 → API 客户端 → Axios → 模拟/真实 API
```

### 代码示例

#### 在 Store 中调用 API
```typescript
// ✅ 推荐：在 Store 中调用 API
async function fetchUsers() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await apiClient.getUsers()
    users.value = response.data
  } catch (err) {
    error.value = handleError(err)
  } finally {
    isLoading.value = false
  }
}

// ❌ 避免：在组件中直接调用 API
// 不要在组件中直接使用 axios 或 apiClient
```

#### 在组件中使用 Store
```typescript
// ✅ 推荐：在组件中使用 Store
const userStore = useUserStore()

onMounted(async () => {
  await userStore.fetchUsers()
})

// 访问状态
const users = computed(() => userStore.users)
const isLoading = computed(() => userStore.isLoading)
const error = computed(() => userStore.error)
```

## 错误处理规范

### 错误分类
1. **网络错误**：连接超时、网络不可达
2. **HTTP 错误**：4xx、5xx 状态码
3. **业务错误**：数据验证失败、重复数据

### 错误处理流程
```typescript
try {
  const response = await apiClient.createUser(userData)
  // 处理成功响应
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // 处理网络错误
    showError('网络连接失败，请检查网络连接')
  } else if (error.code === 'VALIDATION_ERROR') {
    // 处理验证错误
    showError(error.message)
  } else {
    // 处理其他错误
    showError('操作失败，请稍后重试')
  }
}
```

### 错误消息规范
- 使用中文错误消息
- 提供具体的错误原因
- 给出可操作的建议
- 避免技术术语

## 加载状态管理

### 基本模式
```typescript
// Store 中的加载状态
const isLoading = ref(false)
const loadingOperation = ref<string | null>(null)

async function performOperation(operationName: string) {
  isLoading.value = true
  loadingOperation.value = operationName
  
  try {
    // 执行操作
  } finally {
    isLoading.value = false
    loadingOperation.value = null
  }
}
```

### 组件中显示加载状态
```vue
<template>
  <a-spin :spinning="isLoading">
    <!-- 内容 -->
  </a-spin>
</template>

<script setup lang="ts">
const userStore = useUserStore()
const isLoading = computed(() => userStore.isLoading)
</script>
```

## API 响应格式

### 标准响应格式
```typescript
interface ApiResponse<T> {
  data: T                    // 实际数据
  message: string           // 响应消息
  success: boolean          // 操作是否成功
  timestamp: string         // 响应时间戳
  errors?: string[]         // 错误详情（可选）
}
```

### 处理响应数据
```typescript
// ✅ 推荐：检查响应格式
const response = await apiClient.getUsers()
if (response.success) {
  users.value = response.data
} else {
  throw new Error(response.message)
}

// ❌ 避免：直接使用响应数据而不检查
users.value = response.data  // 可能导致错误
```

## 模拟 API 服务

### 开发环境配置
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCK_API=true
VITE_MOCK_API_DELAY=100
```

### 模拟 API 特性
- 自动生成测试数据（中文姓名、邮箱）
- 支持所有 CRUD 操作
- 数据持久化到 localStorage
- 模拟网络延迟
- 支持错误模拟（用于测试错误处理）

### 切换到真实 API
```typescript
// .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_USE_MOCK_API=false
```

## 性能优化

### 请求优化
- 使用请求取消避免重复请求
- 实现请求防抖（搜索功能）
- 缓存常用数据
- 分页加载大量数据

### 代码示例
```typescript
// 请求取消
let abortController: AbortController | null = null

async function searchUsers(keyword: string) {
  // 取消之前的请求
  if (abortController) {
    abortController.abort()
  }
  
  abortController = new AbortController()
  
  try {
    const response = await apiClient.getUsers(
      { search: keyword },
      { signal: abortController.signal }
    )
    users.value = response.data
  } catch (error) {
    if (error.name !== 'AbortError') {
      handleError(error)
    }
  }
}
```

## 测试规范

### API 客户端测试
```typescript
// 使用 axios-mock-adapter 模拟 HTTP 请求
import MockAdapter from 'axios-mock-adapter'

describe('API 客户端', () => {
  let mock: MockAdapter
  
  beforeEach(() => {
    mock = new MockAdapter(axios)
  })
  
  afterEach(() => {
    mock.restore()
  })
  
  it('应该成功获取用户列表', async () => {
    const mockUsers = [{ id: '1', name: '张三' }]
    mock.onGet('/users').reply(200, {
      data: mockUsers,
      success: true,
      message: '获取成功'
    })
    
    const response = await apiClient.getUsers()
    expect(response.data).toEqual(mockUsers)
  })
})
```

### 属性测试
```typescript
// 使用 fast-check 进行属性测试
import fc from 'fast-check'

it('Property: API 响应格式一致性', () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(fc.record({
        id: fc.uuid(),
        name: fc.string(),
        email: fc.emailAddress()
      })),
      async (users) => {
        mock.onGet('/users').reply(200, {
          data: users,
          success: true,
          message: '获取成功',
          timestamp: new Date().toISOString()
        })
        
        const response = await apiClient.getUsers()
        
        // 验证响应格式
        expect(response).toHaveProperty('data')
        expect(response).toHaveProperty('success')
        expect(response).toHaveProperty('message')
        expect(response).toHaveProperty('timestamp')
        expect(response.success).toBe(true)
      }
    ),
    { numRuns: 100 }  // 最少 100 次迭代
  )
})
```

## 常见问题

### 问题 1：请求重复发送
**原因**：组件多次挂载或状态变化触发多次请求

**解决方案**：
- 使用请求取消机制
- 在 Store 中添加请求状态标志
- 使用防抖/节流

### 问题 2：错误处理不一致
**原因**：不同地方使用不同的错误处理逻辑

**解决方案**：
- 统一使用 `errorHandler.ts` 处理错误
- 在 API 客户端层统一捕获和转换错误
- 使用全局错误处理插件

### 问题 3：加载状态管理混乱
**原因**：多个异步操作同时进行

**解决方案**：
- 为每个操作维护独立的加载状态
- 使用 `loadingOperation` 标识当前操作
- 在 finally 块中确保清除加载状态

### 问题 4：模拟 API 数据不持久
**原因**：页面刷新后数据丢失

**解决方案**：
- 模拟 API 服务自动保存数据到 localStorage
- 在服务初始化时加载持久化数据
- 提供手动保存/加载数据的方法

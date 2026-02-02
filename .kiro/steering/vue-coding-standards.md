# Vue 和 TypeScript 编码规范

## 核心原则

本项目严格遵循以下编码规范，确保代码的一致性、可维护性和类型安全。

## Vue 组件规范

### 1. 必须使用 `<script setup>` 语法

所有 Vue 组件必须使用 Composition API 的 `<script setup>` 语法，不允许使用 Options API。

✅ **正确示例：**
```vue
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <button @click="handleClick">点击</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const title = ref('我的组件')
const count = ref(0)

const doubleCount = computed(() => count.value * 2)

const handleClick = () => {
  count.value++
}
</script>

<style scoped>
.my-component {
  padding: 20px;
}
</style>
```

❌ **错误示例（不要使用 Options API）：**
```vue
<script lang="ts">
export default {
  data() {
    return {
      title: '我的组件',
      count: 0
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    handleClick() {
      this.count++
    }
  }
}
</script>
```

### 2. 必须使用 TypeScript

所有 Vue 组件的 `<script>` 标签必须包含 `lang="ts"` 属性。

✅ **正确：**
```vue
<script setup lang="ts">
// TypeScript 代码
</script>
```

❌ **错误：**
```vue
<script setup>
// JavaScript 代码（不允许）
</script>
```

### 3. Props 定义规范

使用 `defineProps` 配合 TypeScript 接口定义 props，提供完整的类型定义。

✅ **正确示例：**
```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
  user: {
    id: string
    name: string
  }
}

const props = defineProps<Props>()

// 如果需要默认值，使用 withDefaults
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  items: () => []
})
</script>
```

❌ **错误示例（不要使用运行时声明）：**
```vue
<script setup lang="ts">
const props = defineProps({
  title: String,
  count: Number
})
</script>
```

### 4. Emits 定义规范

使用 `defineEmits` 配合 TypeScript 类型定义事件。

✅ **正确示例：**
```vue
<script setup lang="ts">
interface Emits {
  (e: 'update', value: string): void
  (e: 'delete', id: string): void
  (e: 'submit', data: { name: string; email: string }): void
}

const emit = defineEmits<Emits>()

const handleSubmit = () => {
  emit('submit', { name: 'John', email: 'john@example.com' })
}
</script>
```

### 5. 组件引用规范

使用 `ref` 和 TypeScript 类型定义组件引用。

✅ **正确示例：**
```vue
<template>
  <input ref="inputRef" type="text" />
  <MyComponent ref="componentRef" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import MyComponent from './MyComponent.vue'

const inputRef = ref<HTMLInputElement | null>(null)
const componentRef = ref<ComponentPublicInstance<typeof MyComponent> | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})
</script>
```

### 6. 响应式数据规范

- 使用 `ref` 定义基本类型和对象引用
- 使用 `reactive` 定义复杂对象（但优先使用 `ref`）
- 使用 `computed` 定义计算属性
- 始终提供 TypeScript 类型注解

✅ **正确示例：**
```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// 基本类型使用 ref
const count = ref<number>(0)
const message = ref<string>('Hello')
const isActive = ref<boolean>(false)

// 对象也优先使用 ref
const user = ref<{ id: string; name: string }>({
  id: '1',
  name: 'John'
})

// 复杂对象可以使用 reactive
interface FormData {
  username: string
  email: string
  age: number
}

const form = reactive<FormData>({
  username: '',
  email: '',
  age: 0
})

// 计算属性
const doubleCount = computed<number>(() => count.value * 2)
const fullName = computed<string>(() => `${user.value.name} Doe`)
</script>
```

### 7. 生命周期钩子规范

使用 Composition API 的生命周期钩子，并添加清晰的注释。

✅ **正确示例：**
```vue
<script setup lang="ts">
import { onMounted, onUnmounted, onBeforeMount, onUpdated } from 'vue'

/**
 * 组件挂载前执行
 */
onBeforeMount(() => {
  console.log('组件即将挂载')
})

/**
 * 组件挂载后执行
 * 适合进行 DOM 操作和数据初始化
 */
onMounted(() => {
  console.log('组件已挂载')
  // 初始化数据
  fetchData()
})

/**
 * 组件更新后执行
 */
onUpdated(() => {
  console.log('组件已更新')
})

/**
 * 组件卸载前执行
 * 适合清理定时器、取消订阅等
 */
onUnmounted(() => {
  console.log('组件即将卸载')
  // 清理资源
  cleanup()
})
</script>
```

## TypeScript 规范

### 1. 类型定义

- 所有函数参数必须有类型注解
- 所有函数返回值必须有类型注解（除非可以明确推断）
- 避免使用 `any` 类型，使用 `unknown` 替代
- 使用 `interface` 定义对象类型，使用 `type` 定义联合类型和工具类型

✅ **正确示例：**
```typescript
// 接口定义
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
}

// 类型别名
type UserRole = 'admin' | 'user' | 'moderator'
type UserId = string

// 函数类型注解
const fetchUser = async (userId: string): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
}

// 泛型函数
const createArray = <T>(length: number, value: T): T[] => {
  return Array(length).fill(value)
}

// 使用 unknown 而不是 any
const handleError = (error: unknown): void => {
  if (error instanceof Error) {
    console.error(error.message)
  }
}
```

❌ **错误示例：**
```typescript
// 缺少类型注解
const fetchUser = async (userId) => {
  const response = await fetch(`/api/users/${userId}`)
  return response.json()
}

// 使用 any
const handleError = (error: any) => {
  console.error(error.message)
}
```

### 2. 类型导入

使用 `type` 关键字导入类型，与值导入区分开。

✅ **正确示例：**
```typescript
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { User, UserRole } from '@/types/user'
import { useUserStore } from '@/stores/userStore'
```

### 3. 可选属性和联合类型

正确使用可选属性（`?`）和联合类型（`|`）。

✅ **正确示例：**
```typescript
interface User {
  id: string
  name: string
  email: string
  age?: number  // 可选属性
  avatar?: string | null  // 可选且可为 null
  role: 'admin' | 'user' | 'moderator'  // 联合类型
}

// 函数参数可选
const greet = (name: string, title?: string): string => {
  return title ? `${title} ${name}` : name
}
```

## Pinia Store 规范

### 1. 必须使用 Setup Store 语法

所有 Pinia store 必须使用 setup 语法（Composition API 风格），不允许使用 Options Store。

✅ **正确示例：**
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  
  // 计算属性
  const userCount = computed(() => users.value.length)
  const hasUsers = computed(() => users.value.length > 0)
  
  // 方法
  const addUser = (user: User): void => {
    users.value.push(user)
  }
  
  const removeUser = (userId: string): void => {
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      users.value.splice(index, 1)
    }
  }
  
  const clearUsers = (): void => {
    users.value = []
    currentUser.value = null
  }
  
  // 返回公开的状态和方法
  return {
    // 状态（只读）
    users: computed(() => users.value),
    currentUser: computed(() => currentUser.value),
    
    // 计算属性
    userCount,
    hasUsers,
    
    // 方法
    addUser,
    removeUser,
    clearUsers
  }
})
```

❌ **错误示例（不要使用 Options Store）：**
```typescript
export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    currentUser: null
  }),
  getters: {
    userCount: (state) => state.users.length
  },
  actions: {
    addUser(user) {
      this.users.push(user)
    }
  }
})
```

### 2. Store 状态导出规范

- 状态应该通过 `computed` 返回，确保只读
- 提供明确的方法来修改状态
- 所有方法都应该有类型注解

## 组件命名规范

### 1. 文件命名

- 组件文件使用 PascalCase：`UserForm.vue`、`SearchFilter.vue`
- 页面视图使用 PascalCase：`Home.vue`、`Users.vue`
- 布局组件使用 PascalCase：`MainLayout.vue`

### 2. 组件内命名

- 变量和函数使用 camelCase：`userName`、`handleClick`
- 常量使用 UPPER_SNAKE_CASE：`MAX_COUNT`、`API_BASE_URL`
- 类型和接口使用 PascalCase：`User`、`UserRole`

## 注释规范

### 1. 函数注释

使用 JSDoc 风格注释函数，说明参数、返回值和功能。

✅ **正确示例：**
```typescript
/**
 * 根据用户 ID 获取用户信息
 * @param userId - 用户唯一标识符
 * @returns 用户对象，如果不存在则返回 null
 */
const fetchUser = async (userId: string): Promise<User | null> => {
  try {
    const response = await apiClient.getUser(userId)
    return response.data
  } catch (error) {
    console.error('获取用户失败:', error)
    return null
  }
}
```

### 2. 复杂逻辑注释

对复杂的业务逻辑添加中文注释，解释"为什么"而不是"是什么"。

✅ **正确示例：**
```typescript
// 使用防抖避免频繁的 API 请求
const debouncedSearch = debounce(async (keyword: string) => {
  await searchUsers(keyword)
}, 300)

// 取消之前的请求，避免竞态条件
if (previousRequest) {
  previousRequest.abort()
}
```

## 导入顺序规范

按照以下顺序组织导入语句：

1. Vue 核心库
2. 第三方库
3. 类型导入
4. 本地组件
5. 本地工具函数
6. 本地类型定义
7. 样式文件

✅ **正确示例：**
```typescript
// 1. Vue 核心库
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 2. 第三方库
import { message } from 'ant-design-vue'

// 3. 类型导入
import type { Ref, ComputedRef } from 'vue'
import type { User, UserRole } from '@/types/user'

// 4. 本地组件
import UserForm from '@/components/UserForm.vue'
import SearchFilter from '@/components/SearchFilter.vue'

// 5. 本地工具函数
import { formatDate, validateEmail } from '@/utils/helpers'

// 6. Stores
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
```

## 错误处理规范

### 1. 异步函数错误处理

所有异步函数必须使用 try-catch 处理错误。

✅ **正确示例：**
```typescript
const fetchUsers = async (): Promise<void> => {
  try {
    const response = await apiClient.getUsers()
    users.value = response.data
  } catch (error) {
    if (error instanceof Error) {
      console.error('获取用户列表失败:', error.message)
      // 显示错误提示
      message.error('获取用户列表失败，请稍后重试')
    }
  }
}
```

### 2. 类型守卫

使用类型守卫确保类型安全。

✅ **正确示例：**
```typescript
const handleError = (error: unknown): void => {
  if (error instanceof Error) {
    console.error('错误消息:', error.message)
  } else if (typeof error === 'string') {
    console.error('错误:', error)
  } else {
    console.error('未知错误:', error)
  }
}
```

## 性能优化规范

### 1. 计算属性缓存

使用 `computed` 而不是方法来实现需要缓存的计算逻辑。

✅ **正确：**
```typescript
const filteredUsers = computed(() => {
  return users.value.filter(user => user.status === 'active')
})
```

❌ **错误：**
```typescript
const getFilteredUsers = () => {
  return users.value.filter(user => user.status === 'active')
}
```

### 2. 避免不必要的响应式

对于不需要响应式的数据，不要使用 `ref` 或 `reactive`。

✅ **正确：**
```typescript
// 常量配置不需要响应式
const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'user', label: '普通用户' }
]

// 需要响应式的数据
const selectedRole = ref<string>('')
```

## 总结

遵循这些规范可以确保：
- ✅ 代码风格一致
- ✅ 类型安全
- ✅ 易于维护
- ✅ 性能优化
- ✅ 团队协作顺畅

所有新代码和修改的代码都必须严格遵循这些规范。

# 设计文档

## 概述

批量删除用户功能为用户管理系统添加了多选和批量删除能力。该功能通过扩展现有的用户表格组件，添加行选择功能，并在 UserStore 中实现批量删除逻辑。设计遵循现有的架构模式，使用 Vue 3 Composition API、Pinia 状态管理和 Ant Design Vue 组件库。

### 核心功能
- 表格行选择（单选、多选、全选）
- 批量删除按钮（动态显示选中数量）
- 确认对话框（防止误删除）
- 批量删除 API 调用
- 错误处理和用户反馈
- 响应式设计支持

## 架构

### 组件层次结构

```
UserManagement.vue (主组件)
├── UserTable.vue (表格组件 - 添加 rowSelection)
├── UserForm.vue (表单组件 - 不变)
└── BatchDeleteButton.vue (新增：批量删除按钮组件)
```

### 数据流

```
用户操作 → UserManagement 组件
         ↓
    更新选中状态 (selectedUserIds)
         ↓
    点击批量删除按钮
         ↓
    显示确认对话框
         ↓
    确认后调用 UserStore.batchDeleteUsers()
         ↓
    UserStore → API Client → 模拟/真实 API
         ↓
    更新用户列表 + 清空选中状态
         ↓
    显示成功/错误提示
```

### 状态管理

批量删除功能的状态分为两部分：

1. **组件本地状态**（UserManagement.vue）
   - `selectedUserIds: Ref<string[]>` - 选中的用户 ID 数组
   - `isDeleting: Ref<boolean>` - 批量删除操作进行中标志

2. **全局状态**（UserStore）
   - `users: ComputedRef<User[]>` - 用户列表
   - `isLoading: ComputedRef<boolean>` - 加载状态
   - `error: ComputedRef<AppError | null>` - 错误状态

## 组件和接口

### 1. UserManagement.vue（修改）

**新增状态：**
```typescript
// 选中的用户 ID 数组
const selectedUserIds = ref<string[]>([])

// 批量删除操作进行中
const isDeleting = ref<boolean>(false)

// 确认对话框显示状态
const showBatchDeleteConfirm = ref<boolean>(false)
```

**新增计算属性：**
```typescript
// 是否有选中的用户
const hasSelectedUsers = computed(() => selectedUserIds.value.length > 0)

// 选中的用户数量
const selectedCount = computed(() => selectedUserIds.value.length)

// 选中的用户对象数组（用于显示详情）
const selectedUsers = computed(() => {
  return userStore.users.filter(user => 
    selectedUserIds.value.includes(user.id)
  )
})
```

**新增方法：**
```typescript
/**
 * 处理行选择变化
 * @param selectedRowKeys - 选中的行键数组
 */
const handleSelectionChange = (selectedRowKeys: string[]) => {
  selectedUserIds.value = selectedRowKeys
}

/**
 * 显示批量删除确认对话框
 */
const showBatchDeleteDialog = () => {
  if (!hasSelectedUsers.value) return
  showBatchDeleteConfirm.value = true
}

/**
 * 执行批量删除操作
 */
const handleBatchDelete = async () => {
  if (!hasSelectedUsers.value) return
  
  isDeleting.value = true
  showBatchDeleteConfirm.value = false
  
  try {
    await userStore.batchDeleteUsers(selectedUserIds.value)
    message.success(`成功删除 ${selectedCount.value} 个用户`)
    selectedUserIds.value = []
  } catch (error) {
    message.error('批量删除失败，请稍后重试')
  } finally {
    isDeleting.value = false
  }
}

/**
 * 取消批量删除
 */
const cancelBatchDelete = () => {
  showBatchDeleteConfirm.value = false
}
```

### 2. UserTable.vue（修改）

**新增 Props：**
```typescript
interface Props {
  users: User[]
  loading: boolean
  selectedRowKeys?: string[]  // 新增：选中的行键
}

const props = withDefaults(defineProps<Props>(), {
  selectedRowKeys: () => []
})
```

**新增 Emits：**
```typescript
interface Emits {
  (e: 'edit', user: User): void
  (e: 'delete', userId: string): void
  (e: 'selectionChange', selectedRowKeys: string[]): void  // 新增
}

const emit = defineEmits<Emits>()
```

**行选择配置：**
```typescript
// 行选择配置
const rowSelection = computed(() => ({
  selectedRowKeys: props.selectedRowKeys,
  onChange: (selectedRowKeys: string[]) => {
    emit('selectionChange', selectedRowKeys)
  },
  // 禁用某些行的选择（可选）
  getCheckboxProps: (record: User) => ({
    disabled: false,  // 可以根据用户状态禁用
    name: record.name
  })
}))
```

**模板更新：**
```vue
<a-table
  :columns="columns"
  :data-source="users"
  :loading="loading"
  :row-key="record => record.id"
  :row-selection="rowSelection"
  :pagination="pagination"
  @change="handleTableChange"
>
  <!-- 现有的插槽内容 -->
</a-table>
```

### 3. BatchDeleteButton.vue（新增组件）

**Props：**
```typescript
interface Props {
  selectedCount: number
  loading: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})
```

**Emits：**
```typescript
interface Emits {
  (e: 'click'): void
}

const emit = defineEmits<Emits>()
```

**计算属性：**
```typescript
// 按钮是否禁用
const isDisabled = computed(() => {
  return props.disabled || props.selectedCount === 0 || props.loading
})

// 按钮文本
const buttonText = computed(() => {
  if (props.selectedCount === 0) {
    return '批量删除'
  }
  return `批量删除 (${props.selectedCount})`
})
```

**模板：**
```vue
<template>
  <a-button
    danger
    :disabled="isDisabled"
    :loading="loading"
    @click="emit('click')"
  >
    <template #icon>
      <DeleteOutlined />
    </template>
    {{ buttonText }}
  </a-button>
</template>
```

### 4. UserStore（修改）

**新增方法：**
```typescript
/**
 * 批量删除用户
 * @param userIds - 要删除的用户 ID 数组
 * @returns Promise<void>
 */
const batchDeleteUsers = async (userIds: string[]): Promise<void> => {
  if (userIds.length === 0) {
    throw createValidationError('没有选中要删除的用户')
  }
  
  isLoading.value = true
  error.value = null
  
  try {
    // 调用 API 客户端的批量删除方法
    const response = await apiClient.batchDeleteUsers(userIds)
    
    if (response.success) {
      // 从本地状态中移除已删除的用户
      users.value = users.value.filter(user => !userIds.includes(user.id))
      
      // 更新 localStorage
      saveToLocalStorage()
    } else {
      throw createBusinessError(response.message || '批量删除失败')
    }
  } catch (err) {
    error.value = handleError(err)
    throw error.value
  } finally {
    isLoading.value = false
  }
}
```

### 5. API Client（修改）

**新增方法：**
```typescript
/**
 * 批量删除用户
 * @param userIds - 要删除的用户 ID 数组
 * @returns Promise<ApiResponse<void>>
 */
async batchDeleteUsers(userIds: string[]): Promise<ApiResponse<void>> {
  try {
    const response = await this.axiosInstance.delete<ApiResponse<void>>(
      '/users/batch',
      {
        data: { userIds },
        timeout: 5000
      }
    )
    return response.data
  } catch (error) {
    throw this.handleError(error)
  }
}
```

### 6. Mock API Service（修改）

**新增端点：**
```typescript
/**
 * 批量删除用户端点
 * DELETE /users/batch
 * Body: { userIds: string[] }
 */
private setupBatchDeleteEndpoint(): void {
  this.app.delete('/users/batch', (req, res) => {
    const { userIds } = req.body
    
    // 验证请求
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        data: null,
        message: '请提供要删除的用户 ID 数组',
        success: false,
        timestamp: new Date().toISOString(),
        errors: ['userIds 必须是非空数组']
      })
    }
    
    // 模拟网络延迟
    setTimeout(() => {
      // 查找不存在的用户 ID
      const notFoundIds = userIds.filter(id => 
        !this.users.some(user => user.id === id)
      )
      
      if (notFoundIds.length > 0) {
        return res.status(404).json({
          data: null,
          message: `部分用户不存在: ${notFoundIds.join(', ')}`,
          success: false,
          timestamp: new Date().toISOString(),
          errors: notFoundIds.map(id => `用户 ${id} 不存在`)
        })
      }
      
      // 执行批量删除
      this.users = this.users.filter(user => !userIds.includes(user.id))
      this.saveToLocalStorage()
      
      res.json({
        data: null,
        message: `成功删除 ${userIds.length} 个用户`,
        success: true,
        timestamp: new Date().toISOString()
      })
    }, this.delay)
  })
}
```

## 数据模型

### 现有类型（不变）

```typescript
// User 接口保持不变
interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

enum UserRole {
  Admin = 'admin',
  Moderator = 'moderator',
  User = 'user'
}

enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}
```

### 新增类型

```typescript
/**
 * 批量删除请求体
 */
interface BatchDeleteRequest {
  userIds: string[]
}

/**
 * 批量删除响应
 */
interface BatchDeleteResponse {
  deletedCount: number
  failedIds?: string[]  // 删除失败的用户 ID（可选）
  errors?: string[]     // 错误详情（可选）
}

/**
 * 行选择配置
 */
interface RowSelectionConfig {
  selectedRowKeys: string[]
  onChange: (selectedRowKeys: string[]) => void
  getCheckboxProps?: (record: User) => {
    disabled: boolean
    name: string
  }
}
```

## 用户界面设计

### 1. 用户表格布局

```
┌─────────────────────────────────────────────────────────────┐
│ [搜索框]  [角色筛选]  [状态筛选]  [新增用户]  [批量删除(2)] │
├─────────────────────────────────────────────────────────────┤
│ ☐ │ 用户名 │ 邮箱           │ 角色   │ 状态   │ 操作      │
├─────────────────────────────────────────────────────────────┤
│ ☑ │ 张三   │ zhang@ex.com   │ 管理员 │ 活跃   │ 编辑 删除 │
│ ☑ │ 李四   │ li@ex.com      │ 用户   │ 活跃   │ 编辑 删除 │
│ ☐ │ 王五   │ wang@ex.com    │ 用户   │ 未激活 │ 编辑 删除 │
└─────────────────────────────────────────────────────────────┘
```

### 2. 批量删除确认对话框

```
┌─────────────────────────────────────┐
│  ⚠️  确认批量删除                    │
├─────────────────────────────────────┤
│                                     │
│  您确定要删除选中的 2 个用户吗？     │
│  此操作不可恢复。                    │
│                                     │
│  选中的用户：                        │
│  • 张三 (zhang@ex.com)              │
│  • 李四 (li@ex.com)                 │
│                                     │
├─────────────────────────────────────┤
│              [取消]  [确认删除]      │
└─────────────────────────────────────┘
```

### 3. 响应式设计

**桌面（≥ 992px）：**
- 显示完整表格，包含所有列
- 批量删除按钮在表格上方右侧
- 确认对话框宽度 600px

**平板（768px - 991px）：**
- 隐藏次要列（创建时间、更新时间）
- 批量删除按钮在表格上方
- 确认对话框宽度 500px

**手机（< 768px）：**
- 使用卡片布局代替表格
- 每个卡片显示复选框
- 批量删除按钮固定在底部
- 确认对话框全屏显示


## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在分析验收标准后，我识别出以下可能的冗余：
- 属性 1.5 和 2.2 都测试"选中用户时显示批量删除按钮" - 合并为一个属性
- 属性 4.3 和 4.6 都测试"删除后用户列表更新" - 合并为一个属性
- 属性 2.1 是边界情况，将作为属性 1 的一部分测试

经过反思，以下是去除冗余后的核心属性：

### 属性 1：行选择状态切换

*对于任意* 用户列表和任意选中的行，当点击该行的复选框时，该行的选中状态应该正确切换（未选中变为选中，选中变为未选中）。

**验证需求：1.2**

### 属性 2：全选功能

*对于任意* 用户列表，当点击全选复选框时，如果当前不是全选状态，则所有用户应该被选中；如果当前是全选状态，则所有用户应该被取消选中。

**验证需求：1.3**

### 属性 3：选中行高亮显示

*对于任意* 用户列表中的任意用户，当该用户被选中时，对应的表格行应该包含高亮样式类。

**验证需求：1.4**

### 属性 4：批量删除按钮显示逻辑

*对于任意* 选中用户数量，当且仅当选中数量大于 0 时，批量删除按钮应该显示且启用；当选中数量为 0 时，批量删除按钮应该隐藏或禁用。

**验证需求：1.5, 2.1, 2.2**

### 属性 5：批量删除按钮文本

*对于任意* 选中用户数量（大于 0），批量删除按钮的文本应该包含选中的用户数量，格式为"批量删除 (N)"。

**验证需求：2.3**

### 属性 6：确认对话框显示

*对于任意* 选中用户数量（大于 0），当点击批量删除按钮时，确认对话框应该显示，并且对话框内容应该包含选中的用户数量。

**验证需求：3.1, 3.2**

### 属性 7：取消操作保持状态

*对于任意* 用户列表和选中的用户 ID 集合，当显示确认对话框后点击"取消"按钮或按 ESC 键时，用户列表应该保持不变，选中状态应该保持不变。

**验证需求：3.4, 3.5**

### 属性 8：批量删除移除用户

*对于任意* 用户列表和选中的用户 ID 集合，当执行批量删除操作成功后，用户列表中不应该包含任何被删除的用户 ID。

**验证需求：4.3, 4.6**

### 属性 9：批量删除清空选中状态

*对于任意* 选中的用户 ID 集合，当批量删除操作成功完成后，选中状态应该被清空（selectedUserIds 数组长度为 0）。

**验证需求：4.5**

### 属性 10：批量删除失败保持选中状态

*对于任意* 选中的用户 ID 集合，当批量删除操作失败时，选中状态应该保持不变，以便用户可以重试操作。

**验证需求：5.5**

### 属性 11：API 请求格式

*对于任意* 用户 ID 数组，当调用批量删除 API 时，请求应该是 DELETE 方法，请求体应该包含 userIds 字段，且该字段的值应该等于传入的用户 ID 数组。

**验证需求：6.2**

### 属性 12：API 响应格式一致性

*对于任意* 批量删除 API 响应（成功或失败），响应对象应该包含 data、message、success 和 timestamp 字段，且这些字段的类型应该符合 ApiResponse 接口定义。

**验证需求：6.3**

### 属性 13：错误类型正确性

*对于任意* 批量删除 API 失败响应，API 客户端应该抛出类型化的错误对象，错误对象应该包含 code、message 和 timestamp 字段。

**验证需求：6.4**

### 属性 14：部分失败错误信息

*对于任意* 用户 ID 数组，如果其中部分用户 ID 不存在，批量删除操作应该返回包含失败用户 ID 列表的错误信息。

**验证需求：5.4**

### 属性 15：操作互斥

*对于任意* 批量删除操作，当操作正在执行时（isDeleting 为 true），其他操作按钮（新增、编辑、单个删除）应该被禁用。

**验证需求：8.4**

## 错误处理

### 错误类型

1. **验证错误**
   - 空用户 ID 数组
   - 无效的用户 ID 格式
   - 错误消息："没有选中要删除的用户" 或 "用户 ID 格式不正确"

2. **网络错误**
   - 连接超时
   - 网络不可达
   - 错误消息："网络连接失败，请检查网络连接"

3. **HTTP 错误**
   - 404：部分用户不存在
   - 500：服务器内部错误
   - 错误消息："部分用户不存在" 或 "服务器错误，请稍后重试"

4. **业务错误**
   - 部分用户删除失败
   - 权限不足
   - 错误消息：具体的失败原因和用户列表

### 错误处理流程

```typescript
try {
  await userStore.batchDeleteUsers(selectedUserIds.value)
  // 成功处理
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    message.error(error.message)
  } else if (error.code === 'NETWORK_ERROR') {
    message.error('网络连接失败，请检查网络连接')
  } else if (error.code === 'HTTP_ERROR') {
    if (error.statusCode === 404) {
      message.error('部分用户不存在，请刷新列表后重试')
    } else if (error.statusCode >= 500) {
      message.error('服务器错误，请稍后重试')
    }
  } else {
    message.error('批量删除失败，请稍后重试')
  }
  // 保持选中状态以便重试
}
```

### 错误恢复策略

1. **网络错误**：保持选中状态，提示用户检查网络后重试
2. **部分用户不存在**：保持选中状态，建议用户刷新列表后重试
3. **服务器错误**：保持选中状态，提示用户稍后重试
4. **验证错误**：清空选中状态，提示用户重新选择

## 测试策略

### 单元测试

**UserManagement 组件测试：**
```typescript
describe('UserManagement 批量删除功能', () => {
  it('应该在没有选中用户时隐藏批量删除按钮', () => {
    // 测试边界情况
  })
  
  it('应该在选中用户时显示批量删除按钮和数量', () => {
    // 测试特定示例
  })
  
  it('应该在点击批量删除按钮时显示确认对话框', () => {
    // 测试用户交互
  })
  
  it('应该在点击取消时关闭对话框且不删除用户', () => {
    // 测试取消操作
  })
  
  it('应该在确认后执行批量删除', async () => {
    // 测试删除流程
  })
})
```

**UserTable 组件测试：**
```typescript
describe('UserTable 行选择功能', () => {
  it('应该渲染行选择复选框', () => {
    // 测试 UI 渲染
  })
  
  it('应该在点击复选框时触发 selectionChange 事件', async () => {
    // 测试事件触发
  })
  
  it('应该支持全选功能', async () => {
    // 测试全选
  })
})
```

**UserStore 测试：**
```typescript
describe('UserStore.batchDeleteUsers', () => {
  it('应该成功删除选中的用户', async () => {
    // 测试成功场景
  })
  
  it('应该在用户 ID 数组为空时抛出验证错误', async () => {
    // 测试验证
  })
  
  it('应该在 API 调用失败时抛出错误', async () => {
    // 测试错误处理
  })
})
```

**API Client 测试：**
```typescript
describe('apiClient.batchDeleteUsers', () => {
  it('应该发送正确格式的 DELETE 请求', async () => {
    // 测试请求格式
  })
  
  it('应该在成功时返回标准响应格式', async () => {
    // 测试响应格式
  })
  
  it('应该在失败时抛出类型化错误', async () => {
    // 测试错误处理
  })
})
```

### 属性测试

所有属性测试必须运行至少 100 次迭代，并使用标签格式：**功能：batch-delete-users，属性 {编号}：{属性文本}**

**属性测试 1：行选择状态切换**
```typescript
it('Property: 行选择状态切换 - 验证需求 1.2', () => {
  // **功能：batch-delete-users，属性 1：行选择状态切换**
  
  fc.assert(
    fc.property(
      fc.array(userArbitrary, { minLength: 1, maxLength: 50 }),
      fc.integer({ min: 0, max: 49 }),
      (users, selectedIndex) => {
        fc.pre(selectedIndex < users.length)
        
        const selectedUserIds = ref<string[]>([])
        const userId = users[selectedIndex].id
        
        // 初始状态：未选中
        expect(selectedUserIds.value).not.toContain(userId)
        
        // 第一次点击：选中
        selectedUserIds.value = [...selectedUserIds.value, userId]
        expect(selectedUserIds.value).toContain(userId)
        
        // 第二次点击：取消选中
        selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
        expect(selectedUserIds.value).not.toContain(userId)
      }
    ),
    { numRuns: 100 }
  )
})
```

**属性测试 2：全选功能**
```typescript
it('Property: 全选功能 - 验证需求 1.3', () => {
  // **功能：batch-delete-users，属性 2：全选功能**
  
  fc.assert(
    fc.property(
      fc.array(userArbitrary, { minLength: 1, maxLength: 100 }),
      (users) => {
        const selectedUserIds = ref<string[]>([])
        const allUserIds = users.map(u => u.id)
        
        // 全选
        selectedUserIds.value = allUserIds
        expect(selectedUserIds.value).toHaveLength(users.length)
        expect(selectedUserIds.value).toEqual(allUserIds)
        
        // 取消全选
        selectedUserIds.value = []
        expect(selectedUserIds.value).toHaveLength(0)
      }
    ),
    { numRuns: 100 }
  )
})
```

**属性测试 3：批量删除移除用户**
```typescript
it('Property: 批量删除移除用户 - 验证需求 4.3, 4.6', () => {
  // **功能：batch-delete-users，属性 8：批量删除移除用户**
  
  fc.assert(
    fc.asyncProperty(
      fc.array(userArbitrary, { minLength: 5, maxLength: 50 }),
      fc.array(fc.integer({ min: 0, max: 49 }), { minLength: 1, maxLength: 10 }),
      async (users, selectedIndices) => {
        // 确保索引有效
        const validIndices = selectedIndices.filter(i => i < users.length)
        fc.pre(validIndices.length > 0)
        
        const userStore = useUserStore()
        userStore.users = users
        
        const userIdsToDelete = validIndices.map(i => users[i].id)
        
        // 执行批量删除
        await userStore.batchDeleteUsers(userIdsToDelete)
        
        // 验证被删除的用户不在列表中
        const remainingUserIds = userStore.users.map(u => u.id)
        userIdsToDelete.forEach(id => {
          expect(remainingUserIds).not.toContain(id)
        })
      }
    ),
    { numRuns: 100 }
  )
})
```

**属性测试 4：API 响应格式一致性**
```typescript
it('Property: API 响应格式一致性 - 验证需求 6.3', () => {
  // **功能：batch-delete-users，属性 12：API 响应格式一致性**
  
  fc.assert(
    fc.asyncProperty(
      fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
      async (userIds) => {
        const mock = new MockAdapter(axios)
        
        mock.onDelete('/users/batch').reply(200, {
          data: null,
          message: `成功删除 ${userIds.length} 个用户`,
          success: true,
          timestamp: new Date().toISOString()
        })
        
        const response = await apiClient.batchDeleteUsers(userIds)
        
        // 验证响应格式
        expect(response).toHaveProperty('data')
        expect(response).toHaveProperty('message')
        expect(response).toHaveProperty('success')
        expect(response).toHaveProperty('timestamp')
        expect(typeof response.message).toBe('string')
        expect(typeof response.success).toBe('boolean')
        expect(typeof response.timestamp).toBe('string')
        
        mock.restore()
      }
    ),
    { numRuns: 100 }
  )
})
```

### 集成测试

**完整批量删除流程测试：**
```typescript
describe('批量删除集成测试', () => {
  it('应该完成完整的批量删除流程', async () => {
    const userStore = useUserStore()
    
    // 1. 创建测试用户
    const testUsers = [
      { name: '张三', email: 'zhang@test.com', role: UserRole.User, status: UserStatus.Active },
      { name: '李四', email: 'li@test.com', role: UserRole.User, status: UserStatus.Active },
      { name: '王五', email: 'wang@test.com', role: UserRole.User, status: UserStatus.Active }
    ]
    
    for (const userData of testUsers) {
      await userStore.createUser(userData)
    }
    
    expect(userStore.users).toHaveLength(3)
    
    // 2. 选中前两个用户
    const userIdsToDelete = userStore.users.slice(0, 2).map(u => u.id)
    
    // 3. 执行批量删除
    await userStore.batchDeleteUsers(userIdsToDelete)
    
    // 4. 验证结果
    expect(userStore.users).toHaveLength(1)
    expect(userStore.users[0].name).toBe('王五')
  })
})
```

### 测试覆盖率目标

- **代码覆盖率**：90% 以上
- **分支覆盖率**：85% 以上
- **函数覆盖率**：95% 以上
- **属性测试覆盖**：所有核心业务逻辑（15 个属性）

### 测试数据生成器

```typescript
// 用户数据生成器（复用现有）
const userArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  role: fc.constantFrom(UserRole.Admin, UserRole.Moderator, UserRole.User),
  status: fc.constantFrom(UserStatus.Active, UserStatus.Inactive, UserStatus.Pending),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString())
})

// 用户 ID 数组生成器
const userIdsArbitrary = fc.array(fc.uuid(), { minLength: 1, maxLength: 50 })

// 批量删除请求生成器
const batchDeleteRequestArbitrary = fc.record({
  userIds: userIdsArbitrary
})
```

# 修复连续点击重置按钮报错问题

## 问题描述

用户报告：连续点击"重置"按钮会显示多个"网络连接失败，请检查网络设置"的错误提示。

## 问题分析

### 根本原因

1. **请求取消机制**：当用户连续点击重置按钮时，每次点击都会触发：
   - `setSearchKeyword('')` 
   - `setFilters({})`
   
2. **请求链**：这两个方法都会调用 `refreshUsers()` → `fetchUsers()`

3. **请求取消**：`fetchUsers` 会取消之前的同类型请求，被取消的请求会抛出 `AbortError` 或 `ERR_CANCELED` 错误

4. **错误冒泡**：
   - `fetchUsers` 正确处理了 `AbortError`（不抛出）
   - 但 `setSearchKeyword` 和 `setFilters` 没有捕获这个错误
   - 错误冒泡到 `handleReset` 方法
   - 最终被全局错误处理器捕获并显示错误提示

### 错误流程

```
用户连续点击重置按钮
  ↓
多次调用 setSearchKeyword('') 和 setFilters({})
  ↓
多次调用 refreshUsers() → fetchUsers()
  ↓
新请求取消旧请求（AbortError）
  ↓
AbortError 从 fetchUsers 返回到 setSearchKeyword/setFilters
  ↓
错误继续冒泡到 handleReset
  ↓
全局错误处理器显示错误提示 ❌
```

## 解决方案

在 `setSearchKeyword` 和 `setFilters` 方法中捕获并忽略 `AbortError`：

```typescript
// 设置搜索关键词并刷新数据
const setSearchKeyword = async (keyword: string) => {
  state.searchKeyword = keyword
  try {
    await refreshUsers()
  } catch (error: any) {
    // 忽略请求取消错误，其他错误继续抛出
    if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
      throw error
    }
  }
}

// 设置筛选条件并刷新数据
const setFilters = async (filters: UserFilters) => {
  state.filters = { ...filters }
  try {
    await refreshUsers()
  } catch (error: any) {
    // 忽略请求取消错误，其他错误继续抛出
    if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
      throw error
    }
  }
}
```

## 修复后的流程

```
用户连续点击重置按钮
  ↓
多次调用 setSearchKeyword('') 和 setFilters({})
  ↓
多次调用 refreshUsers() → fetchUsers()
  ↓
新请求取消旧请求（AbortError）
  ↓
AbortError 从 fetchUsers 返回到 setSearchKeyword/setFilters
  ↓
setSearchKeyword/setFilters 捕获并忽略 AbortError ✅
  ↓
用户不会看到错误提示 ✅
```

## 测试验证

创建了专门的测试文件 `src/stores/__tests__/userStore.abort.test.ts` 来验证修复：

1. **测试1**：连续调用 `setSearchKeyword` 不应显示取消错误
2. **测试2**：连续调用 `setFilters` 不应显示取消错误
3. **测试3**：连续点击重置按钮（模拟）不应显示取消错误

所有测试通过 ✅

## 影响范围

- **修改文件**：`src/stores/userStore.ts`
- **修改方法**：`setSearchKeyword`、`setFilters`
- **向后兼容**：是，不影响现有功能
- **副作用**：无

## 注意事项

1. **请求取消是正常行为**：当用户快速操作时，取消旧请求是性能优化的一部分
2. **错误处理层级**：
   - `fetchUsers` 层：捕获并静默处理 `AbortError`
   - `setSearchKeyword/setFilters` 层：捕获并静默处理 `AbortError`
   - 其他真实错误仍会正常抛出和显示
3. **用户体验**：用户不会看到因请求取消而产生的错误提示，体验更流畅

## 相关问题

这个问题与之前修复的删除用户问题类似，都涉及到请求取消和错误处理的正确实现。

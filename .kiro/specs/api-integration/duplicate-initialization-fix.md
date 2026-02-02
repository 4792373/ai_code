# 重复初始化问题修复

## 问题描述

在Chrome无痕模式下打开页面时，虽然用户列表正常显示，但仍然显示"网络连接失败，请检查网络设置"的错误消息。

## 根本原因

应用存在**两次初始化**的问题：

1. **第一次初始化**：`main.ts`
   ```typescript
   const { initializeApp } = useAppInitialization()
   initializeApp()  // → userStore.initialize() → fetchUsers()
   ```

2. **第二次初始化**：`UserManagement.vue` 的 `onMounted`
   ```typescript
   onMounted(() => {
     await userStore.initialize()  // 重复调用！
   })
   ```

### 时序问题

```
1. main.ts 挂载应用
2. userStore 被导入 → initializeMockApiService() 被调用
3. main.ts 调用 initializeApp() → fetchUsers() (第一次)
4. UserManagement 组件挂载
5. onMounted 调用 userStore.initialize() → fetchUsers() (第二次)
```

第一次调用可能在模拟API服务完全准备好之前就发送了，导致网络错误。

## 解决方案

移除`UserManagement.vue`中的重复初始化调用。

### 修改前

```typescript
onMounted(() => {
  withErrorHandling(async () => {
    await userStore.initialize()  // ❌ 重复初始化
    
    if (userStore.users.length === 0) {
      // 添加示例数据...
    }
  })
})
```

### 修改后

```typescript
onMounted(() => {
  // 注意：初始化已经在 main.ts 中完成，这里不需要再次初始化
  withErrorHandling(async () => {
    // ✅ 只检查是否需要添加示例数据
    if (userStore.users.length === 0 && !import.meta.env.VITEST) {
      // 添加示例数据...
      showSuccess('用户数据成功初始化')
    }
  })
})
```

## 验证步骤

1. **刷新浏览器页面**
   - 按 `Ctrl+Shift+R` 强制刷新
   - 或关闭并重新打开无痕窗口

2. **检查控制台日志**
   - 应该只看到一次：`[UserStore] 正在初始化...`
   - 应该只看到一次：`[UserStore] 成功获取 25 个用户`
   - 不应该再有网络错误

3. **检查页面消息**
   - 应该只显示：✅ "用户数据成功初始化"
   - 不应该显示：❌ "网络连接失败"

## 预期结果

修复后：
- ✅ 只有一次初始化调用
- ✅ 不再有网络错误消息
- ✅ 用户列表正常显示
- ✅ 所有功能正常工作

## 技术说明

### 初始化流程（修复后）

```
1. main.ts 挂载应用
   ↓
2. userStore 被导入
   ↓
3. initializeMockApiService() 被调用（准备模拟API）
   ↓
4. main.ts 调用 initializeApp()
   ↓
5. userStore.initialize() → fetchUsers()
   ↓
6. 模拟API服务处理请求并返回数据
   ↓
7. UserManagement 组件挂载
   ↓
8. onMounted 检查数据（不再重复初始化）
```

### 为什么会有两次初始化

这是一个常见的模式冲突：

1. **全局初始化模式**：在`main.ts`中统一初始化所有数据
2. **组件自治模式**：每个组件在`onMounted`中初始化自己需要的数据

两种模式都有其优点，但在同一个应用中混用会导致重复初始化。

### 最佳实践

对于这个应用，我们选择**全局初始化模式**：

- ✅ 在`main.ts`中统一初始化
- ✅ 组件只负责UI逻辑
- ✅ 避免重复的API调用
- ✅ 更容易控制初始化顺序

## 相关文件

- `src/main.ts` - 应用入口，负责全局初始化
- `src/components/UserManagement.vue` - 用户管理组件（已修复）
- `src/composables/useAppInitialization.ts` - 初始化逻辑
- `src/stores/userStore.ts` - 用户数据store

## 后续改进

如果需要更灵活的初始化策略，可以考虑：

1. **添加初始化状态标志**
   ```typescript
   const isInitialized = ref(false)
   
   const initialize = async () => {
     if (isInitialized.value) return  // 防止重复初始化
     // ...
     isInitialized.value = true
   }
   ```

2. **使用单例模式**
   ```typescript
   let initPromise: Promise<void> | null = null
   
   const initialize = async () => {
     if (initPromise) return initPromise  // 返回现有的Promise
     initPromise = doInitialize()
     return initPromise
   }
   ```

3. **使用Pinia的持久化插件**
   - 自动处理数据加载和保存
   - 避免手动初始化逻辑

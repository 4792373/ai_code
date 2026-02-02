# 为搜索筛选添加加载状态

## 改进内容

为 `SearchFilter` 组件添加了加载状态的视觉反馈，提升用户体验。

## 实现细节

### 1. 添加 Spin 组件包裹

使用 Ant Design Vue 的 `Spin` 组件包裹整个搜索筛选区域：

```vue
<a-spin :spinning="loading" size="small">
  <a-row :gutter="16" align="middle">
    <!-- 搜索和筛选控件 -->
  </a-row>
</a-spin>
```

### 2. 禁用控件状态

在加载时禁用所有输入控件，防止用户在请求进行中进行操作：

- **搜索输入框**：添加 `:disabled="loading"`
- **角色筛选下拉框**：添加 `:disabled="loading"` 和 `:loading="loading"`
- **状态筛选下拉框**：添加 `:disabled="loading"` 和 `:loading="loading"`
- **重置按钮**：添加 `:loading="loading"` 和 `:disabled="loading"`

### 3. 获取加载状态

从 `uiStore` 获取全局加载状态：

```typescript
import { useUIStore } from '@/stores/uiStore'

const uiStore = useUIStore()
const loading = computed(() => uiStore.loading)
```

## 用户体验改进

### 加载时的视觉反馈

1. **Spin 动画**：整个搜索筛选区域显示加载动画
2. **控件禁用**：所有输入控件变为禁用状态，显示灰色
3. **下拉框加载**：角色和状态筛选下拉框显示加载图标
4. **按钮加载**：重置按钮显示加载图标并禁用

### 防止重复操作

- 加载期间用户无法修改搜索条件
- 防止连续点击导致多个请求
- 提供清晰的视觉反馈，告知用户系统正在处理

## 技术实现

### 组件导入

```typescript
import { Spin } from 'ant-design-vue'
const ASpin = Spin
```

### 加载状态管理

加载状态由 `uiStore` 统一管理：
- `userStore` 在发起 API 请求时调用 `uiStore.setLoading(true)`
- 请求完成后调用 `uiStore.setLoading(false)`
- 使用延迟加载机制（300ms），避免闪烁

## 测试验证

所有现有测试通过，包括：
- 搜索关键词更新
- 角色筛选
- 状态筛选
- 重置功能
- Store 状态同步

## 相关文件

- `src/components/SearchFilter.vue` - 添加加载状态UI
- `src/stores/uiStore.ts` - 提供加载状态
- `src/stores/userStore.ts` - 管理加载状态

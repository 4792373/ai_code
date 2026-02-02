# UI 设计规范

## 核心原则

本项目基于 Ant Design Vue 4.x 构建，遵循以下 UI 设计原则：

- **一致性**：保持界面元素、交互模式和视觉风格的统一
- **简洁性**：避免不必要的装饰，专注于核心功能
- **可访问性**：确保所有用户都能轻松使用
- **响应式**：适配不同屏幕尺寸和设备
- **用户友好**：提供清晰的反馈和引导

## Ant Design Vue 组件使用规范

### 1. 组件导入规范

使用按需导入，避免全量导入影响性能。

✅ **正确示例：**
```vue
<script setup lang="ts">
import { Button, Form, Input, Table, Modal, message } from 'ant-design-vue'
</script>
```

❌ **错误示例：**
```vue
<script setup lang="ts">
import Antd from 'ant-design-vue'  // 不要全量导入
</script>
```

### 2. 表单组件规范

#### 表单布局
- 使用 `a-form` 组件包裹所有表单元素
- 使用 `a-form-item` 定义表单项，提供 `label` 和 `name` 属性
- 表单验证使用 `rules` 属性定义规则

✅ **正确示例：**
```vue
<template>
  <a-form
    :model="formData"
    :rules="rules"
    :label-col="{ span: 6 }"
    :wrapper-col="{ span: 18 }"
    @finish="handleSubmit"
  >
    <a-form-item label="用户名" name="name">
      <a-input v-model:value="formData.name" placeholder="请输入用户名" />
    </a-form-item>
    
    <a-form-item label="邮箱" name="email">
      <a-input v-model:value="formData.email" type="email" placeholder="请输入邮箱" />
    </a-form-item>
    
    <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
      <a-space>
        <a-button type="primary" html-type="submit">提交</a-button>
        <a-button @click="handleCancel">取消</a-button>
      </a-space>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'

const formData = reactive({
  name: '',
  email: ''
})

const rules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度为 2-50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}
</script>
```

#### 表单验证规则
- 必填字段使用 `required: true`
- 提供清晰的中文错误提示
- 使用 `trigger` 指定验证时机（blur、change）
- 复杂验证使用自定义验证函数

### 3. 表格组件规范

#### 表格配置
- 使用 `a-table` 组件展示列表数据
- 定义 `columns` 配置列信息
- 使用 `rowKey` 指定唯一标识
- 启用 `pagination` 进行分页

✅ **正确示例：**
```vue
<template>
  <a-table
    :columns="columns"
    :data-source="users"
    :loading="isLoading"
    :pagination="pagination"
    :row-key="record => record.id"
    @change="handleTableChange"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-tag :color="getStatusColor(record.status)">
          {{ getStatusText(record.status) }}
        </a-tag>
      </template>
      
      <template v-if="column.key === 'actions'">
        <a-space>
          <a-button type="link" size="small" @click="handleEdit(record)">
            编辑
          </a-button>
          <a-button type="link" danger size="small" @click="handleDelete(record)">
            删除
          </a-button>
        </a-space>
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue'

const columns: TableColumnsType = [
  {
    title: '用户名',
    dataIndex: 'name',
    key: 'name',
    width: 150
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 200
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center'
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    align: 'center',
    fixed: 'right'
  }
]

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
}))
</script>
```

#### 表格样式规范
- 操作列固定在右侧：`fixed: 'right'`
- 状态列居中对齐：`align: 'center'`
- 使用 `a-tag` 显示状态标签
- 操作按钮使用 `a-space` 组织

### 4. 按钮组件规范

#### 按钮类型
- **主要按钮**（`type="primary"`）：用于主要操作（提交、确认）
- **默认按钮**（无 type）：用于次要操作（取消、返回）
- **危险按钮**（`danger`）：用于删除等危险操作
- **链接按钮**（`type="link"`）：用于表格内的操作链接

✅ **正确示例：**
```vue
<template>
  <!-- 表单操作按钮 -->
  <a-space>
    <a-button type="primary" @click="handleSubmit">提交</a-button>
    <a-button @click="handleCancel">取消</a-button>
  </a-space>
  
  <!-- 危险操作按钮 -->
  <a-button danger @click="handleDelete">删除</a-button>
  
  <!-- 表格内操作按钮 -->
  <a-space>
    <a-button type="link" size="small" @click="handleEdit">编辑</a-button>
    <a-button type="link" danger size="small" @click="handleDelete">删除</a-button>
  </a-space>
  
  <!-- 带图标的按钮 -->
  <a-button type="primary">
    <template #icon><PlusOutlined /></template>
    新增用户
  </a-button>
</template>
```

#### 按钮组织
- 多个按钮使用 `a-space` 组织，保持间距一致
- 主要操作按钮放在左侧或前面
- 危险操作按钮与其他按钮分开

### 5. 对话框组件规范

#### Modal 使用
- 使用 `v-model:open` 控制显示/隐藏
- 提供清晰的标题和操作按钮
- 确认对话框使用 `Modal.confirm`

✅ **正确示例：**
```vue
<template>
  <!-- 表单对话框 -->
  <a-modal
    v-model:open="visible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    :width="600"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form :model="formData" :rules="rules">
      <!-- 表单内容 -->
    </a-form>
  </a-modal>
  
  <!-- 确认对话框 -->
  <a-button @click="showDeleteConfirm">删除</a-button>
</template>

<script setup lang="ts">
import { Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { createVNode } from 'vue'

const showDeleteConfirm = () => {
  Modal.confirm({
    title: '确认删除',
    icon: createVNode(ExclamationCircleOutlined),
    content: '确定要删除这条记录吗？此操作不可恢复。',
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      await handleDelete()
    }
  })
}
</script>
```

### 6. 消息提示规范

#### Message 使用
- 成功操作：`message.success('操作成功')`
- 错误提示：`message.error('操作失败')`
- 警告提示：`message.warning('请注意')`
- 信息提示：`message.info('提示信息')`

✅ **正确示例：**
```typescript
import { message } from 'ant-design-vue'

// 成功提示
const handleSubmit = async () => {
  try {
    await userStore.createUser(formData)
    message.success('用户创建成功')
  } catch (error) {
    message.error('用户创建失败，请稍后重试')
  }
}

// 加载提示
const handleExport = async () => {
  const hide = message.loading('正在导出数据...', 0)
  try {
    await exportData()
    hide()
    message.success('导出成功')
  } catch (error) {
    hide()
    message.error('导出失败')
  }
}
```

#### 提示文案规范
- 使用中文，简洁明了
- 成功提示：说明完成的操作
- 错误提示：说明错误原因和建议
- 避免技术术语，使用用户能理解的语言

### 7. 加载状态规范

#### Spin 组件
- 使用 `a-spin` 包裹需要加载状态的内容
- 提供 `tip` 属性显示加载文案

✅ **正确示例：**
```vue
<template>
  <!-- 页面级加载 -->
  <a-spin :spinning="isLoading" tip="加载中...">
    <div class="content">
      <!-- 页面内容 -->
    </div>
  </a-spin>
  
  <!-- 表格加载 -->
  <a-table
    :loading="isLoading"
    :data-source="users"
    :columns="columns"
  />
  
  <!-- 按钮加载 -->
  <a-button type="primary" :loading="isSubmitting" @click="handleSubmit">
    提交
  </a-button>
</template>
```

## 响应式设计规范

### 1. 断点定义

遵循 Ant Design 的响应式断点：

- **xs**：< 576px（手机）
- **sm**：≥ 576px（平板竖屏）
- **md**：≥ 768px（平板横屏）
- **lg**：≥ 992px（桌面）
- **xl**：≥ 1200px（大屏桌面）
- **xxl**：≥ 1600px（超大屏）

### 2. 栅格系统

使用 Ant Design 的 24 栅格系统：

✅ **正确示例：**
```vue
<template>
  <a-row :gutter="[16, 16]">
    <!-- 桌面：4 列，平板：2 列，手机：1 列 -->
    <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
      <div class="card">卡片 1</div>
    </a-col>
    <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
      <div class="card">卡片 2</div>
    </a-col>
    <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
      <div class="card">卡片 3</div>
    </a-col>
    <a-col :xs="24" :sm="12" :md="12" :lg="6" :xl="6">
      <div class="card">卡片 4</div>
    </a-col>
  </a-row>
</template>
```

### 3. 表单响应式

表单在不同屏幕尺寸下的布局调整：

✅ **正确示例：**
```vue
<template>
  <a-form
    :model="formData"
    :label-col="labelCol"
    :wrapper-col="wrapperCol"
  >
    <!-- 表单项 -->
  </a-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Grid } from 'ant-design-vue'

const screens = Grid.useBreakpoint()

// 根据屏幕尺寸调整表单布局
const labelCol = computed(() => {
  if (screens.value.xs) {
    return { span: 24 }  // 手机：标签占满一行
  }
  return { span: 6 }  // 桌面：标签占 6 列
})

const wrapperCol = computed(() => {
  if (screens.value.xs) {
    return { span: 24 }  // 手机：输入框占满一行
  }
  return { span: 18 }  // 桌面：输入框占 18 列
})
</script>
```

### 4. 表格响应式

- 桌面：显示所有列
- 平板：隐藏次要列
- 手机：使用卡片布局或只显示关键列

✅ **正确示例：**
```vue
<template>
  <!-- 桌面：表格布局 -->
  <a-table
    v-if="!screens.xs"
    :columns="columns"
    :data-source="users"
  />
  
  <!-- 手机：卡片布局 -->
  <div v-else class="mobile-list">
    <a-card v-for="user in users" :key="user.id" class="mobile-card">
      <div class="user-name">{{ user.name }}</div>
      <div class="user-email">{{ user.email }}</div>
      <div class="user-actions">
        <a-button type="link" size="small">编辑</a-button>
        <a-button type="link" danger size="small">删除</a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { Grid } from 'ant-design-vue'

const screens = Grid.useBreakpoint()
</script>
```

## 颜色规范

### 1. 主题色

使用 Ant Design 默认主题色：

- **主色**：`#1890ff`（蓝色）
- **成功色**：`#52c41a`（绿色）
- **警告色**：`#faad14`（橙色）
- **错误色**：`#ff4d4f`（红色）
- **信息色**：`#1890ff`（蓝色）

### 2. 中性色

- **标题色**：`rgba(0, 0, 0, 0.85)`
- **主文本色**：`rgba(0, 0, 0, 0.65)`
- **次文本色**：`rgba(0, 0, 0, 0.45)`
- **禁用色**：`rgba(0, 0, 0, 0.25)`
- **边框色**：`#d9d9d9`
- **分割线色**：`#f0f0f0`
- **背景色**：`#fafafa`

### 3. 状态颜色使用

✅ **正确示例：**
```vue
<template>
  <!-- 状态标签 -->
  <a-tag color="success">活跃</a-tag>
  <a-tag color="default">未激活</a-tag>
  <a-tag color="warning">待审核</a-tag>
  <a-tag color="error">已禁用</a-tag>
  
  <!-- 角色标签 -->
  <a-tag color="red">管理员</a-tag>
  <a-tag color="blue">协管员</a-tag>
  <a-tag color="default">普通用户</a-tag>
</template>
```

## 间距规范

### 1. 基础间距单位

使用 8px 作为基础间距单位：

- **xs**：4px
- **sm**：8px
- **md**：16px
- **lg**：24px
- **xl**：32px

### 2. 组件间距

✅ **正确示例：**
```vue
<template>
  <!-- 使用 a-space 组织按钮 -->
  <a-space :size="8">
    <a-button>按钮 1</a-button>
    <a-button>按钮 2</a-button>
  </a-space>
  
  <!-- 使用 gutter 设置栅格间距 -->
  <a-row :gutter="[16, 16]">
    <a-col :span="12">内容 1</a-col>
    <a-col :span="12">内容 2</a-col>
  </a-row>
</template>

<style scoped>
/* 页面内边距 */
.page-container {
  padding: 24px;
}

/* 卡片间距 */
.card + .card {
  margin-top: 16px;
}

/* 表单项间距（由 a-form 自动处理） */
</style>
```

## 字体规范

### 1. 字体家族

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 
             'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 
             'Noto Color Emoji';
```

### 2. 字体大小

- **标题 1**：24px
- **标题 2**：20px
- **标题 3**：16px
- **正文**：14px
- **辅助文字**：12px

### 3. 字体使用

✅ **正确示例：**
```vue
<style scoped>
/* 页面标题 */
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 24px;
}

/* 卡片标题 */
.card-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

/* 正文 */
.text-body {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.5715;
}

/* 辅助文字 */
.text-secondary {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
```

## 图标使用规范

### 1. 图标导入

使用 Ant Design Icons：

```vue
<script setup lang="ts">
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
</script>
```

### 2. 图标使用场景

✅ **正确示例：**
```vue
<template>
  <!-- 按钮图标 -->
  <a-button type="primary">
    <template #icon><PlusOutlined /></template>
    新增
  </a-button>
  
  <!-- 输入框图标 -->
  <a-input placeholder="搜索">
    <template #prefix><SearchOutlined /></template>
  </a-input>
  
  <!-- 独立图标 -->
  <EditOutlined style="font-size: 16px; color: #1890ff;" />
</template>
```

## 可访问性规范

### 1. 语义化 HTML

- 使用正确的 HTML 标签
- 为交互元素提供清晰的标签
- 使用 `aria-label` 提供辅助说明

### 2. 键盘导航

- 确保所有交互元素可通过键盘访问
- 提供合理的 Tab 顺序
- 支持 Enter 和 Space 键触发操作

### 3. 颜色对比度

- 文本与背景的对比度至少为 4.5:1
- 大文本（18px+）对比度至少为 3:1
- 不仅依赖颜色传达信息

## 性能优化规范

### 1. 组件懒加载

```typescript
// 路由懒加载
const UserManagement = () => import('@/views/Users.vue')

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
```

### 2. 虚拟滚动

对于大量数据的列表，使用虚拟滚动：

```vue
<template>
  <a-table
    :virtual="true"
    :scroll="{ y: 500 }"
    :data-source="largeDataset"
  />
</template>
```

### 3. 防抖和节流

对于频繁触发的事件，使用防抖或节流：

```typescript
import { debounce } from '@/utils/debounce'

const handleSearch = debounce((keyword: string) => {
  // 搜索逻辑
}, 300)
```

## 常见问题

### 问题 1：表单验证不生效
**原因**：未正确配置 `name` 属性或 `rules`

**解决方案**：
- 确保 `a-form-item` 有 `name` 属性
- 确保 `name` 与 `formData` 中的字段对应
- 确保 `rules` 正确配置

### 问题 2：表格列宽度不合理
**原因**：未设置列宽度或设置不当

**解决方案**：
- 为每列设置合理的 `width`
- 使用 `fixed` 固定重要列
- 启用 `scroll` 支持横向滚动

### 问题 3：移动端显示异常
**原因**：未做响应式适配

**解决方案**：
- 使用 `Grid.useBreakpoint()` 检测屏幕尺寸
- 为不同屏幕提供不同布局
- 测试各种屏幕尺寸

## 总结

遵循这些 UI 规范可以确保：
- ✅ 界面风格统一
- ✅ 用户体验良好
- ✅ 响应式适配完善
- ✅ 可访问性达标
- ✅ 性能表现优秀

所有新开发的界面和修改的界面都必须严格遵循这些规范。

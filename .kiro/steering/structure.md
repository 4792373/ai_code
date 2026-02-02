# 项目结构

## 目录组织

```
src/
├── components/          # Vue 组件
│   └── __tests__/      # 组件测试
├── composables/        # 组合式函数
│   └── __tests__/      # 组合式函数测试
├── services/           # 业务逻辑服务
│   ├── apiClient.ts    # Axios HTTP 客户端封装
│   ├── mockApiService.ts  # 本地模拟 API 服务
│   ├── testDataGenerator.ts  # 测试数据生成器
│   ├── errorHandler.ts # 错误处理服务
│   └── __tests__/      # 服务测试
├── stores/             # Pinia 状态管理
│   └── __tests__/      # Store 测试
├── types/              # TypeScript 类型定义
│   ├── user.ts         # 用户相关类型
│   ├── api.ts          # API 请求/响应类型
│   ├── error.ts        # 错误类型定义
│   └── env.ts          # 环境变量类型
├── utils/              # 工具函数
│   └── __tests__/      # 工具函数测试
├── plugins/            # Vue 插件
│   └── errorHandler.ts # 全局错误处理插件
├── App.vue             # 根组件
└── main.ts             # 应用入口
```

## 架构模式

### 组件结构
- 使用 Vue 3 Composition API 和 `<script setup>` 语法
- 组件测试放在 `__tests__/` 子目录中
- 测试文件使用 `.test.ts` 后缀
- 集成测试使用 `.integration.test.ts` 后缀

### 状态管理
- Pinia stores 使用组合式 API 风格的 `defineStore`
- 导出计算属性以实现响应式状态访问
- Store 方法处理业务逻辑和 localStorage 持久化
- Stores 使用自定义错误创建器抛出类型化错误

### 服务层
- 服务通过 `getInstance()` 实现单例模式
- 验证逻辑位于服务层
- 服务与 stores 交互以访问数据
- 返回类型化的验证结果或抛出自定义错误

#### API 客户端服务
- `apiClient.ts`：封装 Axios HTTP 客户端
- 提供统一的 API 请求接口（GET、POST、PUT、DELETE）
- 配置请求/响应拦截器
- 处理请求超时和错误重试
- 支持请求取消功能

#### 模拟 API 服务
- `mockApiService.ts`：本地模拟后端 API
- 实现完整的 CRUD 操作端点
- 使用内存存储模拟数据库
- 支持数据持久化到 localStorage
- 提供测试数据生成功能

#### 错误处理服务
- `errorHandler.ts`：统一错误处理逻辑
- 分类处理不同类型的错误（网络、HTTP、业务）
- 提供错误恢复策略（自动重试）
- 记录错误日志到控制台

### 类型定义
- 集中在 `src/types/` 目录
- 对固定值集使用 TypeScript 枚举（UserRole、UserStatus）
- 为创建/更新操作使用独立的接口
- 使用可辨识联合类型定义自定义错误类型

### 错误处理
- 自定义错误类型定义在 `types/error.ts`
- 使用错误创建器函数确保错误对象一致性
- 全局错误处理插件在 main.ts 中注册
- UI store 管理错误显示状态

### 测试策略
- 为所有组件、stores、服务和工具函数编写单元测试
- 为复杂用户流程编写集成测试
- 使用 fast-check 库进行属性测试（最少 100 次迭代）
- 测试使用描述性名称并按逻辑分组
- 属性测试在测试名称中标记"Property"以便筛选
- 属性测试必须引用设计文档中的正确性属性
- 测试覆盖目标：代码覆盖率 90%+，分支覆盖率 85%+

#### 测试类型
1. **单元测试**：验证特定示例、边界情况和错误条件
2. **集成测试**：测试完整的用户操作流程和端到端数据流
3. **属性测试**：验证跨所有输入的通用属性和不变量

## 命名约定

- 组件：PascalCase（例如 `UserManagement.vue`）
- 组合式函数：camelCase，带 `use` 前缀（例如 `useAppInitialization.ts`）
- Stores：camelCase，带 store 后缀（例如 `userStore.ts`）
- 服务：camelCase，带 service 后缀（例如 `userService.ts`）
- 类型：PascalCase，用于接口/枚举（例如 `User`、`UserRole`）
- 测试文件：与源文件名匹配，带 `.test.ts` 后缀

## 导入约定

- 使用 `@/` 路径别名从 `src/` 导入
- 使用 `type` 关键字导入类型：`import type { User } from '@/types/user'`
- 分组导入：Vue/库优先，然后是本地导入

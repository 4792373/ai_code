# 技术栈

## 核心技术

- **前端框架**: Vue 3 + Composition API
- **编程语言**: TypeScript（启用严格模式）
- **UI组件库**: Ant Design Vue 4.x
- **状态管理**: Pinia
- **HTTP 客户端**: Axios（用于 API 请求）
- **构建工具**: Vite 5.x
- **测试框架**: Vitest + fast-check（属性测试）

## 开发依赖

- ESLint 用于代码检查
- vue-tsc 用于 TypeScript 类型检查
- @vue/test-utils 用于组件测试
- jsdom 用于 DOM 测试环境
- fast-check 用于属性测试（最少 100 次迭代）

## 常用命令

### 开发
```bash
npm run dev              # 启动开发服务器
npm run build            # 生产构建（包含类型检查）
npm run preview          # 预览生产构建
```

### 代码质量
```bash
npm run lint             # 运行 ESLint 并自动修复
npm run type-check       # 运行 TypeScript 类型检查
```

### 测试
```bash
npm test                 # 以监听模式运行测试
npm run test:unit        # 运行所有单元测试（一次）
npm run test:prop        # 仅运行属性测试
```

## 配置说明

- 路径别名 `@/` 映射到 `src/` 目录
- TypeScript 严格模式已启用，包含额外检查：
  - noUnusedLocals（未使用的局部变量）
  - noUnusedParameters（未使用的参数）
  - noImplicitReturns（隐式返回）
- Vite 配置了 Vue 3 特性：
  - defineModel 支持
  - Props 解构支持
- 测试环境使用 jsdom 和全局测试工具
- Axios 配置：
  - 基础 URL 通过环境变量配置
  - 请求超时时间：5000ms
  - 支持请求/响应拦截器
  - 自动错误处理和重试机制

## API 集成架构

### 数据流
```
Vue 组件 → Pinia Store → API 客户端 → Axios → 模拟 API 服务
```

### 环境配置
- 开发环境：使用本地模拟 API 服务
- 生产环境：可配置真实后端 API 端点
- 配置文件：`.env.development` 和 `.env.production`

### 模拟 API 服务
- 提供完整的 CRUD 操作端点
- 使用内存存储模拟数据库
- 支持数据持久化到 localStorage
- 自动生成测试数据（中文姓名、邮箱等）
- 响应时间：GET 请求 < 100ms，其他请求 < 200ms

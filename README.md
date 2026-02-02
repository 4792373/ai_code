# 用户管理系统 (User Management System)

一个基于 Vue 3 + TypeScript + Ant Design Vue 的现代化用户管理系统，支持用户管理和品牌管理功能。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Ant Design Vue 4.x
- **类型系统**: TypeScript (严格模式)
- **状态管理**: Pinia
- **构建工具**: Vite
- **测试框架**: Vitest + fast-check (属性测试)

## 项目设置

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 开发工作流

### 代码检查

```bash
npm run lint
```

### 类型检查

```bash
npm run type-check
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行属性测试
npm run test:prop
```

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── BrandForm.vue           # 品牌表单组件
│   ├── BrandManagement.vue     # 品牌管理组件
│   └── __tests__/              # 组件测试
├── composables/         # 组合式函数
│   ├── useDataCache.ts         # 数据缓存 Composable
│   ├── useVirtualScroll.ts     # 虚拟滚动 Composable
│   └── __tests__/              # Composable 测试
├── services/           # 业务服务
│   ├── apiClient.ts            # API 客户端
│   ├── brandService.ts         # 品牌服务
│   ├── excelService.ts         # Excel 服务
│   ├── mockApiService.ts       # 模拟 API 服务
│   └── __tests__/              # 服务测试
├── stores/             # Pinia 状态管理
│   ├── brandStore.ts           # 品牌 Store
│   ├── userStore.ts            # 用户 Store
│   └── __tests__/              # Store 测试
├── types/              # TypeScript 类型定义
│   ├── brand.ts                # 品牌类型定义
│   ├── user.ts                 # 用户类型定义
│   └── error.ts                # 错误类型定义
├── utils/              # 工具函数
│   ├── debounce.ts             # 防抖/节流工具
│   └── __tests__/              # 工具函数测试
├── App.vue             # 根组件
└── main.ts             # 应用入口
```

## 功能特性

### 用户管理
- ✅ 项目初始化和基础结构
- 🚧 用户列表展示
- 🚧 用户 CRUD 操作
- 🚧 搜索和筛选功能
- 🚧 表单验证
- 🚧 数据持久化
- 🚧 响应式设计

### 品牌管理
- ✅ 品牌列表展示（支持分页）
- ✅ 品牌 CRUD 操作（创建、编辑、删除）
- ✅ 搜索功能（按品牌名称或编码）
- ✅ 状态筛选（有效/无效）
- ✅ 表单验证（客户端和服务端双重验证）
- ✅ Excel 批量导入（支持模板下载）
- ✅ 数据缓存（减少 API 请求）
- ✅ 响应式设计（支持移动端、平板、桌面）
- ✅ 性能优化（虚拟滚动、防抖、请求取消）

### 技术特性
- ✅ TypeScript 严格模式
- ✅ Vue 3 Composition API
- ✅ Pinia 状态管理（Setup Store 语法）
- ✅ Ant Design Vue 4.x UI 组件
- ✅ 单元测试 + 属性测试（fast-check）
- ✅ 集成测试 + 性能测试
- ✅ API 客户端封装（Axios）
- ✅ 模拟 API 服务（开发环境）
- ✅ 错误处理和重试机制
- ✅ 数据持久化（localStorage）

## 开发规范

- 使用 TypeScript 严格模式
- 遵循 Vue 3 Composition API 最佳实践
- 使用 Ant Design Vue 组件库
- 采用 Pinia 进行状态管理
- 编写单元测试和属性测试

## 品牌管理使用指南

### 基本操作

#### 1. 查看品牌列表
- 系统启动后自动加载品牌列表
- 支持分页浏览（默认每页 10 条）
- 显示品牌名称、编码、状态、操作人和操作时间

#### 2. 创建品牌
1. 点击"新增品牌"按钮
2. 填写品牌信息：
   - 品牌名称（1-50 个字符）
   - 品牌编码（2-20 个字符，仅支持大写字母、数字、下划线、连字符）
   - 品牌状态（有效/无效）
3. 点击"确定"提交

#### 3. 编辑品牌
1. 点击品牌列表中的"编辑"按钮
2. 修改品牌信息
3. 点击"确定"保存

#### 4. 删除品牌
1. 点击品牌列表中的"删除"按钮
2. 确认删除操作

#### 5. 搜索品牌
- 在搜索框中输入品牌名称或编码
- 系统自动进行模糊搜索（支持防抖）

#### 6. 筛选品牌
- 使用状态下拉框筛选有效或无效的品牌
- 点击"重置"按钮清除所有筛选条件

#### 7. 批量导入
1. 点击"下载模板"按钮获取 Excel 导入模板
2. 按照模板格式填写品牌数据
3. 点击"批量导入"按钮上传 Excel 文件
4. 系统自动解析并导入数据
5. 显示导入结果（成功数量、失败数量、错误详情）

### 数据验证规则

#### 品牌名称
- 必填项
- 长度：1-50 个字符
- 不能为空白字符

#### 品牌编码
- 必填项
- 长度：2-20 个字符
- 格式：仅支持大写字母（A-Z）、数字（0-9）、下划线（_）、连字符（-）
- 唯一性：不能与现有品牌编码重复（不区分大小写）

#### 品牌状态
- 必填项
- 可选值：有效（active）、无效（inactive）

### 性能优化

#### 数据缓存
- 品牌列表数据自动缓存 5 分钟
- 减少不必要的 API 请求
- 数据变更后自动清除缓存

#### 搜索防抖
- 搜索输入延迟 300ms 后执行
- 避免频繁的搜索请求

#### 请求取消
- 自动取消重复的 API 请求
- 避免竞态条件

#### 虚拟滚动
- 大数据量列表（1000+ 条）使用虚拟滚动
- 只渲染可见区域的数据
- 提高渲染性能

### 响应式设计

#### 移动设备（< 768px）
- 简化表格列（隐藏操作人和操作时间）
- 简单分页模式
- 全屏表单对话框
- 优化按钮和输入框尺寸

#### 平板设备（768px - 1023px）
- 显示完整表格列
- 标准分页模式
- 适中的字体和间距

#### 桌面设备（≥ 1024px）
- 完整功能展示
- 最佳用户体验
- 最大宽度限制（1400px - 1600px）

## 测试

### 测试覆盖

#### 单元测试
- 品牌服务（brandService）
- Excel 服务（excelService）
- 品牌 Store（brandStore）
- 工具函数（debounce）
- Composables（useDataCache、useVirtualScroll）

#### 集成测试
- 品牌管理组件（BrandManagement）
- 品牌表单组件（BrandForm）
- 完整的用户操作流程

#### 属性测试
- 品牌数据验证
- Excel 解析
- API 响应格式一致性

#### 性能测试
- 大数据量渲染性能
- 搜索响应时间
- 缓存命中率

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行属性测试
npm run test:prop

# 运行特定测试文件
npm test -- brandService.test.ts

# 生成测试覆盖率报告
npm test -- --coverage
```

## 故障排除

### 常见问题

#### 1. 品牌编码验证失败
- 确保编码只包含大写字母、数字、下划线、连字符
- 检查编码长度是否在 2-20 个字符之间
- 确认编码未被其他品牌使用

#### 2. Excel 导入失败
- 检查文件格式是否为 .xlsx 或 .xls
- 确认文件大小不超过 5MB
- 验证 Excel 列标题是否正确（品牌名称、品牌编码、品牌状态）
- 检查数据格式是否符合验证规则

#### 3. 搜索或筛选无响应
- 检查网络连接
- 查看浏览器控制台是否有错误
- 尝试刷新页面

#### 4. 数据未更新
- 清除浏览器缓存
- 点击"重置"按钮刷新数据
- 检查 localStorage 是否被禁用

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '添加某个特性'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License
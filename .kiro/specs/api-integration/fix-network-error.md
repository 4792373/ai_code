# 网络错误修复说明

## 问题描述

应用启动时显示多个"网络连接失败，请检查网络设置"的错误消息。

## 问题原因

axios正在尝试发送真实的HTTP请求到`http://localhost:3000/api`，但该API服务器不存在。虽然我们配置了模拟API服务（`VITE_USE_MOCK_API=true`），但axios请求没有被拦截。

## 解决方案

在`src/services/apiClient.ts`中添加了自定义的axios适配器`mockApiAdapter`，用于拦截所有HTTP请求并使用模拟API服务处理。

### 修改内容

1. **导入模拟API服务**
   ```typescript
   import { getMockApiService } from '@/services/mockApiService'
   ```

2. **创建模拟API适配器**
   ```typescript
   const mockApiAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
     const mockService = getMockApiService()
     // 根据请求方法和URL路由到相应的模拟API处理器
     // ...
   }
   ```

3. **配置axios使用模拟适配器**
   ```typescript
   this.axiosInstance = axios.create({
     // ...
     ...(useMockApi() ? { adapter: mockApiAdapter as any } : {})
   })
   ```

## 验证步骤

### 方法1：在浏览器中验证

1. 确保开发服务器正在运行：`npm run dev`
2. 打开浏览器访问：`http://localhost:5173`
3. 打开浏览器控制台（F12）
4. 检查是否有以下日志：
   - `[模拟 API] 服务已初始化，加载了 25 个用户`
   - `[UserStore] 正在初始化...`
   - `[UserStore] 成功获取 25 个用户`
5. 页面应该正常显示用户列表，不再有网络错误

### 方法2：使用测试页面验证

1. 打开浏览器访问：`http://localhost:5173/test-mock-api.html`
2. 打开浏览器控制台（F12）
3. 点击"测试模拟API"按钮
4. 检查控制台输出，应该看到：
   - `✅ 获取用户列表成功`
   - `✅ 创建用户成功`
   - `🎉 所有测试通过！`

### 方法3：运行单元测试

```bash
npm run test:unit
```

测试应该通过，不再有网络相关的错误。

## 预期结果

修复后，应用应该：

1. ✅ 启动时不再显示网络错误
2. ✅ 正常显示用户列表（25个测试用户）
3. ✅ 所有CRUD操作正常工作
4. ✅ 搜索和筛选功能正常
5. ✅ 控制台显示模拟API日志而不是网络错误

## 技术细节

### 模拟API适配器工作原理

1. **请求拦截**：当axios发送请求时，自定义适配器会拦截请求
2. **路由匹配**：根据请求方法（GET/POST/PUT/DELETE）和URL路径匹配到相应的模拟API处理器
3. **模拟处理**：调用模拟API服务的相应方法处理请求
4. **响应转换**：将模拟API的响应转换为axios格式的响应对象
5. **错误处理**：将模拟API的错误转换为axios错误格式

### 支持的API端点

- `GET /api/users` - 获取用户列表（支持搜索和筛选）
- `GET /api/users/:id` - 根据ID获取用户
- `POST /api/users` - 创建新用户
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户

### 配置说明

模拟API通过环境变量控制：

```env
# .env.development
VITE_USE_MOCK_API=true        # 启用模拟API
VITE_MOCK_API_DELAY=100       # 模拟API响应延迟（毫秒）
```

如果需要使用真实的API服务器，只需将`VITE_USE_MOCK_API`设置为`false`。

## 故障排除

如果修复后仍然有问题：

1. **清除浏览器缓存**
   - 按 Ctrl+Shift+Delete
   - 清除缓存和Cookie
   - 刷新页面（Ctrl+F5）

2. **清除localStorage**
   - 打开浏览器控制台
   - 执行：`localStorage.clear()`
   - 刷新页面

3. **重启开发服务器**
   ```bash
   # 停止当前服务器（Ctrl+C）
   npm run dev
   ```

4. **检查环境变量**
   - 确认`.env.development`文件存在
   - 确认`VITE_USE_MOCK_API=true`

5. **检查控制台日志**
   - 打开浏览器控制台
   - 查找`[模拟 API]`相关的日志
   - 如果没有看到初始化日志，说明模拟API没有正确加载

## 相关文件

- `src/services/apiClient.ts` - API客户端（包含模拟适配器）
- `src/services/mockApiService.ts` - 模拟API服务实现
- `src/services/configService.ts` - 配置服务
- `.env.development` - 开发环境配置
- `src/stores/userStore.ts` - 用户Store（初始化模拟API）

## 后续改进

如果需要更强大的模拟功能，可以考虑：

1. 使用MSW (Mock Service Worker) - 更标准的API模拟方案
2. 添加更多的API端点支持
3. 支持更复杂的查询参数
4. 添加网络延迟和错误模拟
5. 支持文件上传等高级功能

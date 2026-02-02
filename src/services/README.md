# 服务层文档

## 统一错误处理器 (errorHandler.ts)

统一错误处理器提供了一套完整的错误处理解决方案，支持不同类型的HTTP错误分类处理、控制台日志记录和用户友好的错误提示。

### 主要功能

1. **错误分类处理**：自动识别网络错误、超时错误、客户端错误(4xx)、服务器错误(5xx)
2. **用户友好提示**：为不同错误类型提供中文错误消息
3. **详细日志记录**：记录完整的错误信息到控制台，便于调试
4. **错误恢复策略**：提供智能的重试建议和指数退避延迟
5. **兼容性支持**：与现有错误处理机制完全兼容

### 基本用法

#### 获取错误处理器实例

```typescript
import { getErrorHandler } from '@/services/errorHandler'

const errorHandler = getErrorHandler()
```

#### 处理API错误

```typescript
import { handleApiError } from '@/services/errorHandler'

try {
  await apiClient.getUsers()
} catch (error) {
  const processedError = handleApiError(error)
  console.log('错误类型:', processedError.type)
  console.log('用户消息:', processedError.userMessage)
}
```

#### 创建兼容的AppError

```typescript
import { createCompatibleAppError } from '@/services/errorHandler'

const processedError = handleApiError(error)
const appError = createCompatibleAppError(processedError)

// 现在可以与现有错误处理系统一起使用
throw appError
```

### 错误类型

错误处理器支持以下错误类型：

- `NETWORK_ERROR`: 网络连接错误
- `TIMEOUT_ERROR`: 请求超时错误  
- `CLIENT_ERROR`: 客户端错误 (4xx)
- `SERVER_ERROR`: 服务器错误 (5xx)
- `VALIDATION_ERROR`: 数据验证错误

### 错误恢复策略

错误处理器提供智能的重试建议：

```typescript
const errorHandler = getErrorHandler()

// 检查是否应该重试
if (errorHandler.shouldRetry(error)) {
  const delay = errorHandler.getRetryDelay(attemptNumber)
  const maxRetries = errorHandler.getMaxRetries()
  
  // 实现重试逻辑
  setTimeout(() => {
    // 重试请求
  }, delay)
}
```

### 重试策略规则

- **网络错误**: 建议重试，最多3次
- **5xx服务器错误**: 建议重试，最多3次  
- **408/429错误**: 建议重试
- **其他4xx错误**: 不建议重试
- **延迟策略**: 指数退避 (1s, 2s, 4s)

### 日志记录

错误处理器会自动记录详细的错误信息：

```
🚨 [错误处理器] 网络连接 - 2024-01-01T12:00:00.000Z
错误消息: Network Error
错误类型: NetworkError
请求配置: {
  method: "GET",
  url: "/api/users",
  baseURL: "http://localhost:3000",
  timeout: 5000
}
```

### 与API客户端集成

错误处理器已经集成到API客户端中，会自动处理所有HTTP请求的错误：

```typescript
// API客户端会自动使用错误处理器
const apiClient = getApiClient()

try {
  const users = await apiClient.getUsers()
} catch (error) {
  // 错误已经被处理，包含了错误类型和用户消息
  console.log(error.errorType) // 'NETWORK_ERROR'
  console.log(error.userMessage) // '网络连接失败，请检查网络设置'
}
```

### 配置选项

错误处理器支持通过环境变量进行配置：

- `VITE_ENABLE_ERROR_LOGGING`: 是否启用错误日志记录 (默认: true)

### 测试

错误处理器包含完整的单元测试和集成测试：

```bash
# 运行错误处理器测试
npm test -- src/services/__tests__/errorHandler

# 运行集成测试
npm test -- src/services/__tests__/errorHandler.integration.test.ts
```

### 扩展

如果需要自定义错误恢复策略，可以实现 `ErrorRecoveryStrategy` 接口：

```typescript
import { ErrorRecoveryStrategy, getErrorHandler } from '@/services/errorHandler'

class CustomRecoveryStrategy implements ErrorRecoveryStrategy {
  shouldRetry(error: AxiosError): boolean {
    // 自定义重试逻辑
    return false
  }
  
  getRetryDelay(attemptNumber: number): number {
    // 自定义延迟策略
    return 1000 * attemptNumber
  }
  
  getMaxRetries(): number {
    return 5
  }
}

const errorHandler = getErrorHandler(new CustomRecoveryStrategy())
```
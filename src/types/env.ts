// 环境变量类型定义

// 环境变量接口
export interface ImportMetaEnv {
  // API 配置
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  
  // 环境模式
  readonly VITE_APP_MODE: string
  
  // 日志配置
  readonly VITE_ENABLE_API_LOGGING: string
  readonly VITE_ENABLE_ERROR_LOGGING: string
  
  // 模拟 API 配置
  readonly VITE_USE_MOCK_API: string
  readonly VITE_MOCK_API_DELAY: string
  
  // 开发工具
  readonly VITE_ENABLE_DEVTOOLS?: string
}

// 扩展 ImportMeta 接口
export interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 应用配置接口
export interface AppConfig {
  api: {
    baseURL: string
    timeout: number
    useMockApi: boolean
    mockApiDelay: number
  }
  logging: {
    enableApiLogging: boolean
    enableErrorLogging: boolean
  }
  development: {
    enableDevtools: boolean
  }
  mode: 'development' | 'production'
}

// 环境配置解析器接口
export interface ConfigParser {
  parseConfig(): AppConfig
  getBooleanValue(value: string | undefined, defaultValue: boolean): boolean
  getNumberValue(value: string | undefined, defaultValue: number): number
  getStringValue(value: string | undefined, defaultValue: string): string
}
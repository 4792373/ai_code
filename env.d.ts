/// <reference types="vite/client" />

// 环境变量类型定义
interface ImportMetaEnv {
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

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
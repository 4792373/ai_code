import type { App } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { ErrorType } from '@/types/error'

// 全局错误处理插件
export const errorHandlerPlugin = {
  install(app: App) {
    const { handleError } = useErrorHandler()

    // 全局错误处理器
    app.config.errorHandler = (error: unknown, _instance, info) => {
      console.error('Global error handler:', error, info)
      
      // 根据错误类型进行分类处理
      if (error instanceof Error) {
        if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
          // 代码分割加载错误
          handleError({
            type: ErrorType.NETWORK_ERROR,
            message: '资源加载失败，请刷新页面重试',
            details: { error, info }
          })
        } else if (error.message.includes('localStorage') || error.message.includes('sessionStorage')) {
          // 存储相关错误
          handleError({
            type: ErrorType.STORAGE_ERROR,
            message: '本地存储访问失败，请检查浏览器设置',
            details: { error, info }
          })
        } else {
          // 其他未知错误
          handleError({
            type: ErrorType.UNKNOWN_ERROR,
            message: '应用程序发生未知错误',
            details: { error, info }
          })
        }
      } else {
        // 非 Error 对象
        handleError({
          type: ErrorType.UNKNOWN_ERROR,
          message: '应用程序发生未知错误',
          details: { error, info }
        })
      }
    }

    // 全局未捕获的 Promise 错误处理
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // 阻止默认的控制台错误输出
      event.preventDefault()
      
      // 使用我们的错误处理器
      if (event.reason && typeof event.reason === 'object' && 'type' in event.reason) {
        // 如果是我们的 AppError
        handleError(event.reason)
      } else {
        // 其他类型的错误
        handleError({
          type: ErrorType.UNKNOWN_ERROR,
          message: '异步操作失败',
          details: event.reason
        })
      }
    })

    // 全局资源加载错误处理
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        // 资源加载错误（图片、脚本等）
        console.error('Resource loading error:', event)
        handleError({
          type: ErrorType.NETWORK_ERROR,
          message: '资源加载失败',
          details: {
            source: (event.target as any).src || (event.target as any).href,
            error: event.error
          }
        })
      }
    })

    // 提供全局访问
    app.provide('errorHandler', { handleError })
  }
}

// 导出类型
export type ErrorHandlerPlugin = typeof errorHandlerPlugin
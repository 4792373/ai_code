/**
 * 配置服务 - 管理环境变量和应用配置
 */

import type { AppConfig, ConfigParser } from '@/types/env'

/**
 * 配置解析器实现
 */
class ConfigServiceImpl implements ConfigParser {
  private config: AppConfig | null = null

  /**
   * 解析环境变量并生成应用配置
   * @returns 应用配置对象
   */
  parseConfig(): AppConfig {
    if (this.config) {
      return this.config
    }

    const env = import.meta.env

    this.config = {
      api: {
        baseURL: this.getStringValue(env.VITE_API_BASE_URL, 'http://localhost:3000/api'),
        timeout: this.getNumberValue(env.VITE_API_TIMEOUT, 5000),
        useMockApi: this.getBooleanValue(env.VITE_USE_MOCK_API, true),
        mockApiDelay: this.getNumberValue(env.VITE_MOCK_API_DELAY, 100)
      },
      logging: {
        enableApiLogging: this.getBooleanValue(env.VITE_ENABLE_API_LOGGING, true),
        enableErrorLogging: this.getBooleanValue(env.VITE_ENABLE_ERROR_LOGGING, true)
      },
      development: {
        enableDevtools: this.getBooleanValue(env.VITE_ENABLE_DEVTOOLS, false)
      },
      mode: env.VITE_APP_MODE === 'production' ? 'production' : 'development'
    }

    return this.config
  }

  /**
   * 解析布尔值环境变量
   * @param value 环境变量值
   * @param defaultValue 默认值
   * @returns 布尔值
   */
  getBooleanValue(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined || value === '') {
      return defaultValue
    }
    return value.toLowerCase() === 'true' || value === '1'
  }

  /**
   * 解析数字值环境变量
   * @param value 环境变量值
   * @param defaultValue 默认值
   * @returns 数字值
   */
  getNumberValue(value: string | undefined, defaultValue: number): number {
    if (value === undefined || value === '') {
      return defaultValue
    }
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  /**
   * 解析字符串值环境变量
   * @param value 环境变量值
   * @param defaultValue 默认值
   * @returns 字符串值
   */
  getStringValue(value: string | undefined, defaultValue: string): string {
    return value || defaultValue
  }

  /**
   * 重置配置缓存（主要用于测试）
   */
  resetConfig(): void {
    this.config = null
  }
}

// 单例实例
let configServiceInstance: ConfigServiceImpl | null = null

/**
 * 获取配置服务实例
 * @returns 配置服务实例
 */
export const getConfigService = (): ConfigServiceImpl => {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigServiceImpl()
  }
  return configServiceInstance
}

/**
 * 获取应用配置
 * @returns 应用配置对象
 */
export const getAppConfig = (): AppConfig => {
  return getConfigService().parseConfig()
}

/**
 * 检查是否为开发模式
 * @returns 是否为开发模式
 */
export const isDevelopment = (): boolean => {
  return getAppConfig().mode === 'development'
}

/**
 * 检查是否为生产模式
 * @returns 是否为生产模式
 */
export const isProduction = (): boolean => {
  return getAppConfig().mode === 'production'
}

/**
 * 检查是否启用模拟 API
 * @returns 是否启用模拟 API
 */
export const useMockApi = (): boolean => {
  return getAppConfig().api.useMockApi
}

/**
 * 检查是否启用 API 日志记录
 * @returns 是否启用 API 日志记录
 */
export const isApiLoggingEnabled = (): boolean => {
  return getAppConfig().logging.enableApiLogging
}

/**
 * 检查是否启用错误日志记录
 * @returns 是否启用错误日志记录
 */
export const isErrorLoggingEnabled = (): boolean => {
  return getAppConfig().logging.enableErrorLogging
}
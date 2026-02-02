import { describe, it, expect, vi } from 'vitest'
import { ApiClientClass } from '@/services/apiClient'
import type { ApiClientConfig } from '@/types/api'

// 模拟 axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      request: vi.fn().mockResolvedValue({
        data: {
          data: [],
          message: '操作成功',
          success: true,
          timestamp: new Date().toISOString()
        }
      })
    }))
  }
}))

// 模拟配置服务
vi.mock('@/services/configService', () => ({
  getAppConfig: () => ({
    api: {
      baseURL: 'http://localhost:3000/api',
      timeout: 5000
    },
    logging: {
      enableApiLogging: true,
      enableErrorLogging: true
    }
  }),
  isApiLoggingEnabled: () => true,
  isErrorLoggingEnabled: () => true
}))

describe('ApiClient 基础功能测试', () => {
  it('应该能够创建 API 客户端实例', () => {
    const config: ApiClientConfig = {
      baseURL: 'http://localhost:3000/api',
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    }
    
    const apiClient = new ApiClientClass(config)
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.getUsers).toBe('function')
    expect(typeof apiClient.createUser).toBe('function')
    expect(typeof apiClient.updateUser).toBe('function')
    expect(typeof apiClient.deleteUser).toBe('function')
  })

  it('应该提供请求取消功能', () => {
    const config: ApiClientConfig = {
      baseURL: 'http://localhost:3000/api',
      timeout: 5000
    }
    
    const apiClient = new ApiClientClass(config)
    expect(typeof apiClient.cancelRequest).toBe('function')
    expect(typeof apiClient.cancelAllRequests).toBe('function')
  })

  it('应该提供 axios 实例访问方法', () => {
    const config: ApiClientConfig = {
      baseURL: 'http://localhost:3000/api',
      timeout: 5000
    }
    
    const apiClient = new ApiClientClass(config)
    const axiosInstance = apiClient.getAxiosInstance()
    expect(axiosInstance).toBeDefined()
    expect(axiosInstance.interceptors).toBeDefined()
  })
})
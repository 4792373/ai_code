/**
 * 配置服务测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { getConfigService, getAppConfig, isDevelopment, isProduction, useMockApi } from '../configService'

describe('配置服务', () => {
  beforeEach(() => {
    // 重置配置服务实例
    getConfigService().resetConfig()
  })

  describe('环境变量解析', () => {
    it('应该正确解析布尔值环境变量', () => {
      const configService = getConfigService()
      
      expect(configService.getBooleanValue('true', false)).toBe(true)
      expect(configService.getBooleanValue('1', false)).toBe(true)
      expect(configService.getBooleanValue('false', true)).toBe(false)
      expect(configService.getBooleanValue('0', true)).toBe(false)
      expect(configService.getBooleanValue(undefined, true)).toBe(true)
      expect(configService.getBooleanValue('', false)).toBe(false)
    })

    it('应该正确解析数字值环境变量', () => {
      const configService = getConfigService()
      
      expect(configService.getNumberValue('5000', 3000)).toBe(5000)
      expect(configService.getNumberValue('invalid', 3000)).toBe(3000)
      expect(configService.getNumberValue(undefined, 3000)).toBe(3000)
      expect(configService.getNumberValue('', 3000)).toBe(3000)
    })

    it('应该正确解析字符串值环境变量', () => {
      const configService = getConfigService()
      
      expect(configService.getStringValue('test', 'default')).toBe('test')
      expect(configService.getStringValue(undefined, 'default')).toBe('default')
      expect(configService.getStringValue('', 'default')).toBe('default')
    })
  })

  describe('应用配置', () => {
    it('应该返回有效的应用配置对象', () => {
      const config = getAppConfig()
      
      expect(config).toHaveProperty('api')
      expect(config).toHaveProperty('logging')
      expect(config).toHaveProperty('development')
      expect(config).toHaveProperty('mode')
      
      expect(config.api).toHaveProperty('baseURL')
      expect(config.api).toHaveProperty('timeout')
      expect(config.api).toHaveProperty('useMockApi')
      expect(config.api).toHaveProperty('mockApiDelay')
      
      expect(typeof config.api.baseURL).toBe('string')
      expect(typeof config.api.timeout).toBe('number')
      expect(typeof config.api.useMockApi).toBe('boolean')
      expect(typeof config.api.mockApiDelay).toBe('number')
    })

    it('应该缓存配置对象', () => {
      const config1 = getAppConfig()
      const config2 = getAppConfig()
      
      expect(config1).toBe(config2) // 应该是同一个对象引用
    })
  })

  describe('便捷方法', () => {
    it('isDevelopment 应该正确判断开发模式', () => {
      // 由于我们在测试环境中，默认应该是开发模式
      expect(typeof isDevelopment()).toBe('boolean')
    })

    it('isProduction 应该正确判断生产模式', () => {
      expect(typeof isProduction()).toBe('boolean')
      expect(isDevelopment()).toBe(!isProduction()) // 两者应该互斥
    })

    it('useMockApi 应该正确返回模拟 API 配置', () => {
      expect(typeof useMockApi()).toBe('boolean')
    })
  })
})
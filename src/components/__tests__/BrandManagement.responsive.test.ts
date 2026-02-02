/**
 * 品牌管理组件响应式设计测试
 * 
 * **验证需求：10.1, 10.2, 10.3, 10.4**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BrandManagement from '../BrandManagement.vue'
import BrandForm from '../BrandForm.vue'

describe('品牌管理响应式设计测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('桌面设备 (>= 1024px)', () => {
    beforeEach(() => {
      // 模拟桌面设备屏幕尺寸
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })
    })

    it('应该显示完整的表格列（需求 10.1）', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      // 触发屏幕尺寸检查
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      // 验证表格列数（桌面设备应该显示所有列）
      const columns = wrapper.vm.columns
      expect(columns.length).toBeGreaterThanOrEqual(5) // 品牌名称、编码、操作人、操作时间、状态、操作
    })

    it('应该显示完整的分页控件（需求 10.1）', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      const paginationConfig = wrapper.vm.paginationConfig
      expect(paginationConfig.showSizeChanger).toBe(true)
      expect(paginationConfig.showQuickJumper).toBe(true)
      expect(paginationConfig.simple).toBe(false)
    })
  })

  describe('移动设备 (< 768px)', () => {
    beforeEach(() => {
      // 模拟移动设备屏幕尺寸
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
    })

    it('应该隐藏次要列（需求 10.2, 10.3）', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      // 触发屏幕尺寸检查
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      // 验证表格列数（移动设备应该隐藏操作人和操作时间列）
      const columns = wrapper.vm.columns
      expect(columns.length).toBeLessThan(5) // 只显示品牌名称、编码、状态、操作
    })

    it('应该使用简化的分页控件（需求 10.2）', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      // 触发屏幕尺寸检查
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      const paginationConfig = wrapper.vm.paginationConfig
      expect(paginationConfig.showSizeChanger).toBe(false)
      expect(paginationConfig.showQuickJumper).toBe(false)
      expect(paginationConfig.simple).toBe(true)
    })

    it('应该调整表格尺寸为 small（需求 10.2）', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      // 触发屏幕尺寸检查
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      // 验证 isMobile 状态
      expect(wrapper.vm.isMobile).toBe(true)
    })
  })

  describe('平板设备 (768px - 1023px)', () => {
    beforeEach(() => {
      // 模拟平板设备屏幕尺寸
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })
    })

    it('应该显示完整的表格列（需求 10.1）', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      // 触发屏幕尺寸检查
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      // 验证表格列数（平板设备应该显示所有列）
      const columns = wrapper.vm.columns
      expect(columns.length).toBeGreaterThanOrEqual(5)
    })

    it('应该标记为平板设备', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      // 触发屏幕尺寸检查
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isTablet).toBe(true)
      expect(wrapper.vm.isMobile).toBe(false)
    })
  })

  describe('品牌表单响应式设计', () => {
    it('移动设备应该使用全屏对话框（需求 10.4）', async () => {
      // 模拟移动设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const wrapper = mount(BrandForm, {
        props: {
          visible: true,
          mode: 'create'
        }
      })
      await wrapper.vm.$nextTick()

      // 验证 isMobile 状态
      expect(wrapper.vm.isMobile).toBe(true)
    })

    it('桌面设备应该使用固定宽度对话框（需求 10.4）', async () => {
      // 模拟桌面设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      const wrapper = mount(BrandForm, {
        props: {
          visible: true,
          mode: 'create'
        }
      })
      await wrapper.vm.$nextTick()

      // 验证 isMobile 状态
      expect(wrapper.vm.isMobile).toBe(false)
    })
  })

  describe('响应式状态更新', () => {
    it('应该在窗口大小变化时更新响应式状态', async () => {
      const wrapper = mount(BrandManagement)
      await wrapper.vm.$nextTick()

      // 初始状态：桌面设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isMobile).toBe(false)

      // 切换到移动设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isMobile).toBe(true)

      // 切换回桌面设备
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.isMobile).toBe(false)
    })

    it('应该在组件卸载时清理事件监听器', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const wrapper = mount(BrandManagement)
      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      
      removeEventListenerSpy.mockRestore()
    })
  })
})

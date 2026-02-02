import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DeleteConfirmDialog from '../DeleteConfirmDialog.vue'

describe('DeleteConfirmDialog', () => {
  it('should render modal component with correct props', () => {
    const wrapper = mount(DeleteConfirmDialog, {
      props: {
        visible: true
      }
    })

    const modal = wrapper.findComponent({ name: 'AModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('title')).toBe('确认删除')
  })

  it('should pass visible prop correctly', () => {
    const wrapper = mount(DeleteConfirmDialog, {
      props: {
        visible: false
      }
    })

    const modal = wrapper.findComponent({ name: 'AModal' })
    expect(modal.props('open')).toBe(false)
  })

  it('should emit confirm event when handleConfirm is called', async () => {
    const wrapper = mount(DeleteConfirmDialog, {
      props: {
        visible: true
      }
    })

    await wrapper.vm.handleConfirm()

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('should emit cancel event when handleCancel is called', async () => {
    const wrapper = mount(DeleteConfirmDialog, {
      props: {
        visible: true
      }
    })

    await wrapper.vm.handleCancel()

    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('should pass loading prop to modal', () => {
    const wrapper = mount(DeleteConfirmDialog, {
      props: {
        visible: true,
        loading: true
      }
    })

    const modal = wrapper.findComponent({ name: 'AModal' })
    expect(modal.props('confirmLoading')).toBe(true)
  })

  it('should have default loading value as false', () => {
    const wrapper = mount(DeleteConfirmDialog, {
      props: {
        visible: true
      }
    })

    const modal = wrapper.findComponent({ name: 'AModal' })
    expect(modal.props('confirmLoading')).toBe(false)
  })
})
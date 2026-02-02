import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce, throttle } from '../debounce'

describe('debounce 工具函数', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该延迟执行函数', () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 300)

    // 调用防抖函数
    debouncedFn('test')

    // 立即检查，函数不应该被调用
    expect(mockFn).not.toHaveBeenCalled()

    // 快进时间 300ms
    vi.advanceTimersByTime(300)

    // 现在函数应该被调用
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('应该在多次调用时重置计时器', () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 300)

    // 第一次调用
    debouncedFn('call1')
    vi.advanceTimersByTime(100)

    // 第二次调用（重置计时器）
    debouncedFn('call2')
    vi.advanceTimersByTime(100)

    // 第三次调用（重置计时器）
    debouncedFn('call3')
    vi.advanceTimersByTime(100)

    // 此时只过了 300ms，但由于多次重置，函数不应该被调用
    expect(mockFn).not.toHaveBeenCalled()

    // 再快进 200ms（总共 300ms 从最后一次调用开始）
    vi.advanceTimersByTime(200)

    // 现在函数应该被调用，且只调用一次，使用最后一次的参数
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('call3')
  })

  it('应该支持多个参数', () => {
    const mockFn = vi.fn()
    const debouncedFn = debounce(mockFn, 300)

    debouncedFn('arg1', 'arg2', 'arg3')
    vi.advanceTimersByTime(300)

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
  })

  it('应该保持 this 上下文', () => {
    const obj = {
      value: 42,
      method: function (this: any) {
        return this.value
      }
    }

    const debouncedMethod = debounce(obj.method, 300)

    // 绑定 this 上下文
    const boundMethod = debouncedMethod.bind(obj)
    boundMethod()

    vi.advanceTimersByTime(300)

    // 验证 this 上下文正确
    expect(obj.method()).toBe(42)
  })
})

describe('throttle 工具函数', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该立即执行第一次调用', () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 300)

    throttledFn('test')

    // 第一次调用应该立即执行
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('应该在延迟时间内忽略后续调用', () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 300)

    // 第一次调用
    throttledFn('call1')
    expect(mockFn).toHaveBeenCalledTimes(1)

    // 在延迟时间内的调用应该被忽略
    vi.advanceTimersByTime(100)
    throttledFn('call2')
    expect(mockFn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    throttledFn('call3')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('应该在延迟时间后允许新的调用', () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 300)

    // 第一次调用
    throttledFn('call1')
    expect(mockFn).toHaveBeenCalledTimes(1)

    // 快进超过延迟时间
    vi.advanceTimersByTime(300)

    // 现在应该允许新的调用
    throttledFn('call2')
    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenLastCalledWith('call2')
  })

  it('应该支持多个参数', () => {
    const mockFn = vi.fn()
    const throttledFn = throttle(mockFn, 300)

    throttledFn('arg1', 'arg2', 'arg3')

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataCache } from '../useDataCache'

describe('useDataCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('应该正确生成缓存键', () => {
    const cache = useDataCache<string>()

    // 无参数
    const key1 = cache.generateKey('test')
    expect(key1).toBe('test')

    // 有参数
    const key2 = cache.generateKey('test', { id: '1', name: 'test' })
    expect(key2).toContain('test:')
    expect(key2).toContain('id=')
    expect(key2).toContain('name=')
  })

  it('应该能够设置和获取缓存数据', () => {
    const cache = useDataCache<string>()

    cache.set('key1', 'value1')
    const result = cache.get('key1')

    expect(result).toBe('value1')
    expect(cache.size.value).toBe(1)
  })

  it('应该在缓存不存在时返回 null', () => {
    const cache = useDataCache<string>()

    const result = cache.get('nonexistent')

    expect(result).toBeNull()
  })

  it('应该正确统计缓存命中和未命中', () => {
    const cache = useDataCache<string>()

    cache.set('key1', 'value1')

    // 命中
    cache.get('key1')
    expect(cache.hits.value).toBe(1)
    expect(cache.misses.value).toBe(0)

    // 未命中
    cache.get('key2')
    expect(cache.hits.value).toBe(1)
    expect(cache.misses.value).toBe(1)

    // 计算命中率
    expect(cache.hitRate.value).toBe(50)
  })

  it('应该在 TTL 过期后删除缓存', () => {
    const cache = useDataCache<string>({ ttl: 1000 })

    cache.set('key1', 'value1')

    // 立即获取应该成功
    expect(cache.get('key1')).toBe('value1')

    // 快进时间超过 TTL
    vi.advanceTimersByTime(1001)

    // 现在应该返回 null
    expect(cache.get('key1')).toBeNull()
  })

  it('应该能够删除指定的缓存项', () => {
    const cache = useDataCache<string>()

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    expect(cache.size.value).toBe(2)

    const deleted = cache.remove('key1')

    expect(deleted).toBe(true)
    expect(cache.size.value).toBe(1)
    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBe('value2')
  })

  it('应该能够清空所有缓存', () => {
    const cache = useDataCache<string>()

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.set('key3', 'value3')

    expect(cache.size.value).toBe(3)

    cache.clear()

    expect(cache.size.value).toBe(0)
    expect(cache.hits.value).toBe(0)
    expect(cache.misses.value).toBe(0)
  })

  it('应该正确检查缓存是否存在', () => {
    const cache = useDataCache<string>({ ttl: 1000 })

    cache.set('key1', 'value1')

    // 应该存在
    expect(cache.has('key1')).toBe(true)

    // 不存在的键
    expect(cache.has('key2')).toBe(false)

    // 过期后应该不存在
    vi.advanceTimersByTime(1001)
    expect(cache.has('key1')).toBe(false)
  })

  it('应该实现 LRU 策略淘汰最旧的缓存项', () => {
    const cache = useDataCache<string>({ maxSize: 3 })

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.set('key3', 'value3')

    expect(cache.size.value).toBe(3)

    // 添加第 4 个项，应该淘汰最旧的 key1
    cache.set('key4', 'value4')

    expect(cache.size.value).toBe(3)
    expect(cache.get('key1')).toBeNull() // 最旧的被淘汰
    expect(cache.get('key2')).toBe('value2')
    expect(cache.get('key3')).toBe('value3')
    expect(cache.get('key4')).toBe('value4')
  })

  it('应该在访问时更新 LRU 顺序', () => {
    const cache = useDataCache<string>({ maxSize: 3 })

    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.set('key3', 'value3')

    // 访问 key1，使其成为最新的
    cache.get('key1')

    // 添加新项，应该淘汰 key2（现在是最旧的）
    cache.set('key4', 'value4')

    expect(cache.get('key1')).toBe('value1') // 仍然存在
    expect(cache.get('key2')).toBeNull() // 被淘汰
    expect(cache.get('key3')).toBe('value3')
    expect(cache.get('key4')).toBe('value4')
  })

  it('应该能够清理过期的缓存项', () => {
    const cache = useDataCache<string>({ ttl: 1000 })

    cache.set('key1', 'value1')
    vi.advanceTimersByTime(500)
    cache.set('key2', 'value2')
    vi.advanceTimersByTime(600) // key1 已过期，key2 未过期

    cache.cleanExpired()

    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBe('value2')
  })

  it('应该返回正确的缓存统计信息', () => {
    const cache = useDataCache<string>({ ttl: 5000, maxSize: 50 })

    cache.set('key1', 'value1')
    cache.get('key1') // 命中
    cache.get('key2') // 未命中

    const stats = cache.getStats()

    expect(stats.size).toBe(1)
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBe('50.00%')
    expect(stats.maxSize).toBe(50)
    expect(stats.ttl).toBe(5000)
  })

  it('应该支持复杂对象作为缓存值', () => {
    interface TestData {
      id: string
      name: string
      items: number[]
    }

    const cache = useDataCache<TestData>()

    const testData: TestData = {
      id: '1',
      name: 'test',
      items: [1, 2, 3]
    }

    cache.set('key1', testData)
    const result = cache.get('key1')

    expect(result).toEqual(testData)
    expect(result?.items).toEqual([1, 2, 3])
  })

  it('应该支持数组作为缓存值', () => {
    const cache = useDataCache<string[]>()

    const testArray = ['item1', 'item2', 'item3']

    cache.set('key1', testArray)
    const result = cache.get('key1')

    expect(result).toEqual(testArray)
    expect(result?.length).toBe(3)
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getMockApiService } from '../mockApiService'
import { BrandStatus } from '@/types/brand'
import type { CreateBrandDto, UpdateBrandDto } from '@/types/brand'

describe('模拟 API 服务 - 品牌管理端点', () => {
  let mockApiService: ReturnType<typeof getMockApiService>

  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
    
    // 获取新的服务实例
    mockApiService = getMockApiService()
    mockApiService.initialize()
  })

  afterEach(() => {
    mockApiService.cleanup()
    localStorage.clear()
  })

  describe('GET /brands - 获取品牌列表', () => {
    it('应该成功获取品牌列表', async () => {
      const response = await mockApiService.handleGetBrands()

      expect(response.success).toBe(true)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.message).toContain('成功获取')
    })

    it('应该返回包含所有必需字段的品牌对象', async () => {
      const response = await mockApiService.handleGetBrands()
      const brand = response.data[0]

      expect(brand).toHaveProperty('id')
      expect(brand).toHaveProperty('name')
      expect(brand).toHaveProperty('code')
      expect(brand).toHaveProperty('status')
      expect(brand).toHaveProperty('operator')
      expect(brand).toHaveProperty('createdAt')
      expect(brand).toHaveProperty('updatedAt')
    })

    it('应该支持按品牌名称搜索', async () => {
      const response = await mockApiService.handleGetBrands({ search: '华为' })

      expect(response.success).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
      response.data.forEach(brand => {
        expect(
          brand.name.includes('华为') || brand.code.toLowerCase().includes('华为'.toLowerCase())
        ).toBe(true)
      })
    })

    it('应该支持按品牌编码搜索', async () => {
      const response = await mockApiService.handleGetBrands({ search: 'HUAWEI' })

      expect(response.success).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
      response.data.forEach(brand => {
        expect(
          brand.name.toLowerCase().includes('huawei') || brand.code.includes('HUAWEI')
        ).toBe(true)
      })
    })

    it('应该支持按状态筛选', async () => {
      const response = await mockApiService.handleGetBrands({ status: BrandStatus.Active })

      expect(response.success).toBe(true)
      response.data.forEach(brand => {
        expect(brand.status).toBe(BrandStatus.Active)
      })
    })

    it('应该支持分页', async () => {
      const response = await mockApiService.handleGetBrands({ page: 1, pageSize: 5 })

      expect(response.success).toBe(true)
      expect(response.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('GET /brands/:id - 根据ID获取品牌', () => {
    it('应该成功获取指定品牌', async () => {
      const listResponse = await mockApiService.handleGetBrands()
      const brandId = listResponse.data[0].id

      const response = await mockApiService.handleGetBrandById(brandId)

      expect(response.success).toBe(true)
      expect(response.data.id).toBe(brandId)
      expect(response.message).toContain('成功获取品牌信息')
    })

    it('应该在品牌不存在时返回404错误', async () => {
      await expect(
        mockApiService.handleGetBrandById('non-existent-id')
      ).rejects.toThrow('品牌不存在')
    })

    it('应该在ID为空时返回错误', async () => {
      await expect(
        mockApiService.handleGetBrandById('')
      ).rejects.toThrow('品牌ID不能为空')
    })
  })

  describe('POST /brands - 创建品牌', () => {
    it('应该成功创建新品牌', async () => {
      const brandData: CreateBrandDto = {
        name: '测试品牌',
        code: 'TEST_BRAND',
        status: BrandStatus.Active
      }

      const response = await mockApiService.handleCreateBrand(brandData)

      expect(response.success).toBe(true)
      expect(response.data.name).toBe('测试品牌')
      expect(response.data.code).toBe('TEST_BRAND')
      expect(response.data.status).toBe(BrandStatus.Active)
      expect(response.message).toContain('品牌创建成功')
    })

    it('应该在品牌名称为空时返回验证错误', async () => {
      const brandData: CreateBrandDto = {
        name: '',
        code: 'TEST_BRAND',
        status: BrandStatus.Active
      }

      await expect(
        mockApiService.handleCreateBrand(brandData)
      ).rejects.toThrow('数据验证失败')
    })

    it('应该在品牌编码为空时返回验证错误', async () => {
      const brandData: CreateBrandDto = {
        name: '测试品牌',
        code: '',
        status: BrandStatus.Active
      }

      await expect(
        mockApiService.handleCreateBrand(brandData)
      ).rejects.toThrow('数据验证失败')
    })

    it('应该在品牌编码格式不正确时返回验证错误', async () => {
      const brandData: CreateBrandDto = {
        name: '测试品牌',
        code: 'test_brand', // 包含小写字母
        status: BrandStatus.Active
      }

      await expect(
        mockApiService.handleCreateBrand(brandData)
      ).rejects.toThrow('数据验证失败')
    })

    it('应该在品牌编码已存在时返回验证错误', async () => {
      const brandData: CreateBrandDto = {
        name: '华为2',
        code: 'HUAWEI', // 已存在的编码
        status: BrandStatus.Active
      }

      await expect(
        mockApiService.handleCreateBrand(brandData)
      ).rejects.toThrow('数据验证失败')
    })

    it('应该自动去除品牌名称和编码的空格', async () => {
      const brandData: CreateBrandDto = {
        name: '  测试品牌  ',
        code: '  TEST_BRAND  ',
        status: BrandStatus.Active
      }

      const response = await mockApiService.handleCreateBrand(brandData)

      expect(response.data.name).toBe('测试品牌')
      expect(response.data.code).toBe('TEST_BRAND')
    })
  })

  describe('PUT /brands/:id - 更新品牌', () => {
    it('应该成功更新品牌信息', async () => {
      const listResponse = await mockApiService.handleGetBrands()
      const brandId = listResponse.data[0].id

      const updateData: UpdateBrandDto = {
        name: '更新后的品牌名称',
        status: BrandStatus.Inactive
      }

      const response = await mockApiService.handleUpdateBrand(brandId, updateData)

      expect(response.success).toBe(true)
      expect(response.data.name).toBe('更新后的品牌名称')
      expect(response.data.status).toBe(BrandStatus.Inactive)
      expect(response.message).toContain('品牌信息更新成功')
    })

    it('应该在品牌不存在时返回404错误', async () => {
      const updateData: UpdateBrandDto = {
        name: '更新后的品牌名称'
      }

      await expect(
        mockApiService.handleUpdateBrand('non-existent-id', updateData)
      ).rejects.toThrow('品牌不存在')
    })

    it('应该在更新编码为已存在的编码时返回验证错误', async () => {
      const listResponse = await mockApiService.handleGetBrands()
      const brand1 = listResponse.data[0]
      const brand2 = listResponse.data[1]

      const updateData: UpdateBrandDto = {
        code: brand2.code // 使用另一个品牌的编码
      }

      await expect(
        mockApiService.handleUpdateBrand(brand1.id, updateData)
      ).rejects.toThrow('数据验证失败')
    })

    it('应该允许更新品牌时保持自己的编码不变', async () => {
      const listResponse = await mockApiService.handleGetBrands()
      const brand = listResponse.data[0]

      const updateData: UpdateBrandDto = {
        name: '新名称',
        code: brand.code // 保持编码不变
      }

      const response = await mockApiService.handleUpdateBrand(brand.id, updateData)

      expect(response.success).toBe(true)
      expect(response.data.code).toBe(brand.code)
    })
  })

  describe('DELETE /brands/:id - 删除品牌', () => {
    it('应该成功删除品牌', async () => {
      const listResponse = await mockApiService.handleGetBrands()
      const initialCount = listResponse.data.length
      const brandId = listResponse.data[0].id

      const response = await mockApiService.handleDeleteBrand(brandId)

      expect(response.success).toBe(true)
      expect(response.message).toContain('品牌删除成功')

      // 验证品牌已被删除
      const newListResponse = await mockApiService.handleGetBrands()
      expect(newListResponse.data.length).toBe(initialCount - 1)
      expect(newListResponse.data.find(b => b.id === brandId)).toBeUndefined()
    })

    it('应该在品牌不存在时返回404错误', async () => {
      await expect(
        mockApiService.handleDeleteBrand('non-existent-id')
      ).rejects.toThrow('品牌不存在')
    })

    it('应该在ID为空时返回错误', async () => {
      await expect(
        mockApiService.handleDeleteBrand('')
      ).rejects.toThrow('品牌ID不能为空')
    })
  })

  describe('POST /brands/batch - 批量创建品牌', () => {
    it('应该成功批量创建品牌', async () => {
      const brandsData: CreateBrandDto[] = [
        { name: '批量品牌1', code: 'BATCH_01', status: BrandStatus.Active },
        { name: '批量品牌2', code: 'BATCH_02', status: BrandStatus.Active },
        { name: '批量品牌3', code: 'BATCH_03', status: BrandStatus.Inactive }
      ]

      const response = await mockApiService.handleBatchCreateBrands(brandsData)

      expect(response.success).toBe(true)
      expect(response.data.total).toBe(3)
      expect(response.data.success).toBe(3)
      expect(response.data.failed).toBe(0)
      expect(response.data.errors).toHaveLength(0)
    })

    it('应该正确处理部分成功的批量导入', async () => {
      const brandsData: CreateBrandDto[] = [
        { name: '有效品牌', code: 'VALID_01', status: BrandStatus.Active },
        { name: '', code: 'INVALID_01', status: BrandStatus.Active }, // 名称为空
        { name: '有效品牌2', code: 'invalid', status: BrandStatus.Active }, // 编码格式错误
        { name: '有效品牌3', code: 'VALID_02', status: BrandStatus.Active }
      ]

      const response = await mockApiService.handleBatchCreateBrands(brandsData)

      expect(response.success).toBe(true)
      expect(response.data.total).toBe(4)
      expect(response.data.success).toBe(2)
      expect(response.data.failed).toBe(2)
      expect(response.data.errors.length).toBeGreaterThan(0)
    })

    it('应该在错误详情中包含行号', async () => {
      const brandsData: CreateBrandDto[] = [
        { name: '', code: 'TEST_01', status: BrandStatus.Active }
      ]

      const response = await mockApiService.handleBatchCreateBrands(brandsData)

      expect(response.data.errors[0].row).toBe(2) // Excel 行号从2开始
    })

    it('应该处理重复编码的情况', async () => {
      const brandsData: CreateBrandDto[] = [
        { name: '品牌1', code: 'DUPLICATE', status: BrandStatus.Active },
        { name: '品牌2', code: 'DUPLICATE', status: BrandStatus.Active } // 重复编码
      ]

      const response = await mockApiService.handleBatchCreateBrands(brandsData)

      expect(response.data.success).toBe(1)
      expect(response.data.failed).toBe(1)
      expect(response.data.errors.some(e => e.message.includes('品牌编码已存在'))).toBe(true)
    })
  })

  describe('数据持久化', () => {
    it('应该将品牌数据保存到 localStorage', async () => {
      const brandData: CreateBrandDto = {
        name: '持久化测试品牌',
        code: 'PERSIST_TEST',
        status: BrandStatus.Active
      }

      await mockApiService.handleCreateBrand(brandData)

      // 检查 localStorage
      const stored = localStorage.getItem('mock_api_brands')
      expect(stored).not.toBeNull()
      
      const data = JSON.parse(stored!)
      expect(data.brands).toBeInstanceOf(Array)
      expect(data.brands.some((b: any) => b.code === 'PERSIST_TEST')).toBe(true)
    })

    it('应该从 localStorage 加载品牌数据', async () => {
      // 先创建一个品牌
      const brandData: CreateBrandDto = {
        name: '加载测试品牌',
        code: 'LOAD_TEST',
        status: BrandStatus.Active
      }
      await mockApiService.handleCreateBrand(brandData)

      // 清理并重新初始化
      mockApiService.cleanup()
      const newService = getMockApiService()
      newService.initialize()

      // 验证数据已加载
      const response = await newService.handleGetBrands({ search: 'LOAD_TEST' })
      expect(response.data.length).toBeGreaterThan(0)
      expect(response.data[0].code).toBe('LOAD_TEST')
    })
  })
})

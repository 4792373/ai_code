/**
 * 品牌服务单元测试
 * 
 * 测试品牌数据验证、编码唯一性检查和数据格式化功能
 */

import { describe, it, expect } from 'vitest'
import { brandService } from '../brandService'
import { BrandStatus } from '@/types/brand'
import type { CreateBrandDto, UpdateBrandDto } from '@/types/brand'

describe('brandService', () => {
  describe('validateBrandData', () => {
    describe('品牌名称验证', () => {
      it('应该拒绝空品牌名称', () => {
        const brandData: CreateBrandDto = {
          name: '',
          code: 'TEST_BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'name',
          message: '品牌名称不能为空'
        })
      })

      it('应该拒绝仅包含空格的品牌名称', () => {
        const brandData: CreateBrandDto = {
          name: '   ',
          code: 'TEST_BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'name',
          message: '品牌名称不能为空'
        })
      })

      it('应该拒绝超过 50 个字符的品牌名称', () => {
        const brandData: CreateBrandDto = {
          name: 'A'.repeat(51),
          code: 'TEST_BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'name',
          message: '品牌名称长度为 1-50 个字符'
        })
      })

      it('应该接受有效的品牌名称', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'TEST_BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该接受最小长度（1 个字符）的品牌名称', () => {
        const brandData: CreateBrandDto = {
          name: 'A',
          code: 'TEST_BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该接受最大长度（50 个字符）的品牌名称', () => {
        const brandData: CreateBrandDto = {
          name: 'A'.repeat(50),
          code: 'TEST_BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('品牌编码验证', () => {
      it('应该拒绝空品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: '',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'code',
          message: '品牌编码不能为空'
        })
      })

      it('应该拒绝仅包含空格的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: '   ',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'code',
          message: '品牌编码不能为空'
        })
      })

      it('应该拒绝少于 2 个字符的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'A',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'code',
          message: '品牌编码长度为 2-20 个字符'
        })
      })

      it('应该拒绝超过 20 个字符的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'A'.repeat(21),
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'code',
          message: '品牌编码长度为 2-20 个字符'
        })
      })

      it('应该拒绝包含小写字母的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'test_brand',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'code',
          message: '品牌编码只能包含大写字母、数字、下划线和连字符'
        })
      })

      it('应该拒绝包含特殊字符的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'TEST@BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'code',
          message: '品牌编码只能包含大写字母、数字、下划线和连字符'
        })
      })

      it('应该接受有效的品牌编码（大写字母）', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'TESTBRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该接受包含数字的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'BRAND123',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该接受包含下划线的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'TEST_BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该接受包含连字符的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'TEST-BRAND',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该接受最小长度（2 个字符）的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'AB',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该接受最大长度（20 个字符）的品牌编码', () => {
        const brandData: CreateBrandDto = {
          name: '测试品牌',
          code: 'A'.repeat(20),
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('多个字段验证', () => {
      it('应该返回多个验证错误', () => {
        const brandData: CreateBrandDto = {
          name: '',
          code: 'a',
          status: BrandStatus.Active
        }

        const result = brandService.validateBrandData(brandData)

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
        expect(result.errors.some(e => e.field === 'name')).toBe(true)
        expect(result.errors.some(e => e.field === 'code')).toBe(true)
      })
    })

    describe('更新数据验证', () => {
      it('应该验证部分更新数据', () => {
        const updateData: UpdateBrandDto = {
          name: '更新后的品牌'
        }

        const result = brandService.validateBrandData(updateData)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('应该验证更新数据中的无效字段', () => {
        const updateData: UpdateBrandDto = {
          code: 'invalid_code'
        }

        const result = brandService.validateBrandData(updateData)

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual({
          field: 'code',
          message: '品牌编码只能包含大写字母、数字、下划线和连字符'
        })
      })
    })
  })

  describe('isBrandCodeUnique', () => {
    const existingBrands = [
      { id: '1', code: 'BRAND_A' },
      { id: '2', code: 'BRAND_B' },
      { id: '3', code: 'BRAND_C' }
    ]

    it('应该返回 true 当编码不存在时', () => {
      const result = brandService.isBrandCodeUnique('BRAND_D', existingBrands)

      expect(result).toBe(true)
    })

    it('应该返回 false 当编码已存在时', () => {
      const result = brandService.isBrandCodeUnique('BRAND_A', existingBrands)

      expect(result).toBe(false)
    })

    it('应该忽略大小写进行比较', () => {
      const result = brandService.isBrandCodeUnique('brand_a', existingBrands)

      expect(result).toBe(false)
    })

    it('应该忽略前后空格', () => {
      const result = brandService.isBrandCodeUnique('  BRAND_A  ', existingBrands)

      expect(result).toBe(false)
    })

    it('应该排除指定的品牌 ID（编辑时）', () => {
      const result = brandService.isBrandCodeUnique('BRAND_A', existingBrands, '1')

      expect(result).toBe(true)
    })

    it('应该在编辑时检查其他品牌的编码', () => {
      const result = brandService.isBrandCodeUnique('BRAND_B', existingBrands, '1')

      expect(result).toBe(false)
    })

    it('应该返回 true 当品牌列表为空时', () => {
      const result = brandService.isBrandCodeUnique('BRAND_A', [])

      expect(result).toBe(true)
    })
  })

  describe('formatBrandData', () => {
    it('应该去除品牌名称的前后空格', () => {
      const brandData: CreateBrandDto = {
        name: '  测试品牌  ',
        code: 'TEST_BRAND',
        status: BrandStatus.Active
      }

      const result = brandService.formatBrandData(brandData)

      expect(result.name).toBe('测试品牌')
    })

    it('应该去除品牌编码的前后空格', () => {
      const brandData: CreateBrandDto = {
        name: '测试品牌',
        code: '  TEST_BRAND  ',
        status: BrandStatus.Active
      }

      const result = brandService.formatBrandData(brandData)

      expect(result.code).toBe('TEST_BRAND')
    })

    it('应该将品牌编码转换为大写', () => {
      const brandData: CreateBrandDto = {
        name: '测试品牌',
        code: 'test_brand',
        status: BrandStatus.Active
      }

      const result = brandService.formatBrandData(brandData)

      expect(result.code).toBe('TEST_BRAND')
    })

    it('应该保持品牌状态不变', () => {
      const brandData: CreateBrandDto = {
        name: '测试品牌',
        code: 'TEST_BRAND',
        status: BrandStatus.Inactive
      }

      const result = brandService.formatBrandData(brandData)

      expect(result.status).toBe(BrandStatus.Inactive)
    })

    it('应该同时处理所有格式化操作', () => {
      const brandData: CreateBrandDto = {
        name: '  测试品牌  ',
        code: '  test_brand  ',
        status: BrandStatus.Active
      }

      const result = brandService.formatBrandData(brandData)

      expect(result.name).toBe('测试品牌')
      expect(result.code).toBe('TEST_BRAND')
      expect(result.status).toBe(BrandStatus.Active)
    })
  })

  describe('validateBrandDataWithError', () => {
    it('应该在验证失败时抛出错误', async () => {
      const brandData: CreateBrandDto = {
        name: '',
        code: 'TEST_BRAND',
        status: BrandStatus.Active
      }

      await expect(
        brandService.validateBrandDataWithError(brandData)
      ).rejects.toThrow('品牌数据验证失败')
    })

    it('应该在验证成功时不抛出错误', async () => {
      const brandData: CreateBrandDto = {
        name: '测试品牌',
        code: 'TEST_BRAND',
        status: BrandStatus.Active
      }

      await expect(
        brandService.validateBrandDataWithError(brandData)
      ).resolves.not.toThrow()
    })
  })

  describe('validateBrand', () => {
    it('应该返回兼容的 ValidationResult 格式', async () => {
      const brandData: CreateBrandDto = {
        name: '',
        code: 'TEST_BRAND',
        status: BrandStatus.Active
      }

      const result = await brandService.validateBrand(brandData)

      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result.isValid).toBe(false)
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe('generateId', () => {
    it('应该生成唯一的 ID', () => {
      const id1 = brandService.generateId()
      const id2 = brandService.generateId()

      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
      expect(id2.length).toBeGreaterThan(0)
    })
  })
})

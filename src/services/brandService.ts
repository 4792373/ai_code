/**
 * 品牌服务层
 * 
 * 提供品牌数据验证、业务规则检查和数据转换功能
 */

import type { CreateBrandDto, UpdateBrandDto, ValidationResult as BrandValidationResult } from '@/types/brand'
import type { ValidationResult } from '@/types/error'
import { createValidationError } from '@/types/error'

/**
 * 品牌服务类
 * 
 * 使用单例模式，提供品牌相关的业务逻辑处理
 */
export class BrandService {
  private static instance: BrandService

  /**
   * 获取品牌服务单例实例
   * @returns 品牌服务实例
   */
  static getInstance(): BrandService {
    if (!BrandService.instance) {
      BrandService.instance = new BrandService()
    }
    return BrandService.instance
  }

  /**
   * 验证品牌数据
   * 
   * 验证品牌名称和编码的格式是否符合要求
   * 
   * @param brandData 品牌数据（创建或更新）
   * @returns 验证结果，包含是否有效和错误列表
   * 
   * **验证需求：2.2, 2.3**
   */
  validateBrandData(brandData: CreateBrandDto | UpdateBrandDto): BrandValidationResult {
    const errors: { field: string; message: string }[] = []

    // 品牌名称验证（需求 2.2）
    if ('name' in brandData) {
      if (!brandData.name || brandData.name.trim().length === 0) {
        errors.push({
          field: 'name',
          message: '品牌名称不能为空'
        })
      } else if (brandData.name.trim().length < 1 || brandData.name.trim().length > 50) {
        errors.push({
          field: 'name',
          message: '品牌名称长度为 1-50 个字符'
        })
      }
    }

    // 品牌编码验证（需求 2.3）
    if ('code' in brandData) {
      if (!brandData.code || brandData.code.trim().length === 0) {
        errors.push({
          field: 'code',
          message: '品牌编码不能为空'
        })
      } else {
        const code = brandData.code.trim()
        
        // 验证长度
        if (code.length < 2 || code.length > 20) {
          errors.push({
            field: 'code',
            message: '品牌编码长度为 2-20 个字符'
          })
        }
        
        // 验证格式：只能包含大写字母、数字、下划线和连字符
        const codePattern = /^[A-Z0-9_-]+$/
        if (!codePattern.test(code)) {
          errors.push({
            field: 'code',
            message: '品牌编码只能包含大写字母、数字、下划线和连字符'
          })
        }
      }
    }

    // 品牌状态验证
    if ('status' in brandData && brandData.status === undefined) {
      errors.push({
        field: 'status',
        message: '请选择品牌状态'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证品牌数据并抛出错误
   * 
   * 用于需要抛出异常的场景，如 API 请求前的验证
   * 
   * @param brandData 品牌数据
   * @throws {AppError} 验证失败时抛出验证错误
   */
  async validateBrandDataWithError(brandData: CreateBrandDto | UpdateBrandDto): Promise<void> {
    const result = this.validateBrandData(brandData)
    if (!result.valid) {
      const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`)
      throw createValidationError('品牌数据验证失败', errorMessages)
    }
  }

  /**
   * 检查品牌编码是否唯一
   * 
   * 在创建或更新品牌时，检查编码是否已被其他品牌使用
   * 
   * @param code 品牌编码
   * @param existingBrands 现有品牌列表
   * @param excludeId 排除的品牌 ID（编辑时使用，排除自身）
   * @returns 是否唯一（true 表示唯一，false 表示重复）
   * 
   * **验证需求：2.4, 3.4**
   */
  isBrandCodeUnique(
    code: string,
    existingBrands: Array<{ id: string; code: string }>,
    excludeId?: string
  ): boolean {
    const normalizedCode = code.trim().toUpperCase()
    
    return !existingBrands.some(brand => {
      // 如果是编辑操作，排除自身
      if (excludeId && brand.id === excludeId) {
        return false
      }
      
      // 比较编码（不区分大小写）
      return brand.code.toUpperCase() === normalizedCode
    })
  }

  /**
   * 格式化品牌数据
   * 
   * 对品牌数据进行标准化处理，如去除空格、转换大小写等
   * 
   * @param brandData 原始品牌数据
   * @returns 格式化后的品牌数据
   * 
   * **验证需求：2.2, 2.3**
   */
  formatBrandData(brandData: CreateBrandDto): CreateBrandDto {
    return {
      name: brandData.name.trim(),
      code: brandData.code.trim().toUpperCase(),
      status: brandData.status
    }
  }

  /**
   * 验证品牌数据（兼容旧的 ValidationResult 接口）
   * 
   * 提供与 userService 相同的接口，返回 ValidationResult 类型
   * 
   * @param brandData 品牌数据
   * @returns 验证结果
   */
  async validateBrand(brandData: CreateBrandDto | UpdateBrandDto): Promise<ValidationResult> {
    const result = this.validateBrandData(brandData)
    
    return {
      isValid: result.valid,
      errors: result.errors.map(e => `${e.field}: ${e.message}`)
    }
  }

  /**
   * 生成唯一 ID
   * 
   * 生成基于时间戳和随机数的唯一标识符
   * 
   * @returns 唯一 ID 字符串
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }
}

/**
 * 导出品牌服务单例实例
 * 
 * 可以直接导入使用，无需手动调用 getInstance()
 */
export const brandService = BrandService.getInstance()

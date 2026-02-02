import type { CreateUserData, UpdateUserData } from '@/types/user'
import type { ValidationResult } from '@/types/error'
import { createValidationError } from '@/types/error'

export class UserService {
  private static instance: UserService
  
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  // 验证用户数据
  async validateUser(userData: CreateUserData | UpdateUserData): Promise<ValidationResult> {
    const errors: string[] = []
    
    // 姓名验证
    if (!userData.name || userData.name.trim().length === 0) {
      errors.push('用户姓名不能为空')
    } else if (userData.name.trim().length < 2 || userData.name.trim().length > 50) {
      errors.push('姓名长度应在2-50个字符之间')
    }
    
    // 邮箱格式验证
    if (!userData.email || userData.email.trim().length === 0) {
      errors.push('邮箱地址不能为空')
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('邮箱格式不正确')
    }
    // 注意：邮箱唯一性验证现在由服务端处理
    
    // 角色验证
    if (!userData.role) {
      errors.push('请选择用户角色')
    }
    
    // 状态验证
    if (!userData.status) {
      errors.push('请选择用户状态')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 验证用户数据并抛出错误（用于错误处理）
  async validateUserWithError(userData: CreateUserData | UpdateUserData): Promise<void> {
    const result = await this.validateUser(userData)
    if (!result.isValid) {
      throw createValidationError('用户数据验证失败', result.errors)
    }
  }

  // 验证邮箱格式
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  // 生成唯一ID
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }
}

// 导出单例实例
export const userService = UserService.getInstance()
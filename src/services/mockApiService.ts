import type { 
  ApiResponse, 
  UserQueryParams
} from '@/types/api'
import type { User, CreateUserData, UpdateUserData } from '@/types/user'
import { UserRole, UserStatus } from '@/types/user'
import type { 
  Brand, 
  CreateBrandDto, 
  UpdateBrandDto, 
  BrandQueryParams,
  BatchImportResult 
} from '@/types/brand'
import { BrandStatus } from '@/types/brand'
import { TestDataGenerator } from './testDataGenerator'
import { getAppConfig } from './configService'

/**
 * 模拟 API 服务接口
 */
export interface MockApiService {
  /** 初始化服务 */
  initialize(): void
  
  /** 用户管理端点 */
  handleGetUsers(params?: UserQueryParams): Promise<ApiResponse<User[]>>
  handleGetUserById(id: string): Promise<ApiResponse<User>>
  handleCreateUser(userData: CreateUserData): Promise<ApiResponse<User>>
  handleUpdateUser(id: string, userData: UpdateUserData): Promise<ApiResponse<User>>
  handleDeleteUser(id: string): Promise<ApiResponse<void>>
  
  /** 品牌管理端点 */
  handleGetBrands(params?: BrandQueryParams): Promise<ApiResponse<Brand[]>>
  handleGetBrandById(id: string): Promise<ApiResponse<Brand>>
  handleCreateBrand(brandData: CreateBrandDto): Promise<ApiResponse<Brand>>
  handleUpdateBrand(id: string, brandData: UpdateBrandDto): Promise<ApiResponse<Brand>>
  handleDeleteBrand(id: string): Promise<ApiResponse<void>>
  handleBatchCreateBrands(brandsData: CreateBrandDto[]): Promise<ApiResponse<BatchImportResult>>
  
  /** 数据管理 */
  loadTestData(): void
  saveToStorage(): void
  loadFromStorage(): void
  
  /** 清理资源 */
  cleanup(): void
}

/**
 * 模拟 API 服务实现类
 * 提供本地模拟 API 功能，支持用户和品牌 CRUD 操作
 */
export class MockApiServiceImpl implements MockApiService {
  private users: User[] = []
  private brands: Brand[] = []
  private readonly storageKey = 'mock_api_users'
  private readonly brandStorageKey = 'mock_api_brands'
  private initialized = false

  /**
   * 初始化服务
   * 加载测试数据或从 localStorage 恢复数据
   */
  public initialize(): void {
    if (this.initialized) {
      return
    }

    try {
      // 尝试从 localStorage 加载数据
      this.loadFromStorage()
      
      // 如果没有数据，生成测试数据
      if (this.users.length === 0) {
        this.loadTestData()
        this.saveToStorage()
      }
      
      this.initialized = true
      console.log(`[模拟 API] 服务已初始化，加载了 ${this.users.length} 个用户和 ${this.brands.length} 个品牌`)
    } catch (error) {
      console.error('[模拟 API] 初始化失败:', error)
      // 初始化失败时生成默认测试数据
      this.loadTestData()
      this.initialized = true
    }
  }

  /**
   * 加载测试数据
   */
  public loadTestData(): void {
    try {
      this.users = TestDataGenerator.generateDefaultUsers()
      this.brands = this.generateDefaultBrands()
      console.log(`[模拟 API] 已生成 ${this.users.length} 个测试用户和 ${this.brands.length} 个测试品牌`)
    } catch (error) {
      console.error('[模拟 API] 生成测试数据失败:', error)
      this.users = []
      this.brands = []
    }
  }

  /**
   * 保存数据到 localStorage
   */
  public saveToStorage(): void {
    try {
      const data = {
        users: this.users,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      
      const brandData = {
        brands: this.brands,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      localStorage.setItem(this.brandStorageKey, JSON.stringify(brandData))
    } catch (error) {
      console.error('[模拟 API] 保存数据到 localStorage 失败:', error)
    }
  }

  /**
   * 从 localStorage 加载数据
   */
  public loadFromStorage(): void {
    try {
      // 加载用户数据
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.users && Array.isArray(data.users)) {
          this.users = data.users
          console.log(`[模拟 API] 从 localStorage 加载了 ${this.users.length} 个用户`)
        }
      }
      
      // 加载品牌数据
      const brandStored = localStorage.getItem(this.brandStorageKey)
      if (brandStored) {
        const brandData = JSON.parse(brandStored)
        if (brandData.brands && Array.isArray(brandData.brands)) {
          this.brands = brandData.brands
          console.log(`[模拟 API] 从 localStorage 加载了 ${this.brands.length} 个品牌`)
        }
      }
    } catch (error) {
      console.error('[模拟 API] 从 localStorage 加载数据失败:', error)
      this.users = []
      this.brands = []
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.users = []
    this.brands = []
    this.initialized = false
  }

  /**
   * 模拟网络延迟
   */
  private async simulateDelay(_method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<void> {
    const config = getAppConfig()
    const delay = config.api.mockApiDelay
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  /**
   * 创建标准 API 响应
   */
  private createResponse<T>(
    data: T, 
    message: string = '操作成功', 
    success: boolean = true
  ): ApiResponse<T> {
    return {
      data,
      message,
      success,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(
    message: string, 
    errors: string[] = []
  ): never {
    const error = new Error(message) as any
    error.response = {
      data: {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString()
      },
      status: 400
    }
    throw error
  }

  /**
   * 验证用户数据（服务端验证）
   * 与客户端 UserService 的验证逻辑保持一致
   */
  private async validateUserData(userData: CreateUserData | UpdateUserData, excludeId?: string): Promise<string[]> {
    const errors: string[] = []

    // 验证姓名
    if ('name' in userData) {
      if (!userData.name || userData.name.trim().length === 0) {
        errors.push('用户姓名不能为空')
      } else if (userData.name.trim().length < 2) {
        errors.push('姓名长度应在2-50个字符之间')
      } else if (userData.name.trim().length > 50) {
        errors.push('姓名长度应在2-50个字符之间')
      }
    }

    // 验证邮箱
    if ('email' in userData) {
      if (!userData.email || userData.email.trim().length === 0) {
        errors.push('邮箱地址不能为空')
      } else {
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(userData.email.trim())) {
          errors.push('邮箱格式不正确')
        } else {
          // 邮箱唯一性验证
          if (!this.checkEmailUniqueness(userData.email, excludeId)) {
            errors.push('邮箱已存在')
          }
        }
      }
    }

    // 验证角色
    if ('role' in userData) {
      if (!userData.role) {
        errors.push('请选择用户角色')
      } else if (!Object.values(UserRole).includes(userData.role)) {
        errors.push('无效的用户角色')
      }
    }

    // 验证状态
    if ('status' in userData) {
      if (!userData.status) {
        errors.push('请选择用户状态')
      } else if (!Object.values(UserStatus).includes(userData.status)) {
        errors.push('无效的用户状态')
      }
    }

    return errors
  }

  /**
   * 检查邮箱唯一性
   */
  private checkEmailUniqueness(email: string, excludeId?: string): boolean {
    return !this.users.some(user => 
      user.email === email && user.id !== excludeId
    )
  }

  /**
   * 生成新的用户ID
   */
  private generateUserId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  /**
   * 过滤用户列表
   */
  private filterUsers(users: User[], params?: UserQueryParams): User[] {
    if (!params) {
      return users
    }

    let filtered = users

    // 按搜索关键词过滤
    if (params.search) {
      const searchTerm = params.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
    }

    // 按角色过滤
    if (params.role) {
      filtered = filtered.filter(user => user.role === params.role)
    }

    // 按状态过滤
    if (params.status) {
      filtered = filtered.filter(user => user.status === params.status)
    }

    return filtered
  }

  /**
   * 分页处理
   */
  private paginateUsers(users: User[], params?: UserQueryParams): User[] {
    if (!params || (!params.page && !params.pageSize)) {
      return users
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return users.slice(startIndex, endIndex)
  }

  // ==================== 品牌相关辅助方法 ====================

  /**
   * 生成默认测试品牌数据
   */
  private generateDefaultBrands(): Brand[] {
    const brandNames = [
      '华为', '小米', '苹果', '三星', '联想',
      '戴尔', '惠普', '索尼', '松下', '东芝',
      '海尔', '格力', '美的', 'TCL', '创维',
      '长虹', '康佳', '海信', '方太', '老板'
    ]

    const operators = ['系统管理员', '张伟', '李娜', '王强', '刘芳']
    const brands: Brand[] = []
    const now = new Date()

    for (let i = 0; i < brandNames.length; i++) {
      const name = brandNames[i]
      const code = this.generateBrandCode(name, i)
      const status = i % 3 === 0 ? BrandStatus.Inactive : BrandStatus.Active
      const operator = operators[i % operators.length]
      
      // 生成创建时间（过去30天内的随机时间）
      const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      // 更新时间在创建时间之后
      const updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()))

      brands.push({
        id: this.generateBrandId(),
        name,
        code,
        status,
        operator,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      })
    }

    return brands
  }

  /**
   * 生成品牌编码
   */
  private generateBrandCode(name: string, index: number): string {
    // 品牌名称到编码的映射
    const codeMap: Record<string, string> = {
      '华为': 'HUAWEI',
      '小米': 'XIAOMI',
      '苹果': 'APPLE',
      '三星': 'SAMSUNG',
      '联想': 'LENOVO',
      '戴尔': 'DELL',
      '惠普': 'HP',
      '索尼': 'SONY',
      '松下': 'PANASONIC',
      '东芝': 'TOSHIBA',
      '海尔': 'HAIER',
      '格力': 'GREE',
      '美的': 'MIDEA',
      'TCL': 'TCL',
      '创维': 'SKYWORTH',
      '长虹': 'CHANGHONG',
      '康佳': 'KONKA',
      '海信': 'HISENSE',
      '方太': 'FOTILE',
      '老板': 'ROBAM'
    }

    return codeMap[name] || `BRAND_${String(index + 1).padStart(2, '0')}`
  }

  /**
   * 生成新的品牌ID
   */
  private generateBrandId(): string {
    return 'brand_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  /**
   * 验证品牌数据（服务端验证）
   */
  private async validateBrandData(brandData: CreateBrandDto | UpdateBrandDto, excludeId?: string): Promise<string[]> {
    const errors: string[] = []

    // 验证品牌名称
    if ('name' in brandData) {
      if (!brandData.name || brandData.name.trim().length === 0) {
        errors.push('品牌名称不能为空')
      } else if (brandData.name.trim().length < 1) {
        errors.push('品牌名称长度应在1-50个字符之间')
      } else if (brandData.name.trim().length > 50) {
        errors.push('品牌名称长度应在1-50个字符之间')
      }
    }

    // 验证品牌编码
    if ('code' in brandData) {
      if (!brandData.code || brandData.code.trim().length === 0) {
        errors.push('品牌编码不能为空')
      } else {
        const code = brandData.code.trim()
        
        // 编码格式验证：只能包含大写字母、数字、下划线和连字符
        const codeRegex = /^[A-Z0-9_-]+$/
        if (!codeRegex.test(code)) {
          errors.push('品牌编码只能包含大写字母、数字、下划线和连字符')
        }
        
        // 编码长度验证
        if (code.length < 2 || code.length > 20) {
          errors.push('品牌编码长度应在2-20个字符之间')
        }
        
        // 编码唯一性验证
        if (!this.checkBrandCodeUniqueness(code, excludeId)) {
          errors.push('品牌编码已存在')
        }
      }
    }

    // 验证品牌状态
    if ('status' in brandData) {
      if (!brandData.status) {
        errors.push('请选择品牌状态')
      } else if (!Object.values(BrandStatus).includes(brandData.status)) {
        errors.push('无效的品牌状态')
      }
    }

    return errors
  }

  /**
   * 检查品牌编码唯一性
   */
  private checkBrandCodeUniqueness(code: string, excludeId?: string): boolean {
    return !this.brands.some(brand => 
      brand.code === code && brand.id !== excludeId
    )
  }

  /**
   * 过滤品牌列表
   */
  private filterBrands(brands: Brand[], params?: BrandQueryParams): Brand[] {
    if (!params) {
      return brands
    }

    let filtered = brands

    // 按搜索关键词过滤
    if (params.search) {
      const searchTerm = params.search.toLowerCase()
      filtered = filtered.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm) ||
        brand.code.toLowerCase().includes(searchTerm)
      )
    }

    // 按状态过滤
    if (params.status) {
      filtered = filtered.filter(brand => brand.status === params.status)
    }

    return filtered
  }

  /**
   * 分页处理品牌列表
   */
  private paginateBrands(brands: Brand[], params?: BrandQueryParams): Brand[] {
    if (!params || (!params.page && !params.pageSize)) {
      return brands
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    return brands.slice(startIndex, endIndex)
  }

  // ==================== API 端点实现 ====================

  /**
   * 获取用户列表
   * GET /api/users
   */
  public async handleGetUsers(params?: UserQueryParams): Promise<ApiResponse<User[]>> {
    await this.simulateDelay('GET')

    if (!this.initialized) {
      this.initialize()
    }

    try {
      // 过滤用户
      const filteredUsers = this.filterUsers(this.users, params)
      
      // 分页处理
      const paginatedUsers = this.paginateUsers(filteredUsers, params)

      return this.createResponse(
        paginatedUsers,
        `成功获取 ${paginatedUsers.length} 个用户`
      )
    } catch (error) {
      console.error('[模拟 API] 获取用户列表失败:', error)
      this.createErrorResponse('获取用户列表失败')
    }
  }

  /**
   * 根据ID获取用户
   * GET /api/users/:id
   */
  public async handleGetUserById(id: string): Promise<ApiResponse<User>> {
    await this.simulateDelay('GET')

    if (!this.initialized) {
      this.initialize()
    }

    if (!id || id.trim().length === 0) {
      this.createErrorResponse('用户ID不能为空')
    }

    const user = this.users.find(u => u.id === id)
    if (!user) {
      const error = new Error('用户不存在') as any
      error.response = {
        data: {
          success: false,
          message: '用户不存在',
          errors: ['指定的用户ID不存在'],
          timestamp: new Date().toISOString()
        },
        status: 404
      }
      throw error
    }

    return this.createResponse(user, '成功获取用户信息')
  }

  /**
   * 创建新用户
   * POST /api/users
   */
  public async handleCreateUser(userData: CreateUserData): Promise<ApiResponse<User>> {
    await this.simulateDelay('POST')

    if (!this.initialized) {
      this.initialize()
    }

    // 服务端验证用户数据（与客户端验证逻辑保持一致）
    const validationErrors = await this.validateUserData(userData)
    if (validationErrors.length > 0) {
      const error = new Error('数据验证失败') as any
      error.response = {
        data: {
          success: false,
          message: '数据验证失败',
          errors: validationErrors,
          timestamp: new Date().toISOString()
        },
        status: 422
      }
      throw error
    }

    // 创建新用户
    const now = new Date().toISOString()
    const newUser: User = {
      id: this.generateUserId(),
      name: userData.name.trim(),
      email: userData.email.trim(),
      role: userData.role,
      status: userData.status,
      createdAt: now,
      updatedAt: now
    }

    // 添加到用户列表
    this.users.push(newUser)
    
    // 保存到 localStorage
    this.saveToStorage()

    return this.createResponse(newUser, '用户创建成功')
  }

  /**
   * 更新用户信息
   * PUT /api/users/:id
   */
  public async handleUpdateUser(id: string, userData: UpdateUserData): Promise<ApiResponse<User>> {
    await this.simulateDelay('PUT')

    if (!this.initialized) {
      this.initialize()
    }

    if (!id || id.trim().length === 0) {
      this.createErrorResponse('用户ID不能为空')
    }

    // 查找用户
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      const error = new Error('用户不存在') as any
      error.response = {
        data: {
          success: false,
          message: '用户不存在',
          errors: ['指定的用户ID不存在'],
          timestamp: new Date().toISOString()
        },
        status: 404
      }
      throw error
    }

    // 服务端验证更新数据（与客户端验证逻辑保持一致）
    const validationErrors = await this.validateUserData(userData, id)
    if (validationErrors.length > 0) {
      const error = new Error('数据验证失败') as any
      error.response = {
        data: {
          success: false,
          message: '数据验证失败',
          errors: validationErrors,
          timestamp: new Date().toISOString()
        },
        status: 422
      }
      throw error
    }

    // 更新用户信息
    const existingUser = this.users[userIndex]
    const updatedUser: User = {
      ...existingUser,
      ...(userData.name && { name: userData.name.trim() }),
      ...(userData.email && { email: userData.email.trim() }),
      ...(userData.role && { role: userData.role }),
      ...(userData.status && { status: userData.status }),
      updatedAt: new Date().toISOString()
    }

    this.users[userIndex] = updatedUser
    
    // 保存到 localStorage
    this.saveToStorage()

    return this.createResponse(updatedUser, '用户信息更新成功')
  }

  /**
   * 删除用户
   * DELETE /api/users/:id
   */
  public async handleDeleteUser(id: string): Promise<ApiResponse<void>> {
    await this.simulateDelay('DELETE')

    if (!this.initialized) {
      this.initialize()
    }

    if (!id || id.trim().length === 0) {
      this.createErrorResponse('用户ID不能为空')
    }

    // 查找用户
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      const error = new Error('用户不存在') as any
      error.response = {
        data: {
          success: false,
          message: '用户不存在',
          errors: ['指定的用户ID不存在'],
          timestamp: new Date().toISOString()
        },
        status: 404
      }
      throw error
    }

    // 删除用户
    this.users.splice(userIndex, 1)
    
    // 保存到 localStorage
    this.saveToStorage()

    return this.createResponse(undefined as any, '用户删除成功')
  }

  // ==================== 品牌管理端点实现 ====================

  /**
   * 获取品牌列表
   * GET /api/brands
   */
  public async handleGetBrands(params?: BrandQueryParams): Promise<ApiResponse<Brand[]>> {
    await this.simulateDelay('GET')

    if (!this.initialized) {
      this.initialize()
    }

    try {
      // 过滤品牌
      const filteredBrands = this.filterBrands(this.brands, params)
      
      // 分页处理
      const paginatedBrands = this.paginateBrands(filteredBrands, params)

      return this.createResponse(
        paginatedBrands,
        `成功获取 ${paginatedBrands.length} 个品牌`
      )
    } catch (error) {
      console.error('[模拟 API] 获取品牌列表失败:', error)
      this.createErrorResponse('获取品牌列表失败')
    }
  }

  /**
   * 根据ID获取品牌
   * GET /api/brands/:id
   */
  public async handleGetBrandById(id: string): Promise<ApiResponse<Brand>> {
    await this.simulateDelay('GET')

    if (!this.initialized) {
      this.initialize()
    }

    if (!id || id.trim().length === 0) {
      this.createErrorResponse('品牌ID不能为空')
    }

    const brand = this.brands.find(b => b.id === id)
    if (!brand) {
      const error = new Error('品牌不存在') as any
      error.response = {
        data: {
          success: false,
          message: '品牌不存在',
          errors: ['指定的品牌ID不存在'],
          timestamp: new Date().toISOString()
        },
        status: 404
      }
      throw error
    }

    return this.createResponse(brand, '成功获取品牌信息')
  }

  /**
   * 创建新品牌
   * POST /api/brands
   */
  public async handleCreateBrand(brandData: CreateBrandDto): Promise<ApiResponse<Brand>> {
    await this.simulateDelay('POST')

    if (!this.initialized) {
      this.initialize()
    }

    // 服务端验证品牌数据
    const validationErrors = await this.validateBrandData(brandData)
    if (validationErrors.length > 0) {
      const error = new Error('数据验证失败') as any
      error.response = {
        data: {
          success: false,
          message: '数据验证失败',
          errors: validationErrors,
          timestamp: new Date().toISOString()
        },
        status: 422
      }
      throw error
    }

    // 创建新品牌
    const now = new Date().toISOString()
    const newBrand: Brand = {
      id: this.generateBrandId(),
      name: brandData.name.trim(),
      code: brandData.code.trim(),
      status: brandData.status,
      operator: '系统管理员', // 实际应用中应该从当前登录用户获取
      createdAt: now,
      updatedAt: now
    }

    // 添加到品牌列表
    this.brands.push(newBrand)
    
    // 保存到 localStorage
    this.saveToStorage()

    return this.createResponse(newBrand, '品牌创建成功')
  }

  /**
   * 更新品牌信息
   * PUT /api/brands/:id
   */
  public async handleUpdateBrand(id: string, brandData: UpdateBrandDto): Promise<ApiResponse<Brand>> {
    await this.simulateDelay('PUT')

    if (!this.initialized) {
      this.initialize()
    }

    if (!id || id.trim().length === 0) {
      this.createErrorResponse('品牌ID不能为空')
    }

    // 查找品牌
    const brandIndex = this.brands.findIndex(b => b.id === id)
    if (brandIndex === -1) {
      const error = new Error('品牌不存在') as any
      error.response = {
        data: {
          success: false,
          message: '品牌不存在',
          errors: ['指定的品牌ID不存在'],
          timestamp: new Date().toISOString()
        },
        status: 404
      }
      throw error
    }

    // 服务端验证更新数据
    const validationErrors = await this.validateBrandData(brandData, id)
    if (validationErrors.length > 0) {
      const error = new Error('数据验证失败') as any
      error.response = {
        data: {
          success: false,
          message: '数据验证失败',
          errors: validationErrors,
          timestamp: new Date().toISOString()
        },
        status: 422
      }
      throw error
    }

    // 更新品牌信息
    const existingBrand = this.brands[brandIndex]
    const updatedBrand: Brand = {
      ...existingBrand,
      ...(brandData.name && { name: brandData.name.trim() }),
      ...(brandData.code && { code: brandData.code.trim() }),
      ...(brandData.status && { status: brandData.status }),
      operator: '系统管理员', // 实际应用中应该从当前登录用户获取
      updatedAt: new Date().toISOString()
    }

    this.brands[brandIndex] = updatedBrand
    
    // 保存到 localStorage
    this.saveToStorage()

    return this.createResponse(updatedBrand, '品牌信息更新成功')
  }

  /**
   * 删除品牌
   * DELETE /api/brands/:id
   */
  public async handleDeleteBrand(id: string): Promise<ApiResponse<void>> {
    await this.simulateDelay('DELETE')

    if (!this.initialized) {
      this.initialize()
    }

    if (!id || id.trim().length === 0) {
      this.createErrorResponse('品牌ID不能为空')
    }

    // 查找品牌
    const brandIndex = this.brands.findIndex(b => b.id === id)
    if (brandIndex === -1) {
      const error = new Error('品牌不存在') as any
      error.response = {
        data: {
          success: false,
          message: '品牌不存在',
          errors: ['指定的品牌ID不存在'],
          timestamp: new Date().toISOString()
        },
        status: 404
      }
      throw error
    }

    // 删除品牌
    this.brands.splice(brandIndex, 1)
    
    // 保存到 localStorage
    this.saveToStorage()

    return this.createResponse(undefined as any, '品牌删除成功')
  }

  /**
   * 批量创建品牌
   * POST /api/brands/batch
   */
  public async handleBatchCreateBrands(brandsData: CreateBrandDto[]): Promise<ApiResponse<BatchImportResult>> {
    await this.simulateDelay('POST')

    if (!this.initialized) {
      this.initialize()
    }

    const result: BatchImportResult = {
      total: brandsData.length,
      success: 0,
      failed: 0,
      errors: []
    }

    // 逐个验证和创建品牌
    for (let i = 0; i < brandsData.length; i++) {
      const brandData = brandsData[i]
      const rowNumber = i + 2 // Excel 行号从2开始（第1行是标题）

      try {
        // 验证品牌数据
        const validationErrors = await this.validateBrandData(brandData)
        if (validationErrors.length > 0) {
          result.failed++
          validationErrors.forEach(error => {
            result.errors.push({
              row: rowNumber,
              message: error,
              data: brandData
            })
          })
          continue
        }

        // 创建品牌
        const now = new Date().toISOString()
        const newBrand: Brand = {
          id: this.generateBrandId(),
          name: brandData.name.trim(),
          code: brandData.code.trim(),
          status: brandData.status,
          operator: '系统管理员',
          createdAt: now,
          updatedAt: now
        }

        this.brands.push(newBrand)
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : '未知错误',
          data: brandData
        })
      }
    }

    // 保存到 localStorage
    if (result.success > 0) {
      this.saveToStorage()
    }

    const message = `批量导入完成：成功 ${result.success} 个，失败 ${result.failed} 个`
    return this.createResponse(result, message)
  }
}

// 单例实例
let mockApiServiceInstance: MockApiServiceImpl | null = null

/**
 * 获取模拟 API 服务实例（单例模式）
 */
export const getMockApiService = (): MockApiServiceImpl => {
  if (!mockApiServiceInstance) {
    mockApiServiceInstance = new MockApiServiceImpl()
  }
  return mockApiServiceInstance
}

/**
 * 初始化模拟 API 服务
 * 应用启动时调用
 */
export const initializeMockApiService = (): void => {
  const service = getMockApiService()
  service.initialize()
}

/**
 * 清理模拟 API 服务
 * 应用关闭时调用
 */
export const cleanupMockApiService = (): void => {
  if (mockApiServiceInstance) {
    mockApiServiceInstance.cleanup()
    mockApiServiceInstance = null
  }
}

// 导出默认实例
export const mockApiService = getMockApiService()
/**
 * 品牌管理相关的类型定义
 * 
 * 本文件包含品牌实体、DTO、查询参数、验证结果等类型定义
 */

/**
 * 品牌状态枚举
 */
export enum BrandStatus {
  /** 有效状态 */
  Active = 'active',
  /** 无效状态 */
  Inactive = 'inactive'
}

/**
 * 品牌实体接口
 * 
 * 表示系统中的品牌数据模型
 */
export interface Brand {
  /** 品牌唯一标识符（UUID） */
  id: string
  /** 品牌名称（1-50 字符） */
  name: string
  /** 品牌编码（唯一，2-20 字符，大写字母、数字、下划线、连字符） */
  code: string
  /** 品牌状态 */
  status: BrandStatus
  /** 操作人 */
  operator: string
  /** 创建时间（ISO 8601 格式） */
  createdAt: string
  /** 更新时间（ISO 8601 格式） */
  updatedAt: string
}

/**
 * 创建品牌 DTO（数据传输对象）
 * 
 * 用于创建新品牌时传递的数据
 */
export interface CreateBrandDto {
  /** 品牌名称（必填，1-50 字符） */
  name: string
  /** 品牌编码（必填，2-20 字符，大写字母、数字、下划线、连字符） */
  code: string
  /** 品牌状态（必填） */
  status: BrandStatus
}

/**
 * 更新品牌 DTO（数据传输对象）
 * 
 * 用于更新现有品牌时传递的数据，所有字段都是可选的
 */
export interface UpdateBrandDto {
  /** 品牌名称（可选） */
  name?: string
  /** 品牌编码（可选） */
  code?: string
  /** 品牌状态（可选） */
  status?: BrandStatus
}

/**
 * 品牌查询参数接口
 * 
 * 用于查询品牌列表时的筛选和分页参数
 */
export interface BrandQueryParams {
  /** 搜索关键词（品牌名称或编码） */
  search?: string
  /** 状态筛选 */
  status?: BrandStatus
  /** 页码（默认 1） */
  page?: number
  /** 每页数量（默认 10） */
  pageSize?: number
}

/**
 * 导入错误详情接口
 * 
 * 描述批量导入时单个数据项的错误信息
 */
export interface ImportError {
  /** 行号（从 1 开始） */
  row: number
  /** 字段名（可选） */
  field?: string
  /** 错误消息 */
  message: string
  /** 原始数据（可选） */
  data?: any
}

/**
 * 批量导入结果接口
 * 
 * 描述批量导入操作的统计结果
 */
export interface BatchImportResult {
  /** 总数 */
  total: number
  /** 成功数量 */
  success: number
  /** 失败数量 */
  failed: number
  /** 错误详情列表 */
  errors: ImportError[]
}

/**
 * 验证错误接口
 * 
 * 描述单个字段的验证错误
 */
export interface ValidationError {
  /** 字段名 */
  field: string
  /** 错误消息 */
  message: string
}

/**
 * 验证结果接口
 * 
 * 描述数据验证的结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors: ValidationError[]
}

/**
 * 解析结果接口（泛型）
 * 
 * 描述文件解析操作的结果
 * @template T 解析后的数据类型
 */
export interface ParseResult<T> {
  /** 是否成功 */
  success: boolean
  /** 解析的数据（成功时） */
  data?: T
  /** 错误消息列表（失败时） */
  errors?: string[]
}

/**
 * 操作结果接口
 * 
 * 描述通用操作的结果
 */
export interface OperationResult {
  /** 是否成功 */
  success: boolean
  /** 消息（可选） */
  message?: string
  /** 错误信息（可选） */
  error?: string
  /** 返回数据（可选） */
  data?: any
}

/**
 * Excel 模板行接口
 * 
 * 描述 Excel 导入模板的行数据结构
 */
export interface ExcelTemplateRow {
  /** 品牌名称 */
  '品牌名称': string
  /** 品牌编码 */
  '品牌编码': string
  /** 品牌状态（"有效" 或 "无效"） */
  '品牌状态': '有效' | '无效'
}

/**
 * 品牌筛选器接口
 * 
 * 用于前端筛选品牌列表的参数
 */
export interface BrandFilters {
  /** 搜索关键词 */
  search?: string
  /** 状态筛选 */
  status?: BrandStatus
}

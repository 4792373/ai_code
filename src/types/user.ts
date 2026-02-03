// User data interfaces and enums
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

export interface CreateUserData {
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string
}

export interface UserFilters {
  role?: string
  status?: string
}

/**
 * 批量删除请求体
 */
export interface BatchDeleteRequest {
  userIds: string[]
}

/**
 * 批量删除响应
 */
export interface BatchDeleteResponse {
  deletedCount: number
  failedIds?: string[]  // 删除失败的用户 ID（可选）
  errors?: string[]     // 错误详情（可选）
}

/**
 * 行选择配置
 */
export interface RowSelectionConfig {
  selectedRowKeys: string[]
  onChange: (selectedRowKeys: string[]) => void
  getCheckboxProps?: (record: User) => {
    disabled: boolean
    name: string
  }
}
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
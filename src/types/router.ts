/**
 * 路由相关类型定义
 */

import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由元信息接口
 */
export interface RouteMeta {
  /** 页面标题 */
  title: string
  /** 是否需要认证（预留） */
  requiresAuth?: boolean
  /** 图标名称（用于菜单） */
  icon?: string
  /** 是否在菜单中隐藏 */
  hideInMenu?: boolean
}

/**
 * 扩展的路由记录类型
 * 
 * 注意：由于 TypeScript 的类型兼容性问题，我们直接使用 RouteRecordRaw
 * 并通过类型断言来使用自定义的 RouteMeta
 */
export type AppRouteRecordRaw = RouteRecordRaw

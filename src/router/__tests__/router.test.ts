/**
 * 路由配置测试
 */

import { describe, it, expect } from 'vitest'
import router from '../index'

describe('路由配置', () => {
  it('应该包含品牌管理路由', () => {
    const routes = router.getRoutes()
    const brandsRoute = routes.find(route => route.name === 'brands')
    
    expect(brandsRoute).toBeDefined()
    expect(brandsRoute?.path).toBe('/brands')
    expect(brandsRoute?.meta?.title).toBe('品牌管理')
    expect(brandsRoute?.meta?.icon).toBe('tag')
  })

  it('应该包含用户管理路由', () => {
    const routes = router.getRoutes()
    const usersRoute = routes.find(route => route.name === 'users')
    
    expect(usersRoute).toBeDefined()
    expect(usersRoute?.path).toBe('/users')
  })

  it('应该包含首页路由', () => {
    const routes = router.getRoutes()
    const homeRoute = routes.find(route => route.name === 'home')
    
    expect(homeRoute).toBeDefined()
    expect(homeRoute?.path).toBe('/')
  })

  it('应该包含 404 路由', () => {
    const routes = router.getRoutes()
    const notFoundRoute = routes.find(route => route.name === 'not-found')
    
    expect(notFoundRoute).toBeDefined()
  })
})

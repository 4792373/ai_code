/**
 * Vue Router 配置
 * 
 * 本文件定义了应用的路由结构和导航守卫
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { AppRouteRecordRaw } from '@/types/router'

/**
 * 路由配置数组
 * 
 * 定义应用的完整路由结构
 * 
 * 如何添加新路由：
 * 1. 在 views 目录下创建新的视图组件
 * 2. 在此数组中添加路由配置对象
 * 3. 配置 path（路径）、name（名称）、component（组件）
 * 4. 添加 meta 信息（title、icon 等）
 * 5. 使用懒加载方式导入组件：() => import('@/views/YourView.vue')
 */
const routes: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/Home.vue'),
        meta: {
          title: '首页',
          icon: 'home'
        }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/Users.vue'),
        meta: {
          title: '用户管理',
          icon: 'user'
        }
      },
      {
        path: 'brands',
        name: 'brands',
        component: () => import('@/views/Brands.vue'),
        meta: {
          title: '品牌管理',
          icon: 'tag'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

/**
 * 创建路由器实例
 * 
 * 使用 HTML5 History 模式，提供更友好的 URL
 * 注意：部署时需要配置服务器将所有请求重定向到 index.html
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

/**
 * 全局前置守卫
 * 
 * 在每次路由切换前执行以下操作：
 * 1. 更新浏览器标签页标题
 * 2. 记录导航日志（仅开发环境）
 * 3. 允许所有导航继续（当前无权限控制需求）
 */
router.beforeEach((to, from, next) => {
  try {
    // 更新页面标题
    const title = to.meta?.title as string | undefined
    if (title) {
      document.title = `${title} - 用户管理系统`
    }
    
    // 开发环境记录导航日志
    if (import.meta.env.DEV) {
      console.log(`[Router] 导航: ${from.path} → ${to.path}`)
    }
    
    // 允许导航继续
    next()
  } catch (error) {
    // 捕获守卫中的错误，确保不影响导航
    console.error('[Router] 导航守卫错误:', error)
    // 即使出错也允许导航继续
    next()
  }
})

/**
 * 路由错误处理器
 * 
 * 处理路由相关的错误，如组件加载失败
 */
router.onError((error) => {
  console.error('[Router] 路由错误:', error)
  
  // 组件加载失败（通常是网络问题或文件不存在）
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.error('[Router] 组件加载失败，可能是网络问题或文件不存在')
  }
})

export default router

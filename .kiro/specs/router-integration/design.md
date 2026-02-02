# 设计文档 - 路由集成

## 概述

本设计文档描述了如何在现有的 Vue 3 + TypeScript 用户管理系统中集成 Vue Router，实现基于路由的页面导航功能。设计目标是在保持现有功能完整性的前提下，引入路由系统，并为未来扩展更多页面奠定基础。

### 设计目标

1. **无缝集成**：在不破坏现有功能的前提下引入路由系统
2. **可扩展性**：提供清晰的路由结构，便于未来添加新页面
3. **用户体验**：提供流畅的页面导航和响应式布局
4. **类型安全**：使用 TypeScript 确保路由配置的类型安全
5. **性能优化**：使用路由懒加载减少初始加载时间

### 技术选型

- **Vue Router 4.x**：Vue 3 官方路由库，支持 Composition API
- **History 模式**：使用 HTML5 History API，提供更友好的 URL
- **懒加载**：使用动态 import 实现路由组件的按需加载
- **Ant Design Vue Menu**：使用 AntD 的 Menu 组件实现导航菜单

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                        App.vue                          │
│                    (根组件)                              │
│                   <RouterView />                        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ├─────────────────────────────────┐
                         │                                 │
                    ┌────▼─────┐                     ┌────▼─────┐
                    │  Layout  │                     │ NotFound │
                    │  (布局)   │                     │  (404)   │
                    └────┬─────┘                     └──────────┘
                         │
                         │ <RouterView />
                         │
                ┌────────┴────────┐
                │                 │
           ┌────▼─────┐    ┌─────▼──────────┐
           │   Home   │    │ UserManagement │
           │  (首页)   │    │  (用户管理)     │
           └──────────┘    └────────────────┘
```

### 路由层次结构

```
/                           → Layout → Home
/users                      → Layout → UserManagement
/:pathMatch(.*)*           → NotFound
```

### 数据流

```
用户点击导航 → RouterLink → Vue Router → 路由守卫 → 组件渲染
                                            ↓
                                      更新页面标题
                                      记录导航日志
```

## 组件和接口

### 1. 路由配置 (router/index.ts)

#### 路由配置接口

```typescript
import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由元信息接口
 */
interface RouteMeta {
  /** 页面标题 */
  title: string
  /** 是否需要认证（预留） */
  requiresAuth?: boolean
  /** 图标名称（用于菜单） */
  icon?: string
}

/**
 * 扩展的路由记录类型
 */
interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'meta'> {
  meta?: RouteMeta
}
```

#### 路由配置数组

```typescript
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
```

#### 路由器实例创建

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 更新页面标题
  const title = to.meta?.title as string | undefined
  if (title) {
    document.title = `${title} - 用户管理系统`
  }
  
  // 开发环境记录导航日志
  if (import.meta.env.DEV) {
    console.log(`[Router] 导航: ${from.path} → ${to.path}`)
  }
  
  next()
})

export default router
```

### 2. 主布局组件 (layouts/MainLayout.vue)

#### 组件结构

```vue
<template>
  <a-layout class="main-layout">
    <!-- 顶部导航栏 -->
    <a-layout-header class="header">
      <div class="logo">用户管理系统</div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="horizontal"
        theme="dark"
        class="header-menu"
      >
        <a-menu-item key="home">
          <router-link to="/">
            <HomeOutlined />
            <span>首页</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="users">
          <router-link to="/users">
            <UserOutlined />
            <span>用户管理</span>
          </router-link>
        </a-menu-item>
      </a-menu>
    </a-layout-header>

    <!-- 内容区域 -->
    <a-layout-content class="content">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { HomeOutlined, UserOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const selectedKeys = ref<string[]>([])

// 根据当前路由更新选中的菜单项
watch(
  () => route.path,
  (path) => {
    if (path === '/') {
      selectedKeys.value = ['home']
    } else if (path.startsWith('/users')) {
      selectedKeys.value = ['users']
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #001529;
}

.logo {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
  white-space: nowrap;
}

.header-menu {
  flex: 1;
  border-bottom: none;
}

.content {
  padding: 24px;
  background: #f0f2f5;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
  padding: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }
  
  .logo {
    font-size: 16px;
    margin-right: 20px;
  }
  
  .content {
    padding: 16px;
  }
  
  .content-wrapper {
    padding: 16px;
  }
}
</style>
```

### 3. 首页组件 (views/Home.vue)

```vue
<template>
  <div class="home">
    <a-card class="welcome-card">
      <template #title>
        <h1 class="welcome-title">
          <SmileOutlined />
          欢迎使用用户管理系统
        </h1>
      </template>
      
      <div class="welcome-content">
        <p class="description">
          这是一个现代化的用户账户管理系统，提供完整的用户 CRUD 操作、搜索筛选、API 集成和数据持久化功能。
        </p>
        
        <a-divider />
        
        <h3>快速开始</h3>
        <a-space direction="vertical" size="large" style="width: 100%">
          <a-card hoverable class="feature-card">
            <router-link to="/users" class="feature-link">
              <UserOutlined class="feature-icon" />
              <div class="feature-info">
                <h4>用户管理</h4>
                <p>查看、创建、编辑和删除用户账户</p>
              </div>
              <RightOutlined class="arrow-icon" />
            </router-link>
          </a-card>
        </a-space>
        
        <a-divider />
        
        <h3>系统特性</h3>
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" :md="8">
            <a-card size="small">
              <template #title>
                <CheckCircleOutlined style="color: #52c41a" />
                完整的 CRUD 操作
              </template>
              支持用户的创建、读取、更新和删除
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-card size="small">
              <template #title>
                <SearchOutlined style="color: #1890ff" />
                搜索和筛选
              </template>
              按姓名、邮箱、角色和状态筛选用户
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-card size="small">
              <template #title>
                <ApiOutlined style="color: #722ed1" />
                API 集成
              </template>
              基于 Axios 的 HTTP 客户端和模拟 API
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-card size="small">
              <template #title>
                <SaveOutlined style="color: #fa8c16" />
                数据持久化
              </template>
              自动保存数据到 localStorage
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-card size="small">
              <template #title>
                <MobileOutlined style="color: #eb2f96" />
                响应式设计
              </template>
              支持移动端和桌面端访问
            </a-card>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8">
            <a-card size="small">
              <template #title>
                <SafetyOutlined style="color: #13c2c2" />
                错误处理
              </template>
              完善的错误处理和重试机制
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import {
  SmileOutlined,
  UserOutlined,
  RightOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ApiOutlined,
  SaveOutlined,
  MobileOutlined,
  SafetyOutlined
} from '@ant-design/icons-vue'
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  font-size: 28px;
  margin: 0;
  color: #1890ff;
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome-content {
  font-size: 16px;
}

.description {
  font-size: 16px;
  line-height: 1.8;
  color: #595959;
  margin-bottom: 24px;
}

.feature-card {
  border: 1px solid #d9d9d9;
  transition: all 0.3s;
}

.feature-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.feature-link {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: inherit;
}

.feature-icon {
  font-size: 32px;
  color: #1890ff;
}

.feature-info {
  flex: 1;
}

.feature-info h4 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #262626;
}

.feature-info p {
  margin: 0;
  color: #8c8c8c;
}

.arrow-icon {
  font-size: 16px;
  color: #bfbfbf;
  transition: transform 0.3s;
}

.feature-card:hover .arrow-icon {
  transform: translateX(4px);
  color: #1890ff;
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 22px;
  }
  
  .description {
    font-size: 14px;
  }
  
  .feature-icon {
    font-size: 24px;
  }
  
  .feature-info h4 {
    font-size: 16px;
  }
}
</style>
```

### 4. 用户管理视图 (views/Users.vue)

这是一个简单的包装组件，用于在路由系统中渲染现有的 UserManagement 组件：

```vue
<template>
  <div class="users-view">
    <UserManagement />
  </div>
</template>

<script setup lang="ts">
import UserManagement from '@/components/UserManagement.vue'
</script>

<style scoped>
.users-view {
  /* 可以添加额外的视图级样式 */
}
</style>
```

### 5. 404 页面组件 (views/NotFound.vue)

```vue
<template>
  <div class="not-found">
    <a-result
      status="404"
      title="404"
      sub-title="抱歉，您访问的页面不存在"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="goHome">
            <HomeOutlined />
            返回首页
          </a-button>
          <a-button @click="goBack">
            <RollbackOutlined />
            返回上一页
          </a-button>
        </a-space>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeOutlined, RollbackOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
```

### 6. 更新 App.vue

```vue
<template>
  <router-view />
</template>

<script setup lang="ts">
// App.vue 现在只需要渲染 RouterView
// 所有布局和导航逻辑都在 MainLayout 中
</script>

<style>
/* 全局样式保持不变 */
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
```

### 7. 更新 main.ts

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import router from './router'  // 导入路由器
import App from './App.vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)

app.use(createPinia())
app.use(Antd)
app.use(router)  // 注册路由器

app.mount('#app')
```

## 数据模型

### 路由元信息类型

```typescript
/**
 * 路由元信息接口
 */
interface RouteMeta {
  /** 页面标题 */
  title: string
  /** 是否需要认证（预留） */
  requiresAuth?: boolean
  /** 图标名称（用于菜单） */
  icon?: string
  /** 是否在菜单中隐藏 */
  hideInMenu?: boolean
}
```

### 菜单项类型

```typescript
/**
 * 菜单项接口
 */
interface MenuItem {
  /** 菜单项唯一标识 */
  key: string
  /** 菜单项标题 */
  title: string
  /** 路由路径 */
  path: string
  /** 图标组件 */
  icon?: Component
  /** 子菜单项 */
  children?: MenuItem[]
}
```

## 目录结构变化

```
src/
├── router/                 # 新增：路由配置
│   └── index.ts           # 路由器实例和配置
├── layouts/               # 新增：布局组件
│   └── MainLayout.vue     # 主布局组件
├── views/                 # 新增：页面视图组件
│   ├── Home.vue          # 首页
│   ├── Users.vue         # 用户管理视图
│   └── NotFound.vue      # 404 页面
├── components/            # 现有：UI 组件
│   ├── UserManagement.vue # 保持不变
│   ├── UserForm.vue       # 保持不变
│   └── SearchFilter.vue   # 保持不变
├── stores/                # 现有：状态管理
├── services/              # 现有：业务服务
├── types/                 # 现有：类型定义
│   └── router.ts         # 新增：路由相关类型
├── App.vue               # 修改：使用 RouterView
└── main.ts               # 修改：注册路由器
```

## Correctness Properties

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式声明。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在分析所有可测试的验收标准后，我识别出以下冗余情况：

1. **需求 9.2 与需求 8.3 重复**：两者都测试路由切换时更新页面标题，保留 8.3 作为主要属性
2. **需求 10.6 被需求 10.1-10.5 覆盖**：10.6 是总体目标，已被具体的功能测试覆盖
3. **需求 4.1 和 4.2 可以合并**：导航到路由和更新 URL 是同一行为的两个方面，可以合并为一个属性

经过反思，以下是去除冗余后的核心属性：

### 属性 1：路由配置完整性

*对于任何*已定义的路由，该路由必须包含 path、name 和 component 三个必需属性。

**验证需求：2.5**

### 属性 2：路由元信息完整性

*对于任何*已定义的路由，该路由的 meta 对象必须包含 title 属性。

**验证需求：8.1, 8.2**

### 属性 3：导航行为一致性

*对于任何*有效的路由路径，当用户导航到该路径时，系统必须同时更新浏览器 URL 和渲染对应的组件。

**验证需求：4.1, 4.2**

### 属性 4：菜单激活状态同步

*对于任何*路由切换，当前路由对应的菜单项必须处于激活（高亮）状态。

**验证需求：4.3**

### 属性 5：浏览器历史导航

*对于任何*历史导航操作（后退/前进），系统必须正确导航到历史记录中的路由并渲染对应组件。

**验证需求：4.4**

### 属性 6：404 路由处理

*对于任何*未定义的路由路径，系统必须显示 NotFound 组件。

**验证需求：7.2**

### 属性 7：页面标题同步

*对于任何*路由切换，系统必须根据路由的 meta.title 更新浏览器标签页标题。

**验证需求：8.3**

### 属性 8：导航守卫透明性

*对于任何*路由导航请求，导航守卫必须允许导航继续（不阻止）。

**验证需求：9.4**

### 属性 9：用户管理功能完整性 - CRUD 操作

*对于任何*用户管理的 CRUD 操作（创建、读取、更新、删除），在路由环境下的行为必须与非路由环境下完全一致。

**验证需求：10.1**

### 属性 10：用户管理功能完整性 - 搜索筛选

*对于任何*搜索和筛选操作，在路由环境下的行为必须与非路由环境下完全一致。

**验证需求：10.2**

### 属性 11：用户管理功能完整性 - 数据持久化

*对于任何*数据持久化操作，在路由环境下的行为必须与非路由环境下完全一致。

**验证需求：10.3**

### 属性 12：用户管理功能完整性 - 错误处理

*对于任何*错误处理场景，在路由环境下的行为必须与非路由环境下完全一致。

**验证需求：10.4**

### 属性 13：用户管理功能完整性 - API 集成

*对于任何*API 调用，在路由环境下的行为必须与非路由环境下完全一致。

**验证需求：10.5**

### 属性 14：布局组件持久性

*对于任何*路由切换，Layout 组件必须保持渲染状态（不被卸载）。

**验证需求：3.5**

## 错误处理

### 路由错误类型

1. **路由不存在错误**
   - 场景：用户访问未定义的路由
   - 处理：显示 NotFound 组件（404 页面）
   - 用户体验：提供返回首页和返回上一页的选项

2. **组件加载失败错误**
   - 场景：懒加载的路由组件加载失败（网络错误、文件不存在）
   - 处理：捕获动态 import 错误，显示错误提示
   - 用户体验：提供重试选项

3. **导航守卫错误**
   - 场景：导航守卫中的逻辑抛出异常
   - 处理：捕获错误，记录日志，允许导航继续或中断
   - 用户体验：显示错误提示，不影响应用稳定性

### 错误处理实现

```typescript
// 路由器错误处理
router.onError((error) => {
  console.error('[Router] 路由错误:', error)
  
  // 组件加载失败
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.error('[Router] 组件加载失败，可能是网络问题')
    // 可以显示全局错误提示
  }
})

// 导航守卫错误处理
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
    
    next()
  } catch (error) {
    console.error('[Router] 导航守卫错误:', error)
    // 即使出错也允许导航继续
    next()
  }
})
```

### 404 页面设计

NotFound 组件提供友好的错误提示和导航选项：

- 显示 404 状态码和错误消息
- 提供"返回首页"按钮
- 提供"返回上一页"按钮
- 使用 Ant Design Vue 的 Result 组件保持视觉一致性

## 测试策略

### 测试方法

本功能采用三层测试策略：

1. **单元测试**：测试路由配置、组件渲染、特定示例
2. **集成测试**：测试完整的导航流程、用户管理功能在路由环境下的表现
3. **属性测试**：验证路由系统的通用属性和不变量

### 单元测试

#### 路由配置测试

```typescript
describe('路由配置', () => {
  it('应该定义根路由指向首页', () => {
    const route = router.getRoutes().find(r => r.path === '/')
    expect(route).toBeDefined()
    expect(route?.name).toBe('home')
  })
  
  it('应该定义用户管理路由', () => {
    const route = router.getRoutes().find(r => r.path === '/users')
    expect(route).toBeDefined()
    expect(route?.name).toBe('users')
  })
  
  it('应该定义 404 路由', () => {
    const route = router.getRoutes().find(r => r.path === '/:pathMatch(.*)*')
    expect(route).toBeDefined()
    expect(route?.name).toBe('not-found')
  })
  
  it('应该使用懒加载导入组件', () => {
    const routes = router.getRoutes()
    routes.forEach(route => {
      if (route.component) {
        // 懒加载的组件是一个函数
        expect(typeof route.component).toBe('function')
      }
    })
  })
})
```

#### 组件测试

```typescript
describe('MainLayout 组件', () => {
  it('应该包含顶部导航栏', () => {
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.find('.header').exists()).toBe(true)
  })
  
  it('应该包含 RouterView', () => {
    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })
})

describe('Home 组件', () => {
  it('应该显示欢迎信息', () => {
    const wrapper = mount(Home)
    expect(wrapper.text()).toContain('欢迎使用用户管理系统')
  })
  
  it('应该提供到用户管理的链接', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router]
      }
    })
    const link = wrapper.find('a[href="/users"]')
    expect(link.exists()).toBe(true)
  })
})

describe('NotFound 组件', () => {
  it('应该显示 404 错误消息', () => {
    const wrapper = mount(NotFound, {
      global: {
        plugins: [router]
      }
    })
    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain('页面不存在')
  })
  
  it('应该提供返回首页的链接', () => {
    const wrapper = mount(NotFound, {
      global: {
        plugins: [router]
      }
    })
    const homeButton = wrapper.find('button')
    expect(homeButton.exists()).toBe(true)
  })
})
```

### 集成测试

#### 路由导航流程测试

```typescript
describe('路由导航集成测试', () => {
  it('应该完成完整的导航流程：首页 → 用户管理 → 首页', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    
    // 初始在首页
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.findComponent(Home).exists()).toBe(true)
    
    // 导航到用户管理
    await router.push('/users')
    await wrapper.vm.$nextTick()
    expect(router.currentRoute.value.path).toBe('/users')
    expect(wrapper.findComponent(UserManagement).exists()).toBe(true)
    
    // 返回首页
    await router.push('/')
    await wrapper.vm.$nextTick()
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.findComponent(Home).exists()).toBe(true)
  })
  
  it('应该在用户管理页面正常执行 CRUD 操作', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()]
      }
    })
    
    // 导航到用户管理
    await router.push('/users')
    await wrapper.vm.$nextTick()
    
    const userStore = useUserStore()
    
    // 测试创建用户
    const userData = {
      name: '测试用户',
      email: 'test@example.com',
      role: UserRole.User,
      status: UserStatus.Active
    }
    
    await userStore.createUser(userData)
    expect(userStore.users.length).toBeGreaterThan(0)
    
    // 测试更新用户
    const userId = userStore.users[0].id
    await userStore.updateUser(userId, { name: '更新后的用户' })
    expect(userStore.users[0].name).toBe('更新后的用户')
    
    // 测试删除用户
    await userStore.deleteUser(userId)
    expect(userStore.users.find(u => u.id === userId)).toBeUndefined()
  })
})
```

### 属性测试

#### 属性测试配置

所有属性测试必须：
- 使用 fast-check 库
- 最少运行 100 次迭代
- 在测试名称中包含 "Property" 关键字
- 使用标签格式引用设计文档中的属性

```typescript
import fc from 'fast-check'

describe('路由系统属性测试', () => {
  it('Property 1: 路由配置完整性 - 验证需求 2.5', () => {
    // **功能：router-integration，属性 1：路由配置完整性**
    
    fc.assert(
      fc.property(
        fc.constantFrom(...router.getRoutes()),
        (route) => {
          // 过滤掉重定向路由（它们可能没有 component）
          if (route.redirect) {
            return true
          }
          
          // 每个非重定向路由必须有 path、name 和 component
          expect(route.path).toBeDefined()
          expect(route.name).toBeDefined()
          expect(route.component).toBeDefined()
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('Property 2: 路由元信息完整性 - 验证需求 8.1, 8.2', () => {
    // **功能：router-integration，属性 2：路由元信息完整性**
    
    fc.assert(
      fc.property(
        fc.constantFrom(...router.getRoutes()),
        (route) => {
          // 每个路由必须有 meta 对象和 title 属性
          expect(route.meta).toBeDefined()
          expect(route.meta?.title).toBeDefined()
          expect(typeof route.meta?.title).toBe('string')
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('Property 3: 导航行为一致性 - 验证需求 4.1, 4.2', async () => {
    // **功能：router-integration，属性 3：导航行为一致性**
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/', '/users'),
        async (path) => {
          await router.push(path)
          
          // URL 必须更新
          expect(router.currentRoute.value.path).toBe(path)
          
          // 浏览器 URL 必须匹配
          expect(window.location.pathname).toContain(path)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('Property 7: 页面标题同步 - 验证需求 8.3', async () => {
    // **功能：router-integration，属性 7：页面标题同步**
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...router.getRoutes()),
        async (route) => {
          if (route.path && route.meta?.title) {
            await router.push(route.path)
            
            // 页面标题必须包含路由的 title
            expect(document.title).toContain(route.meta.title as string)
            
            return true
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('Property 8: 导航守卫透明性 - 验证需求 9.4', async () => {
    // **功能：router-integration，属性 8：导航守卫透明性**
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/', '/users', '/about', '/settings'),
        async (path) => {
          // 尝试导航到任何路径
          const result = await router.push(path).catch(() => null)
          
          // 导航不应该被守卫阻止（除非路径不存在）
          if (router.getRoutes().some(r => r.path === path)) {
            expect(result).not.toBeNull()
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### 测试覆盖率目标

- **代码覆盖率**：90% 以上
- **分支覆盖率**：85% 以上
- **函数覆盖率**：95% 以上
- **属性测试覆盖**：所有核心路由行为

### 测试运行命令

```bash
# 运行所有测试（监听模式）
npm test

# 运行所有测试（一次）
npm run test:unit

# 仅运行路由相关测试
npm test -- router

# 仅运行属性测试
npm run test:prop

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

## 性能考虑

### 路由懒加载

使用动态 import 实现路由组件的按需加载，减少初始包大小：

```typescript
// ✅ 推荐：懒加载
{
  path: '/users',
  component: () => import('@/views/Users.vue')
}

// ❌ 避免：直接导入
import Users from '@/views/Users.vue'
{
  path: '/users',
  component: Users
}
```

### 路由切换动画

使用 CSS transition 实现平滑的路由切换效果，提升用户体验：

```vue
<router-view v-slot="{ Component }">
  <transition name="fade" mode="out-in">
    <component :is="Component" />
  </transition>
</router-view>
```

动画性能优化：
- 使用 `transform` 和 `opacity` 属性（GPU 加速）
- 避免使用 `height`、`width` 等会触发重排的属性
- 动画时长控制在 200-300ms

### 导航性能

- **预加载**：在用户悬停链接时预加载目标组件
- **缓存**：使用 `<keep-alive>` 缓存频繁访问的组件
- **代码分割**：将大型组件拆分为更小的块

## 安全考虑

### XSS 防护

- 所有用户输入必须经过验证和转义
- 使用 Vue 的模板语法自动转义内容
- 避免使用 `v-html` 渲染用户内容

### 路由权限控制（预留）

虽然当前版本不需要权限控制，但设计已预留扩展空间：

```typescript
// 未来可以在路由守卫中添加权限检查
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta?.requiresAuth
  
  if (requiresAuth && !isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})
```

## 可访问性

### 键盘导航

- 所有导航链接必须可通过键盘访问
- 使用 Tab 键可以在链接间切换
- 使用 Enter 键可以激活链接

### 屏幕阅读器支持

- 使用语义化的 HTML 标签
- 为导航元素添加适当的 ARIA 标签
- 确保页面标题正确更新（屏幕阅读器会读取）

### 焦点管理

- 路由切换后，焦点应该移到新页面的主要内容区域
- 使用 `router.afterEach` 钩子管理焦点

```typescript
router.afterEach(() => {
  // 将焦点移到主要内容区域
  const mainContent = document.querySelector('main')
  if (mainContent) {
    mainContent.focus()
  }
})
```

## 浏览器兼容性

### 支持的浏览器

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器（iOS Safari 14+, Chrome Android 90+）

### History API 兼容性

Vue Router 4 使用 HTML5 History API，所有现代浏览器都支持。对于不支持的旧浏览器，可以降级到 Hash 模式：

```typescript
const router = createRouter({
  history: import.meta.env.LEGACY 
    ? createWebHashHistory() 
    : createWebHistory(),
  routes
})
```

## 部署注意事项

### 服务器配置

使用 History 模式时，需要配置服务器将所有请求重定向到 index.html：

#### Nginx 配置

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Apache 配置

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 基础路径配置

如果应用部署在子路径下，需要配置 base URL：

```typescript
// vite.config.ts
export default defineConfig({
  base: '/my-app/'
})

// router/index.ts
const router = createRouter({
  history: createWebHistory('/my-app/'),
  routes
})
```

## 迁移策略

### 从无路由到有路由的迁移步骤

1. **安装依赖**：安装 vue-router
2. **创建路由配置**：定义路由和组件映射
3. **创建布局组件**：将导航逻辑从 App.vue 移到 Layout
4. **创建视图组件**：为每个路由创建对应的视图组件
5. **更新 App.vue**：使用 RouterView 替代直接渲染
6. **注册路由器**：在 main.ts 中注册
7. **测试验证**：确保所有功能正常工作

### 回滚计划

如果路由集成出现问题，可以快速回滚：

1. 从 main.ts 中移除路由器注册
2. 恢复 App.vue 的原始内容
3. 删除新创建的路由相关文件

建议在独立分支上进行路由集成，测试通过后再合并到主分支。

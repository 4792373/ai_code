<template>
  <a-layout class="main-layout">
    <!-- 左侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :width="200"
      class="sider"
      :breakpoint="isMobile ? 'lg' : undefined"
      @breakpoint="onBreakpoint"
    >
      <div class="sider-content">
        <!-- Logo 区域 -->
        <div class="logo">
          <AppstoreOutlined class="logo-icon" />
          <span v-if="!collapsed" class="logo-text">用户管理系统</span>
        </div>

        <!-- 侧边栏菜单 -->
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          theme="dark"
          class="sider-menu"
          @click="handleMenuClick"
        >
          <a-menu-item key="home">
            <HomeOutlined />
            <span>首页</span>
          </a-menu-item>
          <a-menu-item key="users">
            <UserOutlined />
            <span>用户管理</span>
          </a-menu-item>
          <a-menu-item key="brands">
            <TagOutlined />
            <span>品牌管理</span>
          </a-menu-item>
        </a-menu>

        <!-- 收起/展开按钮 -->
        <div class="sider-trigger" @click="toggleCollapsed">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </div>
      </div>
    </a-layout-sider>

    <!-- 右侧布局 -->
    <a-layout>
      <!-- 顶部栏 -->
      <a-layout-header class="header">
        <div class="header-left">
          <!-- 顶部栏左侧内容 -->
        </div>
        <div class="header-right">
          <!-- 可以在这里添加用户信息、通知等 -->
        </div>
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
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  HomeOutlined, 
  UserOutlined, 
  AppstoreOutlined, 
  TagOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const selectedKeys = ref<string[]>([])
const collapsed = ref(false)
const isMobile = ref(false)

/**
 * 检测是否为移动设备
 */
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    collapsed.value = true
  }
}

/**
 * 响应断点变化
 */
const onBreakpoint = (broken: boolean) => {
  if (broken) {
    collapsed.value = true
  }
}

/**
 * 切换侧边栏折叠状态
 */
const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

/**
 * 处理菜单点击事件
 * 根据菜单项的 key 进行路由跳转
 */
const handleMenuClick = ({ key }: { key: string }) => {
  const routeMap: Record<string, string> = {
    home: '/',
    users: '/users',
    brands: '/brands'
  }
  
  const path = routeMap[key]
  if (path) {
    router.push(path)
    
    // 移动端点击菜单后自动收起侧边栏
    if (isMobile.value) {
      collapsed.value = true
    }
  }
}

/**
 * 根据当前路由更新选中的菜单项
 * 监听路由变化，自动高亮对应的菜单项
 */
watch(
  () => route.path,
  (path) => {
    if (path === '/') {
      selectedKeys.value = ['home']
    } else if (path.startsWith('/users')) {
      selectedKeys.value = ['users']
    } else if (path.startsWith('/brands')) {
      selectedKeys.value = ['brands']
    }
  },
  { immediate: true }
)

// 初始化时检测设备类型
checkMobile()
window.addEventListener('resize', checkMobile)
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

/* 侧边栏样式 */
.sider {
  overflow: hidden;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background: #001529;
}

.sider-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.logo-icon {
  font-size: 24px;
  color: #1890ff;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  transition: opacity 0.3s;
}

.sider-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 隐藏菜单滚动条 */
.sider-menu::-webkit-scrollbar {
  width: 0;
  display: none;
}

.sider-menu {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 侧边栏收起按钮 */
.sider-trigger {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: auto;
}

.sider-trigger:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

/* 顶部栏样式 */
.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
  margin-left: 200px;
  transition: margin-left 0.2s;
}

.sider.ant-layout-sider-collapsed + * .header {
  margin-left: 80px;
}

.header-left {
  display: flex;
  align-items: center;
}



.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 内容区域样式 */
.content {
  margin-left: 200px;
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
  transition: margin-left 0.2s;
}

.sider.ant-layout-sider-collapsed + * .content {
  margin-left: 80px;
}

.content-wrapper {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 112px);
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
  .sider {
    position: fixed !important;
    z-index: 999;
  }
  
  .header {
    margin-left: 0 !important;
  }
  
  .content {
    margin-left: 0 !important;
    padding: 16px;
  }
  
  .content-wrapper {
    padding: 16px;
    min-height: calc(100vh - 96px);
  }
  
  .logo-text {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 12px;
  }
  
  .content-wrapper {
    padding: 12px;
  }
  
  .header {
    padding: 0 16px;
  }
}

/* 侧边栏折叠时的样式调整 */
:deep(.ant-layout-sider-collapsed) .logo {
  padding: 0;
  justify-content: center;
}

:deep(.ant-layout-sider-collapsed) .logo-text {
  opacity: 0;
  width: 0;
}

/* 菜单项样式优化 */
:deep(.ant-menu-dark.ant-menu-inline .ant-menu-item) {
  margin: 4px 8px;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.ant-menu-dark.ant-menu-inline .ant-menu-item-selected) {
  background-color: #1890ff;
}

:deep(.ant-menu-dark.ant-menu-inline .ant-menu-item:hover) {
  background-color: rgba(24, 144, 255, 0.2);
}

/* 菜单项文字超出显示省略号 */
:deep(.ant-menu-dark.ant-menu-inline .ant-menu-item > span) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}

:deep(.ant-menu-dark.ant-menu-inline .ant-menu-item .anticon) {
  vertical-align: middle;
}
</style>

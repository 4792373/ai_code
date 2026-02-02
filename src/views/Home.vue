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

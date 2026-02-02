<template>
  <a-modal
    :open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :width="600"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      @finish="onFinish"
      @finish-failed="onFinishFailed"
    >
      <a-form-item label="用户姓名" name="name">
        <a-input
          v-model:value="formData.name"
          placeholder="请输入用户姓名"
          :maxlength="50"
          show-count
        />
      </a-form-item>

      <a-form-item label="邮箱地址" name="email">
        <a-input
          v-model:value="formData.email"
          placeholder="请输入邮箱地址"
          type="email"
        />
      </a-form-item>

      <a-form-item label="用户角色" name="role">
        <a-select
          v-model:value="formData.role"
          placeholder="请选择用户角色"
        >
          <a-select-option value="admin">管理员</a-select-option>
          <a-select-option value="moderator">协调员</a-select-option>
          <a-select-option value="user">普通用户</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="用户状态" name="status">
        <a-select
          v-model:value="formData.status"
          placeholder="请选择用户状态"
        >
          <a-select-option value="active">激活</a-select-option>
          <a-select-option value="inactive">未激活</a-select-option>
          <a-select-option value="pending">待审核</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Modal, Form, FormItem, Input, Select, SelectOption } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useUserStore } from '@/stores/userStore'
import { useUIStore } from '@/stores/uiStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { User, CreateUserData, UpdateUserData, UserRole, UserStatus } from '@/types/user'

// Ant Design Vue 组件
const AModal = Modal
const AForm = Form
const AFormItem = FormItem
const AInput = Input
const ASelect = Select
const ASelectOption = SelectOption

// Props
interface UserFormProps {
  visible: boolean
  user?: User | null
  mode: 'create' | 'edit'
}

const props = withDefaults(defineProps<UserFormProps>(), {
  visible: false,
  user: null,
  mode: 'create'
})

// Emits
interface UserFormEmits {
  submit: [userData: CreateUserData | UpdateUserData]
  cancel: []
}

const emit = defineEmits<UserFormEmits>()

// 使用 stores 和 composables
const userStore = useUserStore()
const uiStore = useUIStore()
const { handleError } = useErrorHandler()

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态（从 userStore 获取）
const loading = computed(() => userStore.isLoading)

// 表单数据
const formData = ref<CreateUserData>({
  name: '',
  email: '',
  role: '' as UserRole,
  status: '' as UserStatus
})

// 计算属性
const modalTitle = computed(() => {
  return props.mode === 'create' ? '添加用户' : '编辑用户'
})

// 表单验证规则
const formRules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入用户姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度应在2-50个字符之间', trigger: 'blur' },
    { whitespace: true, message: '用户姓名不能为空', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    {
      validator: async (_rule, value) => {
        if (!value) return Promise.resolve()
        
        // 检查邮箱唯一性
        const excludeId = props.mode === 'edit' && props.user ? props.user.id : undefined
        const isExists = userStore.users.some((user: User) => 
          user.email.toLowerCase() === value.toLowerCase().trim() && user.id !== excludeId
        )
        
        if (isExists) {
          return Promise.reject(new Error('邮箱已存在'))
        }
        
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  role: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择用户状态', trigger: 'change' }
  ]
}

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    email: '',
    role: '' as UserRole,
    status: '' as UserStatus
  }
}

// 监听 props 变化，更新表单数据
watch(
  () => [props.visible, props.user, props.mode] as const,
  ([visible, user, mode]) => {
    if (visible) {
      if (mode === 'edit' && user) {
        // 编辑模式：预填充用户数据
        formData.value = {
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      } else {
        // 创建模式：重置表单
        resetForm()
      }
      
      // 清除验证状态
      nextTick(() => {
        formRef.value?.clearValidate?.()
      })
    }
  },
  { immediate: true }
)

// 表单提交成功
const onFinish = async (values: any) => {
  // 类型转换
  const userData: CreateUserData | UpdateUserData = props.mode === 'edit' && props.user
    ? {
        id: props.user.id,
        name: values.name,
        email: values.email,
        role: values.role as UserRole,
        status: values.status as UserStatus
      }
    : {
        name: values.name,
        email: values.email,
        role: values.role as UserRole,
        status: values.status as UserStatus
      }
  
  // 发送提交事件给父组件处理
  emit('submit', userData)
}

// 表单提交失败
const onFinishFailed = (errorInfo: any) => {
  console.log('表单验证失败:', errorInfo)
  handleError('请检查表单输入')
}

// 处理提交按钮点击
const handleSubmit = () => {
  formRef.value?.validateFields().then((values) => {
    onFinish(values)
  }).catch((errorInfo) => {
    onFinishFailed(errorInfo)
  })
}

// 处理取消按钮点击
const handleCancel = () => {
  // 发送取消事件
  emit('cancel')
  
  // 关闭模态框
  uiStore.closeUserModal()
  
  // 重置表单
  resetForm()
  
  // 清除验证状态
  nextTick(() => {
    formRef.value?.resetFields?.()
  })
}

// 暴露给父组件的方法
defineExpose({
  resetForm,
  validateForm: () => formRef.value?.validate(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 24px;
}

.ant-input,
.ant-select {
  width: 100%;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
}

:deep(.ant-input-show-count-suffix) {
  color: #999;
}
</style>
<template>
  <a-modal
    :open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :width="isMobile ? '100%' : 600"
    :style="isMobile ? { top: '0', maxWidth: '100%', paddingBottom: '0' } : {}"
    :bodyStyle="isMobile ? { maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' } : {}"
    :wrapClassName="isMobile ? 'mobile-modal' : ''"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="isMobile ? { span: 24 } : { span: 6 }"
      :wrapper-col="isMobile ? { span: 24 } : { span: 18 }"
      :layout="isMobile ? 'vertical' : 'horizontal'"
      @finish="onFinish"
      @finish-failed="onFinishFailed"
    >
      <a-form-item label="品牌名称" name="name">
        <a-input
          v-model:value="formData.name"
          placeholder="请输入品牌名称"
          :maxlength="50"
          show-count
        />
      </a-form-item>

      <a-form-item label="品牌编码" name="code">
        <a-input
          v-model:value="formData.code"
          placeholder="请输入品牌编码（大写字母、数字、下划线、连字符）"
          :maxlength="20"
          show-count
        />
      </a-form-item>

      <a-form-item label="品牌状态" name="status">
        <a-select
          v-model:value="formData.status"
          placeholder="请选择品牌状态"
        >
          <a-select-option value="active">有效</a-select-option>
          <a-select-option value="inactive">无效</a-select-option>
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
import { useBrandStore } from '@/stores/brandStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { Brand, CreateBrandDto, UpdateBrandDto, BrandStatus } from '@/types/brand'

// Ant Design Vue 组件
const AModal = Modal
const AForm = Form
const AFormItem = FormItem
const AInput = Input
const ASelect = Select
const ASelectOption = SelectOption

/**
 * 品牌表单组件 Props 接口
 * 
 * **验证需求：2.1, 3.1**
 */
interface BrandFormProps {
  /** 对话框可见性 */
  visible: boolean
  /** 编辑时的品牌数据 */
  brand?: Brand | null
  /** 表单模式（创建或编辑） */
  mode: 'create' | 'edit'
}

const props = withDefaults(defineProps<BrandFormProps>(), {
  visible: false,
  brand: null,
  mode: 'create'
})

/**
 * 品牌表单组件 Emits 接口
 * 
 * **验证需求：2.5, 3.5**
 */
interface BrandFormEmits {
  /** 更新可见性 */
  (e: 'update:visible', value: boolean): void
  /** 操作成功 */
  (e: 'success'): void
}

const emit = defineEmits<BrandFormEmits>()

// 使用 stores 和 composables
const brandStore = useBrandStore()
const { handleError, showSuccess } = useErrorHandler()

// 表单引用
const formRef = ref<FormInstance>()

// 响应式断点状态
const isMobile = ref(false)

/**
 * 检查屏幕尺寸并更新响应式状态
 * 
 * **验证需求：10.4**
 */
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
}

// 加载状态（从 brandStore 获取）
const loading = computed(() => brandStore.isLoading)

/**
 * 表单数据
 * 
 * **验证需求：2.1, 3.1**
 */
const formData = ref<CreateBrandDto>({
  name: '',
  code: '',
  status: '' as BrandStatus
})

/**
 * 计算属性：模态框标题
 * 
 * 根据表单模式显示不同的标题
 */
const modalTitle = computed(() => {
  return props.mode === 'create' ? '新增品牌' : '编辑品牌'
})

/**
 * 表单验证规则
 * 
 * **验证需求：2.2, 2.3, 2.4, 3.3, 3.4**
 */
const formRules: Record<string, Rule[]> = {
  name: [
    { required: true, message: '请输入品牌名称', trigger: 'blur' },
    { min: 1, max: 50, message: '品牌名称长度应在 1-50 个字符之间', trigger: 'blur' },
    { whitespace: true, message: '品牌名称不能为空', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入品牌编码', trigger: 'blur' },
    { 
      pattern: /^[A-Z0-9_-]+$/, 
      message: '品牌编码只能包含大写字母、数字、下划线和连字符', 
      trigger: 'blur' 
    },
    { min: 2, max: 20, message: '品牌编码长度应在 2-20 个字符之间', trigger: 'blur' },
    {
      validator: async (_rule, value) => {
        if (!value) return Promise.resolve()
        
        // 检查品牌编码唯一性（需求 2.4, 3.4）
        const excludeId = props.mode === 'edit' && props.brand ? props.brand.id : undefined
        const isExists = brandStore.brands.some((brand: Brand) => 
          brand.code.toUpperCase() === value.toUpperCase().trim() && brand.id !== excludeId
        )
        
        if (isExists) {
          return Promise.reject(new Error('品牌编码已存在'))
        }
        
        return Promise.resolve()
      },
      trigger: 'blur'
    }
  ],
  status: [
    { required: true, message: '请选择品牌状态', trigger: 'change' }
  ]
}

/**
 * 重置表单
 * 
 * 将表单数据重置为初始状态
 */
const resetForm = () => {
  formData.value = {
    name: '',
    code: '',
    status: '' as BrandStatus
  }
}

/**
 * 监听 props 变化，更新表单数据
 * 
 * **验证需求：3.2, 10.4**
 */
watch(
  () => [props.visible, props.brand, props.mode] as const,
  ([visible, brand, mode]) => {
    if (visible) {
      // 检查屏幕尺寸
      checkScreenSize()
      
      if (mode === 'edit' && brand) {
        // 编辑模式：预填充品牌数据（需求 3.2）
        formData.value = {
          name: brand.name,
          code: brand.code,
          status: brand.status
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

/**
 * 表单提交成功处理
 * 
 * 调用 brandStore 方法创建或更新品牌
 * 
 * **验证需求：2.1, 2.5, 2.6, 3.1, 3.5, 3.6**
 */
const onFinish = async (values: any) => {
  try {
    // 类型转换
    const brandData: CreateBrandDto | UpdateBrandDto = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(), // 统一转换为大写
      status: values.status as BrandStatus
    }
    
    if (props.mode === 'edit' && props.brand) {
      // 编辑模式：更新品牌（需求 3.1）
      await brandStore.updateBrand(props.brand.id, brandData)
      
      // 显示成功提示（需求 3.6）
      showSuccess('品牌更新成功')
    } else {
      // 创建模式：创建品牌（需求 2.1）
      await brandStore.createBrand(brandData as CreateBrandDto)
      
      // 显示成功提示（需求 2.6）
      showSuccess('品牌创建成功')
    }
    
    // 发送成功事件（需求 2.5, 3.5）
    emit('success')
    
    // 关闭对话框
    emit('update:visible', false)
    
    // 重置表单
    resetForm()
    
    // 清除验证状态
    nextTick(() => {
      formRef.value?.resetFields?.()
    })
  } catch (error: any) {
    // 错误处理（需求 2.7）
    console.error('[BrandForm] 提交失败:', error)
    
    // 显示错误提示
    if (error.type === 'VALIDATION_ERROR') {
      // 验证错误：显示具体的错误信息（需求 9.5）
      const errorMessage = error.details && error.details.length > 0
        ? error.details.join(', ')
        : error.message || '数据验证失败'
      handleError(errorMessage)
    } else {
      // 其他错误：显示通用错误消息
      handleError(error.message || '操作失败，请稍后重试')
    }
    
    // 保持对话框打开，让用户修改数据（需求 2.7）
  }
}

/**
 * 表单提交失败处理
 * 
 * 当表单验证失败时调用
 */
const onFinishFailed = (errorInfo: any) => {
  console.log('[BrandForm] 表单验证失败:', errorInfo)
  handleError('请检查表单输入')
}

/**
 * 处理提交按钮点击
 * 
 * 触发表单验证并提交
 */
const handleSubmit = () => {
  formRef.value?.validateFields().then((values) => {
    onFinish(values)
  }).catch((errorInfo) => {
    onFinishFailed(errorInfo)
  })
}

/**
 * 处理取消按钮点击
 * 
 * 关闭对话框并重置表单
 */
const handleCancel = () => {
  // 关闭对话框
  emit('update:visible', false)
  
  // 重置表单
  resetForm()
  
  // 清除验证状态
  nextTick(() => {
    formRef.value?.resetFields?.()
  })
}

/**
 * 暴露给父组件的方法
 */
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

/* 移动端样式优化 */
@media (max-width: 767px) {
  .ant-form-item {
    margin-bottom: 16px;
  }
  
  :deep(.ant-form-item-label) {
    padding-bottom: 4px;
  }
  
  :deep(.ant-modal-body) {
    padding: 16px;
  }
  
  :deep(.ant-modal-footer) {
    padding: 10px 16px;
  }
  
  :deep(.ant-btn) {
    height: 40px;
    font-size: 16px;
  }
}

/* 移动端全屏模态框样式 */
:deep(.mobile-modal) {
  .ant-modal {
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  
  .ant-modal-content {
    border-radius: 0;
    min-height: 100vh;
  }
  
  .ant-modal-header {
    border-radius: 0;
  }
}
</style>

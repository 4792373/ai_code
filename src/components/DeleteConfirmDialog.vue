<template>
  <a-modal
    :open="visible"
    title="确认删除"
    :confirm-loading="loading"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" danger :loading="loading" @click="handleConfirm">
        确认删除
      </a-button>
    </template>
    
    <div class="delete-confirm-content">
      <div class="warning-icon">
        <ExclamationCircleOutlined style="color: #faad14; font-size: 22px;" />
      </div>
      <div class="confirm-text">
        <p>您确定要删除该用户吗？</p>
        <p class="warning-text">此操作不可撤销，请谨慎操作。</p>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Modal, Button } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

// Ant Design Vue 组件
const AModal = Modal
const AButton = Button

// Props 定义
interface Props {
  visible: boolean
  loading?: boolean
}

// Emits 定义
interface Emits {
  confirm: []
  cancel: []
}

withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// 处理确认删除
const handleConfirm = () => {
  emit('confirm')
}

// 处理取消删除
const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.delete-confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.warning-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.confirm-text {
  flex: 1;
}

.confirm-text p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.confirm-text p:last-child {
  margin-bottom: 0;
}

.warning-text {
  color: #8c8c8c;
  font-size: 13px !important;
}
</style>
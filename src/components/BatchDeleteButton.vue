<template>
  <a-button
    danger
    :disabled="isDisabled"
    :loading="loading"
    @click="emit('click')"
  >
    <template #icon>
      <DeleteOutlined />
    </template>
    {{ buttonText }}
  </a-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DeleteOutlined } from '@ant-design/icons-vue'

/**
 * BatchDeleteButton 组件 Props
 */
interface Props {
  /** 选中的用户数量 */
  selectedCount: number
  /** 加载状态 */
  loading: boolean
  /** 禁用状态 */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

/**
 * BatchDeleteButton 组件 Emits
 */
interface Emits {
  /** 点击事件 */
  (e: 'click'): void
}

const emit = defineEmits<Emits>()

/**
 * 按钮是否禁用
 * 当选中数量为 0、正在加载或手动禁用时，按钮应该被禁用
 */
const isDisabled = computed(() => {
  return props.disabled || props.selectedCount === 0 || props.loading
})

/**
 * 按钮文本
 * 当选中数量为 0 时显示"批量删除"
 * 当选中数量大于 0 时显示"批量删除 (N)"
 */
const buttonText = computed(() => {
  if (props.selectedCount === 0) {
    return '批量删除'
  }
  return `批量删除 (${props.selectedCount})`
})
</script>

<style scoped>
/* 批量删除按钮样式由 Ant Design Vue 的 danger 属性提供 */
</style>

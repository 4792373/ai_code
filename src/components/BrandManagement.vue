<template>
  <div class="brand-management">
    <a-card title="品牌管理" :bordered="false">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="handleCreate">
            <template #icon>
              <PlusOutlined />
            </template>
            新增品牌
          </a-button>
          <a-button @click="handleDownloadTemplate">
            <template #icon>
              <DownloadOutlined />
            </template>
            下载模板
          </a-button>
          <a-upload
            :before-upload="handleBeforeUpload"
            :show-upload-list="false"
            accept=".xlsx,.xls"
          >
            <a-button>
              <template #icon>
                <UploadOutlined />
              </template>
              批量导入
            </a-button>
          </a-upload>
        </a-space>
      </template>

      <div class="content">
        <!-- 搜索筛选栏 -->
        <div class="search-filter">
          <a-row :gutter="16" align="middle">
            <!-- 搜索输入框 -->
            <a-col :xs="24" :sm="12" :md="8">
              <a-input
                v-model:value="searchKeyword"
                placeholder="搜索品牌名称或编码"
                allow-clear
                :disabled="loading"
                @input="handleSearch"
              >
                <template #prefix>
                  <SearchOutlined />
                </template>
              </a-input>
            </a-col>

            <!-- 状态筛选 -->
            <a-col :xs="12" :sm="8" :md="6">
              <a-select
                v-model:value="selectedStatus"
                placeholder="选择状态"
                allow-clear
                :disabled="loading"
                :loading="loading"
                style="width: 100%"
                @change="handleStatusFilter"
              >
                <a-select-option value="">全部状态</a-select-option>
                <a-select-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :value="status.value"
                >
                  <a-tag :color="status.color">{{ status.label }}</a-tag>
                </a-select-option>
              </a-select>
            </a-col>

            <!-- 重置按钮 -->
            <a-col :xs="12" :sm="4" :md="3">
              <a-button
                @click="handleReset"
                :loading="loading"
                :disabled="loading"
                style="width: 100%"
              >
                <template #icon>
                  <ReloadOutlined />
                </template>
                重置
              </a-button>
            </a-col>
          </a-row>
        </div>

        <!-- 品牌列表表格 -->
        <a-table
          :key="tableKey"
          :columns="columns"
          :data-source="filteredBrands"
          :loading="loading"
          :pagination="paginationConfig"
          :scroll="{ x: isMobile ? 600 : 800 }"
          row-key="id"
          :size="isMobile ? 'small' : 'middle'"
        >
          <!-- 状态列自定义渲染 -->
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'active' ? 'green' : 'red'">
                {{ record.status === 'active' ? '有效' : '无效' }}
              </a-tag>
            </template>

            <!-- 操作列 -->
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="handleEdit(record as Brand)">
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除这个品牌吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete((record as Brand).id)"
                >
                  <a-button type="link" size="small" danger>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 品牌表单对话框 -->
    <BrandForm
      v-model:visible="formVisible"
      :brand="currentBrand"
      :mode="formMode"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import {
  Card,
  Button,
  Space,
  Upload,
  Row,
  Col,
  Input,
  Select,
  Table,
  Tag,
  Popconfirm,
  message
} from 'ant-design-vue'
import {
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { useBrandStore } from '@/stores/brandStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { excelService } from '@/services/excelService'
import { debounce } from '@/utils/debounce'
import BrandForm from './BrandForm.vue'
import type { Brand, BrandStatus } from '@/types/brand'
import type { UploadProps, SelectProps } from 'ant-design-vue'
import type { TableColumnType } from 'ant-design-vue'

// Ant Design Vue 组件
const ACard = Card
const AButton = Button
const ASpace = Space
const AUpload = Upload
const ARow = Row
const ACol = Col
const AInput = Input
const ASelect = Select
const ASelectOption = Select.Option
const ATable = Table
const ATag = Tag
const APopconfirm = Popconfirm

// 使用 stores 和 composables
const brandStore = useBrandStore()
const { showSuccess, handleError, withErrorHandling } = useErrorHandler()

// 表格 key，用于强制重新渲染
const tableKey = ref(0)

// 表单状态
const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')

// 搜索和筛选状态
const searchKeyword = ref('')
const selectedStatus = ref<string>('')

// 计算属性
const filteredBrands = computed(() => brandStore.filteredBrands)
const currentBrand = computed(() => brandStore.currentBrand)
const loading = computed(() => brandStore.isLoading)

/**
 * 状态选项配置
 * 
 * **验证需求：1.4, 1.5, 5.2**
 */
const statusOptions = [
  { value: 'active', label: '有效', color: 'green' },
  { value: 'inactive', label: '无效', color: 'red' }
]

/**
 * 响应式断点状态
 * 
 * **验证需求：10.1, 10.2, 10.3**
 */
const isMobile = ref(false)
const isTablet = ref(false)

/**
 * 检查屏幕尺寸并更新响应式状态
 */
const checkScreenSize = () => {
  const width = window.innerWidth
  isMobile.value = width < 768
  isTablet.value = width >= 768 && width < 1024
}

/**
 * 表格列定义（响应式）
 * 
 * **验证需求：1.2, 10.1, 10.2, 10.3**
 */
const columns = computed<TableColumnType[]>(() => {
  // 基础列配置
  const baseColumns: TableColumnType[] = [
    {
      title: '品牌名称',
      dataIndex: 'name',
      key: 'name',
      width: isMobile.value ? 120 : 200,
      ellipsis: true,
      fixed: isMobile.value ? 'left' : undefined
    },
    {
      title: '品牌编码',
      dataIndex: 'code',
      key: 'code',
      width: isMobile.value ? 100 : 150,
      ellipsis: true
    },
    {
      title: '品牌状态',
      dataIndex: 'status',
      key: 'status',
      width: isMobile.value ? 80 : 100
    },
    {
      title: '操作',
      key: 'action',
      width: isMobile.value ? 100 : 150,
      fixed: 'right'
    }
  ]

  // 在桌面和平板设备上显示完整列（需求 10.1）
  if (!isMobile.value) {
    // 在品牌状态之前插入操作人和操作时间列
    baseColumns.splice(2, 0, 
      {
        title: '操作人',
        dataIndex: 'operator',
        key: 'operator',
        width: isTablet.value ? 100 : 120,
        ellipsis: true
      },
      {
        title: '操作时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: isTablet.value ? 150 : 180,
        ellipsis: true,
        customRender: ({ text }: { text: string }) => {
          // 格式化时间显示
          return new Date(text).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
    )
  }

  return baseColumns
})

/**
 * 分页配置（响应式）
 * 
 * **验证需求：1.3, 10.2**
 */
const paginationConfig = computed(() => ({
  current: brandStore.pagination.current,
  pageSize: brandStore.pagination.pageSize,
  total: filteredBrands.value.length,
  showSizeChanger: !isMobile.value, // 移动设备隐藏页面大小选择器
  showQuickJumper: !isMobile.value, // 移动设备隐藏快速跳转
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
  simple: isMobile.value // 移动设备使用简单分页
}))

/**
 * 处理新增品牌
 * 
 * **验证需求：2.1**
 */
const handleCreate = () => {
  brandStore.setCurrentBrand(null)
  formMode.value = 'create'
  formVisible.value = true
}

/**
 * 处理编辑品牌
 * 
 * @param brand 品牌对象
 * 
 * **验证需求：3.1**
 */
const handleEdit = (brand: Brand) => {
  brandStore.setCurrentBrand(brand)
  formMode.value = 'edit'
  formVisible.value = true
}

/**
 * 处理删除品牌
 * 
 * @param brandId 品牌ID
 * 
 * **验证需求：4.1, 4.2**
 */
const handleDelete = async (brandId: string) => {
  console.log('[BrandManagement] 开始删除品牌:', brandId)

  await withErrorHandling(async () => {
    // 执行删除操作
    await brandStore.deleteBrand(brandId)

    // 显示成功提示
    showSuccess('品牌删除成功')

    // 刷新品牌列表
    await brandStore.refreshBrands()

    // 强制重新渲染表格
    tableKey.value++
  }, '删除品牌失败，请重试')
}

/**
 * 处理搜索输入（带防抖）
 * 
 * 使用 300ms 防抖延迟，避免频繁的搜索请求
 * 
 * **验证需求：5.1**
 */
const handleSearchDebounced = debounce(async (keyword: string) => {
  await withErrorHandling(async () => {
    await brandStore.setSearchKeyword(keyword)
  }, '搜索失败，请重试')
}, 300)

/**
 * 处理搜索输入
 * 
 * **验证需求：5.1**
 */
const handleSearch = async () => {
  // 调用防抖后的搜索函数
  handleSearchDebounced(searchKeyword.value)
}

/**
 * 处理状态筛选
 * 
 * @param value 状态值
 * 
 * **验证需求：5.2**
 */
const handleStatusFilter: SelectProps['onChange'] = async (value) => {
  await withErrorHandling(async () => {
    await brandStore.setFilterStatus(value as BrandStatus | undefined)
  }, '筛选失败，请重试')
}

/**
 * 重置搜索和筛选条件
 * 
 * **验证需求：5.5**
 */
const handleReset = async () => {
  searchKeyword.value = ''
  selectedStatus.value = ''

  await withErrorHandling(async () => {
    await brandStore.resetFilters()
  }, '重置失败，请重试')
}

/**
 * 下载导入模板
 * 
 * **验证需求：6.1, 6.2, 6.3, 6.4, 6.5**
 */
const handleDownloadTemplate = () => {
  try {
    // 生成模板文件
    const blob = excelService.generateBrandTemplate()

    // 生成文件名（格式：品牌导入模板_YYYYMMDD.xlsx）
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `品牌导入模板_${dateStr}.xlsx`

    // 下载文件
    excelService.downloadExcelFile(blob, filename)

    showSuccess('模板下载成功')
  } catch (error: any) {
    console.error('[BrandManagement] 下载模板失败:', error)
    handleError('下载模板失败，请重试')
  }
}

/**
 * 处理文件上传前的验证
 * 
 * @param file 上传的文件
 * @returns false 阻止自动上传
 * 
 * **验证需求：7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**
 */
const handleBeforeUpload: UploadProps['beforeUpload'] = async (file) => {
  console.log('[BrandManagement] 开始处理文件上传:', file.name)

  // 验证文件格式
  const isExcel =
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls')

  if (!isExcel) {
    handleError('请上传 Excel 文件（.xlsx 或 .xls）')
    return false
  }

  // 验证文件大小（最大 5MB）
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    handleError('文件大小不能超过 5MB')
    return false
  }

  await withErrorHandling(async () => {
    // 显示加载提示
    const hide = message.loading('正在解析文件...', 0)

    try {
      // 解析 Excel 文件
      const parseResult = await excelService.parseBrandExcel(file as File)

      if (!parseResult.success || !parseResult.data) {
        // 解析失败
        const errorMsg = parseResult.errors?.join(', ') || '文件解析失败'
        handleError(errorMsg)
        return
      }

      // 批量导入品牌
      const importResult = await brandStore.batchImportBrands(parseResult.data)

      // 显示导入结果
      if (importResult.failed > 0) {
        // 部分失败
        message.warning(
          `导入完成：成功 ${importResult.success} 条，失败 ${importResult.failed} 条`,
          5
        )

        // 显示错误详情
        if (importResult.errors.length > 0) {
          console.error('[BrandManagement] 导入错误详情:', importResult.errors)
          const errorMessages = importResult.errors
            .slice(0, 5) // 只显示前 5 个错误
            .map(err => `第 ${err.row} 行: ${err.message}`)
            .join('\n')
          message.error(errorMessages, 10)
        }
      } else {
        // 全部成功
        showSuccess(`成功导入 ${importResult.success} 条品牌数据`)
      }

      // 强制重新渲染表格
      tableKey.value++
    } finally {
      // 隐藏加载提示
      hide()
    }
  }, '批量导入失败，请检查文件格式')

  // 阻止自动上传
  return false
}

/**
 * 处理表单提交成功
 * 
 * **验证需求：2.5, 3.5**
 */
const handleFormSuccess = async () => {
  // 关闭表单对话框
  formVisible.value = false

  // 刷新品牌列表
  await brandStore.refreshBrands()

  // 强制重新渲染表格
  tableKey.value++
}

/**
 * 监听 store 的搜索关键词和筛选状态，同步到本地状态
 */
watch(
  () => brandStore.searchKeyword,
  (newValue) => {
    if (searchKeyword.value !== newValue) {
      searchKeyword.value = newValue
    }
  }
)

watch(
  () => brandStore.filterStatus,
  (newValue) => {
    const statusValue = newValue || ''
    if (selectedStatus.value !== statusValue) {
      selectedStatus.value = statusValue
    }
  }
)

/**
 * 组件挂载时初始化数据
 * 
 * **验证需求：1.1, 10.1, 10.2, 10.3**
 */
onMounted(async () => {
  console.log('[BrandManagement] 组件挂载，初始化数据')

  // 检查屏幕尺寸
  checkScreenSize()

  // 监听窗口大小变化
  window.addEventListener('resize', checkScreenSize)

  // 初始化本地状态
  searchKeyword.value = brandStore.searchKeyword
  selectedStatus.value = brandStore.filterStatus || ''

  // 如果品牌列表为空，则加载数据
  if (brandStore.brands.length === 0) {
    await withErrorHandling(async () => {
      await brandStore.fetchBrands()
    }, '加载品牌列表失败')
  }
})

/**
 * 组件卸载时清理事件监听器和取消请求
 */
onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
  
  // 取消所有正在进行的请求
  brandStore.cancelAllRequests()
})
</script>

<style scoped>
.brand-management {
  padding: 24px;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.content {
  padding: 20px 0;
}

.search-filter {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.search-filter .ant-row {
  align-items: center;
}

.search-filter .ant-col {
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .search-filter .ant-col {
    margin-bottom: 0;
  }
}

/* 确保在小屏幕上重置按钮有合适的间距 */
@media (max-width: 575px) {
  .search-filter .ant-col:last-child {
    margin-top: 8px;
  }
}

/* 表格样式优化 */
:deep(.ant-table) {
  background: #fff;
  border-radius: 6px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}

/* 操作按钮样式 */
:deep(.ant-btn-link) {
  padding: 0;
  height: auto;
}

/* 响应式设计 - 移动设备优化 */
@media (max-width: 767px) {
  .brand-management {
    padding: 12px;
  }

  .content {
    padding: 12px 0;
  }

  .search-filter {
    padding: 12px;
    margin-bottom: 12px;
  }

  :deep(.ant-card) {
    border-radius: 8px;
  }

  :deep(.ant-card-head) {
    padding: 12px 16px;
    min-height: auto;
  }

  :deep(.ant-card-head-title) {
    font-size: 16px;
    padding: 4px 0;
  }

  :deep(.ant-card-extra) {
    padding: 4px 0;
  }

  :deep(.ant-card-body) {
    padding: 12px;
  }

  /* 移动端按钮组优化 */
  :deep(.ant-space) {
    flex-wrap: wrap;
    gap: 8px !important;
  }

  :deep(.ant-btn) {
    font-size: 14px;
    height: 36px;
    padding: 4px 12px;
  }

  :deep(.ant-btn-icon) {
    font-size: 14px;
  }

  /* 表格移动端优化 */
  :deep(.ant-table) {
    font-size: 13px;
  }

  :deep(.ant-table-thead > tr > th) {
    padding: 8px 4px;
    font-size: 13px;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 4px;
  }

  :deep(.ant-table-cell) {
    word-break: break-word;
  }

  /* 移动端标签优化 */
  :deep(.ant-tag) {
    font-size: 12px;
    padding: 0 6px;
    line-height: 20px;
  }

  /* 移动端操作按钮优化 */
  :deep(.ant-space-item) {
    margin-right: 4px !important;
  }

  :deep(.ant-btn-link) {
    font-size: 13px;
  }

  /* 移动端分页优化 */
  :deep(.ant-pagination) {
    margin-top: 12px;
  }

  :deep(.ant-pagination-simple) {
    text-align: center;
  }

  :deep(.ant-pagination-simple .ant-pagination-simple-pager) {
    margin: 0 8px;
  }

  :deep(.ant-pagination-simple .ant-pagination-simple-pager input) {
    width: 40px;
    margin: 0 4px;
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1023px) {
  .brand-management {
    padding: 16px;
  }

  :deep(.ant-card-head-title) {
    font-size: 18px;
  }

  :deep(.ant-btn) {
    font-size: 14px;
  }

  :deep(.ant-table) {
    font-size: 14px;
  }

  :deep(.ant-table-thead > tr > th),
  :deep(.ant-table-tbody > tr > td) {
    padding: 10px 8px;
  }
}

/* 桌面设备优化 */
@media (min-width: 1024px) {
  .brand-management {
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* 超大屏幕优化 */
@media (min-width: 1600px) {
  .brand-management {
    max-width: 1600px;
  }

  :deep(.ant-table-thead > tr > th),
  :deep(.ant-table-tbody > tr > td) {
    padding: 14px 16px;
  }
}
</style>

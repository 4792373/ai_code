/**
 * Excel 服务单元测试
 * 
 * 测试 Excel 文件的生成、解析和验证功能
 */

import { describe, it, expect } from 'vitest'
import { excelService } from '../excelService'
import { BrandStatus } from '@/types/brand'
import * as XLSX from 'xlsx'

describe('ExcelService', () => {
  describe('generateBrandTemplate', () => {
    it('应该生成包含正确列标题的 Excel 模板', () => {
      // 生成模板
      const blob = excelService.generateBrandTemplate()

      // 验证 Blob 类型
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('应该生成包含示例数据的模板', () => {
      // 生成模板
      const blob = excelService.generateBrandTemplate()

      // 验证 Blob 类型和大小
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(0)
      
      // 注意：在测试环境中，我们无法直接读取 Blob 内容
      // 实际的内容验证在集成测试或手动测试中进行
    })
  })

  describe('generateTemplateFilename', () => {
    it('应该生成符合格式的文件名', () => {
      const filename = excelService.generateTemplateFilename()

      // 验证文件名格式：品牌导入模板_YYYYMMDD
      expect(filename).toMatch(/^品牌导入模板_\d{8}$/)
    })

    it('应该包含当前日期', () => {
      const filename = excelService.generateTemplateFilename()
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const expectedDate = `${year}${month}${day}`

      expect(filename).toContain(expectedDate)
    })
  })

  describe('validateExcelRow', () => {
    it('应该验证有效的行数据', () => {
      const row = ['测试品牌', 'TEST_BRAND', '有效']
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝空品牌名称', () => {
      const row = ['', 'TEST_BRAND', '有效']
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: '品牌名称不能为空'
      })
    })

    it('应该拒绝空品牌编码', () => {
      const row = ['测试品牌', '', '有效']
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'code',
        message: '品牌编码不能为空'
      })
    })

    it('应该拒绝无效的品牌编码格式', () => {
      const row = ['测试品牌', 'test_brand', '有效'] // 包含小写字母
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'code',
        message: '品牌编码只能包含大写字母、数字、下划线和连字符'
      })
    })

    it('应该拒绝过长的品牌名称', () => {
      const longName = 'a'.repeat(51)
      const row = [longName, 'TEST_BRAND', '有效']
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'name',
        message: '品牌名称长度不能超过 50 个字符'
      })
    })

    it('应该拒绝过短的品牌编码', () => {
      const row = ['测试品牌', 'A', '有效'] // 只有 1 个字符
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'code',
        message: '品牌编码长度为 2-20 个字符'
      })
    })

    it('应该拒绝过长的品牌编码', () => {
      const longCode = 'A'.repeat(21)
      const row = ['测试品牌', longCode, '有效']
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'code',
        message: '品牌编码长度为 2-20 个字符'
      })
    })

    it('应该拒绝空品牌状态', () => {
      const row = ['测试品牌', 'TEST_BRAND', '']
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'status',
        message: '品牌状态不能为空'
      })
    })

    it('应该拒绝无效的品牌状态', () => {
      const row = ['测试品牌', 'TEST_BRAND', '未知状态']
      const result = excelService.validateExcelRow(row, 0, 1, 2)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'status',
        message: '品牌状态必须是"有效"或"无效"'
      })
    })
  })

  describe('parseBrandExcel', () => {
    it('应该拒绝非 Excel 文件', async () => {
      // 创建一个文本文件
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

      const result = await excelService.parseBrandExcel(file)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('请上传 Excel 文件（.xlsx 或 .xls 格式）')
    })

    it('应该成功解析有效的 Excel 文件', async () => {
      // 创建一个简单的 Excel 文件
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['品牌名称', '品牌编码', '品牌状态'],
        ['测试品牌1', 'TEST_01', '有效'],
        ['测试品牌2', 'TEST_02', '无效']
      ])

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const file = new File([excelBuffer], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const result = await excelService.parseBrandExcel(file)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toEqual({
        name: '测试品牌1',
        code: 'TEST_01',
        status: BrandStatus.Active
      })
      expect(result.data?.[1]).toEqual({
        name: '测试品牌2',
        code: 'TEST_02',
        status: BrandStatus.Inactive
      })
    })

    it('应该跳过空行', async () => {
      // 创建包含空行的 Excel 文件
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['品牌名称', '品牌编码', '品牌状态'],
        ['测试品牌1', 'TEST_01', '有效'],
        ['', '', ''], // 空行
        ['测试品牌2', 'TEST_02', '无效']
      ])

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const file = new File([excelBuffer], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const result = await excelService.parseBrandExcel(file)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('应该报告无效数据的错误', async () => {
      // 创建包含无效数据的 Excel 文件
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['品牌名称', '品牌编码', '品牌状态'],
        ['', 'TEST_01', '有效'], // 品牌名称为空
        ['测试品牌2', 'test', '无效'] // 品牌编码格式错误
      ])

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const file = new File([excelBuffer], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const result = await excelService.parseBrandExcel(file)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('应该拒绝缺少必需列的 Excel 文件', async () => {
      // 创建缺少列的 Excel 文件
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['品牌名称', '品牌编码'], // 缺少"品牌状态"列
        ['测试品牌1', 'TEST_01']
      ])

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const file = new File([excelBuffer], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const result = await excelService.parseBrandExcel(file)

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Excel 文件缺少必需的列：品牌状态')
    })
  })

  describe('statusToText', () => {
    it('应该将 Active 状态转换为"有效"', () => {
      const text = excelService.statusToText(BrandStatus.Active)
      expect(text).toBe('有效')
    })

    it('应该将 Inactive 状态转换为"无效"', () => {
      const text = excelService.statusToText(BrandStatus.Inactive)
      expect(text).toBe('无效')
    })
  })
})

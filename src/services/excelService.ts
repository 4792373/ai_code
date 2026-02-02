/**
 * Excel 服务层
 * 
 * 提供 Excel 文件的生成、解析和验证功能
 * 用于品牌数据的批量导入和模板下载
 */

import * as XLSX from 'xlsx'
import type {
  CreateBrandDto,
  BrandStatus,
  ParseResult,
  ValidationResult,
  ExcelTemplateRow
} from '@/types/brand'
import { BrandStatus as BrandStatusEnum } from '@/types/brand'

/**
 * Excel 服务类
 * 
 * 使用单例模式，提供 Excel 相关的业务逻辑处理
 */
export class ExcelService {
  private static instance: ExcelService

  /**
   * 获取 Excel 服务单例实例
   * @returns Excel 服务实例
   */
  static getInstance(): ExcelService {
    if (!ExcelService.instance) {
      ExcelService.instance = new ExcelService()
    }
    return ExcelService.instance
  }

  /**
   * 生成品牌导入模板
   * 
   * 创建一个包含列标题和示例数据的 Excel 文件
   * 
   * @returns Excel 文件的 Blob 对象
   * 
   * **验证需求：6.1, 6.2, 6.3**
   */
  generateBrandTemplate(): Blob {
    // 定义列标题
    const headers: (keyof ExcelTemplateRow)[] = ['品牌名称', '品牌编码', '品牌状态']

    // 定义示例数据
    const exampleData: ExcelTemplateRow = {
      '品牌名称': '示例品牌',
      '品牌编码': 'BRAND_01',
      '品牌状态': '有效'
    }

    // 创建工作表数据（包含标题行和示例数据行）
    const worksheetData = [
      headers,
      [exampleData['品牌名称'], exampleData['品牌编码'], exampleData['品牌状态']]
    ]

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 }, // 品牌名称列宽
      { wch: 20 }, // 品牌编码列宽
      { wch: 15 }  // 品牌状态列宽
    ]

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '品牌导入模板')

    // 生成 Excel 文件的二进制数据
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    // 创建 Blob 对象
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  }

  /**
   * 下载 Excel 文件
   * 
   * 触发浏览器下载指定的 Excel 文件
   * 
   * @param blob Excel 文件 Blob
   * @param filename 文件名（不含扩展名）
   * 
   * **验证需求：6.4, 6.5**
   */
  downloadExcelFile(blob: Blob, filename: string): void {
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 生成带日期的文件名
   * 
   * 生成格式为 "品牌导入模板_YYYYMMDD" 的文件名
   * 
   * @returns 文件名（不含扩展名）
   * 
   * **验证需求：6.5**
   */
  generateTemplateFilename(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    
    return `品牌导入模板_${year}${month}${day}`
  }

  /**
   * 解析品牌 Excel 文件
   * 
   * 读取并解析上传的 Excel 文件，提取品牌数据
   * 
   * @param file Excel 文件
   * @returns 解析结果，包含品牌数据数组或错误信息
   * 
   * **验证需求：7.4, 7.5**
   */
  async parseBrandExcel(file: File): Promise<ParseResult<CreateBrandDto[]>> {
    try {
      // 验证文件类型
      const validExtensions = ['.xlsx', '.xls']
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      
      if (!validExtensions.includes(fileExtension)) {
        return {
          success: false,
          errors: ['请上传 Excel 文件（.xlsx 或 .xls 格式）']
        }
      }

      // 读取文件内容
      let arrayBuffer: ArrayBuffer
      
      // 兼容不同环境（浏览器和 Node.js）
      if (typeof file.arrayBuffer === 'function') {
        arrayBuffer = await file.arrayBuffer()
      } else {
        // 在测试环境中，使用 FileReader 或直接读取
        arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as ArrayBuffer)
          reader.onerror = () => reject(reader.error)
          reader.readAsArrayBuffer(file)
        })
      }

      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      // 获取第一个工作表
      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        return {
          success: false,
          errors: ['Excel 文件中没有工作表']
        }
      }

      const worksheet = workbook.Sheets[firstSheetName]

      // 将工作表转换为 JSON 数据
      const rawData = XLSX.utils.sheet_to_json<any>(worksheet, {
        header: 1, // 使用数组格式
        defval: '' // 空单元格默认值
      })

      // 检查是否有数据
      if (rawData.length < 2) {
        return {
          success: false,
          errors: ['Excel 文件中没有数据行']
        }
      }

      // 提取标题行和数据行
      const headers = rawData[0] as string[]
      const dataRows = rawData.slice(1)

      // 验证标题行
      const requiredHeaders = ['品牌名称', '品牌编码', '品牌状态']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        return {
          success: false,
          errors: [`Excel 文件缺少必需的列：${missingHeaders.join('、')}`]
        }
      }

      // 获取列索引
      const nameIndex = headers.indexOf('品牌名称')
      const codeIndex = headers.indexOf('品牌编码')
      const statusIndex = headers.indexOf('品牌状态')

      // 解析数据行
      const brands: CreateBrandDto[] = []
      const errors: string[] = []

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[]
        const rowNumber = i + 2 // Excel 行号（从 1 开始，加上标题行）

        // 跳过空行
        if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
          continue
        }

        // 验证行数据
        const validationResult = this.validateExcelRow(row, nameIndex, codeIndex, statusIndex)
        
        if (!validationResult.valid) {
          errors.push(...validationResult.errors.map(e => `第 ${rowNumber} 行：${e.message}`))
          continue
        }

        // 提取数据
        const name = String(row[nameIndex] || '').trim()
        const code = String(row[codeIndex] || '').trim()
        const statusText = String(row[statusIndex] || '').trim()

        // 转换状态
        const status = this.parseStatus(statusText)
        if (!status) {
          errors.push(`第 ${rowNumber} 行：品牌状态必须是"有效"或"无效"`)
          continue
        }

        // 创建品牌 DTO
        brands.push({
          name,
          code,
          status
        })
      }

      // 如果没有成功解析任何数据
      if (brands.length === 0 && errors.length > 0) {
        return {
          success: false,
          errors
        }
      }

      // 返回解析结果
      return {
        success: true,
        data: brands,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      console.error('解析 Excel 文件失败:', error)
      return {
        success: false,
        errors: ['解析 Excel 文件失败，请检查文件格式是否正确']
      }
    }
  }

  /**
   * 验证 Excel 数据行
   * 
   * 验证单行数据的完整性和格式
   * 
   * @param row Excel 行数据（数组格式）
   * @param nameIndex 品牌名称列索引
   * @param codeIndex 品牌编码列索引
   * @param statusIndex 品牌状态列索引
   * @returns 验证结果
   * 
   * **验证需求：7.5**
   */
  validateExcelRow(
    row: any[],
    nameIndex: number,
    codeIndex: number,
    statusIndex: number
  ): ValidationResult {
    const errors: { field: string; message: string }[] = []

    // 验证品牌名称
    const name = row[nameIndex]
    if (!name || String(name).trim().length === 0) {
      errors.push({
        field: 'name',
        message: '品牌名称不能为空'
      })
    } else if (String(name).trim().length > 50) {
      errors.push({
        field: 'name',
        message: '品牌名称长度不能超过 50 个字符'
      })
    }

    // 验证品牌编码
    const code = row[codeIndex]
    if (!code || String(code).trim().length === 0) {
      errors.push({
        field: 'code',
        message: '品牌编码不能为空'
      })
    } else {
      const codeStr = String(code).trim()
      
      // 验证长度
      if (codeStr.length < 2 || codeStr.length > 20) {
        errors.push({
          field: 'code',
          message: '品牌编码长度为 2-20 个字符'
        })
      }
      
      // 验证格式
      const codePattern = /^[A-Z0-9_-]+$/
      if (!codePattern.test(codeStr)) {
        errors.push({
          field: 'code',
          message: '品牌编码只能包含大写字母、数字、下划线和连字符'
        })
      }
    }

    // 验证品牌状态
    const status = row[statusIndex]
    if (!status || String(status).trim().length === 0) {
      errors.push({
        field: 'status',
        message: '品牌状态不能为空'
      })
    } else {
      const statusText = String(status).trim()
      if (statusText !== '有效' && statusText !== '无效') {
        errors.push({
          field: 'status',
          message: '品牌状态必须是"有效"或"无效"'
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 解析品牌状态文本
   * 
   * 将中文状态文本转换为 BrandStatus 枚举值
   * 
   * @param statusText 状态文本（"有效" 或 "无效"）
   * @returns BrandStatus 枚举值，如果无法解析则返回 null
   */
  private parseStatus(statusText: string): BrandStatus | null {
    const normalizedText = statusText.trim()
    
    switch (normalizedText) {
      case '有效':
        return BrandStatusEnum.Active
      case '无效':
        return BrandStatusEnum.Inactive
      default:
        return null
    }
  }

  /**
   * 将 BrandStatus 枚举值转换为中文文本
   * 
   * @param status BrandStatus 枚举值
   * @returns 中文状态文本
   */
  statusToText(status: BrandStatus): '有效' | '无效' {
    return status === BrandStatusEnum.Active ? '有效' : '无效'
  }
}

/**
 * 导出 Excel 服务单例实例
 * 
 * 可以直接导入使用，无需手动调用 getInstance()
 */
export const excelService = ExcelService.getInstance()

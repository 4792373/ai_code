import type { User } from '@/types/user'
import { UserRole, UserStatus } from '@/types/user'

/**
 * 测试数据生成器配置接口
 */
export interface TestDataConfig {
  /** 生成用户数量 */
  userCount: number
  /** 包含的角色类型 */
  roles: UserRole[]
  /** 包含的状态类型 */
  statuses: UserStatus[]
  /** 支持的语言环境 */
  locales: string[]
}

/**
 * 测试数据生成器类
 * 负责生成符合系统要求的测试用户数据
 */
export class TestDataGenerator {
  private readonly chineseFirstNames = [
    '张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴',
    '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗',
    '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹'
  ]

  private readonly chineseLastNames = [
    '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋',
    '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平',
    '刚', '桂英', '建华', '文', '华', '金凤', '素梅', '建国', '丽娟', '秀兰',
    '建军', '海燕', '雪梅', '春梅', '永强', '志强', '秀珍', '春花', '志明', '建平'
  ]

  private readonly emailDomains = [
    'example.com', 'test.com', 'demo.org', 'sample.net', 'mock.cn',
    'testmail.com', 'demosite.org', 'sampledata.net', 'mockuser.cn', 'devtest.com'
  ]

  private usedEmails = new Set<string>()

  /**
   * 生成指定数量的测试用户数据
   * @param config 测试数据配置
   * @returns 生成的用户数组
   */
  public generateUsers(config: TestDataConfig): User[] {
    this.usedEmails.clear()
    const users: User[] = []
    
    for (let i = 0; i < config.userCount; i++) {
      const user = this.generateSingleUser(config.roles, config.statuses)
      users.push(user)
    }

    return this.ensureUniqueness(users)
  }

  /**
   * 生成单个用户数据
   * @param roles 可用角色列表
   * @param statuses 可用状态列表
   * @returns 生成的用户对象
   */
  private generateSingleUser(roles: UserRole[], statuses: UserStatus[]): User {
    const name = this.generateChineseName()
    const email = this.generateUniqueEmail(name)
    const role = this.getRandomElement(roles)
    const status = this.getRandomElement(statuses)
    const now = new Date()
    
    // 生成创建时间（过去30天内的随机时间）
    const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    // 更新时间在创建时间之后
    const updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()))

    return {
      id: this.generateId(),
      name,
      email,
      role,
      status,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    }
  }

  /**
   * 生成中文姓名
   * @returns 随机生成的中文姓名
   */
  private generateChineseName(): string {
    const firstName = this.getRandomElement(this.chineseFirstNames)
    const lastName = this.getRandomElement(this.chineseLastNames)
    return `${firstName}${lastName}`
  }

  /**
   * 生成唯一的邮箱地址
   * @param name 用户姓名（用于生成邮箱前缀）
   * @returns 唯一的邮箱地址
   */
  private generateUniqueEmail(name: string): string {
    let email: string
    let attempts = 0
    const maxAttempts = 100

    do {
      const prefix = this.generateEmailPrefix(name, attempts)
      const domain = this.getRandomElement(this.emailDomains)
      email = `${prefix}@${domain}`
      attempts++
    } while (this.usedEmails.has(email) && attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      throw new Error('无法生成唯一邮箱地址，请减少用户数量或增加邮箱域名')
    }

    this.usedEmails.add(email)
    return email
  }

  /**
   * 生成邮箱前缀
   * @param name 用户姓名
   * @param attempt 尝试次数（用于确保唯一性）
   * @returns 邮箱前缀
   */
  private generateEmailPrefix(name: string, attempt: number): string {
    // 将中文姓名转换为拼音风格的邮箱前缀
    const pinyinMap: Record<string, string> = {
      '张': 'zhang', '王': 'wang', '李': 'li', '赵': 'zhao', '刘': 'liu',
      '陈': 'chen', '杨': 'yang', '黄': 'huang', '周': 'zhou', '吴': 'wu',
      '徐': 'xu', '孙': 'sun', '马': 'ma', '朱': 'zhu', '胡': 'hu',
      '郭': 'guo', '何': 'he', '高': 'gao', '林': 'lin', '罗': 'luo',
      '郑': 'zheng', '梁': 'liang', '谢': 'xie', '宋': 'song', '唐': 'tang',
      '许': 'xu', '韩': 'han', '冯': 'feng', '邓': 'deng', '曹': 'cao',
      '伟': 'wei', '芳': 'fang', '娜': 'na', '敏': 'min', '静': 'jing',
      '丽': 'li', '强': 'qiang', '磊': 'lei', '军': 'jun', '洋': 'yang',
      '勇': 'yong', '艳': 'yan', '杰': 'jie', '娟': 'juan', '涛': 'tao',
      '明': 'ming', '超': 'chao', '秀英': 'xiuying', '霞': 'xia', '平': 'ping',
      '刚': 'gang', '桂英': 'guiying', '建华': 'jianhua', '文': 'wen', '华': 'hua',
      '金凤': 'jinfeng', '素梅': 'sumei', '建国': 'jianguo', '丽娟': 'lijuan', '秀兰': 'xiulan',
      '建军': 'jianjun', '海燕': 'haiyan', '雪梅': 'xuemei', '春梅': 'chunmei', '永强': 'yongqiang',
      '志强': 'zhiqiang', '秀珍': 'xiuzhen', '春花': 'chunhua', '志明': 'zhiming', '建平': 'jianping'
    }

    let prefix = ''
    for (const char of name) {
      const pinyin = pinyinMap[char]
      if (pinyin) {
        prefix += pinyin
      } else {
        // 如果没有找到对应的拼音，使用字符的Unicode编码生成简短标识
        prefix += 'u' + char.charCodeAt(0).toString(16)
      }
    }

    // 如果有重复尝试，添加数字后缀
    if (attempt > 0) {
      prefix += (attempt + 1).toString()
    }

    return prefix
  }

  /**
   * 生成唯一ID
   * @returns 唯一标识符
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  /**
   * 从数组中随机选择一个元素
   * @param array 源数组
   * @returns 随机选择的元素
   */
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  /**
   * 确保用户数据的唯一性
   * @param users 用户数组
   * @returns 去重后的用户数组
   */
  private ensureUniqueness(users: User[]): User[] {
    const uniqueUsers: User[] = []
    const seenEmails = new Set<string>()
    const seenIds = new Set<string>()

    for (const user of users) {
      if (!seenEmails.has(user.email) && !seenIds.has(user.id)) {
        seenEmails.add(user.email)
        seenIds.add(user.id)
        uniqueUsers.push(user)
      }
    }

    return uniqueUsers
  }

  /**
   * 生成默认测试数据配置
   * @returns 默认配置对象
   */
  public static getDefaultConfig(): TestDataConfig {
    return {
      userCount: 25, // 生成25个用户，超过最低要求的20个
      roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER],
      statuses: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.PENDING],
      locales: ['zh-CN']
    }
  }

  /**
   * 生成默认测试用户数据
   * @returns 生成的用户数组
   */
  public static generateDefaultUsers(): User[] {
    const generator = new TestDataGenerator()
    const config = TestDataGenerator.getDefaultConfig()
    return generator.generateUsers(config)
  }

  /**
   * 验证生成的用户数据是否符合要求
   * @param users 用户数组
   * @param config 配置要求
   * @returns 验证结果
   */
  public static validateGeneratedData(users: User[], config: TestDataConfig): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // 检查用户数量
    if (users.length < config.userCount) {
      errors.push(`用户数量不足：期望 ${config.userCount}，实际 ${users.length}`)
    }

    // 检查邮箱唯一性
    const emails = users.map(u => u.email)
    const uniqueEmails = new Set(emails)
    if (emails.length !== uniqueEmails.size) {
      errors.push('存在重复的邮箱地址')
    }

    // 检查ID唯一性
    const ids = users.map(u => u.id)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      errors.push('存在重复的用户ID')
    }

    // 检查角色覆盖
    const userRoles = new Set(users.map(u => u.role))
    for (const role of config.roles) {
      if (!userRoles.has(role)) {
        errors.push(`缺少角色类型：${role}`)
      }
    }

    // 检查状态覆盖
    const userStatuses = new Set(users.map(u => u.status))
    for (const status of config.statuses) {
      if (!userStatuses.has(status)) {
        errors.push(`缺少状态类型：${status}`)
      }
    }

    // 检查必需字段
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      if (!user.id) errors.push(`用户 ${i + 1} 缺少ID`)
      if (!user.name) errors.push(`用户 ${i + 1} 缺少姓名`)
      if (!user.email) errors.push(`用户 ${i + 1} 缺少邮箱`)
      if (!user.role) errors.push(`用户 ${i + 1} 缺少角色`)
      if (!user.status) errors.push(`用户 ${i + 1} 缺少状态`)
      if (!user.createdAt) errors.push(`用户 ${i + 1} 缺少创建时间`)
      if (!user.updatedAt) errors.push(`用户 ${i + 1} 缺少更新时间`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 导出单例实例
 */
export const testDataGenerator = new TestDataGenerator()

/**
 * 便捷函数：生成默认测试数据
 */
export function generateTestUsers(count?: number): User[] {
  const config = TestDataGenerator.getDefaultConfig()
  if (count) {
    config.userCount = count
  }
  return testDataGenerator.generateUsers(config)
}
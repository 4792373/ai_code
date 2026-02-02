# 语言偏好设置

## 默认语言

本项目的所有交互、文档和代码注释应使用**中文（简体）**。

## 适用范围

- AI 助手的所有回复应使用中文
- 生成的代码注释使用中文
- 生成的文档和 Markdown 文件使用中文
- 提交信息（commit messages）使用中文
- 错误消息和日志使用中文
- 测试用例描述使用中文

## 例外情况

以下内容可以使用英文：

- 代码中的变量名、函数名、类名等标识符（遵循编程规范）
- 第三方库和框架的 API 调用
- 技术术语的英文原文（可在括号中标注，如：组合式函数 (Composable)）
- npm 包名、命令行指令等技术性内容

## 代码注释示例

```typescript
// ✅ 推荐：使用中文注释
/**
 * 获取用户列表
 * @param filters 筛选条件
 * @returns 用户数组
 */
function getUserList(filters: UserFilters): User[] {
  // 实现逻辑...
}

// ❌ 避免：使用英文注释
/**
 * Get user list
 * @param filters Filter conditions
 * @returns User array
 */
```

## 文档编写规范

- 标题和正文使用中文
- 技术术语首次出现时可标注英文原文
- 代码示例中的注释使用中文
- 命令行示例的说明使用中文

/**
 * 防抖工具函数
 * 
 * 防抖（Debounce）：在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 * 
 * **使用场景**：
 * - 搜索框输入：用户停止输入后才发送请求
 * - 窗口大小调整：窗口调整完成后才执行回调
 * - 按钮点击：防止用户快速多次点击
 * 
 * @param func 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    // 清除之前的定时器
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    // 设置新的定时器
    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流工具函数
 * 
 * 节流（Throttle）：规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 * 
 * **使用场景**：
 * - 滚动事件：限制滚动事件的触发频率
 * - 鼠标移动：限制鼠标移动事件的触发频率
 * - 按钮点击：限制按钮点击的频率
 * 
 * @param func 需要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(this, args)
    }
  }
}

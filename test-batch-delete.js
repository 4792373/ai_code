// 测试批量删除功能的脚本
// 在浏览器控制台中运行

console.log('=== 开始测试批量删除功能 ===')

// 1. 获取用户列表
fetch('/api/users')
  .then(res => res.json())
  .then(data => {
    console.log('1. 获取用户列表:', data)
    
    if (data.data && data.data.length >= 2) {
      const userIds = [data.data[0].id, data.data[1].id]
      console.log('2. 准备删除的用户 ID:', userIds)
      
      // 2. 执行批量删除
      return fetch('/api/users/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds })
      })
    } else {
      throw new Error('用户数量不足，无法测试批量删除')
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('3. 批量删除响应:', data)
    
    // 3. 再次获取用户列表验证
    return fetch('/api/users')
  })
  .then(res => res.json())
  .then(data => {
    console.log('4. 删除后的用户列表:', data)
    console.log('=== 测试完成 ===')
  })
  .catch(error => {
    console.error('测试失败:', error)
  })

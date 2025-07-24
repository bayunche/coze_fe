/**
 * 组件测试工具
 * 用于验证重构后的组件功能是否正常
 */

/**
 * 切换到重构后的组件
 */
export function enableRefactoredComponents() {
  localStorage.setItem('useRefactoredComponents', 'true')
  console.log('✅ 已启用重构后的组件')
  location.reload()
}

/**
 * 切换到原始组件
 */
export function enableOriginalComponents() {
  localStorage.setItem('useRefactoredComponents', 'false')
  console.log('✅ 已启用原始组件')
  location.reload()
}

/**
 * 获取当前使用的组件类型
 */
export function getCurrentComponentType() {
  const useRefactored = localStorage.getItem('useRefactoredComponents') === 'true'
  return useRefactored ? '重构后的组件' : '原始组件'
}

/**
 * 组件功能测试清单
 */
export const testChecklist = [
  '✓ 消息显示正常',
  '✓ 标签页切换功能',
  '✓ 清空消息功能', 
  '✓ 查看解析结果按钮',
  '✓ 物资信息确认按钮',
  '✓ 消息队列和动画',
  '✓ 滚动到底部功能',
  '✓ 流式消息显示',
  '✓ 进度条显示',
  '✓ 响应式布局'
]

/**
 * 在控制台打印测试指南
 */
export function printTestGuide() {
  console.log(`
🔧 组件重构测试指南
==================

当前使用: ${getCurrentComponentType()}

快速切换方法:
1. 双击 Ctrl 键快速切换
2. 控制台命令:
   - enableRefactoredComponents() // 启用重构组件
   - enableOriginalComponents()   // 启用原始组件

测试清单:
${testChecklist.join('\n')}

环境变量控制:
- 在 .env.development 中设置 VITE_USE_REFACTORED_COMPONENTS=true

注意事项:
- 确保两个版本功能完全一致
- 测试不同的消息类型和工作流
- 验证所有交互功能正常
  `)
}

// 如果在开发环境，自动打印测试指南
if (import.meta.env.DEV) {
  console.log('🚀 组件重构测试工具已加载')
  console.log('输入 printTestGuide() 查看测试指南')
  
  // 将函数添加到全局对象，方便在控制台调用
  if (typeof window !== 'undefined') {
    window.enableRefactoredComponents = enableRefactoredComponents
    window.enableOriginalComponents = enableOriginalComponents
    window.getCurrentComponentType = getCurrentComponentType
    window.printTestGuide = printTestGuide
  }
}
// 文件下载工具函数
import { ElMessage } from 'element-plus'

/**
 * 获取API基础路径
 * @returns {string} API基础路径
 */
export const getApiBaseUrl = () => {
  // 根据环境变量获取基础API路径
  return import.meta.env.VITE_APP_BASE_API || '/api'
}

/**
 * 通用文件下载函数
 * @param {string} filePath - 文件相对路径，由上传接口返回的filePath字段
 * @param {string} [fileName] - 可选的文件名，如果不提供则从filePath中提取 (暂未使用)
 * @returns {void}
 */
export const downloadFileByPath = (filePath, fileName) => {
  // eslint-disable-line no-unused-vars
  try {
    // 参数验证
    if (!filePath || typeof filePath !== 'string') {
      ElMessage.error('文件路径无效')
      return
    }

    // 构建下载URL
    const baseUrl = getApiBaseUrl()
    const downloadUrl = `${baseUrl}/files/download?filePath=${encodeURIComponent(filePath)}`

    console.log('文件下载URL:', downloadUrl)

    // 在新窗口中打开下载链接
    window.open(downloadUrl, '_blank')
  } catch (error) {
    console.error('文件下载失败:', error)
    ElMessage.error('文件下载失败: ' + (error.message || '未知错误'))
  }
}

/**
 * 从任务详情行数据中下载源文件
 * @param {object} row - 任务详情行数据
 * @param {string} [filePathField='filePath'] - 文件路径字段名，默认为'filePath'
 * @param {string} [fileNameField='fileName'] - 文件名字段名，默认为'fileName'
 * @returns {void}
 */
export const downloadSourceFile = (row, filePathField = 'filePath', fileNameField = 'fileName') => {
  try {
    if (!row || typeof row !== 'object') {
      ElMessage.error('任务数据无效')
      return
    }

    // 获取文件路径
    const filePath = row[filePathField] || row.path || row.sourceFilePath || row.fileUrl
    const fileName = row[fileNameField] || row.name || row.sourceFileName || row.fileName

    if (!filePath) {
      ElMessage.error('源文件路径不存在，无法下载')
      console.warn('任务详情数据中缺少文件路径:', row)
      return
    }

    // 调用通用下载函数
    downloadFileByPath(filePath, fileName)
  } catch (error) {
    console.error('下载源文件失败:', error)
    ElMessage.error('下载源文件失败: ' + (error.message || '未知错误'))
  }
}

/**
 * 处理文件下载错误的统一方法
 * @param {Error} error - 错误对象
 * @param {string} [context='文件下载'] - 错误上下文描述
 */
export const handleDownloadError = (error, context = '文件下载') => {
  console.error(`${context}失败:`, error)

  let errorMessage = '未知错误'

  if (error.message) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  ElMessage.error(`${context}失败: ${errorMessage}`)
}

/**
 * 验证文件下载参数
 * @param {object} params - 参数对象
 * @param {string} params.filePath - 文件路径
 * @param {string} [params.fileName] - 文件名 (暂未使用)
 * @returns {boolean} 参数是否有效
 */
export const validateDownloadParams = ({ filePath, fileName }) => {
  // eslint-disable-line no-unused-vars
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    return false
  }

  // 检查是否包含可能的安全风险路径
  if (filePath.includes('..') || filePath.includes('~')) {
    console.warn('检测到可能不安全的文件路径:', filePath)
    return false
  }

  return true
}

// import request from '@/utils/request.js' // 暂时不需要，因为直接使用浏览器下载

/**
 * 任务文件服务类
 * 提供任务文件下载相关的功能
 */
class TaskFileService {
  /**
   * 根据任务ID下载任务文件
   * 如果任务下只有一个文件，则直接下载该文件
   * 如果任务下有多个文件，则将所有文件打包成ZIP压缩包进行下载
   *
   * @param {string} taskId - 任务ID
   * @returns {Promise<void>} 无返回值，直接触发浏览器下载
   */
  async downloadTaskFiles(taskId) {
    try {
      console.log('【TaskFileService】开始下载任务文件，任务ID:', taskId)

      if (!taskId) {
        throw new Error('任务ID不能为空')
      }

      // 直接使用浏览器下载，不需要通过 axios
      const baseUrl = import.meta.env.VITE_APP_BASE_API || '/api'
      const downloadUrl = `${baseUrl}/tasks/download-files/${taskId}`

      console.log('【TaskFileService】下载URL:', downloadUrl)

      // 创建一个隐藏的a标签来下载文件
      const link = document.createElement('a')
      link.href = downloadUrl
      link.style.display = 'none'

      // 添加下载属性以确保文件被下载而不是在浏览器中打开
      link.download = ''

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('【TaskFileService】文件下载请求已发送')
    } catch (error) {
      console.error('【TaskFileService】下载任务文件失败:', error)
      throw error
    }
  }

  /**
   * 检查任务是否有关联文件
   * 这是一个辅助方法，可以在下载前检查任务状态
   *
   * @param {string} taskId - 任务ID
   * @returns {Promise<boolean>} 是否有文件可下载
   */
  async hasTaskFiles(taskId) {
    try {
      console.log('【TaskFileService】检查任务文件，任务ID:', taskId)

      if (!taskId) {
        return false
      }

      // 这里可以根据需要调用相关API检查文件存在性
      // 目前先简单返回true，让下载接口自己处理文件不存在的情况
      return true
    } catch (error) {
      console.error('【TaskFileService】检查任务文件失败:', error)
      return false
    }
  }

  /**
   * 获取任务文件信息（如果后续需要的话）
   *
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 文件信息
   */
  async getTaskFileInfo(taskId) {
    try {
      console.log('【TaskFileService】获取任务文件信息，任务ID:', taskId)

      if (!taskId) {
        throw new Error('任务ID不能为空')
      }

      // 这里可以调用获取文件信息的API
      // 目前返回基本信息
      return {
        taskId,
        hasFiles: await this.hasTaskFiles(taskId)
      }
    } catch (error) {
      console.error('【TaskFileService】获取任务文件信息失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const taskFileService = new TaskFileService()

export default taskFileService
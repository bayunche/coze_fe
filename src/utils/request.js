import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // api 的 base_url
  timeout: 30000 // 请求超时时间，增加到 30 秒
})

// request 拦截器
service.interceptors.request.use(
  (config) => {
    // 这里可以添加 token 等请求头
    return config
  },
  (error) => {
    console.log(error) // for debug
    Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  (response) => {
    // 如果是流式响应，直接返回 response，不进行常规的错误处理
    if (response.config.responseType === 'stream') {
      return response
    }

    const res = response.data
    // 检查是否是文件下载响应
    if (res.fileName && res.filePath) {
      return res
    }
    
    // 检查是否是分页数据结构（没有code字段，但有content和pageable字段）
    if (res.content && res.pageable && typeof res.totalElements === 'number') {
      // 这是分页数据，直接返回包装后的结构
      return {
        code: 200,
        data: res,
        message: 'Success'
      }
    }
    
    // 检查是否已经有code字段的标准响应格式
    if (res.code !== undefined) {
      // 根据实际业务逻辑判断请求是否成功
      if (res.code !== 20000 && res.code !== 200) {
        // 假设 20000 或 200 为成功状态码
        ElMessage({
          message: res.message || 'Error',
          type: 'error',
          duration: 5 * 1000
        })
        // 50008:非法的token; 50012:其他客户端登录了; 50014:Token 过期了;
        if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
          // 可以根据需要处理重新登录等逻辑
        }
        return Promise.reject(new Error(res.message || 'Error'))
      } else {
        return res
      }
    } else {
      // 没有code字段，认为是成功的响应，直接返回
      return {
        code: 200,
        data: res,
        message: 'Success'
      }
    }
  },
  (error) => {
    console.log('err' + error) // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service

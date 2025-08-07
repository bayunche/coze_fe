// 聚合分析结果服务
import axios from 'axios'

class AnalysisResultsService {
  constructor() {
    // 使用现有的API代理配置
    this.baseURL = '/api/smart-brain'
    
    // 创建axios实例
    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器
    this.http.interceptors.request.use(
      (config) => {
        console.log('发送聚合分析结果请求:', config)
        return config
      },
      (error) => {
        console.error('聚合分析结果请求错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.http.interceptors.response.use(
      (response) => {
        console.log('聚合分析结果响应:', response.data)
        return response
      },
      (error) => {
        console.error('聚合分析结果响应错误:', error)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 查询聚合分析结果
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（从0开始）
   * @param {number} params.size - 每页条数
   * @param {string} params.sort - 排序字段
   * @returns {Promise<Object>} 分页响应数据
   */
  async getAnalysisResults(params = {}) {
    try {
      const response = await this.http.get('/analysis-results', {
        params: {
          page: params.page || 0,
          size: params.size || 10,
          sort: params.sort || undefined
        }
      })

      return {
        success: true,
        data: response.data,
        message: '获取聚合分析结果成功'
      }
    } catch (error) {
      console.error('获取聚合分析结果失败:', error)
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || '获取聚合分析结果失败'
      }
    }
  }

  /**
   * 处理动态字段，将英文字段名转换为中文表头
   * @param {Array} content - API返回的content数组
   * @returns {Object} 包含tableData和tableColumns的对象
   */
  processAnalysisResults(content) {
    if (!Array.isArray(content) || content.length === 0) {
      return {
        tableData: [],
        tableColumns: []
      }
    }

    // 收集所有可能的动态字段
    const allFields = new Set()
    
    content.forEach(item => {
      if (item.dynamicFields && typeof item.dynamicFields === 'object') {
        Object.keys(item.dynamicFields).forEach(field => {
          allFields.add(field)
        })
      }
    })

    // 生成表格列配置，包含基础字段和动态字段
    const baseColumns = [
      { prop: 'taskDetailId', label: '任务详情ID', width: 200, fixed: 'left' },
      { prop: 'taskId', label: '任务ID', width: 150 },
      { prop: 'baseDataId', label: '基础数据ID', width: 150 },
      { prop: 'resultStatus', label: '解析状态', width: 100 }
    ]

    const dynamicColumns = Array.from(allFields).map(field => ({
      prop: field,
      label: this.translateDynamicFieldHeader(field),
      minWidth: 120,
      showOverflowTooltip: true
    }))

    const tableColumns = [...baseColumns, ...dynamicColumns]

    // 处理表格数据，合并基础字段和动态字段
    const tableData = content.map(item => {
      const row = {
        taskDetailId: item.taskDetailId,
        taskId: item.taskId,
        baseDataId: item.baseDataId,
        resultStatus: this.formatResultStatus(item.resultStatus)
      }

      // 添加动态字段
      if (item.dynamicFields && typeof item.dynamicFields === 'object') {
        Object.keys(item.dynamicFields).forEach(field => {
          row[field] = item.dynamicFields[field]
        })
      }

      return row
    })

    return {
      tableData,
      tableColumns
    }
  }

  /**
   * 翻译动态字段表头
   * @param {string} field - 英文字段名
   * @returns {string} 中文表头
   */
  translateDynamicFieldHeader(field) {
    // 扩展的字段映射，基于现有的headerMapping
    const dynamicHeaderMapping = {
      // 基础字段
      taskDetailId: '任务详情ID',
      taskId: '任务ID',
      baseDataId: '基础数据ID',
      resultStatus: '解析状态',
      
      // 合同相关字段
      contract_name: '合同名称',
      contract_number: '合同编号',
      contract_amount: '合同金额',
      name: '合同名称',
      number: '合同编号',
      money: '合同金额',
      pay_result: '付款依据',
      sign_time: '签订时间',
      signing_time: '签订时间',
      fixed_rate: '包干率',
      safety_rate: '安全文明施工费是否下浮',
      temporary_rate: '临时设施费是否下浮',
      anquan_rate: '安全文明施工费是否下浮',
      linshi_rate: '临时设施费是否下浮',
      
      // 物资相关字段
      material_name: '物资名称',
      material_specification: '物资规格',
      material_spec: '物资规格',
      specification: '规格型号',
      spec: '规格型号',
      quantity: '数量',
      unit: '单位',
      price: '单价',
      unit_price: '单价',
      total_price: '总价',
      amount: '金额',
      remark: '备注',
      remarks: '备注',
      note: '备注',
      
      // 乙供物资相关
      supplier_material_name: '乙供物资名称',
      supplier_material_spec: '乙供物资规格',
      supplier_price: '乙供物资价格',
      matched_name: '匹配物资名称',
      matched_specification: '匹配规格型号',
      matched_price: '匹配价格',
      similarity: '相似度',
      match_type: '匹配类型',
      
      // 甲供物资相关
      owner_material_name: '甲供物资名称',
      owner_material_spec: '甲供物资规格',
      owner_price: '甲供物资价格',
      supplier: '供应商',
      delivery_date: '交付日期',
      
      // 通用字段
      id: '编号',
      ID: 'ID',
      status: '状态',
      type: '类型',
      category: '类别',
      description: '描述',
      created_at: '创建时间',
      updated_at: '更新时间',
      
      // 中文字段保持原样
      '物资名称': '物资名称',
      '规格型号': '规格型号',
      '数量': '数量',
      '单位': '单位',
      '单价': '单价',
      '总价': '总价',
      '备注': '备注'
    }

    return dynamicHeaderMapping[field] || field
  }

  /**
   * 格式化解析状态
   * @param {number} status - 状态值
   * @returns {string} 状态文本
   */
  formatResultStatus(status) {
    const statusMap = {
      0: '未确认',
      1: '已确认'
    }
    return statusMap[status] || '未知'
  }

  /**
   * 格式化单元格值
   * @param {*} value - 原始值
   * @param {string} prop - 字段名
   * @returns {*} 格式化后的值
   */
  formatCellValue(value, prop) {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    // 特殊处理解析状态
    if (prop === 'resultStatus') {
      return this.formatResultStatus(value)
    }

    // 处理布尔值
    if (typeof value === 'boolean') {
      return value ? '是' : '否'
    }

    // 处理数字0和1转换为是/否
    if (typeof value === 'number' && (value === 0 || value === 1)) {
      // 对于特定字段，0/1表示是否
      const booleanFields = ['safety_rate', 'temporary_rate', 'anquan_rate', 'linshi_rate']
      if (booleanFields.includes(prop)) {
        return value === 1 ? '是' : '否'
      }
    }

    return value
  }
}

export default AnalysisResultsService
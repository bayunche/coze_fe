// src/utils/helpers.js

// 表头中英文映射 (从 HomeView.vue 迁移过来)
const headerMapping = {
  name: '合同名称',
  number: '合同编号',
  money: '合同金额',
  pay_result: '付款依据',
  sign_time: '签订时间',
  fixed_rate: '包干率',
  anquan_rate: '安全文明施工费是否下浮',
  linshi_rate: '临时设施费是否下浮',
  position: '职位',
  salary: '薪水',
  hire_date: '入职日期',
  id: '编号',
  task_id: '任务ID',
  status: '状态',
  created_at: '创建时间',
  updated_at: '更新时间',
  description: '描述',
  result: '结果',
  total_documents_count: '总文档数',
  processed_documents_count: '处理文档数',
  error_documents_count: '失败文档数',
  progress: '进度',
  file_count: '文件总数',
  file_done_count: '已完成文件数量',
  contract_name: '合同名称',
  contract_number: '合同编号',
  contract_amount: '合同金额',
  pay_result: '付款依据',
  signing_time: '签订时间',
  fixed_rate: '包干率',
  safety_rate: '安全文明施工费是否下浮',
  temporary_rate: '临时设施费是否下浮',
  result_status: '解析状态',
  salary: '薪水',
  hire_date: '入职日期',
  ID: 'ID',
  物资名称: '物资名称',
  规格型号: '规格型号',
  数量: '数量',
  单位: '单位',
  单价: '单价',
  总价: '总价',
  备注: '备注',
  material_name: '乙供物资名称',
  material_specification: '乙供物资规格型号',
  material_price: '乙供物资价格',
  matched_name: '匹配物资名称',
  matched_specification: '匹配规格型号',
  matched_price: '匹配价格',
  similarity: '相似度',
  match_type: '匹配类型'
};

export const translateHeader = (prop) => {
  return headerMapping[prop] || prop;
};

export const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '/';
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  return value;
};

export const formatDuration = (seconds) => {
  if (seconds < 0) seconds = 0;

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  let parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
};

// 模拟结果生成函数 (从 HomeView.vue 迁移过来)
export const generateMockResult = (func, duration) => {
  const baseResult = {
    status: 'success',
    duration,
    totalSteps: func.steps ? func.steps.length : 0,
    processedItems: Math.floor(Math.random() * 1000) + 100,
    successRate: Math.floor(Math.random() * 20) + 80,
    timestamp: new Date().toLocaleString()
  };

  switch (func.id) {
    case 'chat':
      return {
        ...baseResult,
        output: `基于您的输入，我为您生成了以下回复：\n\n这是一个智能生成的对话回复示例。AI系统已经分析了您的问题，并提供了相关的解答。本次对话处理了${baseResult.processedItems}个token，生成质量评分为${baseResult.successRate}%。`,
        files: []
      };

    case 'analysis':
      return {
        ...baseResult,
        output: [
          { 指标: '平均值', 数值: '156.78', 单位: '' },
          { 指标: '标准差', 数值: '23.45', 单位: '' },
          { 指标: '最大值', 数值: '298.12', 单位: '' },
          { 指标: '最小值', 数值: '45.23', 单位: '' },
          { 指标: '相关系数', 数值: '0.87', 单位: '' }
        ],
        files: [
          { name: 'analysis_report.pdf', size: '2.3MB', url: '#' },
          { name: 'data_visualization.png', size: '856KB', url: '#' }
        ]
      };

    case 'documents':
      return {
        ...baseResult,
        output: `文档处理完成！\n\n摘要内容：\n本文档主要讨论了人工智能在现代企业中的应用场景和发展趋势。通过分析多个案例，文档总结了AI技术的核心优势和实施挑战。\n\n关键词：人工智能、企业应用、数字化转型、机器学习\n\n处理统计：\n- 总页数：${
          Math.floor(Math.random() * 50) + 10
        }页\n- 段落数：${baseResult.processedItems}段\n- 关键词提取：${
          Math.floor(Math.random() * 20) + 10
        }个`,
        files: [
          { name: 'document_summary.txt', size: '45KB', url: '#' },
          { name: 'keywords_extracted.json', size: '12KB', url: '#' }
        ]
      };

    case 'search':
      return {
        ...baseResult,
        output: [
          { 标题: 'AI技术发展现状', 相关度: '95%', 来源: '技术报告' },
          { 标题: '机器学习最佳实践', 相关度: '92%', 来源: '学术论文' },
          { 标题: '企业AI应用案例', 相关度: '88%', 来源: '案例研究' },
          { 标题: '深度学习算法优化', 相关度: '85%', 来源: '技术文档' }
        ],
        files: []
      };

    case 'automation':
      return {
        ...baseResult,
        output: `自动化任务执行完成！\n\n执行摘要：\n- 批处理文件：${
          Math.floor(Math.random() * 50) + 10
        }个\n- 成功处理：${Math.floor(
          (baseResult.processedItems * baseResult.successRate) / 100
        )}个\n- 失败处理：${
          baseResult.processedItems -
          Math.floor((baseResult.processedItems * baseResult.successRate) / 100)
        }个\n- 平均处理时间：${(Math.random() * 2 + 0.5).toFixed(
          2
        )}秒/文件\n\n所有任务已按照预设规则自动执行完成，详细日志已保存。`,
        files: [
          { name: 'automation_log.txt', size: '128KB', url: '#' },
          { name: 'processed_files.zip', size: '15.6MB', url: '#' }
        ]
      };

    case 'ownerSuppliedMaterialParsing':
      return {
        ...baseResult,
        output: [
          {
            物资名称: '钢筋',
            规格型号: 'HRB400',
            数量: 100,
            单位: '吨',
            单价: 4500,
            总价: 450000,
            备注: '模拟数据'
          },
          {
            物资名称: '水泥',
            规格型号: 'PO 42.5',
            数量: 50,
            单位: '吨',
            单价: 300,
            总价: 15000,
            备注: '模拟数据'
          },
          {
            物资名称: '砂石',
            规格型号: '中砂',
            数量: 200,
            单位: '立方米',
            单价: 120,
            总价: 24000,
            备注: '模拟数据'
          }
        ],
        files: [
          { name: '甲供物资解析报告.pdf', size: '1.2MB', url: '#' },
          { name: '甲供物资清单.xlsx', size: '50KB', url: '#' }
        ]
      };

    default:
      return {
        ...baseResult,
        output: '任务执行完成，结果已生成。',
        files: []
      };
  }
};
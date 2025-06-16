import {
  ChatDotRound,
  DataAnalysis,
  Document,
  Search,
  Lightning,
  DocumentCopy,
  Cpu
} from '@element-plus/icons-vue'

export const functions = [
  {
    id: 'smartBrain',
    name: '智能大脑',
    icon: Cpu,
    iconClass: 'text-green-500',
    workflows: [],
    params: [],
    steps: [],
    needsFiles: false
  },
  {
    id: 'contractParsing',
    name: '合同解析',
    icon: DocumentCopy,
    iconClass: 'text-blue-500',
    workflows: ['解析合同'],
    params: [],
    steps: [
      { name: '上传文件', description: '将文件上传至服务器' },
      { name: '文件解析', description: '调用Coze工作流进行解析' },
      { name: '解析完毕', description: '' }
    ],
    needsFiles: true,
    allowedTypes: '.pdf,.docx,.txt'
  },
  {
    id: 'supplierMaterialParsing',
    name: '乙供物资解析',
    icon: Document,
    iconClass: 'text-yellow-500',
    workflows: ['解析乙供物资'],
    params: [],
    steps: [
      { name: '上传文件', description: '将乙供物资Excel文件上传至服务器' },
      { name: '文件解析', description: '调用工作流进行解析' },
      { name: '解析完毕', description: '完成乙供物资数据提取' }
    ],
    needsFiles: true,
    allowedTypes: '.xlsx,.xls'
  },

  {
    id: 'analysis',
    name: '数据分析',
    icon: DataAnalysis,
    iconClass: 'text-purple-500',
    workflows: ['统计分析', '趋势预测', '异常检测'],
    params: [
      {
        key: 'analysisType',
        label: '分析类型',
        type: 'select',
        options: [
          { label: '描述性分析', value: 'descriptive' },
          { label: '预测分析', value: 'predictive' },
          { label: '诊断分析', value: 'diagnostic' }
        ]
      },
      { key: 'confidence', label: '置信度', type: 'number', min: 0.8, max: 0.99, step: 0.01 },
      { key: 'includeVisualization', label: '生成图表', type: 'boolean' }
    ],
    steps: [
      { name: '数据加载', description: '读取并验证数据文件' },
      { name: '数据清洗', description: '处理缺失值和异常值' },
      { name: '特征工程', description: '提取和构造特征' },
      { name: '模型分析', description: '执行统计分析' },
      { name: '结果生成', description: '生成分析报告' }
    ],
    needsFiles: true,
    allowedTypes: '.csv,.xlsx,.json'
  }
]

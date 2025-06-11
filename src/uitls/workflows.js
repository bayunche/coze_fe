import {
  ChatDotRound,
  DataAnalysis,
  Document,
  Search,
  Lightning,
  DocumentCopy
} from '@element-plus/icons-vue'

export const functions = [
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
    id: 'chat',
    name: '智能对话',
    icon: ChatDotRound,
    iconClass: 'text-green-500',
    workflows: ['问答生成', '对话摘要'],
    params: [
      {
        key: 'model',
        label: '模型选择',
        type: 'select',
        options: [
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-3.5', value: 'gpt-3.5' },
          { label: 'Claude', value: 'claude' }
        ]
      },
      { key: 'temperature', label: '创造性', type: 'number', min: 0, max: 1, step: 0.1 },
      { key: 'maxTokens', label: '最大长度', type: 'number', min: 100, max: 4000 }
    ],
    steps: [
      { name: '加载模型', description: '初始化AI对话模型' },
      { name: '处理输入', description: '分析用户输入内容' },
      { name: '生成回复', description: '生成智能回复内容' },
      { name: '后处理', description: '优化输出格式' }
    ],
    needsFiles: false
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

// WorkflowExecutionPanel 组件工具函数

export const getExecutionStepText = (step) => {
  const stepTexts = {
    init: '初始化',
    uploading: '上传文件',
    processing: '处理中',
    complete: '完成'
  }
  return stepTexts[step] || '未知'
}

export const calculateStepProgress = (currentStep, totalSteps) => {
  return Math.round((currentStep / totalSteps) * 100)
}
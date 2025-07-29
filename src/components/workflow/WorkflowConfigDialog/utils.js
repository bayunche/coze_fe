import { ElMessage } from 'element-plus'
import { 
  WORKFLOW_NAMES, 
  FILE_UPLOAD_CONFIG, 
  OWNER_MATERIAL_EXCEL_TYPES,
  VALIDATION_MESSAGES 
} from './constants.js'

/**
 * 判断是否为甲供物资工作流
 * @param {string} functionName - 功能名称
 * @returns {boolean}
 */
export const isOwnerMaterialWorkflow = (functionName) => {
  return functionName === WORKFLOW_NAMES.OWNER_MATERIAL
}

/**
 * 处理文件上传前验证
 * @param {File} rawFile - 原始文件
 * @param {Array} allowedTypes - 允许的文件类型
 * @returns {boolean}
 */
export const validateFileBeforeUpload = (rawFile, allowedTypes) => {
  const fileExtension = `.${rawFile.name.split('.').pop()}`.toLowerCase()

  if (allowedTypes) {
    const isAllowedType = allowedTypes.map((t) => t.toLowerCase()).includes(fileExtension)
    if (!isAllowedType) {
      ElMessage.error(
        VALIDATION_MESSAGES.FILE_TYPE_ERROR.replace('{types}', allowedTypes.join(', '))
      )
      return false
    }
  }

  if (rawFile.size / 1024 / 1024 > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    ElMessage.error(VALIDATION_MESSAGES.FILE_SIZE_EXCEEDED)
    return false
  }
  return true
}

/**
 * 格式化文件类型为接受的格式
 * @param {string} allowedFileTypes - 允许的文件类型字符串
 * @returns {string}
 */
export const formatAcceptFileTypes = (allowedFileTypes) => {
  if (!allowedFileTypes) return ''
  return allowedFileTypes
    .split(',')
    .map((type) => {
      const trimmedType = type.trim()
      return trimmedType.includes('/') ? trimmedType : `.${trimmedType}`
    })
    .join(',')
}

/**
 * 为文件添加Excel类型标识
 * @param {Array} files - 文件列表
 * @param {string} type - Excel类型
 * @returns {Array}
 */
export const assignExcelType = (files, type) => {
  return files.map((file) => ({ ...file, excel_type: type }))
}

/**
 * 验证甲供物资工作流必需文件
 * @param {Array} comprehensiveClaimFiles - 综合申领文件
 * @param {Array} actualUsageFiles1 - 实际用料文件1
 * @param {Array} actualUsageFiles2 - 实际用料文件2
 * @returns {boolean}
 */
export const validateOwnerMaterialFiles = (comprehensiveClaimFiles, actualUsageFiles1, actualUsageFiles2) => {
  if (comprehensiveClaimFiles.length === 0) {
    ElMessage.error(VALIDATION_MESSAGES.COMPREHENSIVE_CLAIM_REQUIRED)
    return false
  }
  if (actualUsageFiles1.length === 0) {
    ElMessage.error(VALIDATION_MESSAGES.ACTUAL_USAGE_1_REQUIRED)
    return false
  }
  if (actualUsageFiles2.length === 0) {
    ElMessage.error(VALIDATION_MESSAGES.ACTUAL_USAGE_2_REQUIRED)
    return false
  }
  return true
}

/**
 * 构建甲供物资配置文件列表
 * @param {Array} comprehensiveClaimFiles - 综合申领文件
 * @param {Array} actualUsageFiles1 - 实际用料文件1
 * @param {Array} actualUsageFiles2 - 实际用料文件2
 * @param {Array} otherFiles - 其他文件
 * @returns {Array}
 */
export const buildOwnerMaterialFilesList = (comprehensiveClaimFiles, actualUsageFiles1, actualUsageFiles2, otherFiles) => {
  return [
    ...assignExcelType(comprehensiveClaimFiles, OWNER_MATERIAL_EXCEL_TYPES.APPLY_EXCEL),
    ...assignExcelType(actualUsageFiles1, OWNER_MATERIAL_EXCEL_TYPES.USE_MATERIAL_PDF),
    ...assignExcelType(actualUsageFiles2, OWNER_MATERIAL_EXCEL_TYPES.BACK_MATERIAL_PDF),
    ...assignExcelType(otherFiles, OWNER_MATERIAL_EXCEL_TYPES.OTHER)
  ]
}

/**
 * 清理所有上传组件的文件
 * @param {Object} refs - 上传组件引用对象
 */
export const clearAllUploadFiles = (refs) => {
  const { uploadRef, comprehensiveClaimRef, actualUsageRef1, actualUsageRef2, otherFilesRef } = refs
  
  if (uploadRef?.value) uploadRef.value.clearFiles()
  if (comprehensiveClaimRef?.value) comprehensiveClaimRef.value.clearFiles()
  if (actualUsageRef1?.value) actualUsageRef1.value.clearFiles()
  if (actualUsageRef2?.value) actualUsageRef2.value.clearFiles()
  if (otherFilesRef?.value) otherFilesRef.value.clearFiles()
}

/**
 * 处理文件数量超限
 * @param {Array} files - 选择的文件
 * @param {number} currentCount - 当前文件数量
 * @param {number} limit - 限制数量
 */
export const handleFileExceed = (files, currentCount = 0, limit = FILE_UPLOAD_CONFIG.DEFAULT_LIMIT) => {
  ElMessage.warning(
    `当前限制选择 ${limit} 个文件，本次选择了 ${files.length} 个文件，共选择了 ${
      files.length + currentCount
    } 个文件`
  )
}

/**
 * 处理单文件上传超限（替换文件）
 * @param {Array} files - 选择的文件
 * @param {Object} uploadRef - 上传组件引用
 */
export const handleSingleFileExceed = (files, uploadRef) => {
  if (uploadRef?.value) {
    uploadRef.value.clearFiles()
    uploadRef.value.handleStart(files[0])
  }
}
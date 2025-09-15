// 乙供物资相关组件导出

import SupplierMaterialTable from './SupplierMaterialTable.vue'
import SupplierMaterialTableHighPerf from './SupplierMaterialTableHighPerf.vue'
import OperationGuide from './OperationGuide.vue'

// 导出组件
export { SupplierMaterialTable, SupplierMaterialTableHighPerf, OperationGuide }

// 导出常量配置
export * from './constants.js'

// 默认导出
export default {
  SupplierMaterialTable,
  SupplierMaterialTableHighPerf,
  OperationGuide
}
# API 接口文档

## 项目概述

本文档描述了前端Vue应用所需的后端API接口，主要包括SmartBrainPage（智能大脑页面）和MaterialManagementPage（基础物资管理页面）的接口需求。

## 接口规范

### 通用规范

#### 请求头
```
Content-Type: application/json
Authorization: Bearer {token}
```

#### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {}, // 具体数据
  "timestamp": "2024-01-15T10:30:25Z"
}
```

#### 状态码说明
- `200`: 成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 1. SmartBrainPage（智能大脑页面）接口

### 1.1 获取智能体监控数据

**接口描述**: 获取所有智能体的状态和任务统计信息

**请求方式**: `GET`

**接口路径**: `/api/smart-brain/agents`

**请求参数**: 无

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "agents": [
      {
        "id": "contractParsing",
        "name": "合同解析智能体",
        "status": "online",
        "description": "负责解析各类合同文档",
        "tasks": {
          "total": 156,
          "completed": 142,
          "inProgress": 8,
          "failed": 6
        },
        "lastActivity": "2024-01-15T14:30:25Z",
        "version": "1.2.0"
      },
      {
        "id": "supplierMaterialParsing", 
        "name": "供应商物资解析智能体",
        "status": "online",
        "description": "负责解析供应商物资清单",
        "tasks": {
          "total": 89,
          "completed": 76,
          "inProgress": 5,
          "failed": 8
        },
        "lastActivity": "2024-01-15T14:25:10Z",
        "version": "1.1.5"
      },
      {
        "id": "ownerSuppliedMaterialParsing",
        "name": "甲供物资解析智能体", 
        "status": "online",
        "description": "负责解析甲供物资相关文档",
        "tasks": {
          "total": 64,
          "completed": 58,
          "inProgress": 3,
          "failed": 3
        },
        "lastActivity": "2024-01-15T14:20:15Z",
        "version": "1.0.8"
      }
    ]
  }
}
```

### 1.2 获取智能体任务详情

**接口描述**: 获取指定智能体的详细任务列表

**请求方式**: `GET`

**接口路径**: `/api/smart-brain/agents/{agentId}/tasks`

**路径参数**:
- `agentId`: 智能体ID

**查询参数**:
- `status`: 任务状态筛选 (可选: all, completed, inProgress, failed)
- `page`: 页码 (默认: 1)
- `size`: 每页数量 (默认: 20)
- `startDate`: 开始日期 (可选)
- `endDate`: 结束日期 (可选)

**响应数据**:
```json
{
  "code": 200,
  "message": "success", 
  "data": {
    "tasks": {
      "all": [
        {
          "taskId": "task_001",
          "name": "合同解析任务#001",
          "status": "completed",
          "createTime": "2024-01-15T10:30:25Z",
          "completeTime": "2024-01-15T10:35:45Z",
          "duration": "5m20s",
          "inputFile": {
            "name": "建设工程合同.pdf",
            "size": "2.5MB",
            "type": "pdf"
          },
          "result": {
            "itemsExtracted": 25,
            "confidence": 0.95,
            "outputFile": "contract_parsed_001.json"
          },
          "error": null
        }
      ],
      "completed": [...],
      "inProgress": [...],
      "failed": [...]
    },
    "pagination": {
      "current": 1,
      "size": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

### 1.3 获取执行历史记录

**接口描述**: 获取系统执行历史记录

**请求方式**: `GET`

**接口路径**: `/api/smart-brain/execution-history`

**查询参数**:
- `page`: 页码 (默认: 1)
- `size`: 每页数量 (默认: 20)
- `workflow`: 工作流筛选 (可选)
- `status`: 状态筛选 (可选: success, failed)
- `startDate`: 开始日期 (可选)
- `endDate`: 结束日期 (可选)

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": "exec_001",
        "workflow": "合同解析",
        "function": "文档处理",
        "status": "success",
        "duration": "2.3s",
        "timestamp": "2024-01-15T14:30:25Z",
        "operator": "system",
        "details": {
          "inputSize": "2.5MB",
          "outputItems": 25,
          "processingTime": "2.1s"
        }
      }
    ],
    "pagination": {
      "current": 1,
      "size": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

### 1.4 获取系统总览统计

**接口描述**: 获取系统整体统计数据

**请求方式**: `GET`

**接口路径**: `/api/smart-brain/overview`

**请求参数**: 无

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalTasks": 309,
    "inProgressTasks": 16,
    "completedTasks": 276,
    "failedTasks": 17,
    "totalAgents": 3,
    "onlineAgents": 3,
    "todayTasks": 45,
    "avgProcessingTime": "3.2s",
    "successRate": 0.945
  }
}
```

---

## 2. MaterialManagementPage（基础物资管理页面）接口

### 2.1 基础物资管理接口

#### 2.1.1 获取基础物资列表

**接口描述**: 分页查询基础物资列表，支持按名称和规格筛选

**请求方式**: `GET`

**接口路径**: `/api/materials/base-materials`

**查询参数**:
- `page`: 页码 (默认: 1)
- `size`: 每页数量 (默认: 20)
- `materialName`: 物资名称 (模糊搜索, 可选)
- `specification`: 规格型号 (模糊搜索, 可选)
- `category`: 物资分类 (可选)

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "materialName": "水泥",
        "specification": "425#",
        "unit": "吨",
        "category": "建筑材料",
        "priceCount": 8,
        "createTime": "2024-01-15T10:30:25Z",
        "updateTime": "2024-01-15T14:20:15Z",
        "creator": "张三",
        "status": "active",
        "description": "用于混凝土制备的水泥"
      }
    ],
    "pagination": {
      "current": 1,
      "size": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### 2.1.2 创建基础物资

**接口描述**: 创建新的基础物资

**请求方式**: `POST`

**接口路径**: `/api/materials/base-materials`

**请求体**:
```json
{
  "materialName": "钢筋",
  "specification": "HRB400 Φ12",
  "unit": "吨",
  "category": "钢材",
  "description": "建筑用钢筋"
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 2,
    "materialName": "钢筋",
    "specification": "HRB400 Φ12",
    "unit": "吨",
    "category": "钢材",
    "priceCount": 0,
    "createTime": "2024-01-15T15:30:25Z",
    "updateTime": "2024-01-15T15:30:25Z",
    "creator": "当前用户",
    "status": "active",
    "description": "建筑用钢筋"
  }
}
```

#### 2.1.3 更新基础物资

**接口描述**: 更新指定的基础物资信息

**请求方式**: `PUT`

**接口路径**: `/api/materials/base-materials/{id}`

**路径参数**:
- `id`: 物资ID

**请求体**:
```json
{
  "materialName": "钢筋",
  "specification": "HRB400 Φ14",
  "unit": "吨",
  "category": "钢材",
  "description": "建筑用钢筋，更新规格"
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 2,
    "materialName": "钢筋",
    "specification": "HRB400 Φ14",
    "unit": "吨",
    "category": "钢材",
    "priceCount": 5,
    "createTime": "2024-01-15T15:30:25Z",
    "updateTime": "2024-01-15T16:45:30Z",
    "creator": "当前用户",
    "status": "active",
    "description": "建筑用钢筋，更新规格"
  }
}
```

#### 2.1.4 删除基础物资

**接口描述**: 删除指定的基础物资

**请求方式**: `DELETE`

**接口路径**: `/api/materials/base-materials/{id}`

**路径参数**:
- `id`: 物资ID

**响应数据**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

#### 2.1.5 批量删除基础物资

**接口描述**: 批量删除多个基础物资

**请求方式**: `DELETE`

**接口路径**: `/api/materials/base-materials/batch`

**请求体**:
```json
{
  "ids": [1, 2, 3, 4]
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "批量删除成功",
  "data": {
    "deletedCount": 4,
    "failedIds": []
  }
}
```

#### 2.1.6 获取基础物资统计

**接口描述**: 获取基础物资统计信息

**请求方式**: `GET`

**接口路径**: `/api/materials/base-materials/statistics`

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalMaterials": 150,
    "materialWithPrices": 120,
    "lastUpdate": "2024-01-15T16:45:30Z",
    "categoryCounts": {
      "建筑材料": 45,
      "钢材": 32,
      "砌体材料": 28,
      "砂石料": 25,
      "其他": 20
    }
  }
}
```

### 2.2 物资价格管理接口

#### 2.2.1 获取物资价格列表

**接口描述**: 分页查询物资价格列表，支持按物资、年份、季度筛选

**请求方式**: `GET`

**接口路径**: `/api/materials/prices`

**查询参数**:
- `page`: 页码 (默认: 1)
- `size`: 每页数量 (默认: 20)
- `materialId`: 物资ID (可选)
- `year`: 年份 (可选)
- `quarter`: 季度 (可选: Q1, Q2, Q3, Q4)

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [
      {
        "id": 1,
        "materialId": 1,
        "materialName": "水泥",
        "specification": "425#",
        "price": 350.00,
        "year": 2024,
        "quarter": "Q1",
        "priceQuarter": "2024-Q1",
        "unit": "吨",
        "createTime": "2024-01-15T10:30:25Z",
        "updateTime": "2024-03-10T14:20:15Z",
        "creator": "张三",
        "source": "市场调研",
        "remark": "价格相对稳定"
      }
    ],
    "pagination": {
      "current": 1,
      "size": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

#### 2.2.2 创建物资价格

**接口描述**: 为指定物资创建价格记录

**请求方式**: `POST`

**接口路径**: `/api/materials/prices`

**请求体**:
```json
{
  "materialId": 1,
  "year": 2024,
  "quarter": "Q2",
  "price": 365.00,
  "source": "供应商报价",
  "remark": "价格小幅上涨"
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 2,
    "materialId": 1,
    "materialName": "水泥",
    "specification": "425#",
    "price": 365.00,
    "year": 2024,
    "quarter": "Q2",
    "priceQuarter": "2024-Q2",
    "unit": "吨",
    "createTime": "2024-04-01T10:30:25Z",
    "updateTime": "2024-04-01T10:30:25Z",
    "creator": "当前用户",
    "source": "供应商报价",
    "remark": "价格小幅上涨"
  }
}
```

#### 2.2.3 更新物资价格

**接口描述**: 更新指定的物资价格记录

**请求方式**: `PUT`

**接口路径**: `/api/materials/prices/{id}`

**路径参数**:
- `id`: 价格记录ID

**请求体**:
```json
{
  "materialId": 1,
  "year": 2024,
  "quarter": "Q2",
  "price": 368.00,
  "source": "供应商报价",
  "remark": "价格调整"
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 2,
    "materialId": 1,
    "materialName": "水泥",
    "specification": "425#",
    "price": 368.00,
    "year": 2024,
    "quarter": "Q2",
    "priceQuarter": "2024-Q2",
    "unit": "吨",
    "createTime": "2024-04-01T10:30:25Z",
    "updateTime": "2024-04-01T11:15:30Z",
    "creator": "当前用户",
    "source": "供应商报价",
    "remark": "价格调整"
  }
}
```

#### 2.2.4 删除物资价格

**接口描述**: 删除指定的物资价格记录

**请求方式**: `DELETE`

**接口路径**: `/api/materials/prices/{id}`

**路径参数**:
- `id`: 价格记录ID

**响应数据**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

#### 2.2.5 批量删除物资价格

**接口描述**: 批量删除多个物资价格记录

**请求方式**: `DELETE`

**接口路径**: `/api/materials/prices/batch`

**请求体**:
```json
{
  "ids": [1, 2, 3, 4]
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "批量删除成功",
  "data": {
    "deletedCount": 4,
    "failedIds": []
  }
}
```

#### 2.2.6 获取物资价格统计

**接口描述**: 获取物资价格统计信息

**请求方式**: `GET`

**接口路径**: `/api/materials/prices/statistics`

**查询参数**:
- `year`: 年份 (可选，默认当前年份)
- `quarter`: 季度 (可选)

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalPrices": 500,
    "currentQuarter": "2024-Q1",
    "averagePrice": 1250.75,
    "lastUpdate": "2024-01-15T16:45:30Z",
    "priceDistribution": {
      "Q1": 125,
      "Q2": 130,
      "Q3": 128,
      "Q4": 117
    },
    "priceRange": {
      "min": 0.45,
      "max": 8500.00,
      "median": 850.50
    }
  }
}
```

### 2.3 数据导入导出接口

#### 2.3.1 批量导入物资价格

**接口描述**: 通过Excel文件批量导入物资价格数据

**请求方式**: `POST`

**接口路径**: `/api/materials/prices/import`

**请求头**:
```
Content-Type: multipart/form-data
```

**请求参数**:
- `file`: Excel文件 (必填)
- `year`: 年份 (必填)
- `quarter`: 季度 (必填: Q1, Q2, Q3, Q4)
- `overwrite`: 是否覆盖已存在的数据 (可选，默认: false)

**响应数据**:
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "totalRows": 100,
    "successCount": 95,
    "failedCount": 5,
    "errors": [
      {
        "row": 15,
        "error": "物资名称不能为空"
      },
      {
        "row": 28,
        "error": "价格格式不正确"
      }
    ],
    "importTime": "2024-01-15T16:45:30Z"
  }
}
```

#### 2.3.2 下载导入模板

**接口描述**: 下载物资价格导入的Excel模板文件

**请求方式**: `GET`

**接口路径**: `/api/materials/prices/import-template`

**响应**: Excel文件下载

#### 2.3.3 导出物资价格数据

**接口描述**: 导出物资价格数据为Excel或CSV文件

**请求方式**: `GET`

**接口路径**: `/api/materials/prices/export`

**查询参数**:
- `year`: 年份 (必填)
- `quarter`: 季度 (必填: Q1, Q2, Q3, Q4)
- `format`: 导出格式 (必填: xlsx, csv)
- `range`: 导出范围 (必填: filtered, all)
- `materialIds`: 物资ID列表 (可选，当range=filtered时使用)

**响应**: 文件下载 (Excel或CSV)

#### 2.3.4 导出基础物资数据

**接口描述**: 导出基础物资数据为Excel或CSV文件

**请求方式**: `GET`

**接口路径**: `/api/materials/base-materials/export`

**查询参数**:
- `format`: 导出格式 (必填: xlsx, csv)
- `category`: 物资分类筛选 (可选)
- `materialName`: 物资名称筛选 (可选)

**响应**: 文件下载 (Excel或CSV)

---

## 3. 权限管理接口

### 3.1 用户权限验证

**接口描述**: 验证用户是否有指定权限

**请求方式**: `GET`

**接口路径**: `/api/auth/permissions/{permission}`

**路径参数**:
- `permission`: 权限名称 (如: view_material_management)

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "hasPermission": true,
    "role": "admin",
    "permissions": [
      "view_material_management",
      "edit_material_management",
      "delete_material_management"
    ]
  }
}
```

### 3.2 获取用户信息

**接口描述**: 获取当前登录用户的基本信息

**请求方式**: `GET`

**接口路径**: `/api/auth/user-info`

**响应数据**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "role": "admin",
    "isAdmin": true,
    "permissions": [
      "view_material_management",
      "edit_material_management",
      "delete_material_management",
      "view_smart_brain"
    ],
    "loginTime": "2024-01-15T09:00:00Z"
  }
}
```

---

## 4. 数据字典

### 4.1 任务状态枚举
```
completed: 已完成
inProgress: 进行中  
failed: 失败
pending: 待处理
cancelled: 已取消
```

### 4.2 智能体状态枚举
```
online: 在线
offline: 离线
maintenance: 维护中
error: 错误
```

### 4.3 季度枚举
```
Q1: 第一季度 (1-3月)
Q2: 第二季度 (4-6月)
Q3: 第三季度 (7-9月)
Q4: 第四季度 (10-12月)
```

### 4.4 物资分类枚举
```
建筑材料: 水泥、混凝土等
钢材: 各类钢筋、型钢等
砌体材料: 砖块、砌块等
砂石料: 沙子、石子等
装饰材料: 涂料、瓷砖等
机电设备: 电缆、管道等
其他: 其他类型物资
```

### 4.5 导出格式枚举
```
xlsx: Excel格式
csv: CSV格式
```

---

## 5. 错误码说明

### 5.1 业务错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 40001 | 物资名称已存在 | 更换物资名称或更新现有物资 |
| 40002 | 价格记录已存在 | 更新现有价格记录 |
| 40003 | 物资不存在 | 检查物资ID是否正确 |
| 40004 | 价格记录不存在 | 检查价格记录ID是否正确 |
| 40005 | 文件格式不支持 | 使用支持的文件格式 |
| 40006 | 导入数据格式错误 | 检查Excel格式和数据内容 |
| 40007 | 权限不足 | 联系管理员分配相应权限 |
| 40008 | 智能体不可用 | 等待智能体恢复或联系技术支持 |

---

## 6. 接口使用示例

### 6.1 JavaScript示例 (Axios)

```javascript
// 获取基础物资列表
const getMaterialList = async (params) => {
  try {
    const response = await axios.get('/api/materials/base-materials', {
      params: {
        page: params.page || 1,
        size: params.size || 20,
        materialName: params.materialName,
        specification: params.specification
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取物资列表失败:', error);
    throw error;
  }
};

// 创建基础物资
const createMaterial = async (materialData) => {
  try {
    const response = await axios.post('/api/materials/base-materials', materialData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('创建物资失败:', error);
    throw error;
  }
};

// 批量导入价格数据
const importPrices = async (file, year, quarter) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', year);
    formData.append('quarter', quarter);
    
    const response = await axios.post('/api/materials/prices/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('导入失败:', error);
    throw error;
  }
};
```

### 6.2 Vue组合式API示例

```javascript
import { ref, onMounted } from 'vue';
import axios from 'axios';

export default {
  setup() {
    const materialList = ref([]);
    const loading = ref(false);
    const pagination = ref({
      current: 1,
      size: 20,
      total: 0
    });

    // 获取物资列表
    const fetchMaterials = async () => {
      loading.value = true;
      try {
        const response = await axios.get('/api/materials/base-materials', {
          params: {
            page: pagination.value.current,
            size: pagination.value.size
          }
        });
        
        if (response.data.code === 200) {
          materialList.value = response.data.data.content;
          pagination.value.total = response.data.data.pagination.total;
        }
      } catch (error) {
        console.error('获取物资列表失败:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchMaterials();
    });

    return {
      materialList,
      loading,
      pagination,
      fetchMaterials
    };
  }
};
```

---

## 7. 接口变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2024-01-15 | 初始版本，包含所有基础接口 |

---

## 8. 注意事项

1. **认证授权**: 所有接口都需要在请求头中携带有效的JWT Token
2. **参数验证**: 请求参数必须符合接口规范，否则会返回400错误
3. **分页规范**: 分页参数统一使用page(页码，从1开始)和size(每页数量)
4. **时间格式**: 所有时间字段统一使用ISO 8601格式 (YYYY-MM-DDTHH:mm:ssZ)
5. **文件上传**: 文件上传接口支持的最大文件大小为10MB
6. **并发限制**: 每个用户同时最多只能进行3个数据导入操作
7. **缓存策略**: 统计数据接口有5分钟缓存，实时性要求高的场景请注意
8. **错误处理**: 客户端应该正确处理各种HTTP状态码和业务错误码

---

*本文档最后更新时间: 2024-01-15*
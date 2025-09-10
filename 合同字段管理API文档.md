# 合同字段管理API文档

## 概述

本文档定义了合同解析字段管理功能的数据结构和API接口规范，用于管理合同解析时需要提取的关键字段配置。

## 数据结构

### 1. 字段数据结构 (Field Entity)
```javascript
{
  id: "string",                    // 字段唯一标识
  fieldName: "string",             // 字段名称，如"合同编号"
  fieldCode: "string",             // 字段编码，如"contractNo" 
  fieldType: "string",             // 字段类型: string|number|date|boolean|array|object
  contractType: "string",          // 合同类型: construction|supply|service|design|consulting|lease|sales|other
  description: "string",           // 字段描述
  isRequired: boolean,             // 是否必填
  isEnabled: number,               // 状态: 1启用 0停用
  defaultValue: "string",          // 默认值
  validationRule: "string",        // 验证规则(预留)
  displayOrder: number,            // 显示顺序
  createTime: "string",            // 创建时间
  updateTime: "string"             // 更新时间
}
```

### 2. 分页查询参数
```javascript
{
  keyword: "string",               // 搜索关键词(字段名称/编码/描述)
  fieldType: "string",             // 字段类型筛选
  contractType: "string",          // 合同类型筛选
  status: number,                  // 状态筛选(0/1)
  isRequired: boolean,             // 必填筛选
  page: number,                    // 页码(从0开始)
  size: number                     // 页大小
}
```

### 3. API响应格式
```javascript
{
  code: 200,                       // 状态码
  message: "string",               // 响应消息
  data: {
    list: Field[],                 // 字段列表
    total: number,                 // 总数
    page: number,                  // 当前页
    size: number,                  // 页大小
    totalPages: number             // 总页数
  },
  timestamp: "string"              // 响应时间戳
}
```

## API接口规范

### 1. 字段管理核心接口

#### 获取字段列表
```http
GET /api/contract-fields

Query Parameters: 
- keyword: string (可选) - 搜索关键词
- fieldType: string (可选) - 字段类型筛选
- contractType: string (可选) - 合同类型筛选
- status: number (可选) - 状态筛选
- isRequired: boolean (可选) - 必填筛选
- page: number (默认0) - 页码
- size: number (默认20) - 页大小

Response: 标准分页响应格式
```

#### 创建字段
```http
POST /api/contract-fields

Content-Type: application/json
Body: Field对象(不含id, createTime, updateTime)

Example:
{
  "fieldName": "合同编号",
  "fieldCode": "contractNo",
  "fieldType": "string",
  "contractType": "construction",
  "description": "合同的唯一标识编号",
  "isRequired": true,
  "isEnabled": 1,
  "defaultValue": "",
  "displayOrder": 1
}

Response: 创建成功的Field对象
```

#### 更新字段
```http
PUT /api/contract-fields/{fieldId}

Content-Type: application/json
Body: 部分或完整Field对象

Response: 更新后的Field对象
```

#### 删除字段
```http
DELETE /api/contract-fields/{fieldId}

Response: 删除结果确认
```

#### 获取字段详情
```http
GET /api/contract-fields/{fieldId}

Response: Field对象详细信息
```

### 2. 批量操作接口

#### 批量更新状态
```http
PUT /api/contract-fields/batch/status

Content-Type: application/json
Body: {
  "fieldIds": ["field_1", "field_2", "field_3"],
  "status": 1  // 0停用 1启用
}

Response: 批量更新结果
```

#### 批量删除
```http
DELETE /api/contract-fields/batch

Content-Type: application/json
Body: {
  "fieldIds": ["field_1", "field_2", "field_3"]
}

Response: 批量删除结果
```

### 3. 统计和工具接口

#### 获取统计信息
```http
GET /api/contract-fields/statistics

Response: {
  "code": 200,
  "message": "success",
  "data": {
    "total": 15,
    "enabledCount": 12,
    "disabledCount": 3,
    "requiredCount": 8,
    "optionalCount": 7,
    "fieldTypeStats": {
      "string": 8,
      "number": 3,
      "date": 2,
      "boolean": 1,
      "array": 1
    }
  }
}
```

#### 导出配置
```http
GET /api/contract-fields/export

Response: 下载JSON配置文件
Content-Type: application/json
Content-Disposition: attachment; filename="contract-fields-config-YYYY-MM-DD.json"
```

#### 导入配置
```http
POST /api/contract-fields/import

Content-Type: multipart/form-data
Body: FormData with file

Response: 导入结果统计
```

#### 重置为预设字段
```http
POST /api/contract-fields/reset-preset

Response: 重置操作结果
```

## 枚举值定义

### 字段类型 (fieldType)
| 值 | 说明 | 图标 |
|---|---|---|
| `string` | 文本类型 | Document |
| `number` | 数值类型 | Grid |
| `date` | 日期类型 | Calendar |
| `boolean` | 布尔类型 | Switch |
| `array` | 数组类型 | List |
| `object` | 对象类型 | Grid |

### 合同类型 (contractType)
| 值 | 说明 | 颜色 |
|---|---|---|
| `construction` | 建筑工程 | #409eff |
| `supply` | 物资供应 | #67c23a |
| `service` | 服务类 | #e6a23c |
| `design` | 设计类 | #909399 |
| `consulting` | 咨询类 | #f56c6c |
| `lease` | 租赁类 | #606266 |
| `sales` | 销售类 | #8b5cf6 |
| `other` | 其他 | #94a3b8 |

### 字段状态 (isEnabled)
| 值 | 说明 |
|---|---|
| `1` | 启用 |
| `0` | 停用 |

## 数据库表设计建议

### contract_fields 表结构
```sql
CREATE TABLE contract_fields (
  id VARCHAR(50) PRIMARY KEY COMMENT '字段ID',
  field_name VARCHAR(50) NOT NULL COMMENT '字段名称',
  field_code VARCHAR(30) NOT NULL UNIQUE COMMENT '字段编码',
  field_type VARCHAR(20) NOT NULL COMMENT '字段类型',
  contract_type VARCHAR(20) NOT NULL COMMENT '合同类型',
  description VARCHAR(200) COMMENT '字段描述',
  is_required TINYINT(1) DEFAULT 0 COMMENT '是否必填',
  is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  default_value VARCHAR(100) COMMENT '默认值',
  validation_rule TEXT COMMENT '验证规则',
  display_order INT DEFAULT 0 COMMENT '显示顺序',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_field_type (field_type),
  INDEX idx_contract_type (contract_type),
  INDEX idx_status (is_enabled),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同字段配置表';
```

## 验证规则

### 字段验证
- `fieldCode`: 必须唯一，符合命名规范 `/^[a-zA-Z][a-zA-Z0-9_]*$/`
- `fieldName`: 长度1-50字符，不能为空
- `fieldType`: 必须是枚举值之一
- `contractType`: 必须是枚举值之一
- `description`: 最大200字符
- `displayOrder`: 非负整数
- `isEnabled`: 0或1

### 业务规则
- 字段编码在系统中必须唯一
- 启用状态的字段才会参与合同解析
- 必填字段在解析时如果缺失会给出警告
- 显示顺序决定了字段在界面中的排列位置

## 错误码定义

| 错误码 | 说明 |
|---|---|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 404 | 字段不存在 |
| 409 | 字段编码已存在 |
| 500 | 服务器内部错误 |

## 使用示例

### 创建字段示例
```javascript
// 创建一个合同金额字段
const fieldData = {
  fieldName: "合同金额",
  fieldCode: "contractAmount", 
  fieldType: "number",
  contractType: "construction",
  description: "合同总金额（元）",
  isRequired: true,
  isEnabled: 1,
  defaultValue: "0",
  displayOrder: 4
};

fetch('/api/contract-fields', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(fieldData)
});
```

### 查询字段示例
```javascript
// 查询建筑工程类型的启用字段
fetch('/api/contract-fields?contractType=construction&status=1&page=0&size=20');
```

### 批量操作示例
```javascript
// 批量启用字段
fetch('/api/contract-fields/batch/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fieldIds: ['field_1', 'field_2', 'field_3'],
    status: 1
  })
});
```

---

*文档版本: v1.0*  
*最后更新: 2025-01-09*
# 聚合分析结果查询接口文档

## 接口概述
分页查询智能体解析结果的聚合数据，将相同`TASK_DETAIL_ID`的数据聚合为一行，以`column_code`为列名，`column_value`为列值构建动态字段。

## 基本信息
- **接口路径**: `/api/smart-brain/analysis-results`
- **请求方法**: `GET`
- **接口描述**: 聚合相同TASK_DETAIL_ID的数据，以column_code为列，column_value为值组成一行数据

## 请求参数

### Query参数

| 参数名 | 类型 | 必填 | 描述 | 默认值 | 示例值 |
|--------|------|------|------|--------|--------|
| page | Integer | 否 | 页码（从0开始） | 0 | 0 |
| size | Integer | 否 | 每页条数 | 10 | 20 |
| sort | String | 否 | 排序字段 | - | taskDetailId,asc |

## 响应参数

### 分页响应结构

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| content | Array | 是 | 聚合结果数据列表 |
| pageable | Object | 是 | 分页信息 |
| totalElements | Long | 是 | 总记录数 |
| totalPages | Integer | 是 | 总页数 |
| last | Boolean | 是 | 是否为最后一页 |
| first | Boolean | 是 | 是否为第一页 |
| numberOfElements | Integer | 是 | 当前页记录数 |
| size | Integer | 是 | 每页大小 |
| number | Integer | 是 | 当前页码 |

### content字段详情

| 字段名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| taskDetailId | String | 是 | 任务详情ID | "c5f70caea55d47d4adb962c429c4bd2b" |
| taskId | String | 是 | 任务ID | "task_20240806_001" |
| baseDataId | String | 否 | 基础数据ID | "base_data_123" |
| resultStatus | Integer | 是 | 解析结果状态 | 1 |
| dynamicFields | Object | 是 | 动态字段映射 | {"name": "螺栓", "spec": "M12", "unit": "个"} |

### resultStatus状态说明
- `0`: 未确认
- `1`: 已确认

### dynamicFields说明
- Key: `column_code`字段值
- Value: 对应的`column_value`字段值
- 每个`TASK_DETAIL_ID`的所有解析字段都会聚合在此对象中

## 请求示例

### 基本查询
```bash
curl -X GET "http://localhost:1207/api/smart-brain/analysis-results" \
  -H "Content-Type: application/json"
```

### 分页查询
```bash
curl -X GET "http://localhost:1207/api/smart-brain/analysis-results?page=1&size=20" \
  -H "Content-Type: application/json"
```

### 带排序的查询
```bash
curl -X GET "http://localhost:1207/api/smart-brain/analysis-results?page=0&size=10&sort=taskDetailId,desc" \
  -H "Content-Type: application/json"
```

## 响应示例

### 成功响应
```json
{
  "content": [
    {
      "taskDetailId": "c5f70caea55d47d4adb962c429c4bd2b",
      "taskId": "task_20240806_001",
      "baseDataId": "base_data_123",
      "resultStatus": 1,
      "dynamicFields": {
        "material_name": "螺栓",
        "specification": "M12×30",
        "unit": "个",
        "quantity": "100",
        "price": "2.5"
      }
    },
    {
      "taskDetailId": "d7e80fbc9a6e58f5bce073d540d5ce3c",
      "taskId": "task_20240806_002",
      "baseDataId": "base_data_456",
      "resultStatus": 0,
      "dynamicFields": {
        "material_name": "钢管",
        "specification": "φ32×3.5",
        "unit": "米",
        "quantity": "50"
      }
    }
  ],
  "pageable": {
    "sort": {
      "empty": true,
      "sorted": false,
      "unsorted": true
    },
    "offset": 0,
    "pageSize": 10,
    "pageNumber": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 25,
  "totalPages": 3,
  "last": false,
  "first": true,
  "numberOfElements": 10,
  "size": 10,
  "number": 0,
  "sort": {
    "empty": true,
    "sorted": false,
    "unsorted": true
  },
  "empty": false
}
```

### 空结果响应
```json
{
  "content": [],
  "pageable": {
    "sort": {
      "empty": true,
      "sorted": false,
      "unsorted": true
    },
    "offset": 0,
    "pageSize": 10,
    "pageNumber": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 0,
  "totalPages": 0,
  "last": true,
  "first": true,
  "numberOfElements": 0,
  "size": 10,
  "number": 0,
  "sort": {
    "empty": true,
    "sorted": false,
    "unsorted": true
  },
  "empty": true
}
```

## 状态码说明
- `200`: 请求成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

## 业务逻辑说明
1. 首先分页查询`wmes_analysis_results`表中的不同`TASK_DETAIL_ID`
2. 根据查询到的`TASK_DETAIL_ID`列表，获取所有相关的解析记录
3. 按`TASK_DETAIL_ID`分组，将每组记录的`column_code`和`column_value`聚合成动态字段对象
4. 构建分页响应数据，包含聚合后的结果和分页信息

### 聚合规则
- 相同`TASK_DETAIL_ID`的记录聚合为一行数据
- `column_code`作为动态字段的键名
- `column_value`作为动态字段的值
- 基础信息（`taskId`、`baseDataId`、`resultStatus`）取第一条记录的值

## 性能说明
- 采用数据库级分页，避免内存中处理大量数据
- 先分页查询唯一的`TASK_DETAIL_ID`，再批量获取详细数据
- 使用原生SQL查询优化性能

## 注意事项
- 接口无需认证
- 分页从0开始计算
- 返回结果按`TASK_DETAIL_ID`排序
- `dynamicFields`中的字段名和数量取决于实际的解析结果
- 如果某个`TASK_DETAIL_ID`下有相同的`column_code`，后面的值会覆盖前面的值

## 数据表依赖
- **主表**: `wmes_analysis_results` - 智能体解析结果表
- **字段映射**:
  - `TASK_DETAIL_ID` -> `taskDetailId`
  - `TASK_ID` -> `taskId`
  - `BASE_DATA_ID` -> `baseDataId`
  - `result_status` -> `resultStatus`
  - `column_code` + `column_value` -> `dynamicFields`
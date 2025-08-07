# 根据智能体标签查询任务列表接口文档

## 接口概述
根据传入的智能体标签（业务域）查询该标签下的任务列表数据，支持分页查询功能。

## 基本信息
- **接口路径**: `/api/smart-brain/agents/tasks`
- **请求方法**: `GET`
- **接口描述**: 根据传入的agentLabels查找该agentLabels下的任务列表数据（分页查询）

## 请求参数

### Query Parameters

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|---|---|---|---|---|
| agentLabels | String | 是 | 智能体标签（对应业务域） | j_material |
| page | Integer | 否 | 页码，从0开始 | 0 |
| size | Integer | 否 | 每页大小，默认10 | 10 |
| sort | String | 否 | 排序字段，默认按创建时间倒序 | createdTime,desc |

### 业务域说明
- `j_material`: 甲供物资
- `y_material`: 乙供物资  
- `contract`: 合同

## 响应参数
响应为标准的Spring Data分页格式，包含任务列表数据和分页信息。

### 分页对象结构

| 字段名 | 类型 | 描述 | 示例值 |
|---|---|---|---|
| content | Array | 任务数据列表 | 见下方任务对象结构 |
| totalElements | Long | 总记录数 | 25 |
| totalPages | Integer | 总页数 | 3 |
| size | Integer | 每页大小 | 10 |
| number | Integer | 当前页码（从0开始） | 0 |
| first | Boolean | 是否为第一页 | true |
| last | Boolean | 是否为最后一页 | false |
| numberOfElements | Integer | 当前页实际记录数 | 10 |

### 任务对象结构 (WmesTasksDO)

| 字段名 | 类型 | 必填 | 描述 | 示例值 |
|---|---|---|---|---|
| id | String | 是 | 任务ID | "task_20250805_001" |
| businessDomain | String | 是 | 业务域 | "j_material" |
| agentInfoId | String | 否 | 处理该任务的智能体ID | "agent_456" |
| fileErrorCount | Integer | 否 | 失败处理文件数量 | 0 |
| fileCount | Integer | 否 | 任务下文件总数 | 10 |
| fileDoneCount | Integer | 否 | 已处理文件数量 | 8 |
| taskStatus | Integer | 是 | 任务状态 | 1 |
| priority | String | 否 | 任务优先级 | "HIGH" |
| uploadTime | Date | 否 | 文件上传时间（任务生成时间） | "2025-08-05T10:30:00" |
| startTime | Date | 否 | 任务开始时间 | "2025-08-05T10:35:00" |
| endTime | Date | 否 | 任务结束时间 | "2025-08-05T11:00:00" |
| errorReason | String | 否 | 错误中断原因记录 | null |
| createdBy | String | 否 | 创建人ID | "user123" |
| createdTime | Date | 是 | 任务创建时间 | "2025-08-05T10:30:00" |
| updatedBy | String | 否 | 最后更新人ID | "user123" |
| updatedTime | Date | 否 | 最后更新时间 | "2025-08-05T10:45:00" |

### 任务状态说明
- `0`: 排队中
- `1`: 处理中
- `2`: 处理完成
- `3`: 已确认
- `-1`: 错误中断

## 请求示例

### 基本请求
```http
GET /api/smart-brain/agents/tasks?agentLabels=j_material
```

### 分页请求
```http
GET /api/smart-brain/agents/tasks?agentLabels=j_material&page=0&size=10
```

### 排序请求
```http
GET /api/smart-brain/agents/tasks?agentLabels=y_material&page=1&size=5&sort=createdTime,desc
```

## 响应示例

### 成功响应 (200 OK)
```json
{
  "content": [
    {
      "id": "task_20250805_001",
      "businessDomain": "j_material",
      "agentInfoId": "agent_456",
      "fileErrorCount": 0,
      "fileCount": 10,
      "fileDoneCount": 8,
      "taskStatus": 1,
      "priority": "HIGH",
      "uploadTime": "2025-08-05T10:30:00",
      "startTime": "2025-08-05T10:35:00",
      "endTime": null,
      "errorReason": null,
      "createdBy": "user123",
      "createdTime": "2025-08-05T10:30:00",
      "updatedBy": "user123",
      "updatedTime": "2025-08-05T10:45:00"
    },
    {
      "id": "task_20250805_002",
      "businessDomain": "j_material",
      "agentInfoId": "agent_456",
      "fileErrorCount": 1,
      "fileCount": 5,
      "fileDoneCount": 4,
      "taskStatus": 2,
      "priority": "MEDIUM",
      "uploadTime": "2025-08-05T09:15:00",
      "startTime": "2025-08-05T09:20:00",
      "endTime": "2025-08-05T09:45:00",
      "errorReason": null,
      "createdBy": "user456",
      "createdTime": "2025-08-05T09:15:00",
      "updatedBy": "user456",
      "updatedTime": "2025-08-05T09:45:00"
    }
  ],
  "totalElements": 25,
  "totalPages": 3,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false,
  "numberOfElements": 2
}
```

### 错误响应 (400 Bad Request)
```json
{
  "timestamp": "2025-08-05T15:30:00.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "agentLabels 参数不能为空",
  "path": "/api/smart-brain/agents/tasks"
}
```

### 错误响应 (500 Internal Server Error)
```json
{
  "timestamp": "2025-08-05T15:30:00.123Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "查询任务列表失败",
  "path": "/api/smart-brain/agents/tasks"
}
```

## 注意事项

1. **必填参数**: `agentLabels` 参数为必填，不能为空。
2. **分页参数**: 页码从0开始计算，size默认为10，最大建议不超过100。
3. **性能考虑**: 该接口使用单表查询，避免了复杂的JOIN操作，具有良好的性能表现。
4. **数据一致性**: 查询结果按创建时间倒序排列，最新创建的任务排在前面。
5. **业务域映射**: agentLabels参数直接对应数据库中的BUSINESS_DOMAIN字段。

## 常见问题

**Q: 如何获取所有业务域的任务？**
A: 需要分别调用不同的agentLabels参数，目前不支持一次性查询所有业务域。

**Q: 为什么返回的任务状态是数字而不是文字？**
A: 为了保持数据的原始性和减少网络传输量，状态字段保持数据库原始格式。前端可根据状态码映射对应的文字描述。

**Q: 支持按其他字段筛选吗？**
A: 当前版本仅支持按业务域筛选，如需其他筛选条件，请联系开发团队评估需求。
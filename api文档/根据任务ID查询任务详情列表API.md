# 根据任务ID查询任务详情列表接口文档

## 接口概述
根据任务ID查询该任务下的详情列表数据，支持按文件名进行筛选和分页查询功能。

## 基本信息
- **接口路径**: `/api/smart-brain/agents/tasks/{taskId}/details`
- **请求方法**: `GET`
- **接口描述**: 根据任务ID查询任务详情列表，支持按文件名筛选（分页查询）

## 请求参数

### Path Parameters

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|---|---|---|---|---|
| taskId | String | 是 | 任务ID | task_20250805_001 |

### Query Parameters

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|---|---|---|---|---|
| fileName | String | 否 | 文件名筛选条件（支持模糊匹配） | contract |
| page | Integer | 否 | 页码，从0开始 | 0 |
| size | Integer | 否 | 每页大小，默认10 | 10 |
| sort | String | 否 | 排序字段，默认按创建时间倒序 | createdTime,desc |

### 文件名筛选说明
- 支持模糊匹配，使用LIKE查询
- 例如：fileName=contract 会匹配所有包含"contract"的文件名
- 例如：fileName=.pdf 会匹配所有PDF文件

## 响应参数
响应为标准的Spring Data分页格式，包含任务详情列表数据和分页信息。

### 分页对象结构

| 字段名 | 类型 | 描述 | 示例值 |
|---|---|---|---|
| content | Array | 任务详情数据列表 | 见下方任务详情对象结构 |
| totalElements | Long | 总记录数 | 15 |
| totalPages | Integer | 总页数 | 2 |
| size | Integer | 每页大小 | 10 |
| number | Integer | 当前页码（从0开始） | 0 |
| first | Boolean | 是否为第一页 | true |
| last | Boolean | 是否为最后一页 | false |
| numberOfElements | Integer | 当前页实际记录数 | 10 |

### 任务详情对象结构 (WmesTasksDetailDO)

| 字段名 | 类型 | 必填 | 描述 | 示例值 |
|---|---|---|---|---|
| id | String | 是 | 详情记录ID | "detail_20250805_001" |
| taskId | String | 是 | 关联的任务ID | "task_20250805_001" |
| taskDetailStatus | Integer | 是 | 任务详情状态 | 2 |
| errorReason | String | 否 | 错误中断原因 | null |
| startTime | Date | 否 | 任务开始时间 | "2025-08-05T10:35:00" |
| endTime | Date | 否 | 任务结束时间 | "2025-08-05T10:40:00" |
| fileGroup | Integer | 否 | 文件处理组编号 | 0 |
| createdBy | String | 否 | 创建人ID | "user123" |
| createdTime | Date | 是 | 任务生成时间 | "2025-08-05T10:30:00" |
| updatedBy | String | 否 | 最后更新人ID | "user123" |
| updatedTime | Date | 否 | 最后更新时间 | "2025-08-05T10:40:00" |
| fileName | String | 否 | 文件名称 | "contract_001.pdf" |
| fileUrl | String | 否 | 文件地址 | "/uploads/files/contract_001.pdf" |

### 任务详情状态说明
- `0`: 排队中
- `1`: 处理中
- `2`: 处理完成
- `3`: 已确认
- `-1`: 错误中断

## 请求示例

### 查询任务的所有详情
```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details
```

### 按文件名筛选详情
```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?fileName=contract
```

### 分页查询
```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?page=0&size=5
```

### 组合查询（文件名筛选 + 分页）
```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?fileName=.pdf&page=0&size=10
```

### 排序查询
```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?sort=startTime,desc&page=0&size=10
```

## 响应示例

### 成功响应 (200 OK)
```json
{
  "content": [
    {
      "id": "detail_20250805_001",
      "taskId": "task_20250805_001",
      "taskDetailStatus": 2,
      "errorReason": null,
      "startTime": "2025-08-05T10:35:00",
      "endTime": "2025-08-05T10:40:00",
      "fileGroup": 0,
      "createdBy": "user123",
      "createdTime": "2025-08-05T10:30:00",
      "updatedBy": "user123",
      "updatedTime": "2025-08-05T10:40:00",
      "fileName": "contract_001.pdf",
      "fileUrl": "/uploads/files/contract_001.pdf"
    },
    {
      "id": "detail_20250805_002",
      "taskId": "task_20250805_001",
      "taskDetailStatus": 1,
      "errorReason": null,
      "startTime": "2025-08-05T10:41:00",
      "endTime": null,
      "fileGroup": 0,
      "createdBy": "user123",
      "createdTime": "2025-08-05T10:30:00",
      "updatedBy": "user123",
      "updatedTime": "2025-08-05T10:41:00",
      "fileName": "contract_002.docx",
      "fileUrl": "/uploads/files/contract_002.docx"
    }
  ],
  "totalElements": 15,
  "totalPages": 2,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false,
  "numberOfElements": 2
}
```

### 无数据响应 (200 OK)
```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "size": 10,
  "number": 0,
  "first": true,
  "last": true,
  "numberOfElements": 0
}
```

### 错误响应 (404 Not Found)
```json
{
  "timestamp": "2025-08-05T15:30:00.123Z",
  "status": 404,
  "error": "Not Found",
  "message": "任务ID不存在",
  "path": "/api/smart-brain/agents/tasks/invalid_task_id/details"
}
```

### 错误响应 (400 Bad Request)
```json
{
  "timestamp": "2025-08-05T15:30:00.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "taskId 参数格式不正确",
  "path": "/api/smart-brain/agents/tasks//details"
}
```

### 错误响应 (500 Internal Server Error)
```json
{
  "timestamp": "2025-08-05T15:30:00.123Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "查询任务详情列表失败",
  "path": "/api/smart-brain/agents/tasks/task_20250805_001/details"
}
```

## 使用场景

### 场景1：监控任务执行进度
通过查询任务详情列表，可以实时了解任务中每个文件的处理状态，监控整体执行进度。

```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?page=0&size=20
```

### 场景2：查找特定类型文件的处理情况
当需要查看任务中特定类型文件（如PDF、Word文档）的处理情况时：

```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?fileName=.pdf
```

### 场景3：排查处理失败的文件
查找状态为错误中断(-1)的文件详情：

```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?sort=taskDetailStatus,asc
```

### 场景4：按时间顺序查看处理历史
按开始时间排序查看文件处理的时间顺序：

```http
GET /api/smart-brain/agents/tasks/task_20250805_001/details?sort=startTime,asc
```

## 注意事项

1. **路径参数**: `taskId` 为必填的路径参数，必须是有效的任务ID。
2. **文件名筛选**: fileName参数支持模糊匹配，会匹配文件名中包含该关键词的所有记录。
3. **分页性能**: 建议单次查询的size不要过大，推荐值为10-50，避免影响系统性能。
4. **数据一致性**: 查询结果默认按创建时间倒序排列，确保最新的详情记录排在前面。
5. **状态监控**: 可以通过taskDetailStatus字段监控各个文件的处理状态。
6. **错误处理**: 当taskId不存在时会返回空的分页结果，不会抛出异常。

## 常见问题

**Q: 如何获取某个任务中所有PDF文件的处理情况？**
A: 使用fileName=.pdf作为筛选条件即可。

**Q: 为什么有些记录的endTime为null？**
A: endTime为null表示该文件还在处理中或者处理过程中出现异常，可以结合taskDetailStatus字段判断具体状态。

**Q: 如何按文件处理完成时间排序？**
A: 使用sort=endTime,desc参数，但需要注意未完成的记录endTime为null会排在最后。

**Q: fileGroup字段的作用是什么？**
A: fileGroup用于标识文件处理的批次分组，默认为0，在批量处理时可能会有不同的组编号。

**Q: 可以同时按多个字段排序吗？**
A: 当前版本仅支持单字段排序，如需多字段排序请联系开发团队。
# 智能体任务详情统计接口文档

## 接口概述
获取按业务域划分的智能体任务统计详情，包括每个业务域的总任务数、已完成任务数和进行中任务数。

## 基本信息
- **接口路径**: `/api/smart-brain/agents/task-details`
- **请求方法**: `GET`
- **接口描述**: 获取每个业务域下智能体的任务数（总数、进行中、已完成）

## 请求参数
无需请求参数

## 响应参数
响应为一个JSON数组，数组中的每个对象代表一个业务域的统计数据。

| 字段名 | 类型 | 必填 | 描述 | 示例值 |
|---|---|---|---|---|
| agentName | String | 是 | 智能体名称（业务域的中文描述） | "合同智能审查" |
| totalTaskCount | Long | 是 | 该业务域下的总任务数 | 100 |
| completedTaskCount | Long | 是 | 该业务域下已完成的任务数 | 80 |
| processingTaskCount | Long | 是 | 该业务域下进行中的任务数 | 20 |

### 任务状态统计说明
- **已完成任务**: 任务状态为 `2` (处理完成) 或 `3` (已确认) 的任务。
- **进行中任务**: 任务状态为 `0` (排队中) 或 `1` (处理中) 的任务。
- **总任务数**: 该业务域下的所有任务总数。

## 请求示例

```bash
curl -X GET "http://localhost:1207/api/smart-brain/agents/task-details" \
  -H "Content-Type: application/json"
```

## 响应示例

### 成功响应
```json
[
  {
    "agentName": "合同智能审查",
    "totalTaskCount": 150,
    "completedTaskCount": 120,
    "processingTaskCount": 30
  },
  {
    "agentName": "甲供物资对平",
    "totalTaskCount": 85,
    "completedTaskCount": 80,
    "processingTaskCount": 5
  },
  {
    "agentName": "乙供物资对平",
    "totalTaskCount": 0,
    "completedTaskCount": 0,
    "processingTaskCount": 0
  }
]
```

### 异常响应
如果服务器内部发生错误，将返回一个空的JSON数组。
```json
[]
```

## 状态码说明
- `200`: 请求成功
- `500`: 服务器内部错误

## 业务逻辑说明
1.  查询 `AI_AGENT_MANAGEMENT` 表，获取所有已配置智能体的业务域 (`BUSINESS_DOMAIN`)。
2.  遍历 `BusinessDomainEnum` 中定义的所有业务域。
3.  对于每个业务域：
    -   检查是否存在对应的智能体。如果不存在，该业务域的所有任务数（总数、已完成、进行中）都将返回 `0`。
    -   如果存在智能体，则从 `WMES_TASKS` 表中根据 `BUSINESS_DOMAIN` 字段统计相关任务数量。
4.  返回一个包含所有业务域统计数据的列表。

## 注意事项
- 接口无需认证。
- 即使某个业务域没有任务，或者没有配置智能体，该业务域也会出现在返回的列表中，但其任务数将为0。
- 接口在发生异常时会返回一个空列表，以避免客户端解析错误。

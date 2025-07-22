### 查询任务关联的项目信息

**API Endpoint:**

`GET /baseprojectinfo/queryTaskLinkProjectInfo`

**Description:**

根据任务ID查询其关联的基础项目信息。

**请求参数 (Query Parameters):**

| 参数名 | 类型 | 是否必选 | 描述 |
| --- | --- | --- | --- |
| `taskId` | String | 是 | 要查询的任务ID。 |

**响应 (Response):**

- **成功响应 (200 OK):**
    - 返回一个JSON对象，其中`data`字段包含关联的`BaseProjectInfoDO`对象。

- **失败响应:**
    - 如果未找到关联信息或发生错误，`success`字段为`false`，`msg`字段提供错误详情。

**`BaseProjectInfoDO` 字段说明:**

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `id` | Long | 基础项目信息的唯一ID。 |
| `projectName` | String | 项目名称。 |
| `projectCode` | String | 项目编码 (唯一)。 |
| `engineeringName` | String | 工程名称。 |
| `engineeringCode` | String | 工程编码 (唯一)。 |

**请求示例:**

`GET /baseprojectinfo/queryTaskLinkProjectInfo?taskId=task-12345`

**成功响应示例:**

```json
{
  "code": 200,
  "success": true,
  "data": {
    "id": 101,
    "projectName": "智慧城市建设项目",
    "projectCode": "PROJ-2024-001",
    "engineeringName": "一期工程",
    "engineeringCode": "ENG-001"
  },
  "msg": "成功"
}
```

**失败响应示例 (未找到):**

```json
{
  "code": 200,
  "success": true,
  "data": null,
  "msg": "成功"
}
```

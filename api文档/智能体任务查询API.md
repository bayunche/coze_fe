# 智能体任务查询API

## 接口说明

根据智能体标签查询任务列表，支持按项目名称模糊搜索和项目ID精确匹配条件。

## 接口地址

GET /api/smart-brain/agents/tasks

## 请求参数

| 参数名 | 类型 | 是否必填 | 说明 |
| :--- | :--- | :--- | :--- |
| agentLabels | String | 是 | 智能体标签 |
| projectId | String | 否 | 项目ID，用于精确匹配 |
| projectName | String | 否 | 项目名称，用于模糊搜索 |
| page | Integer | 否 | 页码，默认0 |
| size | Integer | 否 | 每页条数，默认10 |

## 返回结果

返回分页的任务列表数据，包含关联的项目信息。

### 成功响应示例

```json
{
  "content": [
    {
      "id": "task_id_1",
      "businessDomain": "Y_MATERIAL",
      "agentInfoId": "agent_1",
      "fileErrorCount": 0,
      "fileCount": 5,
      "fileDoneCount": 5,
      "taskStatus": 2,
      "priority": "1",
      "uploadTime": "2023-10-26T10:00:00",
      "startTime": "2023-10-26T10:01:00",
      "endTime": "2023-10-26T10:05:00",
      "errorReason": null,
      "createdBy": null,
      "createdTime": "2023-10-26T10:00:00",
      "updatedBy": null,
      "updatedTime": "2023-10-26T10:05:00",
      "approvalStatus": 1,
      "approvalResult": 1,
      "selectedQuarter": "2023Q4",
      "projectInfo": {
        "id": 1,
        "projectName": "项目A",
        "projectCode": "PROJ-A",
        "engineeringName": "工程A",
        "engineeringCode": "ENG-A",
        "contractCode": "CONT-A",
        "contractName": "合同A"
      }
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": {
      "sorted": false,
      "unsorted": true,
      "empty": true
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "last": true,
  "totalElements": 1,
  "totalPages": 1,
  "size": 10,
  "number": 0,
  "sort": {
    "sorted": false,
    "unsorted": true,
    "empty": true
  },
  "first": true,
  "numberOfElements": 1,
  "empty": false
}
```

## 备注

- 项目名称搜索是模糊匹配
- 项目ID搜索是精确匹配
- 若同时提供projectId和projectName参数，将同时应用两个条件
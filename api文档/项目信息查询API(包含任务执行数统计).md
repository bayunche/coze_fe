# 项目信息查询接口（包含任务执行数统计）

## 接口说明

根据关键字搜索项目基础信息，支持分页查询，并返回各业务域的任务执行数以及任务执行总数。

## 接口地址

GET /baseprojectinfo/searchWithTaskStats

## 请求参数

| 参数名 | 类型 | 是否必填 | 说明 |
| :--- | :--- | :--- | :--- |
| keyword | String | 否 | 搜索关键字，可以为空 |
| page | Integer | 否 | 页码，默认0 |
| size | Integer | 否 | 每页条数，默认10 |

## 返回结果

返回分页的项目信息数据，包含各业务域的任务执行数以及任务执行总数。

### 成功响应示例

```json
{
  "content": [
    {
      "id": 1,
      "projectName": "项目A",
      "projectCode": "PROJ-A",
      "engineeringName": "工程A",
      "engineeringCode": "ENG-A",
      "contractCode": "CONT-A",
      "contractName": "合同A",
      "totalTaskExecutionCount": 16,
      "taskExecutionCountByBusinessDomain": {
        "contract": 5,
        "j_material": 3,
        "y_material": 8
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

- 搜索范围包括：项目名称、项目编码、工程名称、工程编码、合同名称、合同编码
- `totalTaskExecutionCount` 字段为该项目关联的所有任务的总数
- `taskExecutionCountByBusinessDomain` 字段为一个Map，key为业务域标识，value为该业务域下的任务执行数。此字段支持动态业务域。
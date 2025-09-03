# 临时数据管理 API 接口文档 (v1.1.0)

本文档描述了 v1.1.0 版本中新增的与临时数据管理相关的 API 接口。

## 1. 查询任务相关的临时数据

### 接口地址

`POST /api/materials/temporary/query`

### 请求方式

`POST`

### 请求参数 (Request Body)

```json
{
  "taskId": "string", // 关联的任务ID（选填）
  "dataType": "string", // 数据类型筛选（可选，"baseInfo" 或 "price"）
  "page": 0, // 页码（从0开始）
  "size": 10 // 每页大小
}
```

### 响应参数 (Response)

```json
{
  "code": 0,
  "msg": "string",
  "data": {
    "temporaryBaseInfos": [
      {
        // MaterialBaseInfoDO 对象
      }
    ],
    "temporaryPrices": [
      {
        // TaxPriceDO 对象
      }
    ],
    "page": {
      "currentPage": 0,
      "pageSize": 10,
      "totalElements": 100,
      "totalPages": 10
    },
    "statistics": {
      "totalBaseInfoCount": 50,
      "totalPriceCount": 30
    }
  }
}
```

### 描述

为后台管理员提供一个接口，用于查询所有与特定任务相关的临时维护的物资基础信息和价格信息。

---

## 2. 将临时数据转为正式数据 (批量)

### 接口地址

`POST /api/materials/temporary/promote`

### 请求方式

`POST`

### 请求参数 (Request Body)

```json
{
  "baseInfoIdsToPromote": ["string"],
  "priceIdsToPromote": ["string"]
}
```

### 响应参数 (Response)

```json
{
  "code": 0,
  "msg": "string", // 例如 "成功转正 X 条数据"
  "data": "string"
}
```

### 描述

管理员在审核临时数据后，可以调用此接口将一批临时的物资基础信息和价格信息正式加入基础库。

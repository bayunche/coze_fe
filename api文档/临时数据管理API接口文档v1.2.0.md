# 临时数据管理 API 接口文档 (v1.2.0)

本文档描述了 v1.2.0 版本中新增的与临时数据管理相关的 API 接口。

**v1.2.0 更新说明**:
- 调整了创建临时物资基础信息和价格信息接口，`associatedTaskId` 参数从必填改为选填

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

## 2. 创建临时物资基础信息

### 接口地址

`POST /api/materials/base-info/temporary/create`

### 请求方式

`POST`

### 请求参数 (Request Body)

```json
{
  "associatedTaskId": "string", // 关联的任务ID（选填）
  "materialName": "string", // 物资名称（必填）
  "specificationModel": "string", // 规格型号（选填）
  "unit": "string", // 单位（选填）
  "serialNumber": "string", // 序号（选填）
  "priceCode": "string", // 信息价编码（选填）
  "materialCode": "string", // 物资编码（选填）
  "businessDomain": "string", // 业务域（选填）
  "mainDistributionNetwork": "string", // 主/配标识（选填）
  "mainDistributionType": 0, // 主/配类型（选填）
  "type": "string" // 物资类型（选填）
}
```

### 响应参数 (Response)

```json
{
  "code": 0,
  "msg": "创建成功",
  "data": {
    // 创建的临时基础信息对象
  }
}
```

### 描述

创建一条临时的物资基础信息记录，可以选择性地关联到特定任务。

---

## 3. 创建临时价格信息

### 接口地址

`POST /materials/priceinfo/temporary/add`

### 请求方式

`POST`

### 请求参数 (Request Body)

```json
{
  "associatedTaskId": "string", // 关联的任务ID（选填）
  "baseInfoId": "string", // 关联基础信息ID（必填）
  "quarter": "string", // 季度（必填）
  "taxPrice": 0.00, // 含税价（必填）
  "taxExcludedPrice": 0.00, // 不含税价（选填）
  "unit": "string" // 价格单位（选填）
}
```

### 响应参数 (Response)

```json
{
  "code": 0,
  "msg": "创建成功",
  "data": {
    // 创建的临时价格信息对象
  }
}
```

### 描述

创建一条临时的价格信息记录，必须关联到已存在的基础信息ID，可以选择性地关联到特定任务。

---

## 4. 将临时数据转为正式数据 (批量)

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
# 价格信息 API 接口文档 (v1.1.0)

本文档描述了 v1.1.0 版本中价格信息模块新增或修改的 API 接口。

## 1. 创建临时价格信息

### 接口地址
`POST /materials/priceinfo/temporary/add`

### 请求方式
`POST`

### 请求参数 (Request Body)
```json
{
  "associatedTaskId": "string", // 关联的任务ID（必填）
  "baseInfoId": "string", // 关联基础信息ID（必填）
  "quarter": "string", // 季度（必填）
  "taxPrice": 0, // 含税价（必填）
  "taxExcludedPrice": 0, // 不含税价
  "unit": "string" // 价格单位
}
```

### 响应参数 (Response)
```json
{
  "code": 0,
  "msg": "string",
  "data": {
    // TaxPriceDO 对象
  }
}
```

### 描述
允许用户在匹配不到价格信息时，基于一个物资基础信息（可以是正式的，也可以是临时的），手动创建一条临时的价格信息。这条信息将标记为临时数据并与指定任务关联。
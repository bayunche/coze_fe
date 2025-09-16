# 物资基础信息 API 接口文档 (v1.1.0)

本文档描述了 v1.1.0 版本中物资基础信息模块新增或修改的 API 接口。

## 1. 创建临时物资基础信息

### 接口地址
`POST /api/materials/base-info/temporary/create`

### 请求方式
`POST`

### 请求参数 (Request Body)
```json
{
  "associatedTaskId": "string", // 关联的任务ID（必填）
  "materialName": "string", // 物资名称（必填）
  "specificationModel": "string", // 规格型号
  "unit": "string", // 单位
  "serialNumber": "string", // 序号
  "priceCode": "string", // 信息价编码
  "materialCode": "string", // 物资编码
  "businessDomain": "string", // 业务域
  "mainDistributionNetwork": "string", // 主/配标识
  "mainDistributionType": 0, // 主/配类型
  "type": "string" // 物资类型
}
```

### 响应参数 (Response)
```json
{
  "code": 0,
  "msg": "string",
  "data": {
    // MaterialBaseInfoDO 对象
  }
}
```

### 描述
允许用户在匹配不到基础物资信息时，手动创建一条临时的物资基础信息。这条信息将标记为临时数据并与指定任务关联。
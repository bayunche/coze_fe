# 根据ID查询基础物资信息

**功能描述**

此接口用于根据唯一ID查询单个基础物资信息记录的详细信息。

**接口地址**

`GET /api/materials/base-info/{id}`

**路径参数**

| 参数名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `id` | String | 是 | 物资基础信息唯一ID |

**请求示例**

```
GET /api/materials/base-info/bd-abc-123-456
```

**成功响应示例**

```json
{
  "code": 200,
  "msg": "Success",
  "data": {
    "id": "bd-abc-123-456",
    "bstudioCreateTime": "2023-10-27T10:00:00",
    "materialName": "混凝土C30",
    "specificationModel": "商品",
    "unit": "m3",
    "serialNumber": "SN001",
    "priceCode": "PC001",
    "materialCode": "MC001",
    "businessDomain": "j_material",
    "mainDistributionNetwork": "主网",
    "mainDistributionType": 1,
    "type": "建筑材料"
  }
}
```

**响应体字段说明**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `id` | String | 物资基础信息唯一ID |
| `bstudioCreateTime` | LocalDateTime | 数据创建时间 |
| `materialName` | String | 物资名称 |
| `specificationModel` | String | 规格型号 |
| `unit` | String | 单位 |
| `serialNumber` | String | 序列号 |
| `priceCode` | String | 价格代码 |
| `materialCode` | String | 物资编码 |
| `businessDomain` | String | 业务域 |
| `mainDistributionNetwork` | String | 主/配网标识 |
| `mainDistributionType` | Integer | 主/配网类型 |
| `type` | String | 物资类型 |

**错误响应示例**

**ID为空**
```json
{
  "code": 400,
  "msg": "物资ID不能为空"
}
```

**记录不存在**
```json
{
  "code": 400,
  "msg": "物资基础信息不存在，ID: bd-abc-123-456"
}
```
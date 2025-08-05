# 获取物资统计信息

**功能描述**

此接口用于获取与基础物资相关的统计数据，包括总物料数、总规格数和总类型数。可以提供一个可选的`keyword`参数，用于在计算统计数据之前筛选基础物资信息。

**接口地址**

`GET /api/materials/base-info/statistics`

**请求参数**

| 参数名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `keyword` | String | 否 | 用于筛选的关键字。如果提供，统计数据将仅基于与关键字匹配的基础物资信息。如果未提供，将统计所有基础物资信息。 |

**成功响应示例**

```json
{
  "code": 200,
  "msg": "Success",
  "data": {
    "totalMaterials": 1500,
    "totalSpecifications": 350,
    "totalTypes": 120
  }
}
```

**响应体字段说明**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `totalMaterials` | Long | 基础物资信息的总数。 |
| `totalSpecifications` | Long | 不同规格型号的总数。 |
| `totalTypes` | Long | 不同物资类型的总数。 |

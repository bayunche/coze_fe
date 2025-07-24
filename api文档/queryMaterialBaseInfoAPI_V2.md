# 查询基础物资信息（分页）

**功能描述**

此接口用于根据关键字模糊搜索基础物资信息，并支持分页查询。搜索范围包括物资名称、规格型号、单位、物资编码和序列号。

**接口地址**

`GET /api/materials/base-info/search`

**请求参数**

| 参数名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `keyword` | String | 否 | 用于模糊搜索的关键字。如果未提供，将返回所有基础物资信息。 |
| `page` | Integer | 否 | 页码，从0开始，默认为0。 |
| `size` | Integer | 否 | 每页显示的记录数，默认为10。 |
| `sort` | String | 否 | 排序参数，例如 `materialName,asc` 或 `materialCode,desc`。 |

**成功响应示例**

```json
{
  "code": 200,
  "msg": "Success",
  "data": {
    "content": [
      {
        "id": "bd-abc-123",
        "bstudioCreateTime": "2023-10-27T10:00:00",
        "materialName": "混凝土C30",
        "specificationModel": "商品",
        "unit": "m3",
        "serialNumber": "SN001",
        "priceCode": "PC001",
        "materialCode": "MC001",
        "businessDomain": "some-domain",
        "mainDistributionNetwork": "主网",
        "mainDistributionType": 1,
        "type": "建筑材料"
      },
      {
        "id": "bd-def-456",
        "bstudioCreateTime": "2023-10-27T11:00:00",
        "materialName": "钢筋HRB400",
        "specificationModel": "Φ25",
        "unit": "t",
        "serialNumber": "SN002",
        "priceCode": "PC002",
        "materialCode": "MC002",
        "businessDomain": "some-domain",
        "mainDistributionNetwork": "配网",
        "mainDistributionType": 2,
        "type": "结构材料"
      }
    ],
    "pageable": {
      "sort": {
        "sorted": false,
        "unsorted": true,
        "empty": true
      },
      "offset": 0,
      "pageNumber": 0,
      "pageSize": 10,
      "paged": true,
      "unpaged": false
    },
    "totalElements": 2,
    "totalPages": 1,
    "last": true,
    "size": 10,
    "number": 0,
    "sort": {
      "sorted": false,
      "unsorted": true,
      "empty": true
    },
    "numberOfElements": 2,
    "first": true,
    "empty": false
  }
}
```

**响应体字段说明**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `id` | String | 物资基础信息唯一ID。 |
| `bstudioCreateTime` | LocalDateTime | 数据创建时间。 |
| `materialName` | String | 物资名称。 |
| `specificationModel` | String | 规格型号。 |
| `unit` | String | 单位。 |
| `serialNumber` | String | 序列号。 |
| `priceCode` | String | 价格代码。 |
| `materialCode` | String | 物资编码。 |
| `businessDomain` | String | 业务域。 |
| `mainDistributionNetwork` | String | 主/配网标识。 |
| `mainDistributionType` | Integer | 主/配网类型。 |
| `type` | String | 物资类型。 |

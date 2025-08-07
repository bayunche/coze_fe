# 查询物资匹配状态

**功能描述**

此接口用于查询指定任务下所有源物资（包括申领和用料）的匹配状态。它返回一个包含所有物料的列表，无论其匹配状态如何（例如，已匹配、未匹配、人工指定等），并提供详细的匹配信息。

**接口地址**

`GET /materials/partya/queryMaterialMatchStatus`

**请求参数**

| 参数名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `taskId` | String | 是 | 要查询的任务ID。 |
| `page` | Integer | 否 | 页码，从0开始，默认为0。 |
| `size` | Integer | 否 | 每页显示的记录数，默认为10。 |

**成功响应示例**

```json
{
  "code": 200,
  "msg": "Success",
  "data": {
    "content": [
      {
        "sourceId": "e6f2b7c8-....",
        "sourceType": "requisition",
        "materialName": "混凝土C30",
        "specificationModel": "商品",
        "unit": "m3",
        "quantity": 150.0,
        "taskId": "task-001",
        "taskDetailId": "detail-001a",
        "baseDataId": "bd-abc-123",
        "matchedType": 1,
        "score": 100.0
      },
      {
        "sourceId": "f7g3c8d9-....",
        "sourceType": "usage",
        "materialName": "钢筋HRB400",
        "specificationModel": "Φ25",
        "unit": "t",
        "quantity": 25.5,
        "taskId": "task-001",
        "taskDetailId": "detail-002b",
        "baseDataId": null,
        "matchedType": 0,
        "score": 0.0
      }
    ],
    "pageable": { ... },
    "totalElements": 2,
    ...
  }
}
```

**响应体字段说明**

| 字段名 | 类型 | 描述 |
| --- | --- | --- |
| `sourceId` | String | 源记录的唯一ID（来自申领表或用料表）。 |
| `sourceType` | String | 数据来源类型，`requisition`表示申领，`usage`表示用料。 |
| `materialName` | String | 物料名称。 |
| `specificationModel` | String | 规格型号。 |
| `unit` | String | 单位。 |
| `quantity` | Double | 数量（申领数或使用数）。 |
| `taskId` | String | 任务ID。 |
| `taskDetailId` | String | 任务详情ID。 |
| `baseDataId` | String | 匹配到的标准物料ID，如果未匹配则为`null`。 |
| `matchedType` | Integer | 匹配类型（`0`:未匹配, `1`:精确匹配, `2`:相似匹配, `3`:历史匹配, `4`:人工指定）。 |
| `score` | Double | 匹配得分。 |

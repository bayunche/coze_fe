### 查询未匹配的甲供物资对平结果

**接口概述**

该接口用于分页查询指定任务（`taskId`）下，所有未匹配到标准物料的甲供物资对平结果。这通常发生在申领或用料记录中的物料名称和规格无法在标准物料库中找到对应条目时。返回的结果将包含这些未匹配物料的详细信息及其来源记录，方便用户进行手动核对或数据修正。

---

**请求**

- **URL:** `/materials/partya/queryUnmatchedBalanceResult`
- **HTTP Method:** `GET`
- **Content-Type:** `application/x-www-form-urlencoded`

**请求参数**

| 参数名    | 类型      | 是否必填 | 默认值 | 描述                                       |
| :-------- | :-------- | :------- | :----- | :----------------------------------------- |
| `taskId`  | `string`  | 是       |        | 要查询的任务的唯一ID。                     |
| `page`    | `integer` | 否       | `0`    | 分页查询的页码，从0开始。                  |
| `size`    | `integer` | 否       | `10`   | 每页返回的记录数量。                       |

---

**响应**

**成功响应示例**

```json
{
  "code": 0,
  "msg": "成功",
  "data": {
    "content": [
      {
        "id": "e8a3c1b1-1b1a-4b1a-8b1a-1b1a1b1a1b1a",
        "baseDataId": null,
        "materialName": "某种特定的钢筋",
        "specificationModel": "HRB500 Φ28",
        "unit": "t",
        "requisitionQuantity": 15.5,
        "actualUsageQuantity": 10.0,
        "actualReturnQuantity": 0.0,
        "balanceStatus": "UNMATCHED",
        "taskId": "task-001",
        "projectId": "proj-001",
        "taskDetailId": "detail-001",
        "sourceRequisitionIds": "req-id-1,req-id-2",
        "sourceUsageIds": "usage-id-1",
        "sourceRequisitions": [
          {
            "id": "req-id-1",
            "materialName": "某种特定的钢筋",
            "specificationModel": "HRB500 Φ28",
            "requisitionQuantity": 10.0
          }
        ],
        "sourceUsages": [
          {
            "id": "usage-id-1",
            "materialName": "某种特定的钢筋",
            "specificationModel": "HRB500 Φ28",
            "useCount": 10.0,
            "backCount": 0.0
          }
        ]
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
    "totalPages": 1,
    "totalElements": 1,
    "last": true,
    "size": 10,
    "number": 0,
    "sort": {
      "sorted": false,
      "unsorted": true,
      "empty": true
    },
    "numberOfElements": 1,
    "first": true,
    "empty": false
  }
}
```

**响应字段说明**

| 字段名                   | 类型     | 描述                                           |
| :----------------------- | :------- | :--------------------------------------------- |
| `code`                   | `int`    | 响应状态码，`0`表示成功。                      |
| `msg`                    | `string` | 响应消息。                                     |
| `data`                   | `object` | 包含分页结果的响应数据体。                     |
| `data.content`           | `array`  | 对平结果对象的数组。                           |
| `data.content[].id`      | `string` | 对平结果记录的唯一ID。                         |
| `data.content[].materialName` | `string` | 物料的原始名称。                               |
| `data.content[].specificationModel` | `string` | 物料的原始规格型号。                           |
| `data.content[].balanceStatus` | `string` | 对平状态，此处固定为 `UNMATCHED`。             |
| `data.content[].sourceRequisitions` | `array` | 导致此对平结果的原始申领记录列表。             |
| `data.content[].sourceUsages` | `array` | 导致此对平结果的原始用料记录列表。             |
| `data.pageable`          | `object` | Spring Data JPA返回的分页信息对象。            |
| `data.totalPages`        | `int`    | 总页数。                                       |
| `data.totalElements`     | `long`   | 总记录数。                                     |

**错误响应示例**

```json
{
  "code": -1,
  "msg": "请求处理失败，原因...",
  "data": null
}
```

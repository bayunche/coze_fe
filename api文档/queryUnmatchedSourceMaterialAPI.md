        # 查询未匹配的源物资数据 (V2)

        **功能描述**

        此接口用于查询指定任务下，所有未与标准物料库成功匹配的原始物料数据。查询范围包括甲供物资的“申领汇总”和“实际用料”两个来源。

        **接口地址**

        `GET /materials/partya/queryUnmatchedBalanceResult`

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
                "taskDetailId": "detail-001a"
              },
              {
                "sourceId": "f7g3c8d9-....",
                "sourceType": "usage",
                "materialName": "钢筋HRB400",
                "specificationModel": "Φ25",
                "unit": "t",
                "quantity": 25.5,
                "taskId": "task-001",
                "taskDetailId": "detail-002b"
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
            "totalElements": 2,
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
        | `sourceId` | String | 源记录的唯一ID（来自申领表或用料表）。 |
        | `sourceType` | String | 数据来源类型，`requisition`表示申领，`usage`表示用料。 |
        | `materialName` | String | 物料名称。 |
        | `specificationModel` | String | 规格型号。 |
        | `unit` | String | 单位。 |
        | `quantity` | Double | 数量（申领数或使用数）。 |
        | `taskId` | String | 任务ID。 |
        | `taskDetailId` | String | 任务详情ID。 |

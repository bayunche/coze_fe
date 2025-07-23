# 查询统一物料明细视图 (V2 - 重构版)

**功能描述**

此接口提供了一个关于指定任务下**所有物料**的统一、完整的状态视图。返回结果是一个混合列表，包含了三种类型的记录：

1.  **已匹配的交易明细 (`sourceType: "detail"`)**: 这些是已经成功匹配并生成了对平流水的记录。
2.  **未匹配的申领记录 (`sourceType: "requisition"`)**: 这些是来自原始申领表、但尚未匹配到标准物料的记录。
3.  **未匹配的用料记录 (`sourceType: "usage"`)**: 这些是来自实际用料表、但尚未匹配到标准物料的记录。

通过`sourceType`字段，调用者可以区分每条记录的性质。

**核心对平逻辑说明**

对于已匹配的记录（`detail`），其`finalBalanceStatus`是根据**“总交易通量”**计算的：
*   **计算方式**: `SUM(ABS(所有用料) + ABS(所有退料))`
*   **比较对象**: 将上述的总和与“计划申领总量” (`requisitionQuantity`) 进行比较。
*   这个逻辑旨在追踪所有物料的移动总量，而不仅仅是净消耗。

**接口地址**

`GET /materials/partya/queryBalanceDetails`

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
      // 1. 已匹配的交易明细
      {
        "id": "d-001",
        "sourceType": "detail",
        "finalBalanceStatus": "UNRETURNED", // 根据总交易通量计算得出
        "transactionQuantity": 150.0,
        "requisitionQuantity": 120.0,
        "statisticalQuantity": 5,
        "transactionCountForSummary": 2,
        "dataSourcePath": "/uploads/usage/file1.pdf",
        "usageMaterialName": "C30混凝土",
        "usageSpecificationModel": "商品",
        "supplierName": "XX建材供应商",
        "baseDataId": "bd-abc-123",
        "baseMaterialName": "混凝土C30",
        "baseSpecificationModel": "商品",
        "baseUnit": "m3",
        "taskId": "task-001",
        "taskDetailId": null
      },
      // 2. 未匹配的申领记录
      {
        "id": "req-abc-456",
        "sourceType": "requisition",
        "finalBalanceStatus": "UNMATCHED",
        "transactionQuantity": 50.0, // 此处为申领量
        "requisitionQuantity": null,
        "statisticalQuantity": null,
        "transactionCountForSummary": null,
        "dataSourcePath": null,
        "usageMaterialName": "未知规格钢材",
        "usageSpecificationModel": "特殊定制",
        "supplierName": "YY特钢",
        "baseDataId": null,
        "baseMaterialName": null,
        "baseSpecificationModel": null,
        "baseUnit": "吨",
        "taskId": "task-001",
        "taskDetailId": "detail-003a"
      },
      // 3. 未匹配的用料记录
      {
        "id": "usage-xyz-789",
        "sourceType": "usage",
        "finalBalanceStatus": "UNMATCHED",
        "transactionQuantity": 10.0, // 此处为用料量
        "requisitionQuantity": null,
        "statisticalQuantity": null,
        "transactionCountForSummary": null,
        "dataSourcePath": "/uploads/usage/scan_002.jpg",
        "usageMaterialName": "手填螺丝",
        "usageSpecificationModel": "M12x50",
        "supplierName": null,
        "baseDataId": null,
        "baseMaterialName": null,
        "baseSpecificationModel": null,
        "baseUnit": "个",
        "taskId": "task-001",
        "taskDetailId": "detail-004b"
      }
    ],
    "pageable": { ... },
    "totalElements": 3,
    ...
  }
}
```

**响应体字段说明**

| 字段名 | `sourceType` | 描述 |
| --- | --- | --- |
| `id` | `all` | 记录的唯一ID。根据`sourceType`的不同，它可能是对平明细ID、申领ID或用料ID。 |
| `sourceType` | `all` | **关键字段**。`detail`, `requisition`, 或 `usage`。 |
| `finalBalanceStatus` | `all` | `detail`类型：计算出的对平状态。`requisition`/`usage`类型：固定为`UNMATCHED`。 |
| `transactionQuantity` | `detail` | 交易数量（正为用料，负为退料）。 |
| | `requisition`| 原始申领数量。 |
| | `usage`| 原始用料数量。 |
| `requisitionQuantity` | `detail` | 关联申领单的总申领数。其他类型为`null`。 |
| `transactionCountForSummary`| `detail` | 关联申领单下的总交易笔数。其他类型为`null`。 |
| `usageMaterialName` | `all` | 原始单据上的物料名称。 |
| `baseMaterialName` | `detail` | 匹配到的标准物料名称。其他类型为`null`。 |
| `...` | `...` | 其他字段根据其来源（申领、用料、基础物料）填充，未关联的数据则为`null`。 |

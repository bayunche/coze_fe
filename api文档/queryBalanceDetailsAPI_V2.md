# 查询详细对平结果 (V2)

**功能描述**

此接口用于查询指定任务下每一笔物资流转的详细对平记录。它提供了高度关联的数据视图，将单笔交易与申领汇总、实际用料、标准物料库信息全部链接起来，并动态计算最终的对平状态。

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
      {
        "detailId": "d-001",
        "transactionQuantity": 50.0, // 正数表示用料，负数表示退料
        "finalBalanceStatus": "DATA_MISSING", // BALANCED, UNRETURNED, DATA_MISSING
        "transactionCountForSummary": 2,
        "dataSourcePath": "/uploads/actual_usage_file_1.pdf",
        "usageMaterialName": "C30混凝土",
        "usageSpecificationModel": "商品",
        "supplierName": "XX建材供应商",
        "requisitionQuantity": 120.0,
        "statisticalQuantity": 5,
        "baseDataId": "bd-abc-123",
        "baseMaterialName": "混凝土C30",
        "baseSpecificationModel": "商品",
        "baseUnit": "m3"
      },
      {
        "detailId": "d-002",
        "transactionQuantity": -10.0,
        "finalBalanceStatus": "DATA_MISSING",
        "transactionCountForSummary": 2,
        "dataSourcePath": "/uploads/return_material_file_2.pdf",
        "usageMaterialName": "C30混凝土",
        "usageSpecificationModel": "商品",
        "supplierName": "XX建材供应商",
        "requisitionQuantity": 120.0,
        "statisticalQuantity": 5,
        "baseDataId": "bd-abc-123",
        "baseMaterialName": "混凝土C30",
        "baseSpecificationModel": "商品",
        "baseUnit": "m3"
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
| `detailId` | String | 对平详情记录的唯一ID。 |
| `transactionQuantity` | Double | 本次交易的数量。正数代表实际用料，负数代表实际退料。 |
| `finalBalanceStatus` | String | **【计算字段】** 该笔交易所属的申领汇总的最终对平状态（`BALANCED`: 已对平, `UNRETURNED`: 未退库, `DATA_MISSING`: 资料缺失）。 |
| `transactionCountForSummary`| Long | **【计算字段】** 与本记录关联的同一个申领汇总（`MaterialRequisitionSummaryDO`）下共有多少笔交易记录。 |
| `dataSourcePath` | String | **【关联字段】** 产生这笔用料/退料的原始文件路径（来自`ActualUsageMaterialDO`）。 |
| `usageMaterialName` | String | **【关联字段】** 用料/退料单据中记录的原始物料名称。 |
| `usageSpecificationModel` | String | **【关联字段】** 用料/退料单据中记录的原始规格型号。 |
| `supplierName` | String | **【关联字段】** 对应申领单中的供应商名称（来自`MaterialRequisitionSummaryDO`）。 |
| `requisitionQuantity` | Double | **【关联字段】** 对应申领单的总申领数量。 |
| `statisticalQuantity` | Integer | **【关联字段】** 对应申领单的统计数量（明细行数）。 |
| `baseDataId` | String | **【关联字段】** 匹配到的标准物料ID（来自`MaterialBaseInfoDO`）。 |
| `baseMaterialName` | String | **【关联字段】** 标准物料库中的物料名称。 |
| `baseSpecificationModel` | String | **【关联字段】** 标准物料库中的规格型号。 |
| `baseUnit` | String | **【关联字段】** 标准物料库中的单位。 |

# 甲供物资查询 API

本文档详细说明了用于查询甲供物资数据的 API 端点。

---

## 1. 查询甲供物资申领数据

此端点用于分页查询甲供物资的申领数据，并关联基础物资信息。

- **URL** : `/materials/partya/queryMaterialsApplyData`
- **Method** : `GET`
- **Content-Type** : `application/json`

### 请求参数

| 参数 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| `taskDetailId` | `String` | 是 | 任务详情的唯一标识符。 |
| `page` | `int` | 否 | 请求的页码，从0开始。默认为 `0`。 |
| `size` | `int` | 否 | 每页返回的记录数。默认为 `10`。 |
| `sort` | `String` | 否 | 排序参数，格式为 `property,direction`（例如 `materialName,asc`）。可多次指定。 |

### 响应字段说明

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `id` | `String` | 主键ID |
| `materialCategoryCode` | `String` | 物资品类编码 |
| `materialName` | `String` | 物资名称 |
| `specificationModel` | `String` | 规格型号 |
| `statisticalQuantity` | `Integer` | 统计数据数（单位：行） |
| `requisitionQuantity` | `Double` | 统计后申领数 |
| `unit` | `String` | 计量单位 |
| `supplier` | `String` | 物资供应商 |
| `unitPrice` | `BigDecimal` | 单价（元） |
| `taxPerUnit` | `BigDecimal` | 单位税额（元） |
| `totalPrice` | `BigDecimal` | 总价（元） |
| `totalTax` | `BigDecimal` | 总税额（元） |
| `taskId` | `String` | 关联任务ID |
| `projectId` | `String` | 关联项目ID |
| `taskDetailId` | `String` | 关联任务详情ID |
| `baseDataId` | `String` | 关联的基础物资ID |
| `matchedType` | `Integer` | 匹配类型 |
| `score` | `Double` | 匹配分数 |
| `baseMaterialName` | `String` | **基础物资**的名称（来自关联查询） |
| `baseSpecificationModel` | `String` | **基础物资**的规格型号（来自关联查询） |
| `baseUnit` | `String` | **基础物资**的计量单位（来自关联查询） |

### 响应格式示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "content": [
      {
        "id": "d2a1c8f0-b3e8-4b1e-9b9a-7e1b5f9c3c1a",
        "materialCategoryCode": "M001",
        "materialName": "螺纹钢",
        "specificationModel": "Φ25",
        "statisticalQuantity": 10,
        "requisitionQuantity": 100.5,
        "unit": "吨",
        "supplier": "XX供应商",
        "unitPrice": 4500.00,
        "taxPerUnit": 585.00,
        "totalPrice": 452250.00,
        "totalTax": 58792.50,
        "taskId": "task-001",
        "projectId": "proj-001",
        "taskDetailId": "detail-001",
        "baseDataId": "base-mat-001",
        "matchedType": 1,
        "score": 0.95,
        "baseMaterialName": "HRB400螺纹钢",
        "baseSpecificationModel": "Φ25mm",
        "baseUnit": "t"
      }
    ],
    "pageable": {
        // ... Pageable info
    }
  }
}
```

---

## 2. 查询实际使用物资数据

此端点用于分页查询实际使用的物资，并可选择性地返回关联的基础物资信息。

- **URL** : `/materials/partya/queryActualUsage`
- **Method** : `GET`
- **Content-Type** : `application/json`

### 请求参数

| 参数 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| `taskDetailId` | `String` | 是 | 任务详情的唯一标识符。 |
| `page` | `int` | 否 | 请求的页码，从0开始。默认为 `0`。 |
| `size` | `int` | 否 | 每页返回的记录数。默认为 `10`。 |
| `sort` | `String` | 否 | 排序参数，格式为 `property,direction`（例如 `materialName,asc`）。可多次指定。 |

### 响应字段说明

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `id` | `String` | 主键ID |
| `materialName` | `String` | 物资名称 |
| `specificationModel` | `String` | 规格型号 |
| `unit` | `String` | 计量单位 |
| `sendCount` | `Double` | 发送数量 |
| `backCount` | `Double` | 退回数量 |
| `useCount` | `Double` | 使用数量 |
| `baseDataId` | `String` | 关联的基础物资ID |
| `matchedType` | `Integer` | 匹配类型 |
| `score` | `Double` | 匹配分数 |
| `taskId` | `String` | 关联任务ID |
| `projectId` | `String` | 关联项目ID |
| `taskDetailId` | `String` | 关联任务详情ID |
| `path` | `String` | 来源文件路径 |
| `baseMaterialName` | `String` | **基础物资**的名称（来自关联查询） |
| `baseSpecificationModel` | `String` | **基础物资**的规格型号（来自关联查询） |
| `baseUnit` | `String` | **基础物资**的计量单位（来自关联查询） |


---

## 3. 查询物资对平结果数据 (含来源)

此端点用于分页查询物资对平的结果，并包含详细的来源数据列表。

- **URL** : `/materials/partya/queryBalanceResult`
- **Method** : `GET`
- **Content-Type** : `application/json`

### 请求参数

| 参数 | 类型 | 是否必需 | 描述 |
| --- | --- | --- | --- |
| `taskId` | `String` | 是 | 任务的唯一标识符。 |
| `taskDetailId` | `String` | 是 | 任务详情的唯一标识符。 |
| `page` | `int` | 否 | 请求的页码，从0开始。默认为 `0`。 |
| `size` | `int` | 否 | 每页返回的记录数。默认为 `10`。 |
| `sort` | `String` | 否 | 排序参数，格式为 `property,direction`。 |

### 响应字段说明

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `id` | `String` | 主键ID |
| `baseDataId` | `String` | 关联的基础物资ID |
| `materialName` | `String` | 物资名称 |
| `specificationModel` | `String` | 规格型号 |
| `unit` | `String` | 计量单位 |
| `requisitionQuantity` | `Double` | 申领数量 |
| `actualUsageQuantity` | `Double` | 实际使用数量 |
| `actualReturnQuantity` | `Double` | 实际退料数量 |
| `balanceStatus` | `Integer` | 对平状态。具体值取决于`BalanceStatusEnum`的序数 (e.g., BALANCED, UNRETURNED, DATA_MISSING, UNMATCHED) |
| `taskId` | `String` | 关联任务ID |
| `projectId` | `String` | 关联项目ID |
| `taskDetailId` | `String` | 关联任务详情ID |
| `sourceRequisitionIds` | `String` | (已废弃) 来源申领记录ID列表（逗号分隔） |
| `sourceUsageIds` | `String` | (已废弃) 来源使用记录ID列表（逗号分隔） |
| `sourceRequisitions` | `Array` | **来源的申领数据列表** (详细结构见下方) |
| `sourceUsages` | `Array` | **来源的实际使用/退料数据列表** (详细结构见下方) |

#### `sourceRequisitions` 对象结构

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `id` | `String` | 主键ID |
| `materialCategoryCode` | `String` | 物资品类编码 |
| `materialName` | `String` | 物资名称 |
| `specificationModel` | `String` | 规格型号 |
| `statisticalQuantity` | `Integer` | 统计数据数（单位：行） |
| `requisitionQuantity` | `Double` | 统计后申领数 |
| `unit` | `String` | 计量单位 |
| `supplier` | `String` | 物资供应商 |
| `unitPrice` | `BigDecimal` | 单价（元） |
| `taxPerUnit` | `BigDecimal` | 单位税额（元） |
| `totalPrice` | `BigDecimal` | 总价（元） |
| `totalTax` | `BigDecimal` | 总税额（元） |
| `taskId` | `String` | 关联任务ID |
| `projectId` | `String` | 关联项目ID |
| `taskDetailId` | `String` | 关联任务详情ID |
| `baseDataId` | `String` | 关联的基础物资ID |
| `matchedType` | `Integer` | 匹配类型 |
| `score` | `Double` | 匹配分数 |

#### `sourceUsages` 对象结构

| 字段 | 类型 | 描述 |
| --- | --- | --- |
| `id` | `String` | 主键ID |
| `materialName` | `String` | 物资名称 |
| `specificationModel` | `String` | 规格型号 |
| `unit` | `String` | 计量单位 |
| `sendCount` | `Double` | 发送数量 |
| `backCount` | `Double` | 退回数量 |
| `useCount` | `Double` | 使用数量 |
| `baseDataId` | `String` | 关联的基础物资ID |
| `matchedType` | `Integer` | 匹配类型 |
| `score` | `Double` | 匹配分数 |
| `taskId` | `String` | 关联任务ID |
| `projectId` | `String` | 关联项目ID |
| `taskDetailId` | `String` | 关联任务详情ID |
| `path` | `String` | 来源文件路径 |


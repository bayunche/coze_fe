### 人工匹配并更新对平状态

**接口概述**

该接口用于对一个当前状态为“未匹配”（`UNMATCHED`）的甲供物资对平结果进行人工干预。通过提供一个对平结果ID（`balanceResultId`）和一个目标标准物料ID（`baseDataId`），可以将该条记录与一个标准物料进行强制关联，并将其状态更新为“人工确认后待对平”（`MANUAL_MATCH_PENDING`）。这为处理自动匹配失败的数据提供了一个重要的修正渠道。

---

**请求**

- **URL:** `/materials/partya/manualMatch`
- **HTTP Method:** `POST`
- **Content-Type:** `application/json`

**请求体**

```json
{
  "balanceResultId": "e8a3c1b1-1b1a-4b1a-8b1a-1b1a1b1a1b1a",
  "baseDataId": "base-data-id-002"
}
```

**请求参数说明**

| 参数名             | 类型     | 是否必填 | 描述                                                         |
| :----------------- | :------- | :------- | :----------------------------------------------------------- |
| `balanceResultId`  | `string` | 是       | 要进行人工匹配的对平结果记录的唯一ID (`wmes_material_balance_result.id`)。 |
| `baseDataId`       | `string` | 是       | 用户指定要关联的标准物料的唯一ID (`wmes_material_base_info.id`)。  |

---

**响应**

**成功响应示例**

```json
{
  "code": 0,
  "msg": "人工匹配成功，状态已更新为“人工确认后待对平”。",
  "data": null
}
```

**响应字段说明**

| 字段名 | 类型     | 描述                                 |
| :----- | :------- | :----------------------------------- |
| `code` | `int`    | 响应状态码，`0`表示成功。            |
| `msg`  | `string` | 响应消息，描述操作的执行结果。       |
| `data` | `object` | 成功时通常为`null`。                 |

---

**错误响应示例**

**1. 对平记录不存在**

```json
{
  "code": -1,
  "msg": "未找到ID为 e8a3c1b1-1b1a-4b1a-8b1a-1b1a1b1a1b1a 的对平记录。",
  "data": null
}
```

**2. 记录状态不正确**

```json
{
  "code": -1,
  "msg": "该记录当前状态为 '对平'，只有未匹配的记录才能进行人工指定。",
  "data": null
}
```

**3. 目标标准物料不存在**

```json
{
  "code": -1,
  "msg": "未找到ID为 base-data-id-invalid 的标准物料。",
  "data": null
}
```

**4. 请求参数缺失**

```json
{
  "code": -1,
  "msg": "请求参数无效，balanceResultId 和 baseDataId 不能为空。",
  "data": null
}
```

# 创建基础物资信息

**功能描述**

此接口用于创建新的基础物资信息记录。创建时会自动生成唯一ID和创建时间，并对输入参数进行完整性验证。

**接口地址**

`POST /api/materials/base-info/create`

**请求参数**

请求体格式：`application/json`

| 参数名 | 类型 | 是否必填 | 描述 | 约束条件 |
| --- | --- | --- | --- | --- |
| `materialName` | String | 是 | 物资名称 | 长度不能超过200个字符 |
| `specificationModel` | String | 否 | 规格型号 | 长度不能超过200个字符 |
| `unit` | String | 否 | 单位 | 长度不能超过50个字符 |
| `serialNumber` | String | 否 | 序列号 | 长度不能超过100个字符 |
| `priceCode` | String | 否 | 信息价编码 | 长度不能超过100个字符 |
| `materialCode` | String | 否 | 物资编码 | 长度不能超过100个字符 |
| `businessDomain` | String | 否 | 业务域 | 长度不能超过50个字符，必须是合法的业务域值 |
| `mainDistributionNetwork` | String | 否 | 主/配标识 | 长度不能超过50个字符 |
| `mainDistributionType` | Integer | 否 | 主/配类型 | 只能是1、2、3 |
| `type` | String | 否 | 物资类型 | 长度不能超过100个字符 |

**业务域枚举值**

| 值 | 描述 |
| --- | --- |
| `contract` | 合同业务 |
| `j_material` | 甲供物资业务 |
| `y_material` | 乙供物资业务 |

**主/配类型枚举值**

| 值 | 描述 |
| --- | --- |
| `1` | 主网 |
| `2` | 配网 |
| `3` | 深圳市地材价 |

**请求示例**

```json
{
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
| `id` | String | 物资基础信息唯一ID（系统自动生成） |
| `bstudioCreateTime` | LocalDateTime | 数据创建时间（系统自动生成） |
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

**参数验证错误**
```json
{
  "code": 400,
  "msg": "物资名称不能为空"
}
```

**业务域值无效**
```json
{
  "code": 400,
  "msg": "业务域值无效，有效值为: contract, j_material, y_material"
}
```

**字段长度超限**
```json
{
  "code": 400,
  "msg": "物资名称长度不能超过200个字符"
}
```

**主/配类型无效**
```json
{
  "code": 400,
  "msg": "主/配类型只能为1、2或3"
}
```
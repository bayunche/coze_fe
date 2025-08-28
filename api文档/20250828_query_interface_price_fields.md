# 乙供物资查询接口 - 价格计算字段说明

## 接口信息
- **接口路径**: `POST /materials/partyb/query`
- **功能描述**: 复杂查询乙供物资解析结果，支持分页、筛选、搜索
- **新增功能**: 价格计算相关字段返回

## 新增价格计算字段

### 1. originalPrice（原始价格）
- **字段类型**: String
- **描述**: 从Excel文件中直接读取的原始价格数据
- **示例值**: "100.00"
- **说明**: 无论Excel中是含税价还是不含税价，这里都保存原始数值

### 2. priceType（价格类型）
- **字段类型**: Integer
- **描述**: 标识原始价格的类型
- **取值说明**:
  - `1`: 含税价
  - `0`: 不含税价
- **示例值**: 1

### 3. taxExcludedPrice（不含税价格）
- **字段类型**: String
- **描述**: 根据税率计算得出的不含税价格
- **计算公式**: 
  - 当priceType=1（含税价）时: `不含税价 = 含税价 ÷ (1 + 税率)`
  - 当priceType=0（不含税价）时: 直接使用原始价格
- **示例值**: "88.50"
- **税率配置**: 默认13%，可通过`tax.rate.default-rate`配置

### 4. unitPrice（含税价格）
- **字段类型**: String（复用现有字段）
- **描述**: 含税价格，可能来自Excel读取或根据税率计算
- **计算公式**:
  - 当priceType=1（含税价）时: 直接使用原始价格
  - 当priceType=0（不含税价）时: `含税价 = 不含税价 × (1 + 税率)`
- **示例值**: "100.00"

## 价格计算逻辑

### 场景1：Excel中为含税价
```
原始价格(originalPrice): 113.00
价格类型(priceType): 1（含税价）
计算过程：
  不含税价 = 113.00 ÷ (1 + 0.13) = 100.00
返回结果：
  unitPrice: "113.00"（含税价）
  taxExcludedPrice: "100.00"（不含税价）
```

### 场景2：Excel中为不含税价
```
原始价格(originalPrice): 100.00
价格类型(priceType): 0（不含税价）
计算过程：
  含税价 = 100.00 × (1 + 0.13) = 113.00
返回结果：
  unitPrice: "113.00"（含税价）
  taxExcludedPrice: "100.00"（不含税价）
```

## 配置说明

### 税率配置
在`application.yml`中配置：
```yaml
tax:
  rate:
    default-rate: 0.13  # 默认税率13%
```

### 数据库字段
- `original_price`: DECIMAL(15,4) - 原始价格
- `tax_excluded_price`: DECIMAL(15,4) - 不含税价格
- `price_type`: INT - 价格类型
- `tax_price`: DECIMAL(10,2) - 含税价格（复用现有字段）

## 使用示例

### 请求示例
```json
{
  "taskId": "task-123",
  "page": 0,
  "size": 10,
  "keyword": "水泥",
  "confirmResult": 0,
  "matchedType": 1
}
```

### 响应示例
```json
{
  "content": [
    {
      "taskDataId": "data-456",
      "materialName": "普通硅酸盐水泥",
      "originalPrice": "113.00",
      "priceType": 1,
      "taxExcludedPrice": "100.00",
      "unitPrice": "113.00",
      "specifications": "P.O 42.5",
      "unit": "吨",
      "quantity": "10.00",
      "totalPrice": "1130.00",
      "confirmResult": 0,
      "matchedType": 1
    }
  ],
  "pageInfo": {
    "currentPage": 0,
    "pageSize": 10,
    "totalElements": 1,
    "totalPages": 1
  },
  "statistics": {
    "totalCount": 1,
    "confirmedCount": 0,
    "unconfirmedCount": 1
  }
}
```

## 注意事项

1. **向后兼容**: 现有接口调用不受影响，unitPrice字段继续返回含税价
2. **数据完整性**: 新增字段在价格计算完成后才会包含有效值
3. **错误处理**: 价格计算失败时，相关字段可能为null
4. **精度处理**: 价格计算使用4位小数精度，显示时可根据需要格式化
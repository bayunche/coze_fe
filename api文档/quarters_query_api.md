# 价格季度查询接口文档 - v1.3.1

## 接口概述

本接口用于查询价格表中所有可用的季度信息，为前端页面的季度选择器提供数据支持。返回的季度按降序排列（最新季度在前），适用于乙供物资匹配、价格查询、任务配置等多个业务场景。

## 接口信息

### 基本信息
- **接口名称**: 查询所有可用季度信息
- **请求方式**: `GET`
- **接口路径**: `/materials/priceinfo/quarters`
- **内容类型**: `application/json`
- **版本**: `v1.3.1`

### 业务场景
- 乙供物资匹配页面的季度选择器
- 价格查询页面的季度筛选器  
- 任务配置页面的结算季度设置
- 价格信息维护页面的季度选择

## 接口详情

### 请求信息

#### 请求参数
无参数，直接GET请求即可。

#### 请求示例

```bash
# cURL 请求示例
curl -X GET "http://localhost:8080/materials/priceinfo/quarters" \
  -H "Accept: application/json"
```

```javascript
// JavaScript Fetch 请求示例
fetch('/materials/priceinfo/quarters', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('可用季度:', data.data);
});
```

### 响应信息

#### 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": [
    "2024-Q4",
    "2024-Q3", 
    "2024-Q2",
    "2024-Q1",
    "2023-Q4",
    "2023-Q3"
  ]
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| code | Integer | 响应状态码，0表示成功 | 0 |
| message | String | 响应消息 | "success" |
| data | List<String> | 季度列表，按降序排列 | ["2024-Q4", "2024-Q3"] |

#### 季度格式说明
- **格式**: `YYYY-Qn`，其中YYYY为年份，n为季度编号（1-4）
- **排序**: 按降序排列，最新季度在前
- **示例**: 
  - `2024-Q4` - 2024年第4季度
  - `2024-Q3` - 2024年第3季度
  - `2024-Q2` - 2024年第2季度
  - `2024-Q1` - 2024年第1季度

#### 状态码说明

| 状态码 | 说明 | 处理建议 |
|--------|------|----------|
| 0 | 请求成功 | 正常处理返回的季度数据 |
| 500 | 服务器内部错误 | 检查系统日志，联系管理员 |

## 使用示例

### 前端下拉框集成

#### React 组件示例

```jsx
import React, { useState, useEffect } from 'react';
import { Select } from 'antd';

const QuarterSelector = ({ onQuarterChange, defaultValue }) => {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuarters();
  }, []);

  const fetchQuarters = async () => {
    try {
      const response = await fetch('/materials/priceinfo/quarters');
      const result = await response.json();
      
      if (result.code === 0) {
        setQuarters(result.data);
      } else {
        console.error('获取季度数据失败:', result.message);
      }
    } catch (error) {
      console.error('请求季度数据异常:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      placeholder="请选择季度"
      loading={loading}
      defaultValue={defaultValue}
      onChange={onQuarterChange}
      style={{ width: 200 }}
    >
      {quarters.map(quarter => (
        <Select.Option key={quarter} value={quarter}>
          {quarter}
        </Select.Option>
      ))}
    </Select>
  );
};

export default QuarterSelector;
```

#### Vue 组件示例

```vue
<template>
  <el-select
    v-model="selectedQuarter"
    placeholder="请选择季度"
    :loading="loading"
    @change="handleQuarterChange"
  >
    <el-option
      v-for="quarter in quarters"
      :key="quarter"
      :label="quarter"
      :value="quarter"
    />
  </el-select>
</template>

<script>
export default {
  name: 'QuarterSelector',
  props: {
    defaultValue: String
  },
  data() {
    return {
      quarters: [],
      selectedQuarter: this.defaultValue,
      loading: true
    };
  },
  mounted() {
    this.fetchQuarters();
  },
  methods: {
    async fetchQuarters() {
      try {
        const response = await this.$http.get('/materials/priceinfo/quarters');
        if (response.data.code === 0) {
          this.quarters = response.data.data;
        }
      } catch (error) {
        console.error('获取季度数据失败:', error);
      } finally {
        this.loading = false;
      }
    },
    handleQuarterChange(value) {
      this.$emit('quarter-change', value);
    }
  }
};
</script>
```

### 业务集成示例

#### 物资匹配页面集成

```javascript
// 物资匹配任务配置
const MaterialMatchConfig = {
  async initQuarterOptions() {
    const response = await fetch('/materials/priceinfo/quarters');
    const result = await response.json();
    
    if (result.code === 0) {
      // 设置默认季度为最新季度
      this.defaultQuarter = result.data[0];
      this.quarterOptions = result.data;
    }
  },
  
  onQuarterChange(selectedQuarter) {
    // 更新匹配参数
    this.matchParams.quarter = selectedQuarter;
    console.log(`选择季度: ${selectedQuarter}`);
  }
};
```

## 技术实现

### 数据库查询
接口底层执行的SQL查询：
```sql
SELECT DISTINCT `quarter` 
FROM wmes_tax_price 
ORDER BY quarter DESC
```

### 服务层方法
- **DAO方法**: `ITaxPriceDAO.findAllDistinctQuarters()`
- **Service方法**: `ITaxPriceService.getAllAvailableQuarters()`
- **Controller方法**: `TaxPriceController.getAllAvailableQuarters()`

### 性能特点
- **查询效率**: 使用DISTINCT去重，查询速度快
- **缓存友好**: 季度数据变化频率低，适合添加缓存
- **数据量小**: 一般情况下季度数量较少，响应速度快

## 错误处理

### 常见错误场景

1. **数据库连接异常**
   ```json
   {
     "code": 500,
     "message": "数据库连接失败",
     "data": null
   }
   ```

2. **数据表为空**
   ```json
   {
     "code": 0,
     "message": "success",
     "data": []
   }
   ```

3. **系统异常**
   ```json
   {
     "code": 500,
     "message": "系统内部错误",
     "data": null
   }
   ```

### 错误处理建议

```javascript
const handleQuarterRequest = async () => {
  try {
    const response = await fetch('/materials/priceinfo/quarters');
    const result = await response.json();
    
    if (result.code === 0) {
      if (result.data && result.data.length > 0) {
        // 正常处理季度数据
        setQuarters(result.data);
      } else {
        // 无季度数据的情况
        console.warn('暂无可用季度数据');
        setQuarters([]);
      }
    } else {
      // 业务错误处理
      console.error('获取季度失败:', result.message);
      setError(result.message);
    }
  } catch (error) {
    // 网络或系统错误处理
    console.error('请求异常:', error);
    setError('网络异常，请稍后重试');
  }
};
```

## 版本信息

- **版本**: v1.3.1
- **发布日期**: 2025-01-12
- **变更类型**: 新增接口
- **兼容性**: 向前兼容，无破坏性变更
- **依赖**: 需要 wmes_tax_price 表存在且包含 quarter 字段

## 相关接口

- [价格信息分页查询接口](./price_info_query_api.md)
- [物资基础信息查询接口](./material_base_info_api.md)
- [乙供物资匹配接口](./party_b_material_match_api.md)

---

**注意事项**:
1. 该接口无需身份验证，但在生产环境中建议添加适当的权限控制
2. 建议在前端实现适当的缓存机制，避免频繁请求
3. 季度格式严格按照 `YYYY-Qn` 格式，前端解析时需注意格式验证
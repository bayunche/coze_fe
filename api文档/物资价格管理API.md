# 物资价格管理 API

## 1. 分页查询物资价格列表

- **接口地址:** `GET /materials/priceinfo/page`
- **功能描述:** 根据条件分页查询物资价格信息。
- **请求参数:**

| 参数名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `baseInfoId` | `String` | 否 | 物资基础信息ID |
| `page` | `int` | 否 | 页码，从0开始，默认为0 |
| `size` | `int` | 否 | 每页数量，默认为10 |

- **请求示例:**
  ```http
  GET /materials/priceinfo/page?baseInfoId=some-base-id&page=0&size=5
  ```

- **成功响应:**
  ```json
  {
    "code": 0,
    "msg": "成功",
    "data": {
      "content": [
        {
          "id": "price-id-1",
          "baseInfoId": "some-base-id",
          "quarter": "2023-Q1",
          "taxPrice": 100.50
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
        "pageSize": 5,
        "paged": true,
        "unpaged": false
      },
      "totalPages": 1,
      "totalElements": 1,
      "last": true,
      "size": 5,
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

---

## 2. 新增物资价格

- **接口地址:** `POST /materials/priceinfo`
- **功能描述:** 创建一条新的物资价格记录。
- **请求体 (`application/json`):**

| 字段名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `baseInfoId` | `String` | 是 | 物资基础信息ID |
| `quarter` | `String` | 是 | 季度，例如 "2023-Q1" |
| `taxPrice` | `BigDecimal` | 是 | 含税价格 |

- **请求示例:**
  ```json
  {
    "baseInfoId": "some-base-id",
    "quarter": "2023-Q2",
    "taxPrice": 105.75
  }
  ```

- **成功响应:**
  ```json
  {
    "code": 0,
    "msg": "成功",
    "data": {
      "id": "new-price-id",
      "baseInfoId": "some-base-id",
      "quarter": "2023-Q2",
      "taxPrice": 105.75
    }
  }
  ```

---

## 3. 修改物资价格

- **接口地址:** `PUT /materials/priceinfo`
- **功能描述:** 更新已存在的物资价格记录。
- **请求体 (`application/json`):**

| 字段名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `id` | `String` | 是 | 要修改的价格记录ID |
| `quarter` | `String` | 是 | 季度 |
| `taxPrice` | `BigDecimal` | 是 | 含税价格 |

- **请求示例:**
  ```json
  {
    "id": "price-id-1",
    "quarter": "2023-Q1",
    "taxPrice": 101.00
  }
  ```

- **成功响应:**
  ```json
  {
    "code": 0,
    "msg": "成功",
    "data": {
      "id": "price-id-1",
      "baseInfoId": "some-base-id",
      "quarter": "2023-Q1",
      "taxPrice": 101.00
    }
  }
  ```

---

## 4. 批量删除物资价格

- **接口地址:** `DELETE /materials/priceinfo`
- **功能描述:** 根据ID列表批量删除物资价格记录。
- **请求体 (`application/json`):**
  ```json
  [
    "price-id-1",
    "price-id-2"
  ]
  ```

- **成功响应:**
  ```json
  {
    "code": 0,
    "msg": "成功",
    "data": "删除成功"
  }
  ```

---

## 5. 获取物资价格统计信息

- **接口地址:** `GET /materials/priceinfo/statistics/{baseInfoId}`
- **功能描述:** 获取指定物资的历史价格统计信息（最高、最低、平均价和总数）。
- **请求参数:**

| 参数名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `baseInfoId` | `String` | 是 | 物资基础信息ID (路径参数) |

- **请求示例:**
  ```http
  GET /materials/priceinfo/statistics/some-base-id
  ```

- **成功响应:**
  ```json
  {
    "code": 0,
    "msg": "成功",
    "data": {
      "baseInfoId": "some-base-id",
      "maxPrice": 105.75,
      "minPrice": 100.50,
      "averagePrice": 102.75,
      "count": 2
    }
  }
  ```

---

## 6. 查询物资所有价格列表

- **接口地址:** `GET /materials/priceinfo/queryPriceInfoList`
- **功能描述:** 获取指定物资的所有历史价格记录，不分页。
- **请求参数:**

| 参数名 | 类型 | 是否必填 | 描述 |
| --- | --- | --- | --- |
| `baseMaterialsDataId` | `String` | 是 | 物资基础信息ID |

- **请求示例:**
  ```http
  GET /materials/priceinfo/queryPriceInfoList?baseMaterialsDataId=some-base-id
  ```

- **成功响应:**
  ```json
  {
    "code": 0,
    "msg": "成功",
    "data": [
      {
        "id": "price-id-1",
        "baseInfoId": "some-base-id",
        "quarter": "2023-Q1",
        "taxPrice": 101.00
      },
      {
        "id": "new-price-id",
        "baseInfoId": "some-base-id",
        "quarter": "2023-Q2",
        "taxPrice": 105.75
      }
    ]
  }
  ```

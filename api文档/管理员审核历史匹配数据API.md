# 查询待审核历史匹配数据 API

## 接口说明
此接口用于查询所有已由用户确认但尚未被管理员审核的历史匹配数据。

## 请求地址
`POST /materials/partyb/admin/query-pending-approval`

## 请求参数 (JSON Body)
```json
{
  "taskId": "可选，任务ID",
  "page": 0,
  "size": 10
}
```

## 响应数据 (JSON)
```json
{
  "content": [
    {
      "taskDataId": "记录ID",
      "taskId": "任务ID",
      "materialName": "用户输入的物料名称",
      "specificationModel": "用户输入的规格型号",
      "unit": "用户输入的单位",
      "count": 10.0,
      "taxPrice": 100.0000,
      "price": 1000.0000,
      "confirmResult": 1,
      "confirmBaseDataId": "用户确认绑定的基础物资ID",
      "confirmPriceId": "用户确认绑定的价格ID",
      "createdTime": "2023-10-27T10:00:00",
      "updatedTime": "2023-10-27T10:05:00",
      "adminApproved": null,
      "confirmedBaseInfo": {
        "baseDataId": "基础物资ID",
        "materialName": "基础物资名称",
        "specificationModel": "基础物资规格型号",
        "unit": "基础物资单位",
        "materialCode": "物资编码",
        "serialNumber": "规格编号"
      }
    }
  ],
  "pageable": {
    "sort": {
      "sorted": false,
      "unsorted": true,
      "empty": true
    },
    "pageNumber": 0,
    "pageSize": 10,
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true,
  "size": 10,
  "number": 0,
  "sort": {
    "sorted": false,
    "unsorted": true,
    "empty": true
  },
  "numberOfElements": 1,
  "empty": false
}
```

---
# 管理员审核历史匹配数据 API

## 接口说明
此接口允许管理员对历史匹配数据进行审核，设置审核状态。

## 请求地址
`POST /materials/partyb/admin/approve-history`

## 请求参数 (JSON Body)
```json
{
  "ids": ["记录ID1", "记录ID2"],
  "adminApproved": 1 // 0: 不通过, 1: 通过
}
```

## 响应数据 (JSON)
```json
{
  "code": 200,
  "message": "操作成功，更新了 2 条记录",
  "data": 2
}
```
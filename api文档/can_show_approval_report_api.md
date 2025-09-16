# 查询能否展示审批报告接口

## 接口说明

根据任务ID查询能否展示审批报告。当单据为审批通过或者所有物资未经过人工调整且物资信息都已经匹配到时允许展示审批报告。

## 接口地址

```
GET /materials/partyb/can-show-approval-report
```

## 请求方式

GET

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| taskId | String | 是 | 任务ID |

## 请求示例

```
GET /materials/partyb/can-show-approval-report?taskId=1234567890
```

## 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Integer | 响应码，200表示成功 |
| message | String | 响应消息 |
| data | Boolean | true表示可以展示审批报告，false表示不可以展示 |

## 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": true
}
```

## 业务逻辑说明

1. 如果任务审批状态为"已审批通过"(approvalStatus=2)，则返回true
2. 如果任务未进行人工调整(confirmType不为2或3)且价格一致(priceMatchedStatus=1)，则返回true
3. 其他情况返回false

## 错误响应示例

```json
{
  "code": 500,
  "message": "查询失败: 任务不存在",
  "data": null
}
```

## 版本信息

- 版本号：1.3.2
- 生效时间：2025-09-15
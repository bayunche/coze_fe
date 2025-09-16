# 待办事项管理API接口文档

**版本：** v1.3.2  
**日期：** 2025-09-15  
**作者：** system  

## 概述

本文档描述了v1.3.2版本中新增的待办事项管理功能相关的API接口。待办功能模块提供了完整的待办事项管理能力，支持创建、查询、更新、删除等操作，并与临时物资和价格审批流程集成。

## 接口列表

### 1. 创建待办事项

**接口地址：** `POST /api/todo/create`  
**接口描述：** 创建新的待办事项  

#### 请求参数 (Request Body)

```json
{
  "title": "待办标题",
  "content": "待办内容描述",
  "todoType": "TEMP_MATERIAL",
  "businessId": "business-123",
  "taskId": "task-456",
  "businessDomain": "materials",
  "assigneeId": "user-001",
  "assigneeName": "张三",
  "priority": 3,
  "dueDate": "2025-09-20T10:00:00",
  "remarks": "备注信息"
}
```

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | String | 是 | 待办标题 |
| content | String | 否 | 待办内容描述 |
| todoType | String | 是 | 待办类型：TEMP_MATERIAL, TEMP_PRICE, Y_MATERIAL |
| businessId | String | 否 | 关联的业务ID |
| taskId | String | 否 | 关联的任务ID |
| businessDomain | String | 否 | 业务域 |
| assigneeId | String | 否 | 处理人员ID（预留字段） |
| assigneeName | String | 否 | 处理人员姓名（预留字段） |
| priority | Integer | 否 | 优先级（1-5，默认3） |
| dueDate | Date | 否 | 截止时间 |
| remarks | String | 否 | 备注信息 |

#### 响应示例

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "id": "todo-789",
    "title": "待办标题",
    "content": "待办内容描述",
    "todoType": "TEMP_MATERIAL",
    "status": 0,
    "businessId": "business-123",
    "taskId": "task-456",
    "businessDomain": "materials",
    "assigneeId": "user-001",
    "assigneeName": "张三",
    "priority": 3,
    "dueDate": "2025-09-20T10:00:00",
    "createTime": "2025-09-15T14:30:00",
    "updateTime": "2025-09-15T14:30:00",
    "completeTime": null,
    "remarks": "备注信息"
  }
}
```

### 2. 管理员待办查询接口

**接口地址：** `GET /api/todo/admin/pending`  
**接口描述：** 为管理员提供的待办查询接口，主要用于查看所有待处理的待办事项  

#### 请求参数 (Query Parameters)

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | Integer | 否 | 0 | 页码（从0开始） |
| size | Integer | 否 | 10 | 每页大小 |
| todoType | String | 否 | - | 待办类型筛选 |
| status | Integer | 否 | 0 | 状态筛选，默认查询待处理状态 |

#### 响应示例

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "todoItems": [
      {
        "id": "todo-001",
        "title": "临时物资审批：钢筋",
        "content": "物资名称：钢筋\n规格型号：HRB400\n单位：吨",
        "todoType": "TEMP_MATERIAL",
        "todoTypeDesc": "临时物资审批",
        "status": 0,
        "statusDesc": "待处理",
        "businessId": "material-001",
        "taskId": "task-001",
        "businessDomain": "materials",
        "priority": 3,
        "createTime": "2025-09-15T14:00:00",
        "updateTime": "2025-09-15T14:00:00",
        "remarks": "系统自动创建"
      }
    ],
    "page": {
      "currentPage": 0,
      "pageSize": 10,
      "totalElements": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrevious": false,
      "isFirst": true,
      "isLast": false
    },
    "statistics": {
      "pendingCount": 25,
      "processingCount": 5,
      "completedCount": 120,
      "cancelledCount": 2,
      "totalCount": 152,
      "highPriorityCount": 8,
      "overdueCount": 0
    }
  }
}
```

### 3. 查询待办事项

**接口地址：** `POST /api/todo/query`  
**接口描述：** 根据条件查询待办事项（分页）  

#### 请求参数 (Request Body)

```json
{
  "todoType": "TEMP_MATERIAL",
  "status": 0,
  "taskId": "task-456",
  "businessDomain": "materials",
  "assigneeId": "user-001",
  "priority": 3,
  "createTimeStart": "2025-09-01T00:00:00",
  "createTimeEnd": "2025-09-30T23:59:59",
  "titleKeyword": "审批",
  "contentKeyword": "钢筋",
  "page": 0,
  "size": 10
}
```

### 4. 更新待办事项状态

**接口地址：** `PUT /api/todo/{id}/status`  
**接口描述：** 更新指定待办事项的状态  

#### 请求参数

- **路径参数：** `id` - 待办事项ID
- **Query Parameters：**
  - `status` (必填) - 新状态：0-待处理，1-处理中，2-已完成，-1-已取消
  - `remarks` (可选) - 备注信息

#### 响应示例

```json
{
  "success": true,
  "message": "更新状态成功",
  "data": null
}
```

### 5. 根据业务ID查询待办事项

**接口地址：** `GET /api/todo/business/{businessId}`  
**接口描述：** 根据业务ID查询相关的待办事项  

#### 响应示例

```json
{
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": "todo-001",
      "title": "临时物资审批：钢筋",
      "todoType": "TEMP_MATERIAL",
      "status": 0,
      "businessId": "material-001",
      "createTime": "2025-09-15T14:00:00"
    }
  ]
}
```

### 6. 批量更新待办事项状态

**接口地址：** `PUT /api/todo/batch/status`  
**接口描述：** 批量更新多个待办事项的状态  

#### 请求参数 (Query Parameters)

- `ids` - 待办事项ID列表，多个ID用逗号分隔
- `status` - 新状态
- `remarks` (可选) - 备注信息

### 7. 获取待办事项统计信息

**接口地址：** `GET /api/todo/statistics`  
**接口描述：** 获取待办事项的统计信息  

#### 响应示例

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "pendingCount": 25,
    "processingCount": 5,
    "completedCount": 120,
    "cancelledCount": 2,
    "totalCount": 152,
    "highPriorityCount": 8,
    "overdueCount": 0
  }
}
```

### 8. 根据任务ID获取待办统计信息

**接口地址：** `GET /api/todo/statistics/task/{taskId}`  
**接口描述：** 根据任务ID获取相关的待办统计信息  

## 状态码说明

### 待办类型 (todoType)

| 代码 | 描述 |
|------|------|
| TEMP_MATERIAL | 临时物资审批 |
| TEMP_PRICE | 临时价格审批 |
| Y_MATERIAL | 乙供物资审批 |

### 待办状态 (status)

| 代码 | 描述 |
|------|------|
| 0 | 待处理 |
| 1 | 处理中 |
| 2 | 已完成 |
| -1 | 已取消 |

### 优先级 (priority)

| 级别 | 描述 |
|------|------|
| 1 | 最低 |
| 2 | 低 |
| 3 | 普通（默认） |
| 4 | 高 |
| 5 | 最高 |

## 业务流程说明

### 临时物资审批流程

1. 用户创建临时物资信息时，系统自动创建待办事项
2. 待办类型为 `TEMP_MATERIAL`
3. 管理员通过待办查询接口查看待审批的临时物资
4. 管理员处理完成后，更新待办状态为已完成

### 临时价格审批流程

1. 用户创建临时价格信息时，系统自动创建待办事项
2. 待办类型为 `TEMP_PRICE`
3. 管理员通过待办查询接口查看待审批的临时价格
4. 管理员处理完成后，更新待办状态为已完成

## 注意事项

1. 待办事项创建时会自动设置创建时间和更新时间
2. 状态变为已完成(2)时会自动设置完成时间
3. 人员分配字段(assigneeId, assigneeName)为预留字段，当前版本暂未启用
4. 优先级用于排序，数字越大优先级越高
5. 所有时间字段均使用ISO 8601格式
6. 待办事项支持按多种条件进行筛选和搜索
7. 删除待办事项操作需要谨慎使用，建议使用取消状态代替删除

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 404 | 待办事项不存在 |
| 500 | 服务器内部错误 |
# 任务提交审批接口文档

## 接口概述

任务提交审批接口用于将已完成的任务提交进行审批。系统会根据任务的业务域类型，自动调用对应的业务逻辑进行验证和提交。

- **接口路径**: `POST /tasks/submit-approval`
- **版本**: v1.3.2
- **更新日期**: 2025-09-15

## 接口详情

### 请求信息

#### 基本信息
- **HTTP方法**: POST
- **Content-Type**: application/json
- **接口路径**: `/tasks/submit-approval`

#### 请求头
```http
Content-Type: application/json
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| taskId | string | 是 | 任务ID，用于标识需要提交审批的任务 | "task-123456" |
| remarks | string | 否 | 提交备注，用于记录提交审批时的说明信息 | "所有物资已完成调整，提交审批" |

#### 请求体示例
```json
{
  "taskId": "task-123456",
  "remarks": "所有物资已完成人工调整，价格匹配一致，提交审批"
}
```

### 响应信息

#### 响应参数

| 参数名 | 类型 | 描述 | 示例值 |
|--------|------|------|--------|
| code | integer | 响应状态码，200表示成功 | 200 |
| msg | string | 响应消息 | "操作成功" |
| data | object | 响应数据对象 | - |
| └─ taskId | string | 任务ID | "task-123456" |
| └─ submitSuccess | boolean | 提交状态，true为成功，false为失败 | true |
| └─ todoId | string | 创建的待办事项ID（提交成功时返回） | "todo-789012" |
| └─ message | string | 详细的操作结果说明 | "审批提交成功，已创建待办事项" |
| └─ businessDomain | string | 任务的业务域类型 | "y_material" |

#### 成功响应示例
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "taskId": "task-123456",
    "submitSuccess": true,
    "todoId": "todo-789012",
    "message": "审批提交成功，已创建待办事项",
    "businessDomain": "y_material"
  }
}
```

#### 失败响应示例
```json
{
  "code": 500,
  "msg": "任务不存在",
  "data": null
}
```

## 业务逻辑

### 处理流程

1. **参数校验**
   - 验证 taskId 不能为空
   - 验证任务是否存在

2. **审批状态检查**
   - 检查任务当前的审批状态
   - 如果状态为"待审批"(PENDING_APPROVAL)，返回"任务已提交审批，请勿重复提交"
   - 如果状态为"已审批通过"(APPROVED)，返回"任务已审批通过，无需重复提交"
   - 如果状态为"已驳回"(REJECTED)，允许重新提交
   - 其他状态允许继续处理

3. **业务域判断**
   - 根据任务的 `businessDomain` 字段判断业务类型
   - 调用对应的业务验证逻辑

4. **业务验证**（以乙供物资为例）
   - 验证是否有物资经过人工调整
   - 验证所有物资价格对比是否一致

5. **创建待办事项**
   - 验证通过后创建审批待办事项
   - 更新任务审批状态为"待审批"

### 支持的业务域

| 业务域 | 描述 | 状态 |
|--------|------|------|
| y_material | 乙供物资业务 | ✅ 已支持 |
| 其他业务域 | 预留扩展 | ⏳ 待实现 |

### 乙供物资业务验证规则

#### 1. 人工调整验证
- 检查任务下是否有物资经过人工调整（confirmType = 2 或 3）
- 如果没有人工调整，返回"未进行人工调整，无需审批"

#### 2. 价格一致性验证
- 验证所有物资的价格匹配状态
- 使用统计查询检查 pendingMatchCount 和 unmatchedPriceCount
- 只有当两者之和为0时才允许提交

#### 3. 审批状态检查
- 检查任务当前的审批状态
- 防止重复提交或在错误状态下提交

## 错误码说明

| 错误码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | 任务ID不能为空 | 请求参数中 taskId 为空 |
| 404 | 任务不存在 | 指定的 taskId 在系统中不存在 |
| 400 | 任务业务域为空 | 任务的 businessDomain 字段为空 |
| 400 | 业务域[xxx]的审批功能暂未实现 | 该业务域的审批功能尚未开发 |
| 400 | 未进行人工调整，无需审批 | 乙供物资未经过人工调整 |
| 400 | 存在价格对比不一致的物资 | 乙供物资价格匹配不一致 |
| 400 | 任务已提交审批，请勿重复提交 | 任务已在审批流程中 |
| 400 | 任务已审批通过，无需重复提交 | 任务已审批完成 |
| 500 | 系统异常，请稍后重试 | 服务器内部错误 |

## 使用示例

### cURL 示例
```bash
curl -X POST \
  http://localhost:8080/tasks/submit-approval \
  -H 'Content-Type: application/json' \
  -d '{
    "taskId": "task-123456",
    "remarks": "所有物资已完成人工调整，价格匹配一致，提交审批"
  }'
```

### JavaScript 示例
```javascript
const submitApproval = async (taskId, remarks) => {
  try {
    const response = await fetch('/tasks/submit-approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId: taskId,
        remarks: remarks
      })
    });
    
    const result = await response.json();
    
    if (result.code === 200 && result.data.submitSuccess) {
      console.log('提交成功，待办事项ID：', result.data.todoId);
    } else {
      console.error('提交失败：', result.msg);
    }
  } catch (error) {
    console.error('请求失败：', error);
  }
};

// 使用示例
submitApproval('task-123456', '所有物资已完成调整，提交审批');
```

### Java 示例
```java
@Autowired
private RestTemplate restTemplate;

public void submitTaskApproval(String taskId, String remarks) {
    TaskSubmitApprovalRequestVO request = new TaskSubmitApprovalRequestVO();
    request.setTaskId(taskId);
    request.setRemarks(remarks);
    
    try {
        Msg<TaskSubmitApprovalResponseVO> response = restTemplate.postForObject(
            "/tasks/submit-approval", 
            request, 
            new ParameterizedTypeReference<Msg<TaskSubmitApprovalResponseVO>>() {}
        );
        
        if (response.getCode() == 200 && response.getData().getSubmitSuccess()) {
            System.out.println("提交成功，待办事项ID：" + response.getData().getTodoId());
        } else {
            System.err.println("提交失败：" + response.getMsg());
        }
    } catch (Exception e) {
        System.err.println("请求失败：" + e.getMessage());
    }
}
```

## 注意事项

1. **幂等性**: 相同任务重复提交不会创建重复的待办事项，会更新现有待办
2. **事务性**: 整个提交过程在事务中执行，确保数据一致性
3. **异步处理**: 待办事项创建失败不会影响主业务流程
4. **权限控制**: 建议在实际使用中添加用户权限验证
5. **业务域扩展**: 新增业务域时需要实现对应的验证逻辑

## 更新历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.3.2 | 2025-09-15 | 接口从 MaterialsPartyBController 迁移到 TaskController |
| v1.3.2 | 2025-09-15 | 新增 businessDomain 响应字段 |
| v1.3.2 | 2025-09-15 | 支持多业务域扩展架构 |
| v1.3.2 | 2025-09-15 | 增加审批状态检查，防止重复提交 |

## 相关接口

- [待办事项管理接口](./todo_api_doc.md)
- [任务管理接口](./task_api_doc.md)
- [乙供物资查询接口](./materials_partyb_api_doc.md)
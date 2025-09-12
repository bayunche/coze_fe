# API变更说明 - v1.3.1

## 变更概述

本版本为SmartBrain智能大脑模块的三个核心API接口增加了项目信息关联功能，在保持完全向后兼容的前提下，丰富了任务数据的上下文信息。

## 变更的API接口

### 1. GET /api/smart-brain/agents/task-details

**变更类型**: 字段增加  
**影响等级**: 低风险（向后兼容）

**变更内容**:
- 响应体中`AgentTaskDetailVO`对象增加`projectCount`字段
- 新字段类型：`Long`，表示该业务域关联的项目数量

**变更前**:
```json
{
  "agentName": "合同解析智能体",
  "totalTaskCount": 100,
  "completedTaskCount": 80,
  "processingTaskCount": 20
}
```

**变更后**:
```json
{
  "agentName": "合同解析智能体", 
  "totalTaskCount": 100,
  "completedTaskCount": 80,
  "processingTaskCount": 20,
  "projectCount": 15
}
```

### 2. GET /api/smart-brain/agents/tasks

**变更类型**: 字段增加  
**影响等级**: 低风险（向后兼容）

**变更内容**:
- 响应体中每个任务对象增加`projectInfo`字段
- 新字段类型：`BaseProjectInfoDO`对象或`null`

**变更前**:
```json
{
  "content": [
    {
      "id": "task123",
      "businessDomain": "CONTRACT_ANALYSIS",
      "taskStatus": 2,
      "fileName": "contract.pdf"
    }
  ]
}
```

**变更后**:
```json
{
  "content": [
    {
      "id": "task123",
      "businessDomain": "CONTRACT_ANALYSIS", 
      "taskStatus": 2,
      "fileName": "contract.pdf",
      "projectInfo": {
        "id": 1,
        "projectName": "某建设项目",
        "projectCode": "PRJ001",
        "engineeringName": "某工程",
        "engineeringCode": "ENG001",
        "contractCode": "CON001",
        "contractName": "某合同"
      }
    }
  ]
}
```

### 3. GET /api/smart-brain/agents/tasks/{taskId}/details

**变更类型**: 字段增加  
**影响等级**: 低风险（向后兼容）

**变更内容**:
- 响应体中每个任务详情对象增加`projectInfo`字段
- 新字段类型：`BaseProjectInfoDO`对象或`null`

**变更前**:
```json
{
  "content": [
    {
      "id": "detail123",
      "taskId": "task123", 
      "fileName": "document.pdf",
      "taskDetailStatus": 2
    }
  ]
}
```

**变更后**:
```json
{
  "content": [
    {
      "id": "detail123",
      "taskId": "task123",
      "fileName": "document.pdf", 
      "taskDetailStatus": 2,
      "projectInfo": {
        "id": 1,
        "projectName": "某建设项目",
        "projectCode": "PRJ001",
        "engineeringName": "某工程",
        "engineeringCode": "ENG001", 
        "contractCode": "CON001",
        "contractName": "某合同"
      }
    }
  ]
}
```

## 数据结构定义

### BaseProjectInfoDO 项目信息对象

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| id | Long | 项目ID | 1 |
| projectName | String | 项目名称 | "某建设项目" |
| projectCode | String | 项目编码 | "PRJ001" |
| engineeringName | String | 工程名称 | "某工程" |
| engineeringCode | String | 工程编码 | "ENG001" |
| contractCode | String | 合同编码 | "CON001" |
| contractName | String | 合同名称 | "某合同" |

## 向后兼容性说明

### ✅ 兼容项
- **接口路径**: 完全保持不变
- **请求参数**: 完全保持不变
- **响应状态码**: 完全保持不变
- **原有字段**: 字段名、类型、含义完全保持不变
- **原有业务逻辑**: 完全保持不变

### 📋 新增项
- **新增字段**: 作为额外信息提供，不影响现有解析逻辑
- **空值处理**: 未关联项目时，`projectInfo`字段值为`null`
- **性能影响**: 增加少量查询时间，不影响接口可用性

## 前端处理建议

### 1. 安全的字段访问

```javascript
// 推荐的安全访问方式
const projectName = task.projectInfo?.projectName || '未关联项目';
const projectCount = agentDetail.projectCount || 0;

// 或使用条件判断
if (task.projectInfo) {
    console.log(`项目: ${task.projectInfo.projectName}`);
} else {
    console.log('该任务未关联项目');
}
```

### 2. TypeScript 类型定义

```typescript
interface AgentTaskDetailVO {
  agentName: string;
  totalTaskCount: number;
  completedTaskCount: number;
  processingTaskCount: number;
  projectCount?: number; // 新增可选字段
}

interface WmesTasksDO {
  id: string;
  businessDomain: string;
  taskStatus: number;
  // ... 其他字段
  projectInfo?: BaseProjectInfoDO | null; // 新增可选字段
}

interface BaseProjectInfoDO {
  id: number;
  projectName: string;
  projectCode: string;
  engineeringName: string;
  engineeringCode: string;
  contractCode: string;
  contractName: string;
}
```

### 3. 渐进式升级策略

1. **第一阶段**: 确保现有代码兼容新响应格式
2. **第二阶段**: 在UI中增加项目信息展示
3. **第三阶段**: 利用项目信息优化用户体验

## 测试检查清单

### API兼容性测试
- [ ] 使用旧版客户端调用新接口，确认功能正常
- [ ] 验证新增字段不会导致JSON解析异常
- [ ] 检查响应时间是否在可接受范围内

### 数据有效性测试
- [ ] 验证有项目关联的任务返回正确项目信息
- [ ] 验证无项目关联的任务`projectInfo`为`null`
- [ ] 验证`projectCount`统计准确性

### 边界情况测试
- [ ] 测试大量任务的查询性能
- [ ] 测试项目信息包含特殊字符的情况
- [ ] 测试并发访问时的数据一致性

## 迁移指南

### 现有系统升级
1. **无需修改**: 现有前端代码无需任何修改即可正常工作
2. **渐进增强**: 可以逐步利用新增的项目信息优化用户体验
3. **性能监控**: 建议监控接口响应时间，必要时考虑缓存优化

### 新系统集成
1. **直接使用**: 新系统可以直接使用增强后的接口
2. **UI设计**: 建议在任务列表中展示项目信息
3. **交互优化**: 可以基于项目信息实现更丰富的筛选和分组功能

## 回滚方案

如果需要回滚到v1.3.0版本：
1. 恢复pom.xml版本号
2. 移除新增的`projectInfo`和`projectCount`字段
3. 撤销Service层的项目信息查询逻辑
4. 数据库结构无需变更（使用@Transient注解）

**注意**: 回滚后新字段将不再返回，但不会影响API的基本功能。
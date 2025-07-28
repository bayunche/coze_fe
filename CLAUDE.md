# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在处理此代码库时提供指导。

## 项目概览

这是一个基于 Vue 3 的前端应用程序，集成了 Coze API，为工作流管理和执行提供丰富的交互式界面。项目专注于合同解析、乙供物资分析和甲供物资处理等任务的实时流式执行。

### 核心功能

- **工作流集成**：与 Coze API 深度集成，支持流式和非流式工作流执行
- **物资解析**：专门的工作流，用于解析合同和物资清单等各种文档
- **实时交互**：利用类似 WebSocket 的模式，提供工作流执行的实时反馈和结果
- **动态界面**：支持从文档中提取结构化数据的生成、编辑和可视化功能

## 开发命令

```bash
# 安装依赖
yarn install

# 启动开发服务器 (http://localhost:5173)
yarn dev

# 构建生产版本
yarn build

# 构建生产版本（生产模式）
yarn build-prod

# 本地预览生产构建
yarn preview

# 服务生产构建（使用代理服务器）
yarn serve-prod

# 运行 ESLint 自动修复
yarn lint

# 使用 Prettier 格式化代码
yarn format
```

## 环境配置

1. 在根目录创建 `.env.local` 文件。
2. 将你的 Coze API Key 添加到文件中：
   ```env
   VITE_COZE_API_KEY=your_coze_api_key_here
   ```

## 架构概览

### 核心技术

- **Vue 3** 使用 Composition API
- **Vite** 构建工具
- **Pinia** 状态管理，支持持久化
- **Vue Router** 路由管理
- **Element Plus** UI 组件库，支持自动导入
- **Tailwind CSS** 样式框架
- **@coze/api** Coze API 集成
- **Marked** Markdown 内容渲染

### 主要目录结构

- `src/components/home/` - 主要应用组件（聊天、对话框、工作流面板）
- `src/services/` - API 服务类（CozeWorkflowService、CozeParsingService 等）
- `src/stores/` - Pinia 状态管理存储
- `src/utils/` - 工具函数和辅助方法
- `proxy-server/` - 生产环境 Node.js 代理服务器

### 状态管理

- `stores/workflow.js` - 主要工作流执行和配置
- `stores/chat.js` - 聊天消息和流式传输
- `stores/materialDialog.js` - 物资对话框状态
- `stores/ownerMaterial.js` - 甲供物资管理
- `stores/parsingResult.js` - 解析结果管理
- `stores/theme.js` - 主题管理
- `stores/auth.js` - 认证管理

### 关键服务

- `CozeWorkflowService` - 与 Coze API 的核心工作流执行
- `CozeParsingService` - 文档解析工作流
- `MaterialService` - 物资数据管理
- `OwnerMaterialService` - 甲供物资操作

### 工作流类型

应用程序支持三种主要工作流类型：

1. **合同解析** (`contractParsing`) - 工作流 ID: `7516796514431172642`
2. **乙供物资解析** (`supplierMaterialParsing`) - 工作流 ID: `7517934954761715721`
3. **甲供物资解析** (`ownerSuppliedMaterialParsing`) - 使用专用后端 API

### API 配置

`vite.config.js` 中的开发代理配置：

- `/api/backend-api` → `http://159.75.127.84:1202`
- `/api` → `http://159.75.127.84:1207`
- `/backend-api` → `http://159.75.127.84:1202`

## 重要实现细节

### 工作流执行

- 所有工作流都支持文件上传和流式响应
- 任务 ID 在工作流存储中管理，用于结果跟踪
- 进度指示器显示实时执行状态
- 结果可通过专用详情页面查看

### 文件上传

- 使用 Coze API 进行文件上传，应用 ID: `7509762183313129512`
- 支持多种文件类型（PDF、Excel 等）
- 文件通过工作流输入处理为 `{file_id: string}[]` 格式

### 流式实现

- 使用服务器发送事件（SSE）模式进行实时消息流传输
- 消息以唯一 ID 附加到聊天存储中
- 通过加载状态和完成回调跟踪进度

### 主题系统

项目支持多主题切换，包括：

- 浅色主题（默认）
- 暗黑主题
- 科技蓝主题
- 紫色梦幻主题
- 森林绿主题
- 橙色活力主题

主题相关文件：

- `src/styles/themes.css` - 主题变量定义
- `src/stores/theme.js` - 主题状态管理
- `src/components/theme/` - 主题切换组件

### 路由配置

主要路由：

- `/` - 首页（重定向到智能大脑页面）
- `/smart-brain` - 智能大脑页面
- `/home` - 主要工作界面
- `/material-management` - 物资管理页面
- `/owner-material-detail/:taskId` - 甲供物资详情页
- `/owner-material-align/:taskId` - 甲供物资对平页
- `/owner-material-report/:taskId` - 甲供物资报表页
- `/material-detail/:taskId` - 物资详情页（通用）

## 代码规范

### 通用规范

- **注释清晰**：避免注释无意义代码，注释应解释为什么而不是做什么
- **函数粒度小**：每个函数只做一件事，保持单一职责原则
- **组件逻辑紧凑**：模板简洁，逻辑抽离到 composables 或工具函数中
- **避免重复**：可复用逻辑抽到 composables 中，遵循 DRY 原则

### 组件规范

创建可复用组件时，应在 `src/components` 下创建对应文件夹，包含：

- 组件文件本身（Vue 单文件组件）
- `constants.js` - 组件相关常量
- `utils.js` - 业务逻辑工具函数
- `index.js` - 统一导出组件
- 确保组件能够脱离具体业务独立工作

### 命名规范

- **文件名**：使用 PascalCase（如 `MaterialParsingDialog.vue`）
- **变量名**：使用 camelCase
- **常量名**：使用 UPPER_SNAKE_CASE
- **函数名**：使用动词开头的 camelCase（如 `handleSubmit`、`fetchData`）

### Vue 3 开发规范

- 优先使用 Composition API
- 合理使用 `reactive` 和 `ref`
- 利用 Vue 3 的 `<script setup>` 语法
- 使用 TypeScript 类型注解提高代码质量
- UI 与业务解耦
-

### 状态管理规范

- 使用 Pinia 进行状态管理
- 合理划分 store，避免单个 store 过于庞大
- 利用 pinia-plugin-persistedstate 实现状态持久化
- Action 中处理异步逻辑，Getter 中处理计算属性

### 样式处理规范

- 优先使用 Tailwind CSS 实用类
- 复杂样式使用 SCSS 预处理器
- 遵循 Element Plus 主题定制规范
- 避免内联样式，使用 CSS 类

### API 集成规范

- 统一使用 service 层处理 API 调用
- 实现错误处理和重试机制
- 支持请求取消和防抖处理
- 使用 TypeScript 定义 API 响应类型

## 重要指令提醒

- **严格执行要求**：只做被要求的事情，不多不少
- **文件创建原则**：除非绝对必要，否则不创建新文件
- **优先编辑原则**：总是优先编辑现有文件而不是创建新文件
- **文档创建限制**：除非用户明确要求，否则不主动创建文档文件（\*.md）或 README 文件

## 项目特色功能

1. **智能大脑系统**：集成多个工作流代理，实时监控任务状态和执行情况
2. **流式消息处理**：支持实时消息流显示和交互，提供良好的用户体验
3. **文件上传与解析**：支持多种文件格式的上传和智能解析处理
4. **任务状态跟踪**：完整的任务生命周期管理和状态追踪
5. **响应式设计**：适配多种屏幕尺寸和设备，支持移动端访问
6. **多主题支持**：提供多种主题选择，满足不同用户偏好
7. **数据可视化**：丰富的图表和表格展示，支持数据导出功能

## 常见工作流程

### 合同解析流程

1. 用户选择合同解析功能
2. 上传合同文件（PDF、DOCX等）
3. 系统调用 Coze 工作流进行解析
4. 实时显示解析进度和结果
5. 提供解析结果查看和导出功能

### 物资解析流程

1. 选择物资解析类型（乙供/甲供）
2. 上传物资清单文件（Excel格式）
3. 系统进行智能解析和匹配
4. 处理未匹配项目，支持人工干预
5. 生成解析报告和统计数据

### 调试和测试

- 使用浏览器开发者工具进行调试
- 利用 Vue DevTools 查看组件状态
- 使用 console.log 进行日志输出调试
- 错误信息会在控制台和用户界面中显示

## 特殊代码规范

- UI 与业务解耦
- 事件命名 避免 handleClick，应使用明确动词 + 对象，如 submitForm()
- 保持组件逻辑紧凑：模板简洁，逻辑抽离
- 创建一个页面时，应该在src/views下创建一个页面的文件夹， 里面包含页面文件本身，常量文件(constants.js)和业务逻辑工具文件(utils.js)，并由index.js导出页面文件
- 创建一个可复用的组件时，应该在src/components下创建一个页面的文件夹，里面包含组件文件本身，常量文件(constants.js)和业务运辑工具文件(utils.js)，并由index.js导出组件文件，并确保这个组件能够脱离业务单独工作

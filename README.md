# Coze Workflow FE

这是一个基于 Vue 3、Vite、Element Plus 和 Tailwind CSS 构建的前端应用，深度集成了 Coze API，旨在为 Coze 工作流提供一个功能丰富、可交互的前端界面。

## 核心功能

本项目不仅仅是一个模板，更是一个功能性的应用，展示了如何利用 Coze API 实现复杂的业务逻辑：

- **工作流集成**: 封装了 `CozeService`，用于与 Coze API 进行交互，支持流式和非流式的工作流调用。
- **合同解析**: 实现文件上传和调用合同解析工作流，提取关键信息。
- **数据生成与编辑**: 调用工作流从非结构化文本中生成结构化数据（如表格），并支持对单条记录进行修改。
- **多场景支持**: 预置了聊天、统计分析、文档摘要、语义搜索和自动化任务等多种工作流的调用接口（部分为占位符，可快速替换为您的工作流 ID）。
- **实时交互**: 通过 WebSocket 处理流式响应，在界面上实时展示工作流的执行过程和结果。

## 技术栈

- **Vue 3**: 核心前端框架。
- **Vite**: 现代化的前端构建工具。
- **Vue Router**: 官方路由管理器。
- **Pinia**: 官方推荐的状态管理库。
- **Element Plus**: 功能强大的 UI 组件库。
- **Tailwind CSS**: 高效的原子化 CSS 框架。
- **Marked**: 用于在前端解析和展示 Markdown 格式的文本。
- **@coze/api**: Coze 官方提供的 API 客户端。

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/en/) >= 16.0.0
- [Yarn](https://yarnpkg.com/)

### 配置

1.  将项目根目录下的 `.env.example` 文件复制一份并重命名为 `.env.local`。
2.  在 `.env.local` 文件中填入您的 Coze API Key:

    ```env
    VITE_COZE_API_KEY=your_coze_api_key_here
    ```

    *您可以在 Coze 平台的 **个人中心 -> API 密钥** 中获取您的 API Key。*

### 安装依赖

```sh
yarn install
```

## 可用脚本

### 启动开发服务器

此命令会启动一个热重载的开发服务器，通常地址为 `http://localhost:5173`。

```sh
yarn dev
```

### 编译生产版本

此命令会将项目打包到 `dist` 目录，用于生产环境部署。

```sh
yarn build
```

### 预览生产版本

此命令可以在本地预览生产环境的构建包。

```sh
yarn preview
```

### 代码规范与格式化

```sh
# 运行 ESLint 检查代码规范
yarn lint

# 使用 Prettier 格式化所有代码
yarn format

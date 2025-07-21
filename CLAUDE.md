# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 frontend application that integrates with Coze APIs to provide a rich, interactive interface for managing and executing workflows. The project focuses on real-time, streaming execution for tasks like contract parsing, supplier material analysis, and owner-supplied material processing.

### Core Features
- **Workflow Integration**: Deep integration with Coze APIs for both streaming and non-streaming workflow execution.
- **Material Parsing**: Specialized workflows for parsing various documents like contracts and material lists.
- **Real-time Interaction**: Utilizes WebSocket-like patterns to provide real-time feedback and results from workflow execution.
- **Dynamic UI**: Features for data generation, editing, and visualization of structured data extracted from documents.


## Development Commands

```bash
# Install dependencies
yarn install

# Start development server (http://localhost:5173)
yarn dev

# Build for production
yarn build

# Build for production with production mode
yarn build-prod

# Preview production build locally
yarn preview

# Serve production build (uses proxy-server)
yarn serve-prod

# Run ESLint with auto-fix
yarn lint

# Format code with Prettier
yarn format
```

## Setup

1.  Create a `.env.local` file in the root directory.
2.  Add your Coze API Key to the file:
    ```env
    VITE_COZE_API_KEY=your_coze_api_key_here
    ```

## Architecture Overview

### Core Technologies

- **Vue 3** with Composition API
- **Vite** for build tooling
- **Pinia** for state management with persistence
- **Vue Router** for routing
- **Element Plus** UI components with auto-import
- **Tailwind CSS** for styling
- **@coze/api** for Coze API integration
- **Marked** for rendering Markdown content

### Key Directory Structure

- `src/components/home/` - Main application components (chat, dialogs, workflow panels)
- `src/services/` - API service classes (CozeWorkflowService, CozeParsingService, etc.)
- `src/stores/` - Pinia stores for state management
- `src/utils/` - Utility functions and helpers
- `proxy-server/` - Node.js proxy server for production

### State Management

- `stores/workflow.js` - Main workflow execution and configuration
- `stores/chat.js` - Chat messaging and streaming
- `stores/materialDialog.js` - Material dialog states
- `stores/ownerMaterial.js` - Owner material management
- `stores/parsingResult.js` - Parsing results management

### Key Services

- `CozeWorkflowService` - Core workflow execution with Coze API
- `CozeParsingService` - Document parsing workflows
- `MaterialService` - Material data management
- `OwnerMaterialService` - Owner material operations

### Workflow Types

The application supports three main workflow types:

1. **Contract Parsing** (`contractParsing`) - Workflow ID: `7516796514431172642`
2. **Supplier Material Parsing** (`supplierMaterialParsing`) - Workflow ID: `7517934954761715721`
3. **Owner Material Parsing** (`ownerSuppliedMaterialParsing`) - Uses a dedicated backend API.

### API Configuration

Development proxy configuration in `vite.config.js`:

- `/api/backend-api` → `http://159.75.127.84:1202`
- `/api` → `http://159.75.127.84:1207`
- `/backend-api` → `http://159.75.127.84:1202`

## Important Implementation Details

### Workflow Execution

- All workflows support file uploads and streaming responses.
- Task IDs are managed in the workflow store for result tracking.
- Progress indicators show real-time execution status.
- Results can be viewed through dedicated detail pages.

### File Upload

- Uses Coze API for file uploads with app ID: `7509762183313129512`.
- Supports multiple file types (PDF, Excel, etc.).
- Files are processed through workflow inputs as `{file_id: string}[]`.

### Streaming Implementation

- Real-time message streaming using Server-Sent Events (SSE) patterns.
- Messages are appended to the chat store with unique IDs.
- Progress is tracked with loading states and completion callbacks.


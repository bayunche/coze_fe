# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 frontend application that integrates with Coze APIs to provide workflow management and material parsing capabilities. The project focuses on contract parsing, supplier material parsing, and owner-supplied material parsing with real-time workflow execution.

## Development Commands

```bash
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

## Architecture Overview

### Core Technologies
- **Vue 3** with Composition API
- **Vite** for build tooling
- **Pinia** for state management with persistence
- **Vue Router** for routing
- **Element Plus** UI components with auto-import
- **Tailwind CSS** for styling
- **@coze/api** for Coze API integration

### Key Directory Structure
- `src/components/home/` - Main application components (chat, dialogs, workflow panels)
- `src/services/` - API service classes (CozeChatService, CozeParsingService, etc.)
- `src/stores/` - Pinia stores for state management
- `src/utils/` - Utility functions and helpers
- `src/uitls/` - Legacy utils directory (contains workflow utilities)
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
1. **Contract Parsing** (`contractParsing`) - Workflow ID: 7516796514431172642
2. **Supplier Material Parsing** (`supplierMaterialParsing`) - Workflow ID: 7517934954761715721  
3. **Owner Material Parsing** (`ownerSuppliedMaterialParsing`) - Uses backend API integration

### API Configuration
Development proxy configuration in `vite.config.js`:
- `/api/backend-api` → `http://159.75.127.84:1202`
- `/api` → `http://159.75.127.84:1207` 
- `/backend-api` → `http://159.75.127.84:1202`

## Important Implementation Details

### Workflow Execution
- All workflows support file uploads and streaming responses
- Task IDs are managed in the workflow store for result tracking
- Progress indicators show real-time execution status
- Results can be viewed through dedicated detail pages

### File Upload
- Uses Coze API for file uploads with app ID: 7509762183313129512
- Supports multiple file types (PDF, Excel, etc.)
- Files are processed through workflow inputs as `{file_id: string}[]`

### Streaming Implementation
- Real-time message streaming using SSE/WebSocket patterns
- Messages are appended to chat store with unique IDs
- Progress tracking with loading states and completion callbacks

### Navigation
- Home page (`/home`) - Main workflow interface
- Material detail pages with dynamic routing (`/material-detail/:taskId`)
- Owner material pages for specialized workflows

### Environment Variables
Requires `VITE_COZE_API_KEY` in `.env.local` for Coze API integration.
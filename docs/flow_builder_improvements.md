# NotifyIQ Flow Builder & Execution Engine Production Upgrade Log

## Overview
This document records all changes made to transform the NotifyIQ Automation Flow Builder into a production-grade visual workflow design and real-time execution engine.

---

## Deliverables & Concrete Evidence

### 1. Data Schema & Contracts Extension
- **Files Changed**:
  - [`packages/schemas/src/flow.schema.ts`](file:///d:/Aadi%20Technologies/notifyIQ/packages/schemas/src/flow.schema.ts)
  - [`apps/backend/src/database/schemas/flow.schema.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/database/schemas/flow.schema.ts)
- **Improvements**:
  - Defined `FlowNodeConfigSchema` in Zod to support complete operational configurations for node types (`trigger`, `condition`, `send_message`, `ai_respond`, `action`, `human_handoff`).
  - Added compound index `{ workspaceId: 1, active: 1 }` on Mongoose `FlowSchema` for fast active flow retrieval.

---

### 2. Backend Flow Execution Engine
- **Files Created**:
  - [`apps/backend/src/flows/flow-execution.engine.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/flows/flow-execution.engine.ts)
- **Improvements**:
  - Graph traversal algorithm (BFS/DFS queue) with node evaluation loop and cycle prevention (max 25 step execution safety limit).
  - Handles node types:
    - **`trigger`**: Keyword matching vs wildcard message triggering.
    - **`condition`**: Sentiment analysis routing (`positive`, `neutral`, `negative`, `urgent`) & keyword condition matching.
    - **`send_message`**: Outbound WhatsApp message creation & live socket dispatch (`message.sent`).
    - **`ai_respond`**: Gemini AI / RAG query execution & automated socket response.
    - **`action`**: Contact tagging (`add_tag`, `remove_tag`).
    - **`human_handoff`**: Updates conversation sentiment to `urgent` & emits escalation alerts (`escalation.alert`).

---

### 3. Backend Flow Service & Controller CRUD
- **Files Changed**:
  - [`apps/backend/src/flows/flows.service.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/flows/flows.service.ts)
  - [`apps/backend/src/flows/flows.controller.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/flows/flows.controller.ts)
  - [`apps/backend/src/flows/flows.module.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/flows/flows.module.ts)
- **Improvements**:
  - Implemented single-active-flow policy per workspace (activating a flow automatically deactivates other flows in the workspace).
  - Added REST API endpoints:
    - `GET /api/flows`: List workspace flows.
    - `GET /api/flows/:flowId`: Fetch flow details.
    - `POST /api/flows`: Create new workflow layout.
    - `PUT /api/flows/:flowId`: Update flow layout & node configurations.
    - `PATCH /api/flows/:flowId/toggle`: Activate/deactivate workflow.
    - `POST /api/flows/:flowId/duplicate`: Clone flow layout.
    - `DELETE /api/flows/:flowId`: Delete workflow.
    - `POST /api/flows/test-simulation`: Interactive flow simulation runner.

---

### 4. Inbound Webhook Integration
- **Files Changed**:
  - [`apps/backend/src/queues/workers/webhook.worker.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/queues/workers/webhook.worker.ts)
  - [`apps/backend/src/queues/queues.module.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/queues/queues.module.ts)
- **Improvements**:
  - Injected `FlowExecutionEngine` into `WebhookWorker`.
  - When inbound WhatsApp message is received, system evaluates workspace active flow graph first. If active flow executes actions, it completes seamlessly; otherwise, it falls back to static auto-reply rules.

---

### 5. Frontend Production Flow Builder UI
- **Files Changed**:
  - [`apps/frontend/src/pages/automation/FlowBuilderPage.tsx`](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/automation/FlowBuilderPage.tsx)
- **Improvements**:
  - Workspace Flow Selector Dropdown for switching between flows.
  - Action Controls: `New Flow`, `Duplicate Flow`, `Delete Flow`, `Activate/Deactivate Flow` toggle, and `Save Flow`.
  - Rich Component Inspector (Right Sidebar): Dynamic node configuration fields for `messageText`, `keywords`, `conditionType`, `actionType`, `tagName`, `systemPrompt`, and `reason`.
  - Interactive Flow Simulator Drawer: Built-in visual simulation panel to test customer message execution step-by-step and highlight executed nodes on canvas.
  - Enhanced canvas Bézier connectors, node cards, and color badges.

---

### 6. Verification & Automated Test Suites
- **Files Created**:
  - [`apps/backend/src/flows/flows.service.spec.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/flows/flows.service.spec.ts)
  - [`apps/backend/src/flows/flow-execution.engine.spec.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/flows/flow-execution.engine.spec.ts)
  - [`apps/backend/src/flows/flows.controller.spec.ts`](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/flows/flows.controller.spec.ts)
- **Results**:
  - 21/21 test suites passed across backend (86/86 total tests passed).
  - TypeScript compilation check passed with 0 errors on backend & frontend (`tsc --noEmit`).

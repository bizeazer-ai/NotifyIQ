# NotifyIQ Fixes & Enhancements

This document tracks active system fixes and UI styling enhancements.

---

## 🛠️ Active Fixes

### 1. In-Memory Redis Connection & Log Spam Fix [Status: **COMPLETED** ✅]
- **Issue**: When Docker/Redis is offline, `ioredis` continuously attempted raw socket connections and threw endless `AggregateError [ECONNREFUSED]` stack traces to stderr.
- **Resolution**: Configured `lazyConnect: true` and a capped `retryStrategy` (stops retrying after 2 attempts when offline) in [redis.service.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/common/services/redis.service.ts). Caught connection refusal errors with `.connect().catch()` on initial and duplicated BullMQ connections, printing a single clean warning (`[Redis] Local Redis/Docker service is offline. Operating seamlessly in fallback in-memory mode.`) and falling back to in-memory key-value and rate-limiter maps.

### 2. NestJS DTO Validation Payload Stripping [Status: **COMPLETED** ✅]
- **Issue**: API calls to `/api/auth/register` and `/api/auth/login` failed with `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
- **Resolution**: Discovered that NestJS `ValidationPipe` had `whitelist: true` enabled in `main.ts`, but `RegisterDto` and `LoginDto` in `auth.controller.ts` lacked `class-validator` decorators. As a result, NestJS stripped out `email`, `passwordLegacy`, and `workspaceName` from incoming request bodies, leaving `dto` as `{}`. Added `@IsEmail()`, `@IsNotEmpty()`, `@IsString()`, and `@IsOptional()` decorators to `RegisterDto` and `LoginDto`, restoring full payload parsing for user authentication.

### 3. Professional UI/UX Theme & Global Styles [Status: **COMPLETED** ✅]
- **Issue**: CSS styles were missing across signup/login forms and dashboard layouts.
- **Resolution**: Imported `App.css` globally inside `main.tsx` and updated `:root` color tokens to a professional B2B SaaS trust-blue palette (`#2563EB`) with orange accent CTAs (`#EA580C`).

### 5. User Model Mongoose Schema `name` Requirement Fix [Status: **COMPLETED** ✅]
- **Issue**: Registration threw `500 Internal Server Error`: `User validation failed: name: Path 'name' is required.`.
- **Resolution**: In [user.schema.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/database/schemas/user.schema.ts), `name` is marked as `@Prop({ required: true })`. Updated [auth.service.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/auth/auth.service.ts) to populate `name: dto.name || dto.fullName || emailLower.split('@')[0]` when invoking `userModel.create(...)`. Updated [auth.controller.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/auth/auth.controller.ts) and [auth.schema.ts](file:///d:/Aadi%20Technologies/notifyIQ/packages/schemas/src/auth.schema.ts) with `name` and `fullName` properties, and added a Full Name input field to [RegisterPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/auth/RegisterPage.tsx).

### 6. Phase 2 MVP Full Suite Integration [Status: **COMPLETED** ✅]
- **Google Gemini AI Suite**: Built `GeminiService` (`gemini.service.ts`) using `gemini-3.5-flash-lite` for completions/chat and `gemini-embedding-001` (768-dim) for embeddings. Refactored `SentimentService`, `SuggestionsService`, and `RagService`.
- **Multi-Format Ingestion & Dual RAG Search**: Created `DocumentParserService` (`.pdf`, `.docx`, `.yaml`, `.json`, `.csv`, `.txt`), `ChunkingService` (500 tokens / 50 overlap), and mathematical `CosineSimilarityFallbackEngine`. Created Knowledge Base UI (`KnowledgeBasePage.tsx`).
- **Meta Embedded Signup & WABA Management**: Implemented OAuth popup callback, WABA profile endpoints (`GET/POST /api/waba/profile`), and WhatsApp Message Template Builder endpoints (`GET/POST/DELETE /api/waba/templates`). Created `EmbeddedSignupButton.tsx`, `WabaProfilePage.tsx`, and `TemplateBuilderPage.tsx`.
- **Portal Auto-Reply Bot Control**: Extended `Workspace` schema with `autoReplySettings`, created workspace API endpoints (`GET/PATCH /api/workspaces/auto-reply`), updated `SettingsPage.tsx` with prompt editor, confidence slider, and schedule controls, and wired Gemini RAG auto-reply evaluation into `webhook.worker.ts`.

### 7. Phase 3 MVP & 100+ User Production Readiness Suite [Status: **COMPLETED** ✅]
- **Dual Payment Gateway Integration (Stripe & Razorpay)**: Added `Stripe` and `Razorpay` SDKs, created `createStripeCheckoutSession` (Stripe Hosted Checkout) and `createRazorpayOrder` (with 18% GST HSN 998314), implemented HMAC Webhook verifiers in `billing.controller.ts`, and connected `BillingPage.tsx` to initiate live subscription checkouts.
- **Audience & Contact Suite**: Created `ContactsService`, `ContactsController`, and `ContactsModule` supporting single contact addition (`POST /api/contacts`), bulk CSV import (`POST /api/contacts/import-csv`), CSV export (`GET /api/contacts/export`), and audience tagging (`Lead`, `Customer`, `VIP`). Built drag-and-drop CSV modal in `ContactsPage.tsx`.
- **Executive Analytics Dashboard & Campaign Scheduling**: Built `AnalyticsService`, `AnalyticsController`, and `AnalyticsModule` delivering workspace SLA %, bot containment %, and message volume trends. Created `OverviewDashboardPage.tsx` registered at `/dashboard`. Extended `CampaignsPage.tsx` with instant vs scheduled dispatch datetime picker.
- **Interactive Templates & Inbox Controls**: Upgraded `TemplateBuilderPage.tsx` with Call-To-Action (CTA URL & Phone) buttons and Quick Reply buttons. Enhanced `ChatWindow.tsx` with a manual Bot vs. Human Agent Takeover toggle and inline WhatsApp template picker.

### 8. Flow Builder Repair & Global Light Theme Standardization [Status: **COMPLETED** ✅]
- **Flow Builder Restoration & Interactive Suite**:
  - Upgraded [FlowBuilderPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/automation/FlowBuilderPage.tsx) from pitch-dark (`#07080d`) to standard `:root` light background (`var(--bg-primary)`).
  - Built an interactive **Node Component Palette** supporting all 6 BRD node types (`Trigger`, `Condition`, `Send Message`, `AI Respond`, `Action`, `Human Handoff`).
  - Added visual edge connection controls allowing users to select target nodes, specify routing labels (`positive`, `urgent`, `default`), render SVG Bézier curves, and delete connector paths.
  - Added interactive node dragging, node creation/deletion, flow metadata editing, active status toggle, and `/api/flows` API synchronization with offline sandbox fallback.
- **Global Light Theme Uniformity & Contrast Rectification**:
  - Added `--btn-text: #ffffff` to `:root` in [App.css](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/App.css) and replaced hardcoded `.chat-list-panel` background `rgba(7, 8, 13, 0.85)` with `var(--bg-secondary)`.
  - Replaced hardcoded `#fff` text colors across all pages ([DashboardLayout.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/components/layout/DashboardLayout.tsx), [WabaProfilePage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/settings/WabaProfilePage.tsx), [SettingsPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/settings/SettingsPage.tsx), [ContactsPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/dashboard/ContactsPage.tsx), [CampaignsPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/dashboard/CampaignsPage.tsx), [TemplateBuilderPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/campaigns/TemplateBuilderPage.tsx), [OverviewDashboardPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/dashboard/OverviewDashboardPage.tsx), [InboxPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/dashboard/InboxPage.tsx), [KnowledgeBasePage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/ai/KnowledgeBasePage.tsx), and [BillingPage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/billing/BillingPage.tsx)) with `:root` CSS variables (`var(--text-primary)`, `var(--text-secondary)`, `var(--bg-secondary)`, `var(--bg-tertiary)`).
  - Guaranteed high-contrast readability across all input fields, textareas, select options, modal dialogs, status alert banners, and table cells.

### 9. Meta WABA Phone Numbers List & Embedded Signup Gating [Status: **COMPLETED** ✅]
- **Embedded Signup Default Phone Number Assignment**: Updated `handleEmbeddedSignupCallback` in [meta.service.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/meta/meta.service.ts) to query `GET https://graph.facebook.com/v20.0/${wabaId}/phone_numbers` upon OAuth exchange and automatically save the first available phone number ID as default in `workspace.waba.phoneNumberId`.
- **WABA Connection Status & Phone Numbers List API**: Created `GET /api/waba/status`, `GET /api/waba/phone-numbers`, and `POST /api/waba/select-phone-number` endpoints in [meta.controller.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/meta/meta.controller.ts) allowing users to query attached phone numbers and switch active phone number IDs.
- **UI Gating & Phone Selector Dropdown**: Updated [WabaProfilePage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/settings/WabaProfilePage.tsx) to automatically hide the Embedded Signup button if WABA is already connected to the workspace, rendering a connected WABA card with a phone number selection dropdown menu.

### 10. Meta DTO ValidationPipe Property Stripping Fix [Status: **COMPLETED** ✅]
- **Issue**: `createTemplate` in `MetaService` received an empty object `{}` even though the frontend sent a full template payload (`name`, `category`, `language`, `bodyText`, `buttons`, etc.).
- **Resolution**: NestJS global `ValidationPipe` had `whitelist: true` enabled in `main.ts`, which automatically strips any payload property that lacks a `class-validator` decorator on its DTO class. Added `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsArray()`, `@ValidateNested()`, and `@Type()` decorators to `CreateTemplateDto`, `TemplateButtonDto`, `WabaProfileDto`, and `ConnectWabaDto` in [meta.service.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/meta/meta.service.ts).

### 11. Meta Phone Number Registration & Graph API Audit Log Persistence [Status: **COMPLETED** ✅]
- **Meta API Response Logging Schema**: Created [meta-api-log.schema.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/database/schemas/meta-api-log.schema.ts) (`MetaApiLog` MongoDB schema) storing `workspaceId`, `userId`, `businessAccountId`, `phoneNumberId`, `endpointUrl`, `httpMethod`, `requestPayload`, `responseStatus`, `responseData`, `errorMessage`, and timestamp.
- **Automated Meta Graph API Logging**: Added `logMetaApiCall` helper method in [meta.service.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/meta/meta.service.ts) redacting access tokens in URLs and recording every Meta Graph API call (OAuth exchange, debug token, profile fetch/update, template management, phone number listing/registration).
- **Meta Phone Registration Endpoint & UI Modal**: Created `POST /api/waba/phone-numbers` in [meta.controller.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/meta/meta.controller.ts) (`registerPhoneNumber`) and built an **"Add New Phone Number"** registration modal dialog and **"Meta Graph API Response Logs"** table in [WabaProfilePage.tsx](file:///d:/Aadi%20Technologies/notifyIQ/apps/frontend/src/pages/settings/WabaProfilePage.tsx).

---

## 🧪 Verification Results
- **Backend Build & Type Check**: Verified `pnpm --filter backend exec tsc --noEmit` compiles cleanly with zero errors across all modules.
- **Schemas Build**: Verified `pnpm --filter @notifyiq/schemas run build` compiles cleanly with zero errors.
- **Frontend Build**: Verified `pnpm --filter frontend run build` bundles all split route chunks with zero errors.

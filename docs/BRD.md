# Business Requirements Document (BRD)
## Project Name: NotifyIQ — WhatsApp Business API Intelligence & Automation Platform
**Organization**: BizEazer Pvt Ltd  
**Target Repository**: `BizEazer/NotifyIQ`  
**Document Status**: Approved  
**Version**: 2.0.0 (Mapped 1:1 to all 65 GitHub Issues)  
**Date**: August 2026  

---

## 1. Executive Summary & Product Vision

### 1.1 Executive Summary
**NotifyIQ** is a standalone, multi-tenant WhatsApp Business API (WABA) Intelligence, Campaign Automation, and AI-Driven Customer Engagement Platform built by BizEazer Pvt Ltd. 

Unlike generic notification systems, **NotifyIQ** is purpose-built to solve critical WhatsApp communication challenges for SMBs, SaaS ecosystems (such as Zynkrit and Rolodiq), digital marketing agencies, and enterprise clients. It provides automated WABA onboarding (Embedded Signup), real-time agent inboxes, high-throughput campaign broadcasting (80 msg/sec), AI-powered sentiment analysis and reply suggestions (Claude API), voice note transcription (OpenAI Whisper), RAG knowledge base chatbots (LangChain + MongoDB Atlas Vector Search), visual no-code flow building (ReactFlow), white-label agency sub-workspaces, and strict data compliance with India's DPDP Act and the EU's GDPR.

### 1.2 Codebase & Architectural Vision
* **Monorepo Independence**: Built as an independent monorepo with `backend/` and `frontend/` subdirectories with zero tight coupling or shared dependencies on external codebases (Issue #1).
* **Tech Stack**:
  * **Backend**: Node.js, Express, TypeScript (Strict Mode), Mongoose (MongoDB Atlas M10 in `ap-south-1` Mumbai), ioredis (Utho Managed Redis 7), BullMQ Queue Engine, Winston structured logging, Zod environment validation.
  * **Frontend**: React, ReactFlow, Socket.io client, i18next (5-language localization).
  * **AI Services**: Anthropic Claude API (Haiku / Sonnet), OpenAI Whisper API, LangChain + MongoDB Atlas Vector Search.
  * **Infrastructure**: Multi-stage Docker, Docker Compose, Utho Kubernetes (K8s), Utho S3-Compatible Object Storage, GitHub Actions CI/CD pipelines.

---

## 2. Platform Architecture & Multi-Tenancy Architecture

```mermaid
flowchart TD
    subgraph Client & Ingestion Layer
        A[WhatsApp User] -->|Meta Webhook Payload| B[POST /api/waba/webhook]
        C[Zynkrit / Partner SaaS] -->|External API v1| D[API Key Auth Middleware]
        E[Agent / Admin User] -->|JWT Auth / WebSockets| F[Express API & Socket.io Server]
    end

    subgraph Security & Verification
        B --> G{HMAC-SHA256 Verification}
        G -->|Valid| H[Instant 200 OK + BullMQ Enqueue]
        G -->|Invalid| I[401 Unauthorized]
    end

    subgraph Async Processing Queues (BullMQ)
        H --> J[webhook-processor Queue]
        J --> K[webhook.worker.ts]
        K --> L[audio-processor Queue]
        K --> M[sentiment-analysis Queue]
        K --> N[ai-reply / chatbot Queue]
    end

    subgraph Persistence & AI Services
        K --> O[(MongoDB Atlas M10 - India ap-south-1)]
        K --> P[(Utho Managed Redis 7)]
        L --> Q[OpenAI Whisper API]
        M --> R[Claude API - Sentiment & Prompt Injection Shield]
        N --> S[LangChain + Atlas Vector Search]
    end
```

---

## 3. Detailed Functional Requirements (FRs)

The following requirements represent the complete functional scope of NotifyIQ as defined across the 65 GitHub Issues:

### 3.1 Phase 0: Monorepo, Database & Infrastructure Core (Issues #1 – #35)
* **FR-0.1 Monorepo & Strict TypeScript Setup**: Scaffold `backend/` and `frontend/` structure. Enforce `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, and ESLint zero `console.log` rules (Winston only) (Issues #1, #2, #3).
* **FR-0.2 Strict Environment Validation**: Implement Zod schema validation in `config/env.ts`. Prohibit direct `process.env` access anywhere else in the codebase (Issues #4, #5).
* **FR-0.3 Multi-Tenant Database Schema**:
  * **Workspace (`Workspace`)**: Root of multi-tenancy (`slug`, `type`, `plan`, `currency: INR|USD|EUR`, `waba`, `whitelabel`, `compliance`, `aiSettings`) (Issue #15).
  * **User (`User`)**: Scoped to workspace with compound index `{ workspaceId, email }` and bcrypt password hash (Issue #16).
  * **Contact (`Contact`)**: E.164 phone format, `consentGiven` (DPDP), `optedOut`, `deletionRequestedAt`, compound index `{ workspaceId, phone }` (Issue #17).
  * **Conversation (`Conversation`)**: Scoped thread management `{ workspaceId, contactId, phoneNumberId }` with sentiment tracking (Issue #18).
  * **Message (`Message`)**: Immutable WhatsApp events (`waMessageId`, `direction`, `type`, `status`, `transcript`, `aiSuggestions`) (Issue #19).
  * **API Key (`ApiKey`)**: Bcrypt hashed API keys (`keyHash`), indexed prefix (`keyPrefix`), scope controls (`send`, `read`, `webhook`) (Issue #20).
  * **Audit Log (`AuditLog`)**: Write-only append-only 7-year legal compliance audit trail (Issue #21, #30).
* **FR-0.4 Indexing & Query Isolation**: Every database collection must lead with a `workspaceId` compound index to eliminate collection scans (Issue #22).
* **FR-0.5 Authentication & Workspace Isolation Middleware**:
  * `POST /api/auth/register` (Atomic creation of workspace + admin user) (Issue #23).
  * `POST /api/auth/login` (JWT 15m access token + Redis 7-day refresh token) (Issue #24).
  * `auth.ts` JWT validation & `workspace.ts` isolation middleware enforcing non-suspended workspace status on all routes (Issues #25, #26).
  * `apiKey.ts` authentication for external API integrations (Issue #27).
* **FR-0.6 BullMQ Async Infrastructure & Webhook Ingestion**:
  * 8 core BullMQ queues (`webhook-processor`, `campaign`, `audio-processor`, `sentiment-analysis`, `ai-reply`, `chatbot`, `segmentation`, `compliance`) with exponential backoff & Bull-Board admin dashboard (Issue #31).
  * `POST /api/waba/webhook` endpoint with HMAC-SHA256 signature verification (`utils/metaSignature.ts`), returning `200 OK` in <100ms before async queue delegation (Issues #33, #34).

---

### 3.2 Phase 1A: Embedded Signup, Real-Time Inbox & AI Foundations (Issues #36 – #46)
* **FR-1A.1 Meta Embedded Signup OAuth Flow**: Guided Facebook Login popup flow allowing clients to connect WABA, create System User, obtain permanent token, register webhooks, and activate workspace without Meta Business Suite drop-off (Issue #36).
* **FR-1A.2 WABA Access Token Encryption at Rest**: Encrypt permanent WABA access tokens and webhook secrets using AES-256-GCM (`iv:authTag:ciphertext`) (Issue #37).
* **FR-1A.3 Full Webhook Worker & Message Engine**:
  * `webhook.worker.ts` parses raw Meta events, upserts conversations, checks opt-out/deletion flags, emits WebSockets, and forwards payloads to `workspace.webhookForwardUrl` (Issue #38).
  * `sendTextMessage` service supporting Meta Cloud API dispatch with opt-out enforcement and WABA token decryption (Issue #39).
* **FR-1A.4 Workspace-Scoped Socket.io Real-Time Inbox**:
  * WebSockets authenticated via JWT, joining room `workspace:{workspaceId}` to guarantee multi-tenant real-time isolation (Issue #40).
  * React Inbox UI featuring infinite scroll conversation list, unread indicators, sentiment indicators, and message thread bubble rendering (Issue #44).
* **FR-1A.5 AI Sentiment Analysis**:
  * `sentiment.service.ts` routes inbound text to Claude API (Haiku) to classify messages into `positive`, `neutral`, `negative`, `urgent`.
  * Trigger real-time Socket.io escalation alerts for negative/urgent sentiment (Issue #42).
* **FR-1A.6 DPDP Erasure Pipeline**:
  * `processContactDeletion` atomic transaction cascading deletes: Contact $\rightarrow$ Messages $\rightarrow$ Conversations while anonymizing aggregate campaign stats and logging audit records (Issue #43).
* **FR-1A.7 Zynkrit Integration SDK Wrapper**:
  * TypeScript SDK (`@notifyiq/sdk`) wrapping External API v1 for Zynkrit GST reminder automated dispatch (Issue #45).
* **FR-1A.8 API Documentation**: Interactive OpenAPI 3.0 Swagger UI served at `/api/docs` (Issue #41).

---

### 3.3 Phase 1B: High-Throughput Campaign Engine, Billing & Compliance Export (Issues #47 – #52)
* **FR-1B.1 Broadcast Campaign Engine (80 msg/sec)**:
  * `campaign.worker.ts` executes template broadcasts using Redis Token Bucket rate limiting capped strictly at Meta's 80 msg/sec limit per phone number.
  * Auto-skips opted-out and deletion-requested contacts with pause/cancel controls (Issue #47).
* **FR-1B.2 Dual Multi-Currency Billing Engine**:
  * **Razorpay (INR)**: Webhook handler (`POST /api/billing/razorpay/webhook`), auto-generates 18% GST invoices (HSN 998314), handles 7-day payment failure grace period (Issue #48).
  * **Stripe (USD & EUR)**: Webhook handler for global SaaS partners and European agency subscriptions (Issue #49).
* **FR-1B.3 GDPR Data Export Pipeline**:
  * `generateExport` generates machine-readable ZIP archive (`workspace_info.json`, `contacts.csv`, `conversations.json`, `messages.json`, `campaigns.json`, `audit_log.csv`) stored on Utho Object Storage with 24-hour signed download URL (Issue #50).
* **FR-1B.4 Rolodiq In-Product Cross-Sell**:
  * In-product prompt in Rolodiq app after 10th scanned business card redirecting users to NotifyIQ registration with referral tracking (`?ref=rolodiq`) (Issue #51).

---

### 3.4 Phase 1C & Phase 2A: Enterprise White-Label & Advanced AI (Issues #53 – #59)
* **FR-1C.1 White-Label Agency Architecture**:
  * Agency workspaces create child sub-workspaces (`whitelabel.parentAgencyId`).
  * Custom domain proxying (`wa.digitalpro.in`) loading agency custom logo, primary color, and branding while stripping NotifyIQ references (Issue #53).
  * Comprehensive SaaS partner integration guide published at `docs.notifyiq.app` (Issue #54).
* **FR-2A.1 OpenAI Whisper Voice Note Transcription**:
  * Route WhatsApp audio messages to `audio-processor` queue, download from Meta CDN, store in Utho Object Storage, transcribe via OpenAI Whisper API (Hindi, Gujarati, Marathi, Tamil, Telugu, English), and display transcript below audio player (Issue #56).
* **FR-2A.2 Claude AI Reply Suggestions**:
  * Analyze last 10 messages in conversation to generate 3 reply options (Formal, Friendly, Brief) in the detected language (Issue #57).
* **FR-2A.3 LangChain + MongoDB Atlas Vector Search RAG Chatbot**:
  * PDF/Document upload endpoint (`POST /api/kb/:id/upload`).
  * LangChain document chunking (500 tokens, 50 overlap) with OpenAI embeddings (`text-embedding-3-small`) stored in Atlas Vector Search.
  * Automated RAG response generation with confidence scoring and human agent handoff if vector similarity < 0.75 (Issue #58).

---

### 3.5 Phase 2B & Phase 3: No-Code Visual Automation, Localization & Meta BSP Status (Issues #60 – #62)
* **FR-2B.1 ReactFlow Visual Flow Builder**:
  * No-code visual drag-and-drop flow builder supporting 6 node types: `Trigger`, `Condition`, `Send Message`, `AI Respond`, `Action`, `Human Handoff` saved to `flows` collection (Issue #60).
* **FR-2B.2 Full 5-Language Localization**:
  * Complete UI translations for Hindi (`hi.json`), Gujarati (`gu.json`), Marathi (`mr.json`), Tamil (`ta.json`), and Telugu (`te.json`) with Indian numbering format support (Issue #61).
* **FR-3.1 Meta Business Solution Provider (BSP) Application**:
  * Package 12-month message volume trends (1M+ msg/month target), SLA uptime metrics (99.9%), 50+ WABA case studies, and compliance packages for Meta BSP partner status (Issue #62).

---

### 3.6 Cross-Phase Security & Compliance Controls (Issues #63 – #65)
* **FR-X.1 Workspace Scoping Security Audit**: Strict enforcement preventing any Mongoose query without explicit `{ workspaceId }` scoping to prevent cross-tenant data leaks (Issue #63).
* **FR-X.2 Continuous Audit Log Coverage**: Mandate audit log entries for all personal data modifications, role changes, and compliance events (Issue #64).
* **FR-X.3 Prompt Injection Shielding**: All Claude API prompts must wrap user inputs inside `<user_message>` XML tags, sanitize inputs, truncate payloads to 1,000 chars, and instruct models to treat enclosed content as untrusted input (Issue #65).

---

## 4. Non-Functional Requirements (NFRs)

* **NFR-1 Performance & Latency**:
  * Inbound Webhook Acknowledgment: $\le 100\text{ms}$ return of 200 OK.
  * Single Text Message Dispatch: $\le 500\text{ms}$ processing latency.
  * API Endpoint P99 Latency: $\le 200\text{ms}$.
* **NFR-2 Throughput & Rate Limits**:
  * Campaign Worker: 80 messages/second per WABA.
  * External API v1: 1,000 requests/minute per API key.
  * Auth Login: Max 10 failed attempts / 15 minutes per IP.
* **NFR-3 Reliability & SLA**:
  * 99.99% system availability target on Utho K8s.
  * Minimum 3 retries with exponential backoff on all BullMQ workers.
* **NFR-4 Data Residency & Compliance**:
  * All database records hosted in India (`ap-south-1` Mumbai region).
  * 7-year append-only audit trail for DPDP compliance.
  * 72-hour max SLA for processing GDPR / DPDP erasure requests.

---

## 5. Traceability Matrix — All 65 GitHub Issues

| Issue # | Title / Epic Code | Phase | Priority | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | `[0.1.1] Initialise monorepo structure` | Phase 0 | P0 | Infrastructure / Scaffold |
| **#2** | `[0.1.2] Configure TypeScript strict mode — backend` | Phase 0 | P0 | Backend Type Safety |
| **#3** | `[0.1.3] Configure ESLint + Prettier` | Phase 0 | P1 | Code Quality / Linting |
| **#4** | `[0.1.4] Set up .env.example` | Phase 0 | P0 | Configuration |
| **#5** | `[0.1.5] Implement Zod env validation in config/env.ts` | Phase 0 | P0 | Security & Startup Config |
| **#6** | `[0.1.6] Set up Winston structured logging` | Phase 0 | P0 | Observability / Logging |
| **#7** | `[0.1.7] Create standardised API response utility` | Phase 0 | P0 | API Standards |
| **#8** | `[0.1.8] Create global error handler middleware` | Phase 0 | P0 | Error Management |
| **#9** | `[0.1.9] Set up Docker + Dockerfile for backend API` | Phase 0 | P0 | Containerization |
| **#10** | `[0.1.10] Set up Dockerfile.worker for BullMQ worker` | Phase 0 | P0 | Worker Isolation |
| **#11** | `[0.1.11] Create docker-compose.yml for local development` | Phase 0 | P0 | Developer Experience |
| **#12** | `[0.1.12] Set up GitHub Actions CI pipeline` | Phase 0 | P1 | CI/CD |
| **#13** | `[0.2.1] Connect MongoDB Atlas M10` | Phase 0 | P0 | Database Connection |
| **#14** | `[0.2.2] Connect Utho Managed Redis via ioredis` | Phase 0 | P0 | Caching & Queues |
| **#15** | `[0.2.3] Create Workspace Mongoose model` | Phase 0 | P0 | Multi-Tenancy Core |
| **#16** | `[0.2.4] Create User Mongoose model` | Phase 0 | P0 | Identity Management |
| **#17** | `[0.2.5] Create Contact Mongoose model` | Phase 0 | P0 | Customer Data & Consent |
| **#18** | `[0.2.6] Create Conversation Mongoose model` | Phase 0 | P0 | Thread State |
| **#19** | `[0.2.7] Create Message Mongoose model` | Phase 0 | P0 | Message Payload |
| **#20** | `[0.2.10] Create ApiKey Mongoose model` | Phase 0 | P0 | Partner Auth Keys |
| **#21** | `[0.2.11] Create AuditLog Mongoose model` | Phase 0 | P0 | Compliance Logging |
| **#22** | `[0.2.14] Add MongoDB indexes — all collections` | Phase 0 | P0 | Query Performance |
| **#23** | `[0.3.1] Implement POST /api/auth/register` | Phase 0 | P0 | Tenant Onboarding |
| **#24** | `[0.3.2] Implement POST /api/auth/login` | Phase 0 | P0 | JWT / Auth |
| **#25** | `[0.3.5] Build auth middleware` | Phase 0 | P0 | Route Protection |
| **#26** | `[0.3.6] Build workspace middleware` | Phase 0 | P0 | Tenant Isolation |
| **#27** | `[0.3.7] Build API key middleware` | Phase 0 | P0 | External API Protection |
| **#28** | `[0.4.1] Design DPDP compliance architecture` | Phase 0 | P0 | Indian Data Privacy |
| **#29** | `[0.4.2] Design GDPR compliance architecture` | Phase 0 | P0 | EU Data Privacy |
| **#30** | `[0.4.5] Implement audit log service` | Phase 0 | P0 | Audit Trail |
| **#31** | `[0.5.1] Define all BullMQ queues` | Phase 0 | P0 | Async Queue Engine |
| **#32** | `[0.5.2] Bootstrap webhook.worker.ts` | Phase 0 | P0 | Webhook Queue |
| **#33** | `[0.9.4] Implement POST /api/waba/webhook` | Phase 0 | P0 | Meta Webhook Receiver |
| **#34** | `[0.9.5] Implement metaSignature.ts — HMAC-SHA256` | Phase 0 | P0 | Webhook Security |
| **#35** | `[0.EXIT] Phase 0 Exit Criteria` | Phase 0 | P0 | Milestone Gate |
| **#36** | `[1A.1.1] Implement Embedded Signup OAuth flow` | Phase 1A | P0 | Meta WABA Onboarding |
| **#37** | `[1A.1.3] WABA access token AES-256 encryption at rest` | Phase 1A | P0 | Token Security |
| **#38** | `[1A.2.1] Implement webhook.worker.ts — full processing` | Phase 1A | P0 | Event Processing |
| **#39** | `[1A.3.1] Implement message service — send text message` | Phase 1A | P0 | Outbound Messaging |
| **#40** | `[1A.4.1] Implement Socket.io server` | Phase 1A | P0 | Real-Time WebSockets |
| **#41** | `[1A.8.11] Set up Swagger UI — /api/docs` | Phase 1A | P0 | API Documentation |
| **#42** | `[1A.9.2] Implement sentiment analysis — Claude API` | Phase 1A | P1 | AI Sentiment Engine |
| **#43** | `[1A.10.1] Implement DPDP deletion pipeline` | Phase 1A | P0 | Data Erasure |
| **#44** | `[1A.11.1] Build conversation inbox UI` | Phase 1A | P0 | React Agent Dashboard |
| **#45** | `[1A.12.1] Build Zynkrit SDK wrapper` | Phase 1A | P0 | Partner SDK |
| **#46** | `[1A.EXIT] Phase 1A Exit Criteria` | Phase 1A | P0 | Milestone Gate |
| **#47** | `[1B.1.4] Implement campaign.worker.ts` | Phase 1B | P0 | Broadcasts (80 msg/sec) |
| **#48** | `[1B.2.1] Implement Razorpay subscription — INR` | Phase 1B | P0 | Domestic Billing (GST) |
| **#49** | `[1B.3.1] Implement Stripe subscription — USD + EUR` | Phase 1B | P0 | Global Billing |
| **#50** | `[1B.5.4] Implement GDPR data export pipeline` | Phase 1B | P0 | Data Portability |
| **#51** | `[1B.7.3] Rolodiq in-product cross-sell prompt` | Phase 1B | P0 | GTM / Product Growth |
| **#52** | `[1B.EXIT] Phase 1B Exit Criteria` | Phase 1B | P0 | Milestone Gate |
| **#53** | `[1C.1.1] Implement white-label workspace architecture` | Phase 1C | P0 | Agency Sub-Workspaces |
| **#54** | `[1C.3.1] Write complete partner integration guide` | Phase 1C | P0 | Integration Documentation |
| **#55** | `[1C.EXIT] Phase 1C Exit Criteria` | Phase 1C | P0 | Milestone Gate |
| **#56** | `[2A.1.2] Implement voice note transcription — Whisper` | Phase 2A | P0 | Speech-to-Text AI |
| **#57** | `[2A.2.1] Implement AI reply suggestions — Claude` | Phase 2A | P0 | Smart Assist AI |
| **#58** | `[2A.6.1] Implement RAG knowledge base — LangChain + Atlas` | Phase 2A | P0 | RAG Vector Chatbot |
| **#59** | `[2A.EXIT] Phase 2A Exit Criteria` | Phase 2A | P0 | Milestone Gate |
| **#60** | `[2B.1.1] Implement visual flow builder — ReactFlow` | Phase 2B | P0 | No-Code Automation |
| **#61** | `[2B.3.1–2B.3.5] Full multilingual UI — 5 languages` | Phase 2B | P0 | Localization (hi/gu/mr/ta/te) |
| **#62** | `[3.3.4] Submit Meta BSP Application` | Phase 3 | P0 | Meta BSP Partnership |
| **#63** | `[X.1] Ongoing: workspaceId scoping audit` | Cross-Phase | P0 | Tenant Isolation Security |
| **#64** | `[X.2] Ongoing: audit log coverage` | Cross-Phase | P0 | Legal Compliance Audit |
| **#65** | `[X.7] Ongoing: prompt injection protection` | Cross-Phase | P0 | AI Security Safeguards |

---

## 6. Approval & Sign-Off

| Stakeholder Role | Representative | Date | Signature |
| :--- | :--- | :--- | :--- |
| **Engineering Lead** | BizEazer Tech Team | August 2026 | Approved |
| **Product Manager** | BizEazer Product Ops | August 2026 | Approved |
| **Compliance Officer** | Legal & Compliance | August 2026 | Approved |

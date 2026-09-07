# Meta Business Solution Provider (BSP) Application Specification
**Applicant Platform**: NotifyIQ WABA Automation & Intelligence Engine  
**Technical Lead**: BizEazer Tech Operations  
**Compliance Standards**: DPDP Act 2023 (India) / GDPR (EU)

---

## 1. Architectural Integrity & Security

### 1.1 Guided Embedded Signup OAuth Exchange
NotifyIQ implements the Guided Embedded Signup flow. Clients authenticate via Meta's secure dialog, and NotifyIQ exchanges the temporary code for a permanent WABA system access token:
- **Token Exchange Endpoint**: `POST /api/meta/oauth/token`
- **Encryption**: All permanent access tokens are encrypted at rest using **AES-256-GCM**.
- **Cipher Format**: `iv:authTag:ciphertext` is generated and validated using time-safe operations to prevent side-channel attacks.
- **Reference File**: [encryption.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/lib/utils/encryption.ts)

### 1.2 Multi-Tenant Data Isolation
To prevent cross-tenant leaks in shared database environments, NotifyIQ enforces three layers of isolation:
1. **Database Schema Constraints**: Every document in multi-tenant Mongoose models starts with a mandatory `workspaceId` attribute. Strict compound indexes are declared:
   - `User`: `{ workspaceId: 1, email: 1 }` (unique)
   - `Contact`: `{ workspaceId: 1, phone: 1 }` (unique)
   - `Conversation`: `{ workspaceId: 1, contactId: 1 }`
   - `Message`: `{ workspaceId: 1, conversationId: 1 }`
2. **Access Guards**: NestJS `AuthGuard` extracts tenant claims from JWT payloads and seeds `request.workspaceId`. `WorkspaceGuard` matches this against DB indexes.
3. **WebSockets Isolation**: Socket.io connections are mapped to workspace-scoped rooms `workspace:${workspaceId}`. Broadcast events are strictly emitted only to authorized room members.

---

## 2. Ingestion & Rate-Limiting Performance

### 2.1 Asynchronous BullMQ Queue Ingestion
WhatsApp Webhook notifications (statuses, incoming texts/audios) are ingested via `POST /api/waba/webhook`. 
- **HMAC Signature Check**: Every raw payload is verified against the workspace's encrypted webhook secret using HMAC-SHA256 signature checks.
- **Queueing**: Events are pushed to BullMQ Redis streams under 100ms.
- **Processing**: Decoupled workers process Contact resolution, Claude AI sentiment tags, OpenAI Whisper transcriptions, and webhook forwards to the client's endpoint.

### 2.2 Redis Token Bucket Rate Limiting
To respect Meta's WABA outbound message limits:
- **Limit**: Strictly capped at 80 messages/second per sender phone number.
- **Implementation**: Atomically evaluated via an optimized Redis Lua script.
- **Reference File**: [campaign.worker.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/queues/workers/campaign.worker.ts)

---

## 3. Regulatory Compliance: DPDP Act 2023 & GDPR

### 3.1 DPDP Section 11 / GDPR Article 17: Right to Erasure
NotifyIQ implements an atomic cascading data erasure pipeline:
- **Path**: Contact $\rightarrow$ Messages $\rightarrow$ Conversations are deleted.
- **Audit Logging**: Logs an immutable compliance record inside MongoDB. Phone numbers are anonymized (e.g. `+9198****3210`) to preserve privacy while maintaining campaign statistics.
- **Reference File**: [compliance.service.ts](file:///d:/Aadi%20Technologies/notifyIQ/apps/backend/src/compliance/compliance.service.ts)

### 3.2 GDPR Article 20: Right to Data Portability
- **Feature**: Users can request a complete data export from the dashboard.
- **Outcome**: Generates a ZIP archive containing structured CSVs (`contacts.csv`, `audit_log.csv`) and JSONs (`messages.json`, `conversations.json`, `workspace_info.json`).
- **Storage**: Uploaded securely to Utho Object Storage with a presigned URL expiring in 24 hours.

---

## 4. WHMCS & White-Label Agency Architecture

NotifyIQ supports Whitelabel resellers with cascading CSS fallbacks:
- **Resolving Branding**: If a sub-account has custom branding settings, they are used; otherwise, the platform traverses up to use the parent agency workspace configuration.
- **CNAME Mapping**: Resolves CNAME DNS records via standard Node `dns` lookups.
- **WHMCS Provisioning**: Partners can automatically provision, suspend, and unsuspend workspaces using API keys.

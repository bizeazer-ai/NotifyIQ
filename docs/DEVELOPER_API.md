# NotifyIQ Developer API & External Platform Integration Guide

Welcome to the **NotifyIQ Developer Platform**. This guide provides external developers, partner platforms, CRM/ERP systems, and custom backend applications with everything needed to integrate with NotifyIQ and perform every WhatsApp Business operation programmatically.

---

## Table of Contents
1. [Authentication & API Keys](#1-authentication--api-keys)
2. [TypeScript / Node.js SDK](#2-typescript--nodejs-sdk)
3. [Messaging Operations](#3-messaging-operations)
   - [3.1 Send Text Message](#31-send-text-message)
   - [3.2 Send Media Message (Image, Video, Audio, Document)](#32-send-media-message)
   - [3.3 Upload Media Directly to Meta Cloud CDN](#33-upload-media-directly-to-meta-cloud-cdn)
   - [3.4 Send WhatsApp Meta Template Message](#34-send-whatsapp-meta-template-message)
4. [Conversations & Chat History](#4-conversations--chat-history)
   - [4.1 List Conversations](#41-list-conversations)
   - [4.2 Fetch Message History](#42-fetch-message-history)
   - [4.3 Toggle AI Auto-Reply / Human Takeover](#43-toggle-ai-auto-reply--human-takeover)
5. [Broadcast Campaigns](#5-broadcast-campaigns)
   - [5.1 Launch Broadcast Campaign](#51-launch-broadcast-campaign)
   - [5.2 Get Campaign Delivery & Read Stats](#52-get-campaign-delivery--read-stats)
6. [Contacts Management](#6-contacts-management)
   - [6.1 Create or Update Contact](#61-create-or-update-contact)
   - [6.2 List Contacts](#62-list-contacts)
7. [Receiving Real-Time Webhooks](#7-receiving-real-time-webhooks)
8. [Error Codes & Rate Limits](#8-error-codes--rate-limits)

---

## 1. Authentication & API Keys

All API requests made by external platforms must be authenticated using a **Workspace API Key**.

### Generating an API Key
1. In the NotifyIQ Dashboard, navigate to **Settings** → **API Keys & Developer Portal**.
2. Click **Generate New API Key**.
3. Choose a descriptive name (e.g., `Zoho CRM`, `Custom Mobile App`), set an expiration period, and select scopes (`send`, `read`, `webhook`).
4. **Copy the Secret Key** (`nq_live_...`). Store it securely; for security reasons, it cannot be viewed again.

### Authentication Headers
Include your API Key in either of the following headers on every HTTP request:

```http
x-api-key: nq_live_your_secret_key_here
```
*or*
```http
Authorization: Bearer nq_live_your_secret_key_here
```

> **Note on Multi-Tenancy**: Your API Key is cryptographically tied to your Workspace. You do **not** need to provide an `x-workspace-id` header; the system resolves your tenant and credentials automatically.

---

## 2. TypeScript / Node.js SDK

You can use our official `@notifyiq/sdk` package for typed interactions:

```bash
pnpm add @notifyiq/sdk
# or
npm install @notifyiq/sdk
```

```typescript
import { NotifyIQSdk } from '@notifyiq/sdk';

const notifyiq = new NotifyIQSdk({
  apiKey: 'nq_live_your_secret_api_key',
  baseUrl: 'https://api.notifyiq.app', // or your custom domain
});
```

---

## 3. Messaging Operations

### 3.1 Send Text Message
Sends an outbound WhatsApp text message to any customer phone number.

- **Endpoint**: `POST /api/messages/send`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: nq_live_...`

#### Request Body
```json
{
  "to": "+15551622494",
  "body": "Hello! Your service appointment has been confirmed for 3:00 PM."
}
```

#### cURL Example
```bash
curl -X POST "https://api.notifyiq.app/api/messages/send" \
  -H "Content-Type: application/json" \
  -H "x-api-key: nq_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "to": "+15551622494",
    "body": "Hello! Your appointment is confirmed."
  }'
```

#### Response (`200 OK`)
```json
{
  "message": "Message sent successfully",
  "data": {
    "_id": "6ac6a1002db1bd91582410a1",
    "waMessageId": "wamid.HBgLMTU1NTE2MjI0OTQVAgASGBQzQUI0NzA3...",
    "direction": "outbound",
    "type": "text",
    "status": "sent",
    "body": "Hello! Your appointment is confirmed.",
    "createdAt": "2026-10-08T03:30:00.000Z"
  }
}
```

---

### 3.2 Send Media Message
Sends an image, video, audio file, or PDF/document to a customer.

- **Endpoint**: `POST /api/messages/send-media`
- **Supported Types**: `image` (JPEG, PNG, WebP), `video` (MP4, 3GPP), `audio` (MP3, AAC, OGG), `document` (PDF, CSV, Word, Excel)

#### Request Body
```json
{
  "to": "+15551622494",
  "type": "image",
  "mediaUrl": "https://example.com/receipts/invoice_1042.jpg",
  "caption": "Your invoice receipt for Order #1042"
}
```

#### cURL Example
```bash
curl -X POST "https://api.notifyiq.app/api/messages/send-media" \
  -H "Content-Type: application/json" \
  -H "x-api-key: nq_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "to": "+15551622494",
    "type": "document",
    "mediaUrl": "https://example.com/docs/terms.pdf",
    "filename": "Service_Terms.pdf",
    "caption": "Please review the updated service terms."
  }'
```

---

### 3.3 Upload Media Directly to Meta Cloud CDN
Uploads a binary media file directly to Meta WhatsApp Cloud API storage in memory, returning a permanent Meta Media ID.

- **Endpoint**: `POST /api/messages/upload`
- **Headers**:
  - `Content-Type: multipart/form-data`
  - `x-api-key: nq_live_...`
- **Body**: Form data with field `file` containing the binary file.

#### cURL Example
```bash
curl -X POST "https://api.notifyiq.app/api/messages/upload" \
  -H "x-api-key: nq_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -F "file=@/path/to/product_brochure.pdf"
```

#### Response (`200 OK`)
```json
{
  "message": "Media uploaded directly to Meta Cloud successfully",
  "data": {
    "mediaId": "1077657121829193",
    "url": "/api/messages/media/1077657121829193",
    "filename": "product_brochure.pdf",
    "mimeType": "application/pdf",
    "size": 142058
  }
}
```

You can pass the returned `url` directly into `sendMedia` as `mediaUrl`.

---

### 3.4 Send WhatsApp Meta Template Message
Sends an approved WhatsApp Template message with dynamic body parameters and media header parameters.

- **Endpoint**: `POST /api/messages/send-template`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: nq_live_...`

#### Request Body (with Dynamic Parameters)
```json
{
  "to": "+15551622494",
  "templateName": "order_confirmation_v2",
  "languageCode": "en_US",
  "components": [
    {
      "type": "header",
      "parameters": [
        {
          "type": "image",
          "image": { "link": "https://example.com/header_banner.jpg" }
        }
      ]
    },
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John Doe" },
        { "type": "text", "text": "ORD-9842" },
        { "type": "text", "text": "$149.00" }
      ]
    }
  ],
  "renderedBody": "Hi John Doe, your order ORD-9842 for $149.00 has shipped!"
}
```

---

## 4. Conversations & Chat History

### 4.1 List Conversations
Retrieves all customer conversation threads in reverse chronological order.

- **Endpoint**: `GET /api/messages/conversations`
- **Headers**: `x-api-key: nq_live_...`

#### Response (`200 OK`)
```json
{
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "_id": "6ab49e5c875aae41ad241cdd",
      "contactId": "6ab49e5c875aae41ad241cdc",
      "contactName": "Alice Walker",
      "phone": "+15551622494",
      "sentiment": "positive",
      "lastMessageAt": "2026-10-08T03:15:00.000Z",
      "lastMessageText": "Thank you! Everything looks great.",
      "isHumanTakeover": false,
      "status": "open"
    }
  ]
}
```

### 4.2 Fetch Message History
Retrieves all messages within a specific conversation.

- **Endpoint**: `GET /api/messages/history/:conversationId`
- **Headers**: `x-api-key: nq_live_...`

---

### 4.3 Toggle AI Auto-Reply / Human Takeover
Pauses or resumes AI bot responses for a specific customer conversation.

- **Endpoint**: `POST /api/messages/conversations/:conversationId/toggle-ai`
- **Headers**: `x-api-key: nq_live_...`

#### Response (`200 OK`)
```json
{
  "message": "AI auto-reply paused. Human takeover active.",
  "data": {
    "isHumanTakeover": true
  }
}
```

---

## 5. Broadcast Campaigns

### 5.1 Launch Broadcast Campaign
Queues and dispatches an approved Meta template broadcast to multiple contact IDs using high-throughput rate-limited queues.

- **Endpoint**: `POST /api/messages/campaigns/launch`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: nq_live_...`

#### Request Body
```json
{
  "templateName": "festive_sale_alert",
  "languageCode": "en_US",
  "contactIds": [
    "6ab49e5c875aae41ad241cdc",
    "6ab49e5c875aae41ad241cde",
    "6ab49e5c875aae41ad241ce0"
  ],
  "templateParameters": {
    "1": "VIP Customer",
    "2": "25% OFF"
  }
}
```

#### Response (`200 OK`)
```json
{
  "message": "Campaign queued for high-throughput broadcast successfully",
  "data": {
    "campaignId": "camp_1791431050000"
  }
}
```

### 5.2 Get Campaign Stats
- **Endpoint**: `GET /api/messages/campaigns/stats`
- **Headers**: `x-api-key: nq_live_...`

Returns total counts for `totalSent`, `delivered`, `read`, and `failed`.

---

## 6. Contacts Management

### 6.1 Create or Update Contact
- **Endpoint**: `POST /api/contacts`
- **Headers**: `x-api-key: nq_live_...`

```json
{
  "phone": "+15551622494",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "tags": ["vip", "lead"],
  "customFields": {
    "accountManager": "Alex"
  }
}
```

### 6.2 List Contacts
- **Endpoint**: `GET /api/contacts?page=1&limit=50&search=Jane`
- **Headers**: `x-api-key: nq_live_...`

---

## 7. Receiving Real-Time Outbound Webhooks

When customers reply or message statuses update on WhatsApp, NotifyIQ can push HTTP POST webhooks to your platform.

### Registering a Webhook Endpoint
- **Endpoint**: `POST /api/outbound-webhooks`
- **Headers**: `x-api-key: nq_live_...`

```json
{
  "url": "https://your-crm.com/api/webhooks/notifyiq",
  "description": "Production CRM Ingestion Webhook",
  "events": [
    "message.received",
    "message.delivered",
    "message.read",
    "lead.extracted",
    "ai.reply.generated"
  ]
}
```

### Webhook Event Payload Example (`message.received`)
```json
{
  "event": "message.received",
  "workspaceId": "6a9f9e363e4b4f3cb2e39a08",
  "timestamp": "2026-10-08T03:30:15.000Z",
  "data": {
    "messageId": "wamid.HBgLMTU1NTE2MjI0OTQVAgASGBQzQUI0NzA3...",
    "from": "+15551622494",
    "type": "text",
    "text": "Can I schedule a consultation tomorrow at 10 AM?",
    "contact": {
      "id": "6ab49e5c875aae41ad241cdc",
      "name": "Jane Smith",
      "phone": "+15551622494"
    }
  }
}
```

---

## 8. Error Codes & Rate Limits

| Status Code | Meaning | Resolution |
| :--- | :--- | :--- |
| `401 Unauthorized` | Invalid, expired, or missing API Key | Check the `x-api-key` header and ensure your key has not expired. |
| `403 Forbidden` | Contact opted out or customer service window expired | For free-form text outside 24h, send an approved Meta Template Message. |
| `404 Not Found` | Resource (Contact, Conversation) does not exist | Verify the ID provided belongs to your workspace. |
| `413 Payload Too Large` | Media file exceeds WhatsApp limits | WhatsApp limits: 5MB for images, 16MB for audio/video, 25MB for documents. |
| `429 Too Many Requests` | Rate limit ceiling reached | NotifyIQ queues requests automatically. Implement backoff retry. |

---

## Summary Checklist for Developer Support
1. **API Key URL**: Generate your key in **Settings** → **API Keys & Developer Portal**.
2. **API Documentation (Swagger UI)**: Available at `http://your-server-domain/api/docs`.
3. **Official SDK**: Install `@notifyiq/sdk` for Node.js / TypeScript.
4. **Header Format**: `x-api-key: nq_live_<48_hex_chars>`.

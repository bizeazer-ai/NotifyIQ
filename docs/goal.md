# NotifyIQ — Product Goal & Quality Charter
**Organization**: BizEazer Pvt Ltd
**Repository**: `BizEazer/NotifyIQ`
**Document Purpose**: Define what NotifyIQ *must be* — as a product and as an engineering artifact — to be a real, sellable, market-competitive WhatsApp Business platform. This is not a feature log. It is the bar every feature, test, and release must clear.

---

## 1. What This Product Actually Is

Reading across the BRD, the Phase 2 audit, the Phase 3 audit, and the fixes log, a pattern is visible: NotifyIQ is being built in the shape of the WhatsApp Business API "CPaaS + Inbox + AI" category — the same category occupied by **Interakt, WATI, AiSensy, Gallabox, Zoko, Twilio Conversations, and Gupshup**. The BRD describes the full ambition (multi-tenant WABA platform, AI sentiment/RAG/reply-suggestions, campaign broadcasting, white-label agencies, DPDP/GDPR compliance). Phase 2 replaced the AI stack with Gemini and built out RAG ingestion and auto-reply. Phase 3's own audit is the most important document in the set, because it admits the uncomfortable truth plainly: **billing buttons that do nothing, no way to add a contact, no dashboard, no scheduling** — i.e., a product that *looks* finished in a demo but cannot yet be sold to a single paying customer.

That Phase 3 audit pattern is the real risk to watch going forward, not a one-time embarrassment to move past. The tasklists in every phase document are marked complete (`[x]`) by the same process that produced the gaps the *next* audit found. So the goal of this document is not "build more features" — it's to define a bar of **verified correctness** that no future phase document is allowed to claim without evidence, and that a market launch cannot proceed without.

**One-line product goal**: NotifyIQ must be a WhatsApp Business platform that a real SMB or agency can sign up for, connect their WABA to, pay for, and run their entire customer conversation + broadcast + AI-assist workflow on — with zero dummy buttons, zero silently-failing workflows, and zero features that only work "in the happy path the developer tested."

---

## 2. Market Positioning — What "Competitive" Means Here

To be worth using over an established competitor, NotifyIQ's differentiation has to be real, not just claimed:

| Differentiator (per BRD) | What "real" looks like in market terms |
|---|---|
| AI-native (Gemini sentiment, RAG auto-reply, reply suggestions) | Auto-reply containment rate must be measurable and shown to the customer (Bot Containment % on the dashboard), not just "the feature exists." This is the #1 thing agencies buy CPaaS tools for in 2026. |
| White-label agency workspaces | An agency must be able to resell this under their own domain/branding with zero NotifyIQ leakage, and sub-workspace billing/margins must reconcile correctly. |
| India-first compliance (DPDP) + GDPR | Data residency, 72-hour erasure SLA, and audit trail must be provably enforced, not just modeled in a schema. This is a genuine trust differentiator against US-first competitors for Indian SMBs. |
| Dual-currency billing (Razorpay + Stripe) | Both gateways must actually charge a card/UPI, actually renew subscriptions, actually degrade access on payment failure. A platform that can't take money is not a platform. |
| No-code flow builder | Flows must actually execute against live conversations, not just render in the UI. |

If any row's "real" column isn't true in production, NotifyIQ is not competitive — it's a prototype with a pricing page.

---

## 3. Core Non-Negotiable Pillars

1. **Multi-tenant isolation is absolute.** No query, cache key, socket room, file path, or AI prompt context may ever cross a `workspaceId` boundary. This is both a security requirement and a market requirement — a single cross-tenant data leak ends the business.
2. **Every user-facing action either works or is visibly disabled.** No button that silently does nothing (this is explicitly the Phase 3 audit's top finding — it must never recur).
3. **AI is grounded, not decorative.** Sentiment, suggestions, and RAG replies must be traceable to real inputs (actual conversation history, actual uploaded documents) and must respect the prompt-injection shielding (Issue #65) on every call, not just the ones someone remembered to wrap.
4. **Money movement is real.** Billing must reflect actual gateway state via webhooks, not client-side optimism.
5. **Compliance is enforced in code, not just described in a schema.** Opt-out, consent, and erasure must be checked at the point of send/store, every time.

---

## 4. Definition of Done (applies to every feature, every PR, every phase)

A feature is **not done** — regardless of what a tasklist checkbox says — until all four of the following are true:

### 4.1 Functional correctness
- The feature works end-to-end through the real UI against the real backend and real (or realistically sandboxed) third-party APIs (Meta Graph API, Gemini, Stripe, Razorpay) — not just against a mocked service in isolation.
- Every documented workflow (BRD FRs, Phase 2 gap table, Phase 3 gap table) has been manually walked exactly as a customer would, including the unhappy paths: expired token, webhook signature mismatch, payment failure, rate-limit hit, opted-out contact, low-confidence RAG match, empty knowledge base, malformed CSV.
- No endpoint or UI action returns a fabricated success response when the underlying operation didn't actually happen (this is the specific failure class the Phase 3 audit caught in billing).

### 4.2 Automated test coverage
- **Unit tests**: every service function (auth, billing, contacts, meta/WABA, AI services, workers) has unit tests covering the success path, validation failures, and at least one realistic error/exception path. No service ships with 0% coverage.
- **Integration tests**: every API route is tested with a real (test) database and real workspace-scoping — asserting that workspace A can never read/write workspace B's data. Webhook endpoints are tested with valid and invalid HMAC signatures. Queue workers are tested with a real BullMQ test instance, not just the handler function called directly.
- **Contract tests**: shared types in `@notifyiq/schemas` are the single source of truth between frontend and backend; a build must fail if either side drifts from the contract.
- All test suites must pass in CI before merge. A red pipeline blocks release — not a suggestion, a gate.

### 4.3 Load & performance verification
Tested against the NFRs already defined in the BRD, with evidence (not assumption) that they hold under load:
- Webhook ingestion: p99 ≤ 100ms to return `200 OK`, verified under sustained concurrent webhook traffic, not a single manual curl.
- Message dispatch: p99 ≤ 500ms end-to-end for a single send.
- General API: p99 ≤ 200ms.
- Campaign broadcast: sustained 80 msg/sec per WABA number under a realistic multi-thousand-contact campaign, with the Redis token bucket verified to actually cap throughput (not just configured to).
- Auth login: rate limiting (10 failed attempts / 15 min / IP) verified to actually trigger, not just coded.
- System behavior under Redis/DB degradation is tested deliberately (the in-memory fallback mode noted in fixes.md must not silently mask data loss in production — it needs an explicit alerting story, not just a log line).

### 4.4 Coding standards
- TypeScript strict mode, zero `any` escapes without justification, zero direct `process.env` access outside `config/env.ts`.
- Zero `console.log` in shipped code — Winston only, with correlation/request IDs so a production incident can be traced.
- ESLint/Prettier clean on every merge.
- Every new Mongoose query is workspace-scoped by construction (ideally enforced by a lint rule or query-builder wrapper, not just code review discipline — code review already missed this once per the BRD's own cross-phase audit issue #63).
- Every AI prompt wraps untrusted user input per Issue #65's shielding pattern, with a test asserting injection attempts don't escape the wrapper.

---

## 5. Feature Completeness Bar — "Real" vs "Demo"

This table exists specifically because the project's own history shows the gap between "marked complete" and "actually works." Nothing in this table is new scope — it is the BRD + Phase 2 + Phase 3 scope, restated as a verification checklist.

| Area | Not acceptable ("demo") | Required ("real") |
|---|---|---|
| Billing | Button click does nothing or only updates local UI state | Stripe Checkout/Portal and Razorpay order + modal actually charge, webhooks actually update subscription state, failed payment actually restricts access after grace period |
| Contacts | Read-only list with a search box | Add, bulk CSV import with column mapping, export, tagging, and DPDP erasure all functionally wired to the backend and reflected in real time |
| Analytics | Static numbers or none | Dashboard metrics computed from real aggregated data (messages, delivery rate, bot containment, active threads) that changes as real usage changes |
| Campaigns | Immediate-send only, no targeting | Scheduled sends actually fire at the scheduled time via the worker; tag-based segmentation actually filters the recipient set |
| Templates | Body text only | Media headers and CTA/quick-reply buttons actually submit to and get approved by Meta, and actually render on WhatsApp |
| AI Auto-Reply | Always answers, or never checks context | Operating hours, confidence threshold, and human handoff are all actually evaluated per-message, with escalation actually notifying a live agent over the socket |
| WABA Onboarding | Manual token paste only | Embedded Signup OAuth completes without dropping to Meta Business Suite, and phone number selection actually persists |
| White-label | Custom logo only | Full domain proxying with zero NotifyIQ branding leakage, and correct billing/margin attribution to the parent agency |
| Compliance | Fields exist in schema | Opt-out and consent are checked before every send; erasure request cascades and completes within the 72-hour SLA; audit log entry created for every compliance-relevant action |

A phase is not "exit-criteria met" until every row relevant to that phase is verified in the "Required" column — with a person (not just an AI-generated checkbox) confirming it against the live app, the way the Phase 3 audit did.

---

## 6. Success Metrics (what "competitive" looks like six months post-launch)

- **Time-to-first-message**: a new signup can connect their WABA and send their first message in under 15 minutes, unassisted.
- **Bot containment rate**: a visible, accurate percentage of conversations resolved by AI without human handoff — this is the number agencies will compare against competitors.
- **Delivery SLA**: ≥99% message delivery success rate visible on the dashboard, matching the 99.9% uptime NFR.
- **Zero silent-failure incidents**: no support ticket of the form "I clicked X and nothing happened" — the exact failure class this document exists to prevent.
- **Paying workspace retention**: workspaces that complete onboarding and connect a WABA convert to a paid plan and renew — the ultimate proof billing, AI, and reliability are all actually working together.

---

## 7. Guardrails (to avoid re-scoping this into a different problem)

- Don't add new AI providers, channels (SMS/email), or infrastructure providers mid-build; the Gemini consolidation and Utho infra choices in the BRD/Phase 2 doc stand unless explicitly revisited.
- Don't gold-plate the flow builder or white-label system beyond what Phase 1C/2B scoped — finish and verify the payment, contact, analytics, and template gaps from Phase 3 first, since those block revenue entirely.
- "Feature complete" and "production ready" are different claims. This document's testing/load/coding bar (Section 4) is what turns the former into the latter — a phase document should stop marking `[x]` on functional completion alone.

---

## 8. Release Gate

NotifyIQ may only be represented as production-ready / market-ready when:
1. Every row in Section 5 is verified "Required," not "Not acceptable."
2. Unit + integration test suites are green in CI with meaningful coverage (Section 4.2) — not just present, but asserting real behavior including workspace isolation and failure paths.
3. Load tests demonstrate the NFR targets in Section 4.3 under realistic concurrent load, with results recorded, not assumed.
4. Coding standards (Section 4.4) pass with zero exceptions in CI.
5. A human has walked every core workflow end-to-end on a staging environment against real third-party sandboxes (Meta test WABA, Stripe test mode, Razorpay test mode) and confirmed no dummy/no-op interactions remain.

Until all five hold, NotifyIQ is a strong prototype — not yet the product this document defines.
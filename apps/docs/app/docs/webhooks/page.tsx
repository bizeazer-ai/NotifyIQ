import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Outbound Webhooks & Events | NotifyIQ Documentation',
  description: 'Stream real-time WhatsApp events, verify HMAC-SHA256 signatures, test endpoint ping latency, and integrate with external CRMs and ERPs.',
};

export default function WebhooksDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Platform Administration</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Outbound Webhooks</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Outbound Webhooks, Event Streams &amp; Security
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The event streaming pipeline. Bridge NotifyIQ with your custom backends, CRMs (Zoho, HubSpot, Salesforce), and ERPs. Subscribe to 9 granular WhatsApp and AI event types with cryptographically verifiable HMAC-SHA256 signatures.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Outbound Webhooks enable real-time synchronization between NotifyIQ and your existing software stack. Whenever an inbound message arrives, a delivery receipt is acknowledged by Meta, or an AI bot performs a handoff, NotifyIQ dispatches an HTTP POST request to your designated endpoint with millisecond-level latency.
        </p>
      </section>

      {/* 2. Who Uses It */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          2. Who Uses It (Target Roles)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Backend &amp; API Engineers</span>
            <p className="text-slate-600 dark:text-slate-400">Configures receiver endpoints, implements HMAC signature verification, and captures message events.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">CRM Administrators</span>
            <p className="text-slate-600 dark:text-slate-400">Syncs WhatsApp leads and customer sentiment directly into Zoho CRM or HubSpot contact records.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Operations &amp; Security Leads</span>
            <p className="text-slate-600 dark:text-slate-400">Audits delivery health, inspects endpoint response latency, and rotates webhook signing secrets.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="WebhooksPage.tsx • /settings/webhooks" badge="HMAC-SHA256 Signed" subtitle="9 Event Subscriptions & Test Ping Telemetry">
          <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-3 text-xs">
              <div>
                <div className="font-bold text-white text-sm">Configured Webhook Subscriptions</div>
                <div className="text-[11px] text-slate-400">Automated retry with exponential backoff on HTTP 5xx errors</div>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20">
                + Register New Webhook
              </span>
            </div>

            {/* Configured Webhook Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>Production CRM Event Pipeline</span>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    https://api.bizeazer.in/v1/integrations/whatsapp-events
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[11px] cursor-pointer hover:bg-slate-700">
                    Test Ping (POST)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 text-[11px] cursor-pointer">
                    Delete
                  </span>
                </div>
              </div>

              {/* Subscribed Events Pills */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1.5">Subscribed Events (4):</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    message.inbound
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                    message.status
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                    ai.replied
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                    human.handover
                  </span>
                </div>
              </div>

              {/* Last Delivery Telemetry */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Last Delivery: <strong className="text-slate-900 dark:text-slate-200">200 OK</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Latency: <strong className="text-emerald-400 font-mono">142ms</strong></span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">Failures: 0 (Optimal)</span>
              </div>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: Registering an Outbound Webhook
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Prepare HTTPS Endpoint:</strong> Ensure your receiving server accepts HTTP POST requests with a valid SSL/TLS certificate.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Register Target URL:</strong> Click <strong className="text-emerald-400">+ Register New Webhook</strong>. Enter a human-readable description and paste your HTTPS URL.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Subscribe to Desired Events:</strong> Check the specific event checkboxes your integration requires (e.g., <code className="text-slate-300 font-mono text-xs">message.inbound</code> and <code className="text-slate-300 font-mono text-xs">lead.status_changed</code>).
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Copy Signing Secret:</strong> NotifyIQ generates a unique 32-character webhook secret. Save this secret in your receiving server&apos;s environment variables to verify HMAC signatures.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Send Test Ping:</strong> Click <strong className="text-slate-900 dark:text-slate-200">Test Ping</strong>. NotifyIQ sends a mock payload and measures your endpoint&apos;s HTTP response code and round-trip latency.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. 9 Granular Platform Event Types
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Event Key</th>
                <th className="p-3">Category</th>
                <th className="p-3">Trigger Condition</th>
                <th className="p-3">Common Integration Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-emerald-400 font-mono">message.inbound</td>
                <td className="p-3">Messaging</td>
                <td className="p-3">Customer sends a text or media message to WhatsApp number.</td>
                <td className="p-3">Log inbound inquiries into helpdesk ticketing systems.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-cyan-400 font-mono">message.status</td>
                <td className="p-3">Messaging</td>
                <td className="p-3">Meta reports message as sent, delivered, read, or failed.</td>
                <td className="p-3">Update campaign analytics and read receipts in ERP.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-purple-400 font-mono">ai.replied</td>
                <td className="p-3">AI &amp; Automation</td>
                <td className="p-3">Gemini bot auto-responds using Knowledge Base context.</td>
                <td className="p-3">Audit AI response accuracy and track token consumption.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-pink-400 font-mono">sentiment.analyzed</td>
                <td className="p-3">AI &amp; Automation</td>
                <td className="p-3">Conversation sentiment classified (positive/neutral/negative/urgent).</td>
                <td className="p-3">Trigger VIP alerts or immediate customer churn warnings.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-amber-400 font-mono">human.handover</td>
                <td className="p-3">AI &amp; Automation</td>
                <td className="p-3">Conversation escalated from AI bot to live human agent.</td>
                <td className="p-3">Route live ticket to on-duty Slack or Teams channel.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-indigo-400 font-mono">flow.executed</td>
                <td className="p-3">AI &amp; Automation</td>
                <td className="p-3">Visual flow automation node finishes execution.</td>
                <td className="p-3">Trigger external webhook workflows in Zapier or Make.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-orange-400 font-mono">lead.status_changed</td>
                <td className="p-3">CRM &amp; Contacts</td>
                <td className="p-3">Lead status or stage updated in Contact Lead Drawer.</td>
                <td className="p-3">Update CRM pipeline stages (e.g. Qualified, Proposal Sent).</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-blue-400 font-mono">template.status_changed</td>
                <td className="p-3">Meta WABA</td>
                <td className="p-3">Meta approves, rejects, or pauses a WhatsApp template.</td>
                <td className="p-3">Alert marketing team when broadcast template is approved.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-teal-400 font-mono">account.quality_changed</td>
                <td className="p-3">Meta WABA</td>
                <td className="p-3">WABA phone number rating changes (Green / Yellow / Red).</td>
                <td className="p-3">Critical operational alerts for high spam rates.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes & Verification Code */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Verifying HMAC-SHA256 Signatures in Node.js
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed font-mono">
          <p className="font-sans text-slate-400">
            Every payload contains the header <code className="text-emerald-400 font-mono">x-notifyiq-signature-256</code>. Validate the signature against the raw body buffer to ensure the request originated from NotifyIQ:
          </p>
          <pre className="p-4 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 text-[11px] text-emerald-300 overflow-x-auto leading-normal">
{`const crypto = require('crypto');

function verifyNotifyIQWebhook(req, secret) {
  const signature = req.headers['x-notifyiq-signature-256'];
  if (!signature) return false;

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}`}
          </pre>
        </div>
      </section>

      {/* 6. Common Errors & FAQs */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          6. Common Errors &amp; FAQs
        </h2>
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">What happens if my endpoint goes down?</div>
            <p className="text-slate-600 dark:text-slate-400">
              NotifyIQ queues undelivered events in BullMQ and retries delivery with exponential backoff (up to 5 attempts over 24 hours). If an endpoint fails continuously (&gt;50 consecutive failures), the webhook is automatically marked inactive to protect queue health.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">What HTTP response code should my server return?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Your server must acknowledge receipt with an HTTP <code className="text-emerald-400 font-mono">200 OK</code> or <code className="text-emerald-400 font-mono">204 No Content</code> within 5 seconds. If processing takes longer, ingest the payload into an internal worker queue and return HTTP 200 immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/webhooks" />
    </article>
  );
}

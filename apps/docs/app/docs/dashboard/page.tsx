import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Executive Dashboard | NotifyIQ Documentation',
  description: 'Understand the NotifyIQ Executive Dashboard: KPIs, Meta delivery SLA rate %, Gemini AI containment, and message telemetry.',
};

export default function DashboardDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Core Messaging Console</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Executive Dashboard</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Executive Dashboard &amp; Real-Time Delivery
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The command center for your WhatsApp Business Account. Monitor live message throughput, Meta delivery SLA compliance, autonomous Gemini AI bot containment rates, and inbound/outbound volume distributions.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          The Executive Dashboard provides operations teams, business owners, and customer success managers with an instant, real-time snapshot of their workspace messaging health. It aggregates raw dispatch counts, calculates WhatsApp delivery efficiency through Meta status callbacks, evaluates bot resolution rates, and highlights urgent conversations requiring human intervention.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Workspace Administrators</span>
            <p className="text-slate-600 dark:text-slate-400">Tracks overall Meta WABA compliance, monthly quota usage, and system-wide delivery performance.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Growth &amp; Marketing Teams</span>
            <p className="text-slate-600 dark:text-slate-400">Assesses broadcast throughput, audience engagement curves, and active opted-in customer lists.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Support Operations Leads</span>
            <p className="text-slate-600 dark:text-slate-400">Monitors AI containment efficiency, detects bottlenecks, and prioritizes urgent escalation alerts.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="OverviewDashboardPage.tsx • /dashboard" badge="Live Interface" subtitle="7-Day & 30-Day Telemetry">
          <div className="space-y-6">
            {/* Mockup Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <div className="text-base font-bold text-white">Executive Analytics &amp; Real-time Delivery</div>
                <div className="text-xs text-slate-400">Real-time analytics for WhatsApp dispatches, Meta delivery SLA %, and AI containment.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-300">
                  ↻ Refresh Analytics
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold">
                  ✈ Launch Broadcast
                </span>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-blue-500/30 space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Dispatches</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">Meta WABA</span>
                </div>
                <div className="text-xl font-extrabold text-white">12,480</div>
                <div className="text-[10px] text-slate-400">Total inbound &amp; outbound</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Delivery SLA</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Meta SLA</span>
                </div>
                <div className="text-xl font-extrabold text-emerald-400">99.4%</div>
                <div className="text-[10px] text-slate-400">Optimal webhook telemetry</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/30 space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>AI Containment</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">Auto-Reply</span>
                </div>
                <div className="text-xl font-extrabold text-purple-400">76.8%</div>
                <div className="text-[10px] text-slate-400">Autonomous bot resolution</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-1">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Active Contacts</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">Opted-in</span>
                </div>
                <div className="text-xl font-extrabold text-cyan-400">3,420</div>
                <div className="text-[10px] text-emerald-400 font-semibold">100% Consent Verified</div>
              </div>
            </div>

            {/* Simulated Chart & Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-slate-900/50 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Weekly Dispatches &amp; Response Telemetry</span>
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">Last 7 Days</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">30 Days</span>
                  </div>
                </div>

                {/* Simulated SVG Bar Columns */}
                <div className="h-32 flex items-end gap-3 pt-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {[
                    { day: 'Mon', inH: '40%', outH: '70%' },
                    { day: 'Tue', inH: '60%', outH: '85%' },
                    { day: 'Wed', inH: '50%', outH: '65%' },
                    { day: 'Thu', inH: '75%', outH: '95%' },
                    { day: 'Fri', inH: '90%', outH: '100%' },
                    { day: 'Sat', inH: '35%', outH: '45%' },
                    { day: 'Sun', inH: '30%', outH: '40%' },
                  ].map((col) => (
                    <div key={col.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="flex gap-1 items-end w-full justify-center h-full">
                        <div style={{ height: col.inH }} className="w-2 sm:w-3 bg-cyan-500 rounded-t-sm" />
                        <div style={{ height: col.outH }} className="w-2 sm:w-3 bg-emerald-500 rounded-t-sm" />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">{col.day}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-4 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-cyan-500"></span> Inbound Messages</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-emerald-500"></span> Outbound Dispatches</span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/50 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
                <span className="text-xs font-semibold text-slate-300">Quick Actions</span>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-300 dark:border-slate-700/60 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">Open Live Inbox</div>
                    <div className="text-[10px] text-slate-400">Respond to active customer chats</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-300 dark:border-slate-700/60 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">Message Templates</div>
                    <div className="text-[10px] text-slate-400">Create &amp; submit Meta templates</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-300 dark:border-slate-700/60 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">Flow Builder</div>
                    <div className="text-[10px] text-slate-400">Configure visual bot workflows</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MockupCard>
      </section>

      {/* 3. Step-by-Step Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3. Step-by-Step: How to Use the Dashboard
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Review Headline KPIs:</strong> Check your <strong className="text-slate-900 dark:text-slate-200">Total WhatsApp Dispatches</strong> and <strong className="text-slate-900 dark:text-slate-200">Delivery SLA Rate</strong>. A healthy system typically maintains an SLA above 95%.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Inspect AI Containment:</strong> Verify that the <strong className="text-slate-900 dark:text-slate-200">Gemini AI Containment Rate</strong> aligns with expectations. If containment drops below 60%, check your RAG Knowledge Base and system prompt settings.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Switch Time Horizons:</strong> Toggle between the <code className="text-emerald-400 font-mono text-xs">Last 7 Days</code> and <code className="text-emerald-400 font-mono text-xs">30 Days</code> pills to identify weekly seasonality or campaign dispatch spikes.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Triage Urgent Conversations:</strong> If the urgent alert banner appears indicating conversations with negative sentiment or explicit human agent requests, click <strong className="text-slate-900 dark:text-slate-200">Open Live Inbox</strong> to initiate agent takeover.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Launch Broadcasts:</strong> Use the top-right <strong className="text-slate-900 dark:text-slate-200">Launch Broadcast</strong> action button to immediately navigate to the campaign dispatcher.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Buttons Explained */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Fields, Controls &amp; Metrics Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">UI Element</th>
                <th className="p-3">Type</th>
                <th className="p-3">Calculation / Destination</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Refresh Analytics</td>
                <td className="p-3">Button</td>
                <td className="p-3 font-mono text-emerald-400">GET /api/analytics/overview</td>
                <td className="p-3">Re-queries the backend analytics service to calculate latest message and delivery counts.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Launch Broadcast</td>
                <td className="p-3">Action Button</td>
                <td className="p-3 font-mono text-emerald-400">/campaigns</td>
                <td className="p-3">Direct shortcut to the outbound broadcast campaign dispatch page.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Total Dispatches</td>
                <td className="p-3">Metric Card</td>
                <td className="p-3 font-mono">totalMessages</td>
                <td className="p-3">Sum of all inbound customer messages and outbound Meta API dispatches within the workspace.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Delivery SLA Rate</td>
                <td className="p-3">Metric Card</td>
                <td className="p-3 font-mono">(delivered / outbound) * 100</td>
                <td className="p-3">Percentage of outbound messages successfully confirmed as delivered by Meta webhooks.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">AI Containment Rate</td>
                <td className="p-3">Metric Card</td>
                <td className="p-3 font-mono">botContainmentRatePercent</td>
                <td className="p-3">Percentage of customer conversations completely resolved by Gemini AI without requiring human agent takeover.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Active Contacts Directory</td>
                <td className="p-3">Metric Card</td>
                <td className="p-3 font-mono">totalContacts</td>
                <td className="p-3">Count of unique phone records with explicit DPDP consent status and no opt-out flags.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Last 7 / 30 Days</td>
                <td className="p-3">Filter Pills</td>
                <td className="p-3 font-mono">?days=7 | ?days=30</td>
                <td className="p-3">Re-aggregates daily message distribution histograms for the selected timeframe.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. What Happens Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Meta Cloud API &amp; Backend Telemetry
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When viewing this dashboard, the frontend calls <code className="text-emerald-400 font-mono">GET /api/analytics/overview?days=7</code>. The backend executes aggregation pipelines across the MongoDB <code className="text-slate-200 font-mono">messages</code> and <code className="text-slate-200 font-mono">conversations</code> collections:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Delivery Status Callbacks:</strong> Every time an outbound message is sent via Meta Cloud API <code className="text-emerald-400 font-mono">POST /v20.0/{'{phone_number_id}'}/messages</code>, Meta asynchronously delivers delivery receipts (<code className="text-slate-300 font-mono">sent</code>, <code className="text-slate-300 font-mono">delivered</code>, <code className="text-slate-300 font-mono">read</code>, <code className="text-rose-400 font-mono">failed</code>) to the NotifyIQ webhook endpoint.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Asynchronous Ingestion:</strong> Inbound webhooks are validated with <code className="text-emerald-400 font-mono">x-hub-signature-256</code> HMAC-SHA256, immediately acknowledged with HTTP 200, and queued into BullMQ.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Bot Containment Math:</strong> Conversations are classified as &ldquo;contained&rdquo; when the Gemini auto-reply engine successfully exchanges messages and the session reaches resolution without triggering the <code className="text-slate-300 font-mono">needsHuman: true</code> flag.
            </li>
          </ul>
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why does Delivery SLA Rate show &ldquo;No data&rdquo;?</div>
            <p className="text-slate-600 dark:text-slate-400">
              The Delivery SLA Rate requires at least one outbound message dispatch with recorded webhook delivery callbacks. Once your workspace launches a campaign or sends a live chat response, the SLA percentage will calculate automatically.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">Why are outbound message numbers high but delivered numbers low?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Ensure that your Meta Webhook URL is configured with the <code className="text-slate-200 font-mono">messages</code> subscription field in the Meta App Dashboard, and that recipient phone numbers are active WhatsApp users capable of receiving messages.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">How often are dashboard metrics refreshed?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Metrics are calculated dynamically whenever the page mounts or when the <strong className="text-slate-300">Refresh Analytics</strong> button is clicked. Live thread updates in the Workspace Inbox use real-time WebSockets.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/dashboard" />
    </article>
  );
}

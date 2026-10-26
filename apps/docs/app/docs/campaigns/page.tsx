import React from 'react';
import Link from 'next/link';
import { MockupCard } from '@/components/docs/MockupCard';
import { DocsPagination } from '@/components/docs/DocsPagination';

export const metadata = {
  title: 'Broadcast Campaigns & Dispatch Telemetry | NotifyIQ Documentation',
  description: 'Launch high-throughput WhatsApp marketing broadcasts, configure dynamic variables {{1}}, schedule dispatches, and track real-time delivery telemetry.',
};

export default function CampaignsDocPage() {
  return (
    <article className="space-y-10">
      {/* Header & Breadcrumb */}
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800 pb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link href="/docs" className="hover:text-emerald-600 dark:hover:text-emerald-400">Docs</Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Campaigns &amp; Templates</span>
          <span>/</span>
          <span className="text-emerald-400 font-medium">Broadcast Campaigns</span>
        </nav>
        <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
          Broadcast Campaigns &amp; High-Throughput Delivery
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The high-volume outbound messaging engine. Target consent-verified audiences with pre-approved Meta message templates, map dynamic personalization variables (<code className="text-emerald-400 font-mono text-xs">{'{{1}}'}</code>), schedule deliveries, and track live read and delivery rates.
        </p>
      </div>

      {/* 1. Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          1. Purpose of the Page
        </h2>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Broadcast Campaigns enable marketing, sales, and operations teams to deliver personalized notifications to thousands of opted-in customers simultaneously. Powered by BullMQ and Redis token-bucket rate limiters (80 msgs/sec), it ensures full compliance with Meta WhatsApp Cloud API throughput ceilings while preventing account tier penalties or delivery drops.
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
            <span className="font-bold text-slate-900 dark:text-slate-100">Marketing Directors</span>
            <p className="text-slate-600 dark:text-slate-400">Orchestrates seasonal promotional announcements, product launches, and discount broadcasts.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Operations Managers</span>
            <p className="text-slate-600 dark:text-slate-400">Schedules bulk transactional alerts, system maintenance notices, and urgent customer advisories.</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">Growth Specialists</span>
            <p className="text-slate-600 dark:text-slate-400">Analyzes read-rate telemetry and delivery SLA percentages to optimize messaging engagement.</p>
          </div>
        </div>
      </section>

      {/* 7. CSS UI Mockup */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Interactive Visual Preview
        </h2>
        <MockupCard title="CampaignsPage.tsx • /campaigns" badge="80 msgs/sec BullMQ" subtitle="Template Interpolation & Stats">
          <div className="space-y-6">
            {/* 4 Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-blue-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Total Transmitted</span>
                <div className="text-lg font-bold text-white">48,200</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Delivered SLA</span>
                <div className="text-lg font-bold text-emerald-400">47,890</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Read (Opened)</span>
                <div className="text-lg font-bold text-cyan-400">36,120</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-amber-500/30 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Failed Dispatches</span>
                <div className="text-lg font-bold text-amber-400">310</div>
              </div>
            </div>

            {/* Form + Phone Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Config (7 cols) */}
              <div className="lg:col-span-7 p-4 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <div className="font-bold text-white text-sm">Launch Broadcast Campaign</div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Select Approved Template</label>
                  <select disabled className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-200">
                    <option>festive_offer_2026 (en) • APPROVED</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Header Image URL (Optional)</label>
                  <input
                    type="text"
                    disabled
                    value="https://cdn.notifyiq.app/banners/festive_special.jpg"
                    className="w-full bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">Dynamic Body Variables</label>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 w-16">{'{{1}}'}:</span>
                      <input
                        type="text"
                        disabled
                        value="{{name}} (Customer Name)"
                        className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 w-16">{'{{2}}'}:</span>
                      <input
                        type="text"
                        disabled
                        value="DIWALI25 (Promo Code)"
                        className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500 dark:text-slate-400">Target Recipients: <strong className="text-emerald-400 font-mono">1,850 Opted-in Contacts</strong></span>
                  <span className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20">
                    Launch Broadcast
                  </span>
                </div>
              </div>

              {/* Phone Bubble Preview (5 cols) */}
              <div className="lg:col-span-5 p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col items-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Live WhatsApp Bubble Preview</span>
                <div className="w-full max-w-[260px] rounded-2xl bg-emerald-950/80 border border-emerald-800/60 p-3 text-xs space-y-2 shadow-xl text-slate-200">
                  <div className="h-24 rounded-lg bg-slate-800/80 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-[10px]">
                    🖼️ [Header Media Banner]
                  </div>
                  <p className="leading-relaxed">
                    Hello <strong className="text-emerald-300">Aarav Mehta</strong>, celebrate this festive season with an exclusive 25% discount using promo code <strong className="text-emerald-300">DIWALI25</strong>!
                  </p>
                  <div className="text-[10px] text-slate-400 border-t border-emerald-900/60 pt-1">
                    Valid until midnight Sunday. Reply STOP to opt out.
                  </div>
                  <div className="pt-1 flex flex-col gap-1 text-center font-semibold text-emerald-300 text-[11px]">
                    <div className="p-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60">
                      🎁 Claim Discount
                    </div>
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
          3. Step-by-Step: Creating and Launching a Broadcast
        </h2>
        <ol className="space-y-3 list-decimal list-inside text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Choose an Approved Template:</strong> Select any template in <code className="text-emerald-400 font-mono text-xs">APPROVED</code> status from the dropdown. NotifyIQ synchronizes approved templates directly from your Meta WABA account.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Configure Dynamic Variables:</strong> If the template contains parameter placeholders like <code className="text-emerald-400 font-mono text-xs">{'{{1}}'}</code>, map them to dynamic attributes (such as <code className="text-slate-300 font-mono text-xs">{'{{name}}'}</code> for individual recipient names) or supply static values.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Select Eligible Recipients:</strong> The recipient table displays only contacts where <code className="text-emerald-400 font-mono text-xs">consentGiven === true</code> and <code className="text-emerald-400 font-mono text-xs">optedOut !== true</code>. Click <strong className="text-slate-900 dark:text-slate-200">Select All</strong> or check specific contacts.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Choose Dispatch Mode:</strong> Select <strong className="text-slate-900 dark:text-slate-200">Instant</strong> for immediate queue ingestion, or choose <strong className="text-slate-900 dark:text-slate-200">Scheduled</strong> to set a future date and time per your marketing calendar.
          </li>
          <li className="pl-2">
            <strong className="text-slate-900 dark:text-white">Launch Broadcast:</strong> Click <strong className="text-emerald-400 font-bold">Launch Broadcast</strong>. BullMQ will ingest the jobs, dispatch at 80 msgs/sec, and update real-time telemetry counters as delivery receipts arrive.
          </li>
        </ol>
      </section>

      {/* 4. Fields and Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          4. Fields &amp; Controls Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Field / Setting</th>
                <th className="p-3">Type</th>
                <th className="p-3">Meta Constraint</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 text-slate-400">
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Template Name</td>
                <td className="p-3">Dropdown</td>
                <td className="p-3">Status: APPROVED</td>
                <td className="p-3">Pre-registered Meta template to be sent. Unapproved or rejected templates cannot be selected.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Header Media URL</td>
                <td className="p-3">Input URL</td>
                <td className="p-3 font-mono">HTTPS image/video/doc</td>
                <td className="p-3">Publicly accessible CDN link rendered as the visual header of the WhatsApp message.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Body Parameters</td>
                <td className="p-3">Key-Value Inputs</td>
                <td className="p-3 font-mono">Array of strings</td>
                <td className="p-3">Values replacing <code className="text-emerald-400 font-mono">{'{{1}}'}</code>, <code className="text-emerald-400 font-mono">{'{{2}}'}</code> in the template body text per recipient.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Dispatch Mode</td>
                <td className="p-3">Radio Buttons</td>
                <td className="p-3">Instant / Scheduled</td>
                <td className="p-3">Determines whether messages are dispatched immediately or delayed until a timestamp.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">Delivered SLA</td>
                <td className="p-3">Stat Counter</td>
                <td className="p-3 font-mono">status === &apos;delivered&apos;</td>
                <td className="p-3">Number of messages confirmed reached by the recipient&apos;s handset via webhook receipt.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Behind the Scenes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          5. Behind the Scenes: Queue Architecture &amp; Rate Limits
        </h2>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            When a broadcast is submitted, the backend routes the request through <code className="text-emerald-400 font-mono">POST /api/messages/campaigns/launch</code>:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">BullMQ Redis Queue:</strong> Jobs are broken down into individual dispatch tasks in the Redis queue to ensure horizontal scalability without blocking Node.js event loops.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">80 Messages / Second Token Bucket:</strong> Meta Cloud API limits standard phone number tiers to 80 requests/second. NotifyIQ uses a Redis Lua token bucket to strictly enforce this throughput ceiling, preventing HTTP 429 rate limit exceptions.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">Meta Graph API v20.0 Payload:</strong> The worker dispatches to <code className="text-emerald-400 font-mono">POST /v20.0/{'{phone_number_id}'}/messages</code> with <code className="text-slate-200 font-mono">type: &apos;template&apos;</code> and the interpolated components array.
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
            <div className="font-semibold text-slate-900 dark:text-slate-200">What causes &ldquo;Failed Dispatches&rdquo;?</div>
            <p className="text-slate-600 dark:text-slate-400">
              Dispatches usually fail if the destination phone number is no longer active on WhatsApp, if the country code is missing, or if the template parameter count does not match the approved template schema.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200">Can I send broadcasts to customers who have not opted in?</div>
            <p className="text-slate-600 dark:text-slate-400">
              No. NotifyIQ strictly requires DPDP-compliant consent. Unsolicited marketing violates WhatsApp Business Messaging Policy and Meta Platform Terms, risking account suspension.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination Footer */}
      <DocsPagination currentHref="/docs/campaigns" />
    </article>
  );
}
